// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract EnhancedAMM is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalSupply;
        uint256 lastUpdateTime;
        bool exists;
    }

    struct PoolInfo {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalSupply;
        uint256 lastUpdateTime;
        bool exists;
        uint256 fee;
        uint256 volume24h;
    }

    mapping(address => mapping(address => Pool)) public pools;
    mapping(address => mapping(address => mapping(address => uint256))) public liquidityBalances;
    mapping(address => bool) public supportedTokens;
    mapping(address => mapping(address => uint256)) public poolFees; // Custom fees per pool
    
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public defaultSwapFee = 30; // 0.3% default fee
    uint256 public maxSwapFee = 500; // 5% maximum fee
    
    // Events
    event PoolCreated(address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 fee);
    event LiquidityAdded(address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, address indexed user);
    event FeeUpdated(address indexed tokenA, address indexed tokenB, uint256 newFee);
    event TokenSupported(address indexed token, bool supported);

    constructor() Ownable(msg.sender) {}

    modifier onlySupportedToken(address token) {
        require(supportedTokens[token], "AMM: TOKEN_NOT_SUPPORTED");
        _;
    }

    modifier poolExists(address tokenA, address tokenB) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(pools[token0][token1].exists, "AMM: POOL_NOT_EXISTS");
        _;
    }

    // Admin functions
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "AMM: ZERO_ADDRESS");
        supportedTokens[token] = true;
        emit TokenSupported(token, true);
    }

    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        emit TokenSupported(token, false);
    }

    function setDefaultSwapFee(uint256 newFee) external onlyOwner {
        require(newFee <= maxSwapFee, "AMM: FEE_TOO_HIGH");
        defaultSwapFee = newFee;
    }

    function setPoolFee(address tokenA, address tokenB, uint256 newFee) external onlyOwner {
        require(newFee <= maxSwapFee, "AMM: FEE_TOO_HIGH");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        poolFees[token0][token1] = newFee;
        emit FeeUpdated(token0, token1, newFee);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Core AMM functions
    function createPool(
        address tokenA, 
        address tokenB, 
        uint256 amountA, 
        uint256 amountB
    ) external whenNotPaused {
        require(tokenA != tokenB, "AMM: IDENTICAL_ADDRESSES");
        require(tokenA != address(0) && tokenB != address(0), "AMM: ZERO_ADDRESS");
        require(amountA > 0 && amountB > 0, "AMM: INSUFFICIENT_INPUT_AMOUNT");
        require(supportedTokens[tokenA] && supportedTokens[tokenB], "AMM: TOKEN_NOT_SUPPORTED");
        
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(!pools[token0][token1].exists, "AMM: POOL_EXISTS");

        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        uint256 liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
        require(liquidity > 0, "AMM: INSUFFICIENT_LIQUIDITY_MINTED");

        pools[token0][token1] = Pool({
            tokenA: token0,
            tokenB: token1,
            reserveA: amountA,
            reserveB: amountB,
            totalSupply: liquidity + MINIMUM_LIQUIDITY,
            lastUpdateTime: block.timestamp,
            exists: true
        });

        liquidityBalances[token0][token1][msg.sender] = liquidity;
        liquidityBalances[token0][token1][address(0)] = MINIMUM_LIQUIDITY; // Locked liquidity

        emit PoolCreated(token0, token1, amountA, amountB, getPoolFee(token0, token1));
    }

    function addLiquidity(
        address tokenA, 
        address tokenB, 
        uint256 amountA, 
        uint256 amountB
    ) external nonReentrant whenNotPaused {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        Pool storage pool = pools[token0][token1];
        require(pool.exists, "AMM: POOL_NOT_EXISTS");

        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        uint256 liquidity;
        if (pool.totalSupply == 0) {
            liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            liquidityBalances[token0][token1][address(0)] = MINIMUM_LIQUIDITY;
        } else {
            liquidity = min((amountA * pool.totalSupply) / pool.reserveA, (amountB * pool.totalSupply) / pool.reserveB);
        }

        require(liquidity > 0, "AMM: INSUFFICIENT_LIQUIDITY_MINTED");

        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalSupply += liquidity;
        pool.lastUpdateTime = block.timestamp;
        liquidityBalances[token0][token1][msg.sender] += liquidity;

        emit LiquidityAdded(token0, token1, amountA, amountB, liquidity);
    }

    function removeLiquidity(
        address tokenA, 
        address tokenB, 
        uint256 liquidity
    ) external nonReentrant whenNotPaused {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        Pool storage pool = pools[token0][token1];
        require(pool.exists, "AMM: POOL_NOT_EXISTS");

        uint256 userLiquidity = liquidityBalances[token0][token1][msg.sender];
        require(liquidity <= userLiquidity, "AMM: INSUFFICIENT_LIQUIDITY");

        uint256 amountA = (liquidity * pool.reserveA) / pool.totalSupply;
        uint256 amountB = (liquidity * pool.reserveB) / pool.totalSupply;

        require(amountA > 0 && amountB > 0, "AMM: INSUFFICIENT_LIQUIDITY_BURNED");

        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        pool.totalSupply -= liquidity;
        pool.lastUpdateTime = block.timestamp;
        liquidityBalances[token0][token1][msg.sender] -= liquidity;

        IERC20(token0).safeTransfer(msg.sender, amountA);
        IERC20(token1).safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(token0, token1, amountA, amountB, liquidity);
    }

    function swap(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant whenNotPaused {
        require(tokenIn != tokenOut, "AMM: IDENTICAL_ADDRESSES");
        require(amountIn > 0, "AMM: INSUFFICIENT_INPUT_AMOUNT");
        require(supportedTokens[tokenIn] && supportedTokens[tokenOut], "AMM: TOKEN_NOT_SUPPORTED");

        (address token0, address token1) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        Pool storage pool = pools[token0][token1];
        require(pool.exists, "AMM: POOL_NOT_EXISTS");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        uint256 amountOut = getAmountOut(amountIn, tokenIn == token0 ? pool.reserveA : pool.reserveB, tokenIn == token0 ? pool.reserveB : pool.reserveA);
        require(amountOut >= minAmountOut, "AMM: INSUFFICIENT_OUTPUT_AMOUNT");

        if (tokenIn == token0) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }

        pool.lastUpdateTime = block.timestamp;
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        emit Swap(tokenIn, tokenOut, amountIn, amountOut, msg.sender);
    }

    // View functions
    function getAmountOut(
        uint256 amountIn, 
        uint256 reserveIn, 
        uint256 reserveOut
    ) public view returns (uint256) {
        require(amountIn > 0, "AMM: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "AMM: INSUFFICIENT_LIQUIDITY");

        uint256 fee = defaultSwapFee; // Use default fee for calculation
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - fee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;
        return numerator / denominator;
    }

    function getPool(address tokenA, address tokenB) external view returns (PoolInfo memory) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        Pool storage pool = pools[token0][token1];
        
        return PoolInfo({
            tokenA: pool.tokenA,
            tokenB: pool.tokenB,
            reserveA: pool.reserveA,
            reserveB: pool.reserveB,
            totalSupply: pool.totalSupply,
            lastUpdateTime: pool.lastUpdateTime,
            exists: pool.exists,
            fee: getPoolFee(token0, token1),
            volume24h: 0 // Placeholder for volume tracking
        });
    }

    function getLiquidityBalance(
        address tokenA, 
        address tokenB, 
        address user
    ) external view returns (uint256) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return liquidityBalances[token0][token1][user];
    }

    function getPoolFee(address tokenA, address tokenB) public view returns (uint256) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        uint256 customFee = poolFees[token0][token1];
        return customFee > 0 ? customFee : defaultSwapFee;
    }

    function getSupportedTokens() external view returns (address[] memory) {
        // This is a simplified version - in production you'd want to track supported tokens in an array
        return new address[](0);
    }

    // Utility functions
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    // Emergency functions
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }

    function emergencyPause() external onlyOwner {
        _pause();
    }
} 