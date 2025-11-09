## 🏗️ Project Structure

```
├── contracts/
│   ├── token/
│   │   └── ERC20.sol              # ERC20 token implementation
│   ├── swap/
│   │   └── Swap.sol               # Liquidity pool and swap contract
│   ├── staking/
│   │   └── Staking.sol            # Staking rewards contract
│   ├── buy/
│   │   └── BuyContract.sol       # Token purchase contract
│   └── bridge/
│       └── Bridge.sol               # Cross-chain bridge contract
├── scripts/
│   ├── swap/
│   │   ├── script/
│   │   │   ├── hyperion/         # Hyperion deployment scripts
│   │   │   └── mantle/           # Mantle deployment scripts
│   │   └── pairs/                # Trading pair scripts
│   ├── stake/
│   │   └── deploy-staking-contract.ts
│   ├── buy/
│   │   └── deploy-buy-contract.ts
│   └── verify/                   # Contract verification scripts
├── test/
│   └── DeFiSystem.test.ts        # Comprehensive test suite
└── README.md
```

## 🚀 Features

### ERC20 Tokens
- **USDT**: Tether USD (6 decimals, 40M supply)
- **USDC**: USD Coin (6 decimals, 40M supply)
- **DAI**: Dai Stablecoin (18 decimals, 40M supply)
- **WETH**: Wrapped Ether (18 decimals, 40M supply)

### Liquidity Pool (AMM)
- **Automated Market Maker** with constant product formula
- **Liquidity Provision** and removal
- **Token Swapping** between pairs
- **Trading Fee**: 0.3% (configurable)
- **Emergency Controls**: Pause/unpause functionality

### Staking System
- **USDT staking** for USDC rewards
- **Dynamic reward rate** (0.3 USDC per second)
- **Flexible staking/unstaking**

### Token Purchase
- **Direct purchase** with native currency
- **Fixed pricing** for USDC and USDT
- **Slippage protection**

### Trading Pairs
- USDT/USDC
- USDT/DAI
- USDT/WETH
- USDC/DAI
- USDC/WETH
- DAI/WETH

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hardhat
- MetaMask or similar wallet

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HyperionKit/smc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Compile contracts**
   ```bash
   npx hardhat compile
   ```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npx hardhat test
```

## 🚀 Deployment

### Hyperion Testnet (Fully Deployed & Verified)

**Deployed Contracts:**
- **USDT**: `0x9b52D326D4866055F6c23297656002992e4293FC`
- **USDC**: `0x31424DB0B7a929283C394b4DA412253Ab6D61682`
- **DAI**: `0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb`
- **WETH**: `0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4`
- **LiquidityPool**: `0x91C39DAA7617C5188d0427Fc82e4006803772B74`
- **BuyVault**: `0x0adFd197aAbbC194e8790041290Be57F18d576a3`
- **StakingRewards**: `0xB94d264074571A5099C458f74b526d1e4EE0314B`

**Deployment Commands:**
```bash
# Deploy tokens
npx hardhat run scripts/swap/script/hyperion/deploy-tokens.ts --network metis-hyperion-testnet

# Deploy liquidity pool
npx hardhat run scripts/swap/script/hyperion/deploy-liquidity-pool.ts --network metis-hyperion-testnet

# Setup liquidity pools
npx hardhat run scripts/swap/script/hyperion/setup-liquidity-pools.ts --network metis-hyperion-testnet

# Deploy staking contract
npx hardhat run scripts/stake/deploy-staking-contract.ts --network metis-hyperion-testnet

# Deploy buy contract
npx hardhat run scripts/buy/deploy-buy-contract.ts --network metis-hyperion-testnet
```

### Mantle Testnet (Deployed)

**Deployed Contracts:**
- **USDT**: `0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b`
- **USDC**: `0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE`
- **DAI**: `0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a`
- **WETH**: `0xCa7b49d1C243a9289aE2316051eb15146125914d`
- **LiquidityPool**: `0x93c714601b8bc0C9A9d605CEc99786847654598e`
- **BuyVault**: `0x1E0B86323fdFFa099AAEeE9B3C8B2f8C6E20fFa5`
- **StakingRewards**: `0x1a80Db4cf9E26BafCf672c534Ab219630fFE1A5E`

**Deployment Commands:**
```bash
# Deploy tokens
npx hardhat run scripts/swap/script/mantle/deploy-tokens.ts --network mantle-testnet

# Deploy liquidity pool
npx hardhat run scripts/swap/script/mantle/deploy-liquidity-pool.ts --network mantle-testnet

# Setup liquidity pools
npx hardhat run scripts/swap/script/mantle/setup-liquidity-pools.ts --network mantle-testnet

