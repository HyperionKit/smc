// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct StakingPool {
        address stakingToken;
        address rewardToken;
        uint256 totalStaked;
        uint256 rewardPerTokenStored;
        uint256 lastUpdateTime;
        uint256 periodFinish;
        uint256 rewardRate;
        bool exists;
    }

    struct UserInfo {
        uint256 stakedAmount;
        uint256 rewardPerTokenPaid;
        uint256 rewards;
    }

    mapping(address => StakingPool) public stakingPools;
    mapping(address => mapping(address => UserInfo)) public userInfo; // pool => user => info

    uint256 public constant REWARD_DURATION = 30 days;
    uint256 public constant PRECISION = 1e18;

    event StakingPoolCreated(address indexed stakingToken, address indexed rewardToken);
    event Staked(address indexed pool, address indexed user, uint256 amount);
    event Withdrawn(address indexed pool, address indexed user, uint256 amount);
    event RewardPaid(address indexed pool, address indexed user, uint256 reward);
    event RewardAdded(address indexed pool, uint256 reward);

    constructor() Ownable(msg.sender) {}

    function createStakingPool(address stakingToken, address rewardToken, uint256 rewardAmount) external onlyOwner {
        require(stakingToken != address(0) && rewardToken != address(0), "Staking: ZERO_ADDRESS");
        require(!stakingPools[stakingToken].exists, "Staking: POOL_EXISTS");
        require(rewardAmount > 0, "Staking: INVALID_REWARD_AMOUNT");

        IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), rewardAmount);

        stakingPools[stakingToken] = StakingPool({
            stakingToken: stakingToken,
            rewardToken: rewardToken,
            totalStaked: 0,
            rewardPerTokenStored: 0,
            lastUpdateTime: block.timestamp,
            periodFinish: block.timestamp + REWARD_DURATION,
            rewardRate: rewardAmount / REWARD_DURATION,
            exists: true
        });

        emit StakingPoolCreated(stakingToken, rewardToken);
        emit RewardAdded(stakingToken, rewardAmount);
    }

    function stake(address stakingToken, uint256 amount) external nonReentrant {
        StakingPool storage pool = stakingPools[stakingToken];
        require(pool.exists, "Staking: POOL_NOT_EXISTS");
        require(amount > 0, "Staking: INVALID_AMOUNT");

        updateReward(stakingToken, msg.sender);

        IERC20(stakingToken).safeTransferFrom(msg.sender, address(this), amount);
        
        pool.totalStaked += amount;
        userInfo[stakingToken][msg.sender].stakedAmount += amount;

        emit Staked(stakingToken, msg.sender, amount);
    }

    function withdraw(address stakingToken, uint256 amount) external nonReentrant {
        StakingPool storage pool = stakingPools[stakingToken];
        require(pool.exists, "Staking: POOL_NOT_EXISTS");
        require(amount > 0, "Staking: INVALID_AMOUNT");

        UserInfo storage user = userInfo[stakingToken][msg.sender];
        require(user.stakedAmount >= amount, "Staking: INSUFFICIENT_BALANCE");

        updateReward(stakingToken, msg.sender);

        pool.totalStaked -= amount;
        user.stakedAmount -= amount;

        IERC20(stakingToken).safeTransfer(msg.sender, amount);

        emit Withdrawn(stakingToken, msg.sender, amount);
    }

    function getReward(address stakingToken) external nonReentrant {
        StakingPool storage pool = stakingPools[stakingToken];
        require(pool.exists, "Staking: POOL_NOT_EXISTS");

        updateReward(stakingToken, msg.sender);

        uint256 reward = userInfo[stakingToken][msg.sender].rewards;
        if (reward > 0) {
            userInfo[stakingToken][msg.sender].rewards = 0;
            IERC20(pool.rewardToken).safeTransfer(msg.sender, reward);
            emit RewardPaid(stakingToken, msg.sender, reward);
        }
    }

    function exit(address stakingToken) external {
        UserInfo storage user = userInfo[stakingToken][msg.sender];
        this.withdraw(stakingToken, user.stakedAmount);
        this.getReward(stakingToken);
    }

    function updateReward(address stakingToken, address user) public {
        StakingPool storage pool = stakingPools[stakingToken];
        require(pool.exists, "Staking: POOL_NOT_EXISTS");

        pool.rewardPerTokenStored = rewardPerToken(stakingToken);
        pool.lastUpdateTime = lastTimeRewardApplicable(stakingToken);

        if (user != address(0)) {
            UserInfo storage userInfo_ = userInfo[stakingToken][user];
            userInfo_.rewards = earned(stakingToken, user);
            userInfo_.rewardPerTokenPaid = pool.rewardPerTokenStored;
        }
    }

    function lastTimeRewardApplicable(address stakingToken) public view returns (uint256) {
        StakingPool storage pool = stakingPools[stakingToken];
        return block.timestamp < pool.periodFinish ? block.timestamp : pool.periodFinish;
    }

    function rewardPerToken(address stakingToken) public view returns (uint256) {
        StakingPool storage pool = stakingPools[stakingToken];
        if (pool.totalStaked == 0) {
            return pool.rewardPerTokenStored;
        }
        return pool.rewardPerTokenStored + (
            (lastTimeRewardApplicable(stakingToken) - pool.lastUpdateTime) * 
            pool.rewardRate * 
            PRECISION / pool.totalStaked
        );
    }

    function earned(address stakingToken, address user) public view returns (uint256) {
        UserInfo storage userInfo_ = userInfo[stakingToken][user];
        return (
            userInfo_.stakedAmount * 
            (rewardPerToken(stakingToken) - userInfo_.rewardPerTokenPaid) / 
            PRECISION
        ) + userInfo_.rewards;
    }

    function getStakingPool(address stakingToken) external view returns (StakingPool memory) {
        return stakingPools[stakingToken];
    }

    function getUserInfo(address stakingToken, address user) external view returns (UserInfo memory) {
        return userInfo[stakingToken][user];
    }

    function addReward(address stakingToken, uint256 rewardAmount) external onlyOwner {
        StakingPool storage pool = stakingPools[stakingToken];
        require(pool.exists, "Staking: POOL_NOT_EXISTS");
        require(rewardAmount > 0, "Staking: INVALID_REWARD_AMOUNT");

        IERC20(pool.rewardToken).safeTransferFrom(msg.sender, address(this), rewardAmount);

        if (block.timestamp >= pool.periodFinish) {
            pool.rewardRate = rewardAmount / REWARD_DURATION;
        } else {
            uint256 remaining = pool.periodFinish - block.timestamp;
            uint256 leftover = remaining * pool.rewardRate;
            pool.rewardRate = (rewardAmount + leftover) / REWARD_DURATION;
        }

        pool.lastUpdateTime = block.timestamp;
        pool.periodFinish = block.timestamp + REWARD_DURATION;

        emit RewardAdded(stakingToken, rewardAmount);
    }

    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }
} 