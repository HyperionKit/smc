# DeFi Liquidity Pool System - Deployment Summary

## 🎯 Project Overview

This project implements a complete DeFi ecosystem with ERC20 tokens, automated market maker (AMM) liquidity pools, and token swapping functionality. The system is designed to be deployed on multiple networks including Hyperion, Lazchain, and Metis Sepolia.

## 📊 Token Specifications

### ERC20 Tokens (40M Supply Each)

| Token | Symbol | Decimals | Total Supply | Purpose |
|-------|--------|----------|--------------|---------|
| Tether USD | USDT | 6 | 40,000,000 | Stablecoin |
| USD Coin | USDC | 6 | 40,000,000 | Stablecoin |
| Dai Stablecoin | DAI | 18 | 40,000,000 | Stablecoin |
| Wrapped Ether | WETH | 18 | 40,000,000 | Wrapped ETH |

### Trading Pairs

All tokens can be swapped with each other through the AMM:

- **USDT Pairs:**
  - USDT ↔ USDC
  - USDT ↔ DAI
  - USDT ↔ WETH

- **USDC Pairs:**
  - USDC ↔ DAI
  - USDC ↔ WETH

- **DAI Pairs:**
  - DAI ↔ WETH

**Total: 6 Trading Pairs**

## 🏗️ Smart Contracts

### 1. SimpleERC20.sol
- **Purpose**: ERC20 token implementation
- **Features**: 
  - Standard ERC20 functionality
  - Mintable (owner only)
  - Burnable
  - Ownable access control
  - Configurable decimals

### 2. Swap.sol (LiquidityPool)
- **Purpose**: Automated Market Maker with liquidity pools
- **Features**:
  - Constant product formula (x * y = k)
  - Liquidity provision and removal
  - Token swapping with slippage protection
  - Fee collection (0.3% default, configurable)
  - Emergency pause functionality
  - Owner controls for fee management

## 🔒 Security Features

- **Reentrancy Protection**: All critical functions protected
- **Ownable Access Control**: Admin functions restricted to owner
- **Emergency Pause**: Ability to pause all operations
- **Fee Limits**: Maximum 10% trading fee
- **Input Validation**: Comprehensive parameter validation
- **Safe Math**: Built-in overflow protection (Solidity 0.8.28)

## 🚀 Deployment Instructions

### Prerequisites
1. Node.js (v16 or higher)
2. npm or yarn
3. Hardhat
4. MetaMask or similar wallet
5. Network RPC URLs and private keys

### Environment Setup
Create a `.env` file:
```env
PRIVATE_KEY=your_private_key_here
HYPERION_RPC_URL=your_hyperion_rpc_url
LAZCHAIN_RPC_URL=your_lazchain_rpc_url
METIS_SEPOLIA_RPC_URL=your_metis_sepolia_rpc_url
```

### Network Configuration
Update `hardhat.config.ts` with your network configurations:
```typescript
networks: {
  hyperion: {
    url: "YOUR_HYPERION_RPC_URL",
    accounts: ["YOUR_PRIVATE_KEY"],
    chainId: YOUR_CHAIN_ID
  },
  lazchain: {
    url: "YOUR_LAZCHAIN_RPC_URL",
    accounts: ["YOUR_PRIVATE_KEY"],
    chainId: YOUR_CHAIN_ID
  },
  metisSepolia: {
    url: "YOUR_METIS_SEPOLIA_RPC_URL",
    accounts: ["YOUR_PRIVATE_KEY"],
    chainId: YOUR_CHAIN_ID
  }
}
```

### Deployment Commands

#### Local Development
```bash
# Start local node
npx hardhat node

# Deploy tokens
npx hardhat run scripts/deploy-tokens.ts --network localhost

# Deploy liquidity pool
npx hardhat run scripts/deploy-liquidity-pool.ts --network localhost

# Setup liquidity pools (update addresses first)
npx hardhat run scripts/setup-liquidity-pools.ts --network localhost
```

#### Network Deployment

**Hyperion Network:**
```bash
npx hardhat run scripts/deploy-hyperion.ts --network hyperion
```

**Lazchain Network:**
```bash
npx hardhat run scripts/deploy-lazchain.ts --network lazchain
```

