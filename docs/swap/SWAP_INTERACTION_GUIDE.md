# 🔄 Swap Mechanism Interaction Guide

This guide explains how to interact with the swap mechanism in the SMC DeFi ecosystem, allowing users to swap between USDT and USDC tokens.

## 🎯 Overview

The swap mechanism is built on a **Constant Product AMM (Automated Market Maker)** model, similar to Uniswap V2. Users can seamlessly exchange USDT and USDC tokens through the `SimpleAMM` contract.

## 🚀 Quick Start

### **Method 1: Using Pre-built Scripts (Easiest)**

#### **USDT → USDC Swap**
```bash
npm run swap:usdt-usdc
```

#### **USDC → USDT Swap**
```bash
npm run swap:usdc-usdt
```

#### **View Pool Information**
```bash
npm run pool:info
```

### **Method 2: Using Custom Scripts**

#### **Run Comprehensive Examples**
```bash
npm run swap:examples
```

#### **Use Generic Swap Script**
```bash
# Set environment variables and run
npx hardhat run scripts/swap.ts --network hyperion
```

## 📊 How Swaps Work

### **1. Price Calculation**
The swap price is calculated using the constant product formula:
```
amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
```

### **2. Fee Structure**
- **Swap Fee**: 0.3% (30 basis points)
- **Fee Collection**: Fees are added to the liquidity pool

### **3. Slippage Protection**
The system automatically calculates expected output, but actual output may vary due to:
- Price impact of large trades
- MEV (Maximal Extractable Value)
- Network congestion

## 🔧 Available Scripts

### **Swap Scripts**
- `scripts/swap-usdt-usdc.ts` - Swap 100 USDT for USDC
- `scripts/swap-usdc-usdt.ts` - Swap 100 USDC for USDT
- `scripts/swap-examples.ts` - Comprehensive swap examples
- `scripts/swap.ts` - Generic swap script (uses environment variables)

### **Information Scripts**
- `scripts/pool-info.ts` - Display pool information and prices

### **Deployment Scripts**
- `scripts/deploy-all.ts` - Complete ecosystem deployment
- `scripts/deploy-contracts-only.ts` - Deploy contracts only

## 📈 Current Pool Status

### **Contract Addresses (Hyperion Network)**
- **USDT**: `0xDb6A62c0bdF41bc3485d9E77ABaE2e69A6060eE9`
- **USDC**: `0xa5C8d657E907101773d6F59E6A257a4e91ED289D`
- **AMM**: `0x00Bf5269D42BE882bD6457d961fc11AdFE703C3e`

### **Pool Information**
- **USDT Reserve**: 1,000,000 tokens
- **USDC Reserve**: 1,000,000 tokens
- **Current Price**: 1 USDT = 1.000000 USDC
- **Swap Fee**: 0.30%

## 🛠️ Step-by-Step Swap Process

### **Step 1: Check Pool Information**
```bash
npm run pool:info
```

### **Step 2: Perform Swap**
```bash
# Swap USDT for USDC
npm run swap:usdt-usdc

# Swap USDC for USDT
npm run swap:usdc-usdt
```

### **Step 3: Verify Results**
The script automatically shows:
- Expected output amount
- Actual received amount
- Price impact
- Slippage percentage

## 📊 Example Swap Results

### **USDT → USDC Swap (100 USDT)**
```
🔄 SMC DeFi Swap: USDT → USDC
User: 0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff

=== Contract Addresses ===
USDT: 0xDb6A62c0bdF41bc3485d9E77ABaE2e69A6060eE9
USDC: 0xa5C8d657E907101773d6F59E6A257a4e91ED289D
AMM: 0x00Bf5269D42BE882bD6457d961fc11AdFE703C3e

=== Swap Configuration ===
From Token: USDT
To Token: USDC
Amount: 100
USDT balance: 38500000.0
Pool reserves - USDT: 1000000.0 USDC: 1000000.0
Expected USDC output: 99.69006
Price impact: 0.0200%

1. Approving USDT for AMM...
✅ USDT approved
2. USDC balance before: 38500000.0
3. Executing swap...
✅ Swap executed successfully!
4. USDC received: 99.69006
5. USDC balance after: 38500099.69006
6. Slippage: 0.0000%

🎉 USDT → USDC swap completed successfully!
```

