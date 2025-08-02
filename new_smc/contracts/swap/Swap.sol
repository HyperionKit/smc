// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract LiquidityPool is Ownable, ReentrancyGuard {
    using Math for uint256;

    struct Pair {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        bool exists;
    }

    struct LiquidityPosition {
        uint256 liquidity;
        uint256 timestamp;
    }

    // New staking structures
    struct StakingPosition {
        uint256 stakedAmount;
        uint256 rewardDebt;
        uint256 lastUpdateTime;
        bool isStaked;
    }

    struct StakingPool {
        address rewardToken;
        uint256 totalStaked;
        uint256 rewardPerToken;
        uint256 lastUpdateTime;
        uint256 rewardRate; // rewards per second
        bool exists;
    }

    mapping(bytes32 => Pair) public pairs;
    mapping(bytes32 => mapping(address => LiquidityPosition)) public liquidityPositions;
    
    // New staking mappings
    mapping(bytes32 => StakingPool) public stakingPools;
    mapping(bytes32 => mapping(address => StakingPosition)) public stakingPositions;
    
    bytes32[] public pairIds;
    bytes32[] public stakingPoolIds;
    
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public tradingFee = 30; // 0.3%
    uint256 public constant MAX_FEE = 1000; // 10% max fee
    bool public paused;

    // Staking constants
    uint256 public constant REWARD_PRECISION = 1e18;
    uint256 public constant MIN_STAKE_AMOUNT = 1e18; // 1 token minimum

    event PairCreated(
        address indexed tokenA,
        address indexed tokenB,
        bytes32 indexed pairId
    );
    
    event LiquidityAdded(
        bytes32 indexed pairId,
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        bytes32 indexed pairId,
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event Swap(
        bytes32 indexed pairId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    // New staking events
    event StakingPoolCreated(
        bytes32 indexed pairId,
        address indexed rewardToken,
        uint256 rewardRate
    );

    event Staked(
        bytes32 indexed pairId,
        address indexed user,
        uint256 amount,
        uint256 liquidity
    );

    event Unstaked(
        bytes32 indexed pairId,
        address indexed user,
        uint256 amount,
        uint256 liquidity
    );

    event RewardClaimed(
        bytes32 indexed pairId,
        address indexed user,
        uint256 reward
    );

    // New buy events
    event TokenBought(
        address indexed token,
        address indexed buyer,
        uint256 ethAmount,
        uint256 tokenAmount
    );

    event TradingFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor() Ownable(msg.sender) {}

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // ============ EXISTING AMM FUNCTIONS ============

    function createPair(address tokenA, address tokenB) external onlyOwner whenNotPaused returns (bytes32) {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        bytes32 pairId = keccak256(abi.encodePacked(token0, token1));
        
        require(!pairs[pairId].exists, "Pair already exists");
        
        pairs[pairId] = Pair({
            tokenA: token0,
            tokenB: token1,
            reserveA: 0,
            reserveB: 0,
            totalLiquidity: 0,
            exists: true
        });
        
        pairIds.push(pairId);
        
        emit PairCreated(token0, token1, pairId);
        return pairId;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant whenNotPaused returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        bytes32 pairId = getPairId(tokenA, tokenB);
        require(pairs[pairId].exists, "Pair does not exist");
        
        Pair storage pair = pairs[pairId];
        
        if (pair.reserveA == 0 && pair.reserveB == 0) {
            // First liquidity provision
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            // Calculate optimal amounts based on current reserves with overflow protection
            uint256 amountBOptimal;
            uint256 amountAOptimal;
            
            // Safe multiplication and division
            if (pair.reserveA > 0) {
                amountBOptimal = (amountADesired * pair.reserveB) / pair.reserveA;
            }
            
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                if (pair.reserveB > 0) {
                    amountAOptimal = (amountBDesired * pair.reserveA) / pair.reserveB;
                }
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "Insufficient A amount");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
        }
        
        // Calculate liquidity tokens to mint with better precision
        if (pair.totalLiquidity == 0) {
            liquidity = Math.sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
        } else {
            uint256 liquidityA = (amountA * pair.totalLiquidity) / pair.reserveA;
            uint256 liquidityB = (amountB * pair.totalLiquidity) / pair.reserveB;
            liquidity = Math.min(liquidityA, liquidityB);
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        // Transfer tokens from user
        require(IERC20(pair.tokenA).transferFrom(msg.sender, address(this), amountA), "Transfer A failed");
        require(IERC20(pair.tokenB).transferFrom(msg.sender, address(this), amountB), "Transfer B failed");
        
        // Update reserves and liquidity
        pair.reserveA += amountA;
        pair.reserveB += amountB;
        pair.totalLiquidity += liquidity;
        
        // Update user's liquidity position
        liquidityPositions[pairId][msg.sender].liquidity += liquidity;
        liquidityPositions[pairId][msg.sender].timestamp = block.timestamp;
        
        emit LiquidityAdded(pairId, msg.sender, amountA, amountB, liquidity);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant whenNotPaused returns (uint256 amountA, uint256 amountB) {
        bytes32 pairId = getPairId(tokenA, tokenB);
        require(pairs[pairId].exists, "Pair does not exist");
        require(liquidityPositions[pairId][msg.sender].liquidity >= liquidity, "Insufficient liquidity");
        
        Pair storage pair = pairs[pairId];
        
        // Calculate amounts to return
        amountA = (liquidity * pair.reserveA) / pair.totalLiquidity;
        amountB = (liquidity * pair.reserveB) / pair.totalLiquidity;
        
        require(amountA >= amountAMin && amountB >= amountBMin, "Insufficient amounts");
        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");
        
        // Update liquidity position
        liquidityPositions[pairId][msg.sender].liquidity -= liquidity;
        
        // Update reserves and total liquidity
        pair.reserveA -= amountA;
        pair.reserveB -= amountB;
        pair.totalLiquidity -= liquidity;
        
        // Transfer tokens back to user
        require(IERC20(pair.tokenA).transfer(msg.sender, amountA), "Transfer A failed");
        require(IERC20(pair.tokenB).transfer(msg.sender, amountB), "Transfer B failed");
        
        emit LiquidityRemoved(pairId, msg.sender, amountA, amountB, liquidity);
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid input amount");
        require(tokenIn != tokenOut, "Identical tokens");
        
        bytes32 pairId = getPairId(tokenIn, tokenOut);
        require(pairs[pairId].exists, "Pair does not exist");
        
        Pair storage pair = pairs[pairId];
        require(pair.reserveA > 0 && pair.reserveB > 0, "Insufficient liquidity");
        
        // Check user balance
        require(IERC20(tokenIn).balanceOf(msg.sender) >= amountIn, "Insufficient balance");
        
        // Determine which token is which
        bool isTokenAInput = tokenIn == pair.tokenA;
        (uint256 reserveIn, uint256 reserveOut) = isTokenAInput 
            ? (pair.reserveA, pair.reserveB) 
            : (pair.reserveB, pair.reserveA);
        
        // Calculate output amount using constant product formula with overflow protection
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - tradingFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
        
        require(amountOut >= amountOutMin, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");
        require(amountOut > 0, "Zero output amount");
        
        // Transfer tokens
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer out failed");
        
        // Update reserves
        if (isTokenAInput) {
            pair.reserveA += amountIn;
            pair.reserveB -= amountOut;
        } else {
            pair.reserveB += amountIn;
            pair.reserveA -= amountOut;
        }
        
        emit Swap(pairId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    function getAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) external view returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid input amount");
        
        bytes32 pairId = getPairId(tokenIn, tokenOut);
        require(pairs[pairId].exists, "Pair does not exist");
        
        Pair storage pair = pairs[pairId];
        bool isTokenAInput = tokenIn == pair.tokenA;
        (uint256 reserveIn, uint256 reserveOut) = isTokenAInput 
            ? (pair.reserveA, pair.reserveB) 
            : (pair.reserveB, pair.reserveA);
        
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - tradingFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    // ============ NEW STAKING FUNCTIONS ============

    function createStakingPool(
        address tokenA,
        address tokenB,
        address rewardToken,
        uint256 rewardRate
    ) external onlyOwner whenNotPaused returns (bytes32) {
        bytes32 pairId = getPairId(tokenA, tokenB);
        require(pairs[pairId].exists, "Pair does not exist");
        require(!stakingPools[pairId].exists, "Staking pool already exists");
        require(rewardToken != address(0), "Invalid reward token");
        require(rewardRate > 0, "Invalid reward rate");
        
        stakingPools[pairId] = StakingPool({
            rewardToken: rewardToken,
            totalStaked: 0,
            rewardPerToken: 0,
            lastUpdateTime: block.timestamp,
            rewardRate: rewardRate,
            exists: true
        });
        
        stakingPoolIds.push(pairId);
        
        emit StakingPoolCreated(pairId, rewardToken, rewardRate);
        return pairId;
    }

    function stakeLiquidity(address tokenA, address tokenB) external nonReentrant whenNotPaused {
        bytes32 pairId = getPairId(tokenA, tokenB);
        require(stakingPools[pairId].exists, "Staking pool does not exist");
        
        uint256 userLiquidity = liquidityPositions[pairId][msg.sender].liquidity;
        require(userLiquidity >= MIN_STAKE_AMOUNT, "Insufficient liquidity to stake");
        require(!stakingPositions[pairId][msg.sender].isStaked, "Already staked");
        
        // Update rewards
        _updateRewards(pairId);
        
        // Create staking position
        stakingPositions[pairId][msg.sender] = StakingPosition({
            stakedAmount: userLiquidity,
            rewardDebt: (userLiquidity * stakingPools[pairId].rewardPerToken) / REWARD_PRECISION,
            lastUpdateTime: block.timestamp,
            isStaked: true
        });
        
        stakingPools[pairId].totalStaked += userLiquidity;
        
        emit Staked(pairId, msg.sender, userLiquidity, userLiquidity);
    }

    function unstakeLiquidity(address tokenA, address tokenB) external nonReentrant whenNotPaused {
        bytes32 pairId = getPairId(tokenA, tokenB);
        require(stakingPools[pairId].exists, "Staking pool does not exist");
        require(stakingPositions[pairId][msg.sender].isStaked, "Not staked");
        
        // Claim rewards first
        _claimRewards(pairId);
        
        uint256 stakedAmount = stakingPositions[pairId][msg.sender].stakedAmount;
        
        // Remove staking position
        stakingPositions[pairId][msg.sender].isStaked = false;
        stakingPositions[pairId][msg.sender].stakedAmount = 0;
        stakingPositions[pairId][msg.sender].rewardDebt = 0;
        
        stakingPools[pairId].totalStaked -= stakedAmount;
        
        emit Unstaked(pairId, msg.sender, stakedAmount, stakedAmount);
    }

    function claimRewards(address tokenA, address tokenB) external nonReentrant whenNotPaused {
        bytes32 pairId = getPairId(tokenA, tokenB);
        require(stakingPools[pairId].exists, "Staking pool does not exist");
        require(stakingPositions[pairId][msg.sender].isStaked, "Not staked");
        
        _claimRewards(pairId);
    }

    function _updateRewards(bytes32 pairId) internal {
        StakingPool storage pool = stakingPools[pairId];
        if (pool.totalStaked == 0) {
            pool.lastUpdateTime = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        if (timeElapsed > 0) {
            uint256 rewards = timeElapsed * pool.rewardRate;
            pool.rewardPerToken += (rewards * REWARD_PRECISION) / pool.totalStaked;
            pool.lastUpdateTime = block.timestamp;
        }
    }

    function _claimRewards(bytes32 pairId) internal {
        _updateRewards(pairId);
        
        StakingPosition storage position = stakingPositions[pairId][msg.sender];
        StakingPool storage pool = stakingPools[pairId];
        
        uint256 pendingReward = (position.stakedAmount * pool.rewardPerToken) / REWARD_PRECISION - position.rewardDebt;
        
        if (pendingReward > 0) {
            position.rewardDebt = (position.stakedAmount * pool.rewardPerToken) / REWARD_PRECISION;
            
            require(IERC20(pool.rewardToken).transfer(msg.sender, pendingReward), "Reward transfer failed");
            
            emit RewardClaimed(pairId, msg.sender, pendingReward);
        }
    }

    // ============ NEW BUY FUNCTIONS ============

    function buyWithETH(address tokenOut, uint256 amountOutMin) 
        external payable nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(msg.value > 0, "No ETH sent");
        require(tokenOut != address(0), "Invalid token");
        
        // Find WETH pair - using WETH address from your deployment
        address wethAddress = 0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4; // Your WETH address
        require(wethAddress != address(0), "WETH not configured");
        
        bytes32 pairId = getPairId(wethAddress, tokenOut);
        require(pairs[pairId].exists, "Pair does not exist");
        
        Pair storage pair = pairs[pairId];
        require(pair.reserveA > 0 && pair.reserveB > 0, "Insufficient liquidity");
        
        // Determine which token is which
        bool isWETHTokenA = wethAddress == pair.tokenA;
        (uint256 reserveIn, uint256 reserveOut) = isWETHTokenA 
            ? (pair.reserveA, pair.reserveB) 
            : (pair.reserveB, pair.reserveA);
        
        // Calculate output amount
        uint256 amountInWithFee = msg.value * (FEE_DENOMINATOR - tradingFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
        
        require(amountOut >= amountOutMin, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");
        require(amountOut > 0, "Zero output amount");
        
        // Transfer tokens
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer out failed");
        
        // Update reserves
        if (isWETHTokenA) {
            pair.reserveA += msg.value;
            pair.reserveB -= amountOut;
        } else {
            pair.reserveB += msg.value;
            pair.reserveA -= amountOut;
        }
        
        emit TokenBought(tokenOut, msg.sender, msg.value, amountOut);
    }

    function getBuyAmountOut(uint256 ethAmount, address tokenOut) 
        external view returns (uint256 amountOut) {
        require(ethAmount > 0, "Invalid ETH amount");
        require(tokenOut != address(0), "Invalid token");
        
        address wethAddress = 0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4; // Your WETH address
        require(wethAddress != address(0), "WETH not configured");
        
        bytes32 pairId = getPairId(wethAddress, tokenOut);
        require(pairs[pairId].exists, "Pair does not exist");
        
        Pair storage pair = pairs[pairId];
        bool isWETHTokenA = wethAddress == pair.tokenA;
        (uint256 reserveIn, uint256 reserveOut) = isWETHTokenA 
            ? (pair.reserveA, pair.reserveB) 
            : (pair.reserveB, pair.reserveA);
        
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = ethAmount * (FEE_DENOMINATOR - tradingFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    // ============ VIEW FUNCTIONS ============

    function getPairId(address tokenA, address tokenB) public pure returns (bytes32) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return keccak256(abi.encodePacked(token0, token1));
    }

    function getPairInfo(address tokenA, address tokenB) external view returns (
        uint256 reserveA,
        uint256 reserveB,
        uint256 totalLiquidity
    ) {
        bytes32 pairId = getPairId(tokenA, tokenB);
        require(pairs[pairId].exists, "Pair does not exist");
        
        Pair storage pair = pairs[pairId];
        reserveA = pair.reserveA;
        reserveB = pair.reserveB;
        totalLiquidity = pair.totalLiquidity;
    }

    function getUserLiquidity(address tokenA, address tokenB, address user) external view returns (uint256) {
        bytes32 pairId = getPairId(tokenA, tokenB);
        return liquidityPositions[pairId][user].liquidity;
    }

    function getAllPairs() external view returns (bytes32[] memory) {
        return pairIds;
    }

    // New staking view functions
    function getStakingPoolInfo(address tokenA, address tokenB) external view returns (
        address rewardToken,
        uint256 totalStaked,
        uint256 rewardPerToken,
        uint256 rewardRate,
        bool exists
    ) {
        bytes32 pairId = getPairId(tokenA, tokenB);
        StakingPool storage pool = stakingPools[pairId];
        rewardToken = pool.rewardToken;
        totalStaked = pool.totalStaked;
        rewardPerToken = pool.rewardPerToken;
        rewardRate = pool.rewardRate;
        exists = pool.exists;
    }

    function getUserStakingInfo(address tokenA, address tokenB, address user) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        bool isStaked
    ) {
        bytes32 pairId = getPairId(tokenA, tokenB);
        StakingPosition storage position = stakingPositions[pairId][user];
        StakingPool storage pool = stakingPools[pairId];
        
        stakedAmount = position.stakedAmount;
        isStaked = position.isStaked;
        
        if (isStaked && pool.totalStaked > 0) {
            uint256 currentRewardPerToken = pool.rewardPerToken;
            if (block.timestamp > pool.lastUpdateTime) {
                uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
                uint256 rewards = timeElapsed * pool.rewardRate;
                currentRewardPerToken += (rewards * REWARD_PRECISION) / pool.totalStaked;
            }
            pendingRewards = (position.stakedAmount * currentRewardPerToken) / REWARD_PRECISION - position.rewardDebt;
        } else {
            pendingRewards = 0;
        }
    }

    function getAllStakingPools() external view returns (bytes32[] memory) {
        return stakingPoolIds;
    }

    // ============ ADMIN FUNCTIONS ============

    function setTradingFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high"); // Max 10%
        uint256 oldFee = tradingFee;
        tradingFee = _fee;
        emit TradingFeeUpdated(oldFee, _fee);
    }

    function setRewardRate(address tokenA, address tokenB, uint256 newRewardRate) external onlyOwner {
        bytes32 pairId = getPairId(tokenA, tokenB);
        require(stakingPools[pairId].exists, "Staking pool does not exist");
        stakingPools[pairId].rewardRate = newRewardRate;
    }

    // Emergency functions
    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    // Emergency withdrawal function for owner
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Emergency withdrawal failed");
    }

    // Emergency ETH withdrawal
    function emergencyWithdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
} 