**Metis Sepolia Network:**
```bash
npx hardhat run scripts/deploy-metisSepolia.ts --network metisSepolia
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
npx hardhat test
```

The test suite covers:
- Token deployment and functionality
- Liquidity pool creation and management
- Token swapping with slippage protection
- Liquidity provision and removal
- Emergency functions
- Fee management

## 📈 Initial Setup

After deployment, each pair will have:
- **1,000,000 tokens** of initial liquidity
- **0.3% trading fee**
- **Full trading functionality**

## 🎯 Usage Examples

### Adding Liquidity
```javascript
// Approve tokens first
await usdt.approve(liquidityPool.address, amount);
await usdc.approve(liquidityPool.address, amount);

// Add liquidity
await liquidityPool.addLiquidity(
  usdt.address,
  usdc.address,
  amount,
  amount,
  0, // amountAMin
  0  // amountBMin
);
```

### Swapping Tokens
```javascript
// Approve input token
await usdt.approve(liquidityPool.address, swapAmount);

// Get expected output
const amountOut = await liquidityPool.getAmountOut(swapAmount, usdt.address, usdc.address);

// Execute swap
await liquidityPool.swap(
  usdt.address,
  usdc.address,
  swapAmount,
  amountOut * 95n / 100n // 5% slippage tolerance
);
```

### Removing Liquidity
```javascript
const userLiquidity = await liquidityPool.getUserLiquidity(usdt.address, usdc.address, user.address);
const removeAmount = userLiquidity / 2n; // Remove half

await liquidityPool.removeLiquidity(
  usdt.address,
  usdc.address,
  removeAmount,
  0, // amountAMin
  0  // amountBMin
);
```

## 📊 Contract Functions

### LiquidityPool Contract

#### Core Functions
- `createPair(tokenA, tokenB)`: Create a new trading pair
- `addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin)`: Add liquidity to a pair
- `removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin)`: Remove liquidity from a pair
- `swap(tokenIn, tokenOut, amountIn, amountOutMin)`: Swap tokens

#### View Functions
- `getAmountOut(amountIn, tokenIn, tokenOut)`: Calculate output amount for a swap
- `getPairInfo(tokenA, tokenB)`: Get pair reserves and liquidity
- `getUserLiquidity(tokenA, tokenB, user)`: Get user's liquidity position
- `getAllPairs()`: Get all pair IDs

#### Admin Functions
- `setTradingFee(fee)`: Update trading fee (max 10%)
- `pause()`: Pause all operations
- `unpause()`: Resume operations
- `emergencyWithdraw(token, amount)`: Emergency token withdrawal

### SimpleERC20 Contract

#### Standard ERC20 Functions
- `transfer(to, amount)`: Transfer tokens
- `approve(spender, amount)`: Approve spender
- `transferFrom(from, to, amount)`: Transfer from approved address
- `balanceOf(account)`: Get account balance
- `totalSupply()`: Get total supply

#### Additional Functions
- `mint(to, amount)`: Mint new tokens (owner only)
- `burn(amount)`: Burn tokens

## 🐛 Troubleshooting

### Common Issues

1. **Insufficient Balance**: Ensure you have enough tokens and native currency for gas
2. **Approval Required**: Always approve tokens before adding liquidity or swapping
3. **Slippage Protection**: Set appropriate minimum amounts to avoid failed transactions
4. **Network Issues**: Verify RPC URLs and network configurations

### Error Messages

- `"Pair does not exist"`: Create the pair first using `createPair()`
- `"Insufficient liquidity"`: Add more liquidity to the pair
- `"Insufficient output amount"`: Increase slippage tolerance or reduce swap amount
- `"Contract is paused"`: Wait for admin to unpause or contact support

## 📄 License

MIT License - see LICENSE file for details

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk. Always test thoroughly on testnets before mainnet deployment.

## 📞 Support

For issues and questions:
1. Check the test suite for usage examples
2. Review contract documentation
3. Open an issue in the repository

---

**Deployment Date**: [Date]
**Version**: 1.0.0
**Solidity Version**: 0.8.28
**Hardhat Version**: Latest 