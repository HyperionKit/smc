# Uniswap V2-Style Token Swap System

This document provides a comprehensive guide to the fully functional smart contract token swap system implemented following the Uniswap V2 pattern.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Contracts](#core-contracts)
4. [Deployment](#deployment)
5. [Usage](#usage)
6. [Testing](#testing)
7. [Security Features](#security-features)
8. [Integration Guide](#integration-guide)

## Overview

The swap system implements a complete Automated Market Maker (AMM) following the Uniswap V2 architecture. It provides:

- **Factory Contract**: Deploys and manages token pair pools
- **Pair Contracts**: Handle liquidity pools and swaps using the constant product formula (x × y = k)
- **Router Contract**: User-friendly interface for swaps and liquidity operations
- **TokenSwap Contract**: Simplified interface for easy integration
- **WETH Contract**: Wrapped ETH for ETH/token swaps

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TokenSwap     │    │   UniswapV2     │    │   UniswapV2     │
│   (User Interface) │    │   Router02      │    │   Factory       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UniswapV2     │    │   UniswapV2     │    │   WETH          │
│   Library       │    │   Pair          │    │   (Wrapped ETH) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features

- **Constant Product Formula**: x × y = k ensures price discovery
- **0.3% Swap Fee**: Standard Uniswap V2 fee structure
- **Slippage Protection**: Configurable slippage tolerance
- **Multi-hop Swaps**: Support for complex swap paths
- **Liquidity Provision**: Add/remove liquidity functionality
- **Emergency Functions**: Token recovery and safety features

## Core Contracts

### 1. UniswapV2Factory.sol

**Purpose**: Deploys and registers all token pair pools

**Key Functions**:
- `createPair(address tokenA, address tokenB)`: Creates a new trading pair
- `getPair(address tokenA, address tokenB)`: Returns pair address
- `allPairs(uint index)`: Returns pair by index

### 2. UniswapV2Pair.sol

**Purpose**: Manages individual token pairs and performs swaps

**Key Functions**:
- `swap(uint amount0Out, uint amount1Out, address to, bytes calldata data)`: Execute swaps
- `mint(address to)`: Add liquidity and mint LP tokens
- `burn(address to)`: Remove liquidity and burn LP tokens
- `getReserves()`: Get current pool reserves

### 3. UniswapV2Router02.sol

**Purpose**: User-friendly interface for all swap operations

**Key Functions**:
- `swapExactTokensForTokens()`: Swap exact input for minimum output
- `swapTokensForExactTokens()`: Swap maximum input for exact output
- `addLiquidity()`: Add liquidity to a pair
- `removeLiquidity()`: Remove liquidity from a pair

### 4. TokenSwap.sol

**Purpose**: Simplified interface for easy integration

**Key Functions**:
- `swapExactTokensForTokens()`: Simple token-to-token swap
- `getAmountOut()`: Get expected output for input amount
- `getAmountIn()`: Get required input for output amount
- `calculateMinAmountOut()`: Calculate minimum output with slippage

### 5. UniswapV2Library.sol

**Purpose**: Mathematical utilities for swap calculations

**Key Functions**:
- `getAmountOut()`: Calculate output amount
- `getAmountIn()`: Calculate input amount
- `getAmountsOut()`: Calculate amounts for multi-hop swaps
- `sqrt()`: Square root calculation for liquidity math

## Deployment

### Prerequisites

1. Node.js and npm installed
2. Hardhat configured
3. Private key with sufficient funds for deployment

### Deployment Steps

1. **Deploy the complete system**:
```bash
npx hardhat run scripts/deploy-swap.js --network <network-name>
```

2. **Verify deployment**:
```bash
npx hardhat run scripts/test-swap.js --network <network-name>
```

### Deployment Output

The deployment script creates:
- WETH contract
- Factory contract
- Router contract
- TokenSwap contract
- Test tokens (Token A & Token B)
- Initial liquidity pool

A `deployment-<network>.json` file is generated with all contract addresses.

## Usage

### Basic Token Swap

```javascript
const { ethers } = require("hardhat");

// Get contract instances
const tokenSwap = await ethers.getContractAt("TokenSwap", tokenSwapAddress);
const tokenA = await ethers.getContractAt("IERC20", tokenAAddress);
const tokenB = await ethers.getContractAt("IERC20", tokenBAddress);

// Approve tokens
await tokenA.approve(tokenSwapAddress, amount);

// Execute swap
const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes
const minOutput = await tokenSwap.calculateMinAmountOut(expectedOutput);

const tx = await tokenSwap.swapExactTokensForTokens(
    tokenAAddress,
    tokenBAddress,
    amount,
    minOutput,
    deadline
);
await tx.wait();
```

### Get Swap Quote

```javascript
// Get expected output for input amount
const expectedOutput = await tokenSwap.getAmountOut(
    tokenAAddress,
    tokenBAddress,
    ethers.parseEther("10")
);

// Get required input for output amount
const requiredInput = await tokenSwap.getAmountIn(
    tokenAAddress,
    tokenBAddress,
    ethers.parseEther("5")
);
```

### Add Liquidity

```javascript
const router = await ethers.getContractAt("UniswapV2Router02", routerAddress);

// Approve tokens
await tokenA.approve(routerAddress, amountA);
await tokenB.approve(routerAddress, amountB);

// Add liquidity
const tx = await router.addLiquidity(
    tokenAAddress,
    tokenBAddress,
    amountA,
    amountB,
    0, // slippage tolerance
    0, // slippage tolerance
    userAddress,
    deadline
);
```

## Testing

### Run Complete Test Suite

```bash
npx hardhat run scripts/test-swap.js --network <network-name>
```

### Test Coverage

The test script covers:
- Token transfers and approvals
- Swap quote calculations
- Exact input swaps
- Exact output swaps
- Reverse swaps
- Slippage calculations
- Pair existence checks
- Slippage tolerance updates

### Expected Test Output

```
=== SWAP TESTING ===
TokenSwap: 0x...
Token A: 0x...
Token B: 0x...
Router: 0x...
====================

1. Transferring tokens to user for testing...
2. Checking initial balances...
3. Getting swap quote...
4. Approving tokens for swap...
5. Executing swap...
6. Checking final balances...
7. Testing reverse swap...
8. Testing pair existence check...
9. Testing slippage update...

=== SWAP TESTING COMPLETED ===
```

## Security Features

### 1. Slippage Protection

- Configurable slippage tolerance (default: 0.5%)
- Maximum slippage limit (10%)
- Owner-controlled slippage updates

### 2. Deadline Protection

- All swaps require a deadline parameter
- Transactions revert if deadline is exceeded
- Prevents stale transaction execution

### 3. Reentrancy Protection

- Lock modifier prevents reentrancy attacks
- Safe transfer functions with proper error handling

### 4. Emergency Functions

- Token recovery for stuck funds
- Owner-only emergency functions
- Proper access control

### 5. Input Validation

- Zero address checks
- Amount validation
- Token pair existence verification

## Integration Guide

### For DApps

1. **Import the TokenSwap contract**:
```javascript
import TokenSwap from './contracts/TokenSwap.sol';
```

2. **Initialize the contract**:
```javascript
const tokenSwap = new ethers.Contract(tokenSwapAddress, TokenSwap.abi, signer);
```

3. **Implement swap functionality**:
```javascript
async function performSwap(tokenIn, tokenOut, amount) {
    const expectedOutput = await tokenSwap.getAmountOut(tokenIn, tokenOut, amount);
    const minOutput = await tokenSwap.calculateMinAmountOut(expectedOutput);
    
    await tokenSwap.swapExactTokensForTokens(
        tokenIn,
        tokenOut,
        amount,
        minOutput,
        Math.floor(Date.now() / 1000) + 600
    );
}
```

### For Smart Contracts

1. **Import the interface**:
```solidity
import "./UniswapV2Router02.sol";

contract MyContract {
    IUniswapV2Router02 public router;
    
    constructor(address _router) {
        router = IUniswapV2Router02(_router);
    }
}
```

2. **Implement swap logic**:
```solidity
function swapTokens(
    address tokenIn,
    address tokenOut,
    uint amountIn,
    uint amountOutMin
) external {
    IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
    IERC20(tokenIn).approve(address(router), amountIn);
    
    address[] memory path = new address[](2);
    path[0] = tokenIn;
    path[1] = tokenOut;
    
    router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        msg.sender,
        block.timestamp + 300
    );
}
```

### Network-Specific Configuration

#### Metis Testnet
```javascript
const METIS_TESTNET_CONFIG = {
    chainId: 59902,
    rpcUrl: "https://metis-sepolia-rpc.publicnode.com",
    routerAddress: "0x...", // Deployed router address
    factoryAddress: "0x...", // Deployed factory address
    wethAddress: "0x..." // Deployed WETH address
};
```

#### Hyperion Testnet
```javascript
const HYPERION_CONFIG = {
    chainId: 133717,
    rpcUrl: "https://hyperion-testnet.metisdevops.link",
    routerAddress: "0x...",
    factoryAddress: "0x...",
    wethAddress: "0x..."
};
```

## Best Practices

### 1. Slippage Management

- Always use slippage protection
- Calculate appropriate slippage based on market conditions
- Consider using dynamic slippage based on trade size

### 2. Gas Optimization

- Batch multiple operations when possible
- Use appropriate deadline values
- Consider gas costs when choosing swap paths

### 3. Error Handling

- Implement proper error handling for failed swaps
- Check token approvals before swaps
- Validate input parameters

### 4. User Experience

- Provide clear error messages
- Show swap previews before execution
- Implement loading states during transactions

## Troubleshooting

### Common Issues

1. **Insufficient Allowance**
   - Ensure tokens are approved for the router/swap contract
   - Check approval amounts

2. **Insufficient Liquidity**
   - Verify pair exists and has liquidity
   - Check reserve amounts

3. **Slippage Too High**
   - Reduce swap amount
   - Increase slippage tolerance
   - Check for price impact

4. **Transaction Expired**
   - Increase deadline parameter
   - Retry transaction

### Debug Commands

```bash
# Check pair reserves
npx hardhat console --network <network>
> const pair = await ethers.getContractAt("UniswapV2Pair", pairAddress)
> await pair.getReserves()

# Check token balances
> const token = await ethers.getContractAt("IERC20", tokenAddress)
> await token.balanceOf(userAddress)

# Check pair existence
> const factory = await ethers.getContractAt("UniswapV2Factory", factoryAddress)
> await factory.getPair(tokenA, tokenB)
```

## Conclusion

This swap system provides a complete, production-ready implementation of the Uniswap V2 pattern. It includes all necessary components for token swapping, liquidity provision, and price discovery. The modular design allows for easy integration into existing DeFi applications while maintaining security and efficiency.

For additional support or questions, refer to the test scripts and deployment examples provided in this repository. 