# Swap Mechanism Guide

This guide explains how to interact with the swap mechanism in the SMC DeFi ecosystem, allowing users to swap between USDT and USDC tokens.

## 🏗️ Architecture Overview

The swap mechanism is built on a **Constant Product AMM (Automated Market Maker)** model, similar to Uniswap V2. The key components are:

- **SimpleAMM Contract**: Handles all swap operations
- **Liquidity Pools**: Store token reserves for trading
- **Price Calculation**: Uses the formula `x * y = k` (constant product)

## 🔄 How Swaps Work

### 1. **Price Calculation**
The swap price is calculated using the constant product formula:
```
amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
```

### 2. **Fee Structure**
- **Swap Fee**: 0.3% (30 basis points)
- **Fee Collection**: Fees are added to the liquidity pool

### 3. **Slippage Protection**
The system automatically calculates the expected output amount, but actual output may vary due to:
- Price impact of large trades
- MEV (Maximal Extractable Value)
- Network congestion

## 📋 Prerequisites

Before performing swaps, ensure you have:

1. **Deployed Contracts**: USDT, USDC, and SimpleAMM contracts
2. **Token Balances**: Sufficient tokens to swap
3. **Gas Fees**: ETH for transaction fees
4. **Environment Setup**: Contract addresses configured

## 🚀 Basic Swap Operations

### Step 1: Approve Tokens
Before swapping, you must approve the AMM contract to spend your tokens:

```javascript
// Approve USDT for swapping
const swapAmount = ethers.parseUnits("1000", 6); // 1000 USDT
await usdt.approve(ammAddress, swapAmount);
```

### Step 2: Execute Swap
Perform the actual swap operation:

```javascript
// Swap USDT for USDC
await amm.swap(usdtAddress, usdcAddress, swapAmount);
```

### Step 3: Verify Results
Check your token balances after the swap:

```javascript
const usdcBalance = await usdc.balanceOf(userAddress);
console.log("USDC received:", ethers.formatUnits(usdcBalance, 6));
```

## 📊 Advanced Swap Features

### 1. **Calculate Expected Output**
Before swapping, calculate the expected output:

```javascript
const pool = await amm.getPool(usdtAddress, usdcAddress);
const expectedOutput = await amm.getAmountOut(
    swapAmount, 
    pool.reserveA, 
    pool.reserveB
);
console.log("Expected USDC:", ethers.formatUnits(expectedOutput, 6));
```

### 2. **Check Pool Information**
Get current pool state:

```javascript
const pool = await amm.getPool(usdtAddress, usdcAddress);
console.log("USDT Reserve:", ethers.formatUnits(pool.reserveA, 6));
console.log("USDC Reserve:", ethers.formatUnits(pool.reserveB, 6));
console.log("Total Supply:", pool.totalSupply.toString());
```

### 3. **Calculate Price Impact**
Estimate the price impact of your trade:

```javascript
const priceBefore = Number(pool.reserveB) / Number(pool.reserveA);
const expectedOutput = await amm.getAmountOut(swapAmount, pool.reserveA, pool.reserveB);
const newReserveA = Number(pool.reserveA) + Number(swapAmount);
const newReserveB = Number(pool.reserveB) - Number(expectedOutput);
const priceAfter = newReserveB / newReserveA;
const priceImpact = ((priceBefore - priceAfter) / priceBefore) * 100;
console.log("Price Impact:", priceImpact.toFixed(4) + "%");
```

## 🛠️ Usage Examples

### Example 1: Basic USDT → USDC Swap
```javascript
async function swapUSDTtoUSDC(amount) {
    const swapAmount = ethers.parseUnits(amount.toString(), 6);
    
    // 1. Approve USDT
    await usdt.approve(ammAddress, swapAmount);
    
    // 2. Execute swap
    await amm.swap(usdtAddress, usdcAddress, swapAmount);
    
    console.log(`Swapped ${amount} USDT for USDC`);
}
```

### Example 2: USDC → USDT Swap
```javascript
async function swapUSDCtoUSDT(amount) {
    const swapAmount = ethers.parseUnits(amount.toString(), 6);
    
    // 1. Approve USDC
    await usdc.approve(ammAddress, swapAmount);
    
    // 2. Execute swap
    await amm.swap(usdcAddress, usdtAddress, swapAmount);
    
    console.log(`Swapped ${amount} USDC for USDT`);
}
```

