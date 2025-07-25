// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./UniswapV2Router02.sol";

contract TokenSwap is Ownable {
    address public immutable router;
    address public immutable factory;
    
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint amountIn,
        uint amountOut,
        uint timestamp
    );
    
    event SlippageUpdated(uint oldSlippage, uint newSlippage);
    
    uint public slippageTolerance = 50; // 0.5% default slippage (50 basis points)
    uint public constant MAX_SLIPPAGE = 1000; // 10% maximum slippage
    
    constructor(address _router) Ownable(msg.sender) {
        router = _router;
        factory = UniswapV2Router02(_router).factory();
    }
    
    /**
     * @dev Swap exact amount of tokens for tokens
     * @param tokenIn Address of the input token
     * @param tokenOut Address of the output token
     * @param amountIn Amount of input tokens to swap
     * @param amountOutMin Minimum amount of output tokens to receive
     * @param deadline Transaction deadline
     */
    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint amountIn,
        uint amountOutMin,
        uint deadline
    ) external returns (uint[] memory amounts) {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token addresses");
        require(amountIn > 0, "Amount must be greater than 0");
        require(deadline >= block.timestamp, "Transaction expired");
        
        // Transfer tokens from user to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Approve router to spend tokens
        IERC20(tokenIn).approve(router, amountIn);
        
        // Create swap path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        // Execute swap
        amounts = UniswapV2Router02(router).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            deadline
        );
        
        emit SwapExecuted(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amounts[amounts.length - 1],
            block.timestamp
        );
    }
    
    /**
     * @dev Swap tokens for exact amount of tokens
     * @param tokenIn Address of the input token
     * @param tokenOut Address of the output token
     * @param amountOut Exact amount of output tokens to receive
     * @param amountInMax Maximum amount of input tokens to spend
     * @param deadline Transaction deadline
     */
    function swapTokensForExactTokens(
        address tokenIn,
        address tokenOut,
        uint amountOut,
        uint amountInMax,
        uint deadline
    ) external returns (uint[] memory amounts) {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token addresses");
        require(amountOut > 0, "Amount must be greater than 0");
        require(deadline >= block.timestamp, "Transaction expired");
        
        // Get required input amount
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        amounts = UniswapV2Router02(router).getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "Excessive input amount");
        
        // Transfer tokens from user to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amounts[0]);
        
        // Approve router to spend tokens
        IERC20(tokenIn).approve(router, amounts[0]);
        
        // Execute swap
        amounts = UniswapV2Router02(router).swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            msg.sender,
            deadline
        );
        
        emit SwapExecuted(
            msg.sender,
            tokenIn,
            tokenOut,
            amounts[0],
            amountOut,
            block.timestamp
        );
    }
    
    /**
     * @dev Get expected output amount for a given input
     * @param tokenIn Address of the input token
     * @param tokenOut Address of the output token
     * @param amountIn Amount of input tokens
     * @return amountOut Expected output amount
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint amountIn
    ) external view returns (uint amountOut) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint[] memory amounts = UniswapV2Router02(router).getAmountsOut(amountIn, path);
        amountOut = amounts[amounts.length - 1];
    }
    
    /**
     * @dev Get required input amount for a given output
     * @param tokenIn Address of the input token
     * @param tokenOut Address of the output token
     * @param amountOut Amount of output tokens
     * @return amountIn Required input amount
     */
    function getAmountIn(
        address tokenIn,
        address tokenOut,
        uint amountOut
    ) external view returns (uint amountIn) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint[] memory amounts = UniswapV2Router02(router).getAmountsIn(amountOut, path);
        amountIn = amounts[0];
    }
    
    /**
     * @dev Calculate minimum output amount with slippage protection
     * @param amountOut Expected output amount
     * @return minAmountOut Minimum output amount with slippage applied
     */
    function calculateMinAmountOut(uint amountOut) public view returns (uint minAmountOut) {
        minAmountOut = amountOut * (10000 - slippageTolerance) / 10000;
    }
    
    /**
     * @dev Update slippage tolerance (owner only)
     * @param newSlippage New slippage tolerance in basis points
     */
    function updateSlippageTolerance(uint newSlippage) external onlyOwner {
        require(newSlippage <= MAX_SLIPPAGE, "Slippage too high");
        uint oldSlippage = slippageTolerance;
        slippageTolerance = newSlippage;
        emit SlippageUpdated(oldSlippage, newSlippage);
    }
    
    /**
     * @dev Emergency function to recover stuck tokens (owner only)
     * @param token Address of the token to recover
     * @param amount Amount to recover
     * @param to Address to send tokens to
     */
    function emergencyRecover(
        address token,
        uint amount,
        address to
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        IERC20(token).transfer(to, amount);
    }
    
    /**
     * @dev Check if a pair exists for the given tokens
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return exists Whether the pair exists
     */
    function pairExists(address tokenA, address tokenB) external view returns (bool exists) {
        address pair = UniswapV2Factory(factory).getPair(tokenA, tokenB);
        exists = pair != address(0);
    }
} 