## 🔍 Understanding the Output

### **Key Metrics Explained**

1. **Expected Output**: Calculated amount before the swap
2. **Price Impact**: How much the trade affects the pool price
3. **Slippage**: Difference between expected and actual output
4. **Pool Reserves**: Current liquidity in the pool

### **Fee Calculation**
- **Input**: 100 USDT
- **Fee**: 0.3% = 0.3 USDT
- **Effective Input**: 99.7 USDT
- **Output**: ~99.69 USDC

## ⚠️ Important Considerations

### **1. Token Balances**
- Ensure you have sufficient tokens before swapping
- The deployer has 38.5M tokens of each type
- Check balances using the pool info script

### **2. Gas Fees**
- Each swap requires gas for:
  - Token approval (one-time per token)
  - Swap execution
- Monitor gas prices for optimal timing

### **3. Price Impact**
- Larger trades have higher price impact
- Consider breaking large trades into smaller ones
- Monitor pool reserves for optimal trading

### **4. Slippage Tolerance**
- Small trades typically have minimal slippage
- Large trades may experience significant slippage
- Always check expected output before swapping

## 🔧 Advanced Usage

### **Custom Amount Swaps**
To swap different amounts, modify the scripts:
```typescript
// In scripts/swap-usdt-usdc.ts
const amount = 500; // Change from 100 to 500
```

### **Network Selection**
```bash
# Hyperion Network
npm run swap:usdt-usdc

# LazChain Network
npx hardhat run scripts/swap-usdt-usdc.ts --network lazchain

# Metis Sepolia Network
npx hardhat run scripts/swap-usdt-usdc.ts --network metisSepolia
```

### **Environment Variables**
Set custom parameters using environment variables:
```bash
# For the generic swap script
FROM_TOKEN=USDT TO_TOKEN=USDC SWAP_AMOUNT=500 npx hardhat run scripts/swap.ts --network hyperion
```

## 🚨 Error Handling

### **Common Errors and Solutions**

1. **"Insufficient balance"**
   - Solution: Check your token balance
   - Use smaller amounts or get more tokens

2. **"ERC20: insufficient allowance"**
   - Solution: Approve tokens before swapping
   - The script handles this automatically

3. **"AMM: INSUFFICIENT_OUTPUT_AMOUNT"**
   - Solution: Check pool liquidity
   - Reduce swap amount or add liquidity

4. **"AMM: POOL_NOT_EXISTS"**
   - Solution: Create liquidity pool first
   - Run the deployment script

## 📞 Support and Troubleshooting

### **Before Swapping**
1. ✅ Verify contracts are deployed
2. ✅ Check pool exists and has liquidity
3. ✅ Ensure sufficient token balance
4. ✅ Monitor gas prices

### **During Swapping**
1. ✅ Wait for approval transaction
2. ✅ Wait for swap transaction
3. ✅ Verify transaction success

### **After Swapping**
1. ✅ Check token balances
2. ✅ Verify received amount
3. ✅ Monitor pool reserves

## 🔗 Related Documentation

- [Complete Swap Guide](./SWAP_GUIDE.md)
- [Swap Summary](./SWAP_SUMMARY.md)
- [Deployment Guide](../README.md)
- [Staking Guide](./STAKING_GUIDE.md)

## 🎉 Success Indicators

A successful swap will show:
- ✅ "Tokens approved"
- ✅ "Swap executed successfully!"
- ✅ Positive "USDC received" or "USDT received"
- ✅ "Swap completed successfully!"

---

**The swap mechanism is now fully functional and ready for production use!** 🚀 