# Deploy buy contract
npx hardhat run scripts/buy/deploy-buy-contract.ts --network mantle-testnet

# Deploy staking contract
npx hardhat run scripts/stake/deploy-staking-contract.ts --network mantle-testnet
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```env
PRIVATE_KEY=your_private_key_here
HYPERION_RPC_URL=your_hyperion_rpc_url
MANTLE_TESTNET_RPC_URL=https://rpc.sepolia.mantle.xyz
```

## 📊 Contract Functions

### LiquidityPool Contract

#### Core Functions
- `createPair(tokenA, tokenB)`: Create a new trading pair
- `addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin)`: Add liquidity
- `removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin)`: Remove liquidity
- `swap(tokenIn, tokenOut, amountIn, amountOutMin)`: Swap tokens

#### View Functions
- `getAmountOut(amountIn, tokenIn, tokenOut)`: Calculate output amount
- `getPairInfo(tokenA, tokenB)`: Get pair reserves and liquidity

#### Admin Functions
- `setTradingFee(fee)`: Update trading fee (max 10%)
- `pause()` / `unpause()`: Emergency controls

### StakingRewards Contract

#### Core Functions
- `stake(amount)`: Stake USDT tokens
- `unstake(amount)`: Unstake and claim USDC rewards

#### View Functions
- `getStakedBalance(user)`: Get user's staked balance
- `getPendingReward(user)`: Get user's pending rewards

### BuyVault Contract

#### Core Functions
- `buyUSDC(minTokenAmount)`: Buy USDC with native currency
- `buyUSDT(minTokenAmount)`: Buy USDT with native currency

#### View Functions
- `getUSDCAmount(metisAmount)`: Calculate USDC amount
- `getUSDTAmount(metisAmount)`: Calculate USDT amount

## 🔒 Security Features

- **Reentrancy Protection**: All critical functions protected
- **Ownable Access Control**: Admin functions restricted to owner
- **Emergency Pause**: Ability to pause all operations
- **Fee Limits**: Maximum 10% trading fee
- **Slippage Protection**: Minimum amount guarantees
- **Safe Math**: Built-in overflow protection (Solidity 0.8.28)

## 🎯 Usage Examples

### Adding Liquidity
```javascript
await usdt.approve(liquidityPool.address, amount);
await usdc.approve(liquidityPool.address, amount);
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
await usdt.approve(liquidityPool.address, swapAmount);
const amountOut = await liquidityPool.getAmountOut(swapAmount, usdt.address, usdc.address);
await liquidityPool.swap(
  usdt.address,
  usdc.address,
  swapAmount,
  amountOut * 95n / 100n // 5% slippage tolerance
);
```

### Staking Tokens
```javascript
await usdt.approve(stakingRewards.address, stakeAmount);
await stakingRewards.stake(stakeAmount);
const pendingReward = await stakingRewards.getPendingReward(user.address);
await stakingRewards.unstake(stakedAmount);
```

## 🐛 Troubleshooting

### Common Issues

1. **Insufficient Balance**: Ensure you have enough tokens and native currency for gas
2. **Approval Required**: Always approve tokens before operations
3. **Slippage Protection**: Set appropriate minimum amounts
4. **Network Issues**: Verify RPC URLs and network configurations

## 🚀 Quick Start Commands

### Hyperion Testnet
```bash
# Test staking functionality
npx hardhat run scripts/stake/test-staking.ts --network metis-hyperion-testnet

# Buy USDC with METIS
npx hardhat run scripts/buy/buy-usdc-with-metis.ts --network metis-hyperion-testnet

# Test trading pairs
npx hardhat run scripts/swap/pairs/swap-usdt-usdc.ts --network metis-hyperion-testnet
```

### Mantle Testnet
```bash
# Test trading pairs
npx hardhat run scripts/swap/pairs/swap-usdt-usdc.ts --network mantle-testnet
```

## 📄 License

MIT License - see LICENSE file for details

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk. Always test thoroughly on testnets before mainnet deployment.

## 🎉 **Current Status: FULLY OPERATIONAL**

### Hyperion Testnet
- ✅ **All Contracts Verified**: On blockchain explorer
- ✅ **Liquidity Pool**: 6 trading pairs operational
- ✅ **Staking System**: USDT → USDC rewards working
- ✅ **BuyVault**: Native currency → USDC/USDT conversion working

### Mantle Testnet
- ✅ **Core Contracts Deployed**: Tokens, LiquidityPool, BuyVault, StakingRewards
- ✅ **Trading Pairs**: 6 pairs with liquidity initialized