### Example 3: Get Swap Quote
```javascript
async function getSwapQuote(fromToken, toToken, amount) {
    const swapAmount = ethers.parseUnits(amount.toString(), 6);
    const pool = await amm.getPool(usdtAddress, usdcAddress);
    
    let reserveIn, reserveOut;
    if (fromToken === "USDT") {
        reserveIn = pool.reserveA;
        reserveOut = pool.reserveB;
    } else {
        reserveIn = pool.reserveB;
        reserveOut = pool.reserveA;
    }
    
    const expectedOutput = await amm.getAmountOut(swapAmount, reserveIn, reserveOut);
    return ethers.formatUnits(expectedOutput, 6);
}
```

## 🔧 Script Usage

### Run Swap Examples
```bash
# Run comprehensive swap examples
npx hardhat run scripts/swap-examples.ts --network hyperion
```

### Quick Swap Utility
```bash
# Swap 1000 USDT for USDC
npx hardhat run scripts/quick-swap.ts -- USDT USDC 1000 --network hyperion

# Swap 500 USDC for USDT
npx hardhat run scripts/quick-swap.ts -- USDC USDT 500 --network hyperion
```

## 📈 Liquidity Management

### Add Liquidity
```javascript
async function addLiquidity(usdtAmount, usdcAmount) {
    const usdtLiquidity = ethers.parseUnits(usdtAmount.toString(), 6);
    const usdcLiquidity = ethers.parseUnits(usdcAmount.toString(), 6);
    
    // Approve both tokens
    await usdt.approve(ammAddress, usdtLiquidity);
    await usdc.approve(ammAddress, usdcLiquidity);
    
    // Add liquidity
    await amm.addLiquidity(usdtAddress, usdcAddress, usdtLiquidity, usdcLiquidity);
}
```

### Remove Liquidity
```javascript
async function removeLiquidity(liquidityAmount) {
    await amm.removeLiquidity(usdtAddress, usdcAddress, liquidityAmount);
}
```

## ⚠️ Important Considerations

### 1. **Slippage Tolerance**
- Large trades may experience significant slippage
- Always check the expected output before swapping
- Consider breaking large trades into smaller ones

### 2. **Gas Optimization**
- Batch multiple operations when possible
- Use appropriate gas limits for your transactions
- Monitor gas prices for optimal timing

### 3. **Security Best Practices**
- Always verify contract addresses
- Check token approvals before swapping
- Use trusted RPC endpoints
- Verify transaction success on block explorer

### 4. **Price Impact**
- Larger trades have higher price impact
- Consider the pool size relative to your trade size
- Monitor pool reserves for optimal trading

## 🔍 Monitoring and Analytics

### Track Swap Events
```javascript
// Listen for swap events
amm.on("Swap", (tokenIn, tokenOut, amountIn, amountOut, user) => {
    console.log(`Swap: ${ethers.formatUnits(amountIn, 6)} → ${ethers.formatUnits(amountOut, 6)}`);
});
```

### Calculate Trading Volume
```javascript
async function getTradingVolume(timeframe) {
    // Implementation depends on your indexing solution
    // Consider using The Graph or similar indexing service
}
```

## 🚨 Error Handling

### Common Errors and Solutions

1. **"ERC20: insufficient allowance"**
   - Solution: Approve tokens before swapping
   - Check current allowance: `await usdt.allowance(user, ammAddress)`

2. **"AMM: INSUFFICIENT_OUTPUT_AMOUNT"**
   - Solution: Check pool liquidity
   - Reduce swap amount or add liquidity

3. **"AMM: POOL_NOT_EXISTS"**
   - Solution: Create liquidity pool first
   - Use `amm.createPool()` to initialize the pool

4. **"ERC20: transfer amount exceeds balance"**
   - Solution: Check token balance
   - Ensure sufficient tokens for swap + fees

## 📞 Support and Troubleshooting

For issues with the swap mechanism:

1. **Check Contract Status**: Verify all contracts are deployed and functional
2. **Verify Balances**: Ensure sufficient token balances
3. **Check Approvals**: Verify token approvals are set correctly
4. **Monitor Gas**: Ensure adequate gas for transactions
5. **Review Logs**: Check transaction logs for detailed error information

## 🔗 Related Documentation

- [Deployment Guide](../README.md)
- [Staking Guide](./STAKING_GUIDE.md)
- [Contract Architecture](./ARCHITECTURE.md)
- [Security Considerations](./SECURITY.md) 