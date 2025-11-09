// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingRewards is Ownable, ReentrancyGuard {
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    address public ammAddress;

    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public totalStaked;

    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public rewardBalances;
    mapping(address => uint256) public lastStakeTime;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);

    constructor(address _stakingToken, address _rewardToken, address _ammAddress, uint256 _rewardRate) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        ammAddress = _ammAddress;
        rewardRate = _rewardRate;
    }

    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");

        stakingToken.transferFrom(msg.sender, address(this), _amount);
        stakedBalances[msg.sender] += _amount;
        totalStaked += _amount;
        lastStakeTime[msg.sender] = block.timestamp;

        emit Staked(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        require(stakedBalances[msg.sender] >= _amount, "Insufficient staked balance");

        uint256 reward = calculateReward(msg.sender);
        rewardBalances[msg.sender] = 0;
        lastStakeTime[msg.sender] = block.timestamp;

        stakedBalances[msg.sender] -= _amount;
        totalStaked -= _amount;

        stakingToken.transfer(msg.sender, _amount);
        rewardToken.transfer(msg.sender, reward);

        emit Unstaked(msg.sender, _amount);
        emit RewardPaid(msg.sender, reward);
    }

    function calculateReward(address _user) internal view returns (uint256) {
        uint256 timeStaked = block.timestamp - lastStakeTime[_user];
        uint256 reward = (stakedBalances[_user] * rewardRate * timeStaked) / 1e18;
        return reward;
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }

    function setAMMAddress(address _ammAddress) external onlyOwner {
        ammAddress = _ammAddress;
    }

    function getStakedBalance(address _user) external view returns (uint256) {
        return stakedBalances[_user];
    }

    function getRewardBalance(address _user) external view returns (uint256) {
        return rewardBalances[_user];
    }

    function getPendingReward(address _user) external view returns (uint256) {
        return calculateReward(_user);
    }
} 