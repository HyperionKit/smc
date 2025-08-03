## 🏗️ Project Structure

```
├── contracts/
│   ├── token/
│   │   └── SimpleERC20.sol      # ERC20 token implementation
│   ├── swap/
│   │   ├── AMM.sol             # Automated Market Maker contract
│   │   └── Swap.sol            # Liquidity pool and swap contract
│   ├── staking/
│   │   └── Staking.sol         # Staking rewards contract
│   ├── buy/
│   │   └── BuyContract.sol     # Token purchase contract
│   └── bridge/
│       └── Bridge.sol          # Cross-chain bridge contract
├── scripts/
│   ├── swap/
│   │   ├── deploy-tokens.ts    # Deploy ERC20 tokens
│   │   ├── deploy-liquidity-pool.ts # Deploy liquidity pool
│   │   ├── setup-liquidity-pools.ts # Setup pairs and add liquidity
│   │   └── pairs/              # Trading pair scripts
│   ├── stake/
│   │   ├── deploy-staking-contract.ts # Deploy staking contract
│   │   ├── fund-staking-contract.ts   # Fund staking rewards
│   │   ├── test-staking.ts           # Test staking functionality
│   │   ├── stake-liquidity.ts        # Stake tokens
│   │   └── unstake-and-claim.ts      # Unstake and claim rewards
│   ├── buy/
│   │   ├── deploy-buy-contract.ts    # Deploy buy contract
│   │   ├── fund-buy-contract.ts      # Fund buy contract
│   │   └── buy-usdc-with-metis.ts    # Buy tokens with METIS
│   └── verify/                 # Contract verification scripts
├── test/
│   └── DeFiSystem.test.ts      # Comprehensive test suite
├── docs/                       # Documentation for each network
├── dpsmc/                      # Deployment status and reports
└── README.md                   # This file
```

## 🚀 Features

### ERC20 Tokens
- **USDT**: Tether USD (6 decimals, 40M supply)
- **USDC**: USD Coin (6 decimals, 40M supply)
- **DAI**: Dai Stablecoin (18 decimals, 40M supply)
- **WETH**: Wrapped Ether (18 decimals, 40M supply)

### Liquidity Pool Features
- **Automated Market Maker (AMM)**: Constant product formula (x * y = k)
- **Liquidity Provision**: Add/remove liquidity to earn fees
- **Token Swapping**: Swap between any supported token pair
- **Fee Collection**: 0.3% trading fee (configurable)
- **Emergency Controls**: Pause/unpause functionality
- **Owner Controls**: Fee management and emergency functions

### Staking Features
- **Staking Rewards**: Stake USDT to earn USDC rewards
- **Flexible Staking**: Stake and unstake at any time
- **Real-time Rewards**: Rewards calculated based on time staked
- **Configurable Rates**: Owner can adjust reward rates
- **AMM Integration**: Connected to liquidity pool for enhanced functionality

### Token Purchase Features
- **METIS to Token**: Buy USDC/USDT with METIS
- **Fixed Pricing**: Predictable token prices
- **Slippage Protection**: Minimum amount guarantees
- **Emergency Controls**: Pause/unpause functionality

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
   git clone <repository-url>
   cd new_smc
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

The test suite covers:
- Token deployment and functionality
- Liquidity pool creation and management
- Token swapping with slippage protection
- Liquidity provision and removal
- Emergency functions
- Fee management

## 🚀 Deployment

### Local Development

1. **Start local node**
   ```bash
   npx hardhat node
   ```

2. **Deploy tokens**
   ```bash
   npx hardhat run scripts/swap/deploy-tokens.ts --network localhost
   ```

3. **Deploy liquidity pool**
   ```bash
   npx hardhat run scripts/swap/deploy-liquidity-pool.ts --network localhost
   ```

4. **Setup liquidity pools** (update addresses in script first)
   ```bash
   npx hardhat run scripts/swap/setup-liquidity-pools.ts --network localhost
   ```

5. **Deploy staking contract**
   ```bash
   npx hardhat run scripts/stake/deploy-staking-contract.ts --network localhost
   ```

6. **Deploy buy contract**
   ```bash
   npx hardhat run scripts/buy/deploy-buy-contract.ts --network localhost
   ```

### Network Deployment

#### Hyperion Network (Fully Deployed & Verified)
All contracts are deployed and verified on Hyperion testnet:

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
# Deploy tokens and liquidity pool
npx hardhat run scripts/swap/deploy-tokens.ts --network metis-hyperion-testnet
npx hardhat run scripts/swap/deploy-liquidity-pool.ts --network metis-hyperion-testnet
npx hardhat run scripts/swap/setup-liquidity-pools.ts --network metis-hyperion-testnet

# Deploy staking contract
npx hardhat run scripts/stake/deploy-staking-contract.ts --network metis-hyperion-testnet

# Deploy buy contract
npx hardhat run scripts/buy/deploy-buy-contract.ts --network metis-hyperion-testnet
```

#### Lazchain Network
```bash
npx hardhat run scripts/swap/deploy-tokens.ts --network metis-lazchain-testnet
npx hardhat run scripts/swap/deploy-liquidity-pool.ts --network metis-lazchain-testnet
npx hardhat run scripts/swap/setup-liquidity-pools.ts --network metis-lazchain-testnet
```

#### Metis Sepolia Network
```bash
npx hardhat run scripts/swap/deploy-tokens.ts --network metis-sepolia-testnet
npx hardhat run scripts/swap/deploy-liquidity-pool.ts --network metis-sepolia-testnet
npx hardhat run scripts/swap/setup-liquidity-pools.ts --network metis-sepolia-testnet
```

## ⚙️ Configuration

### Hardhat Configuration

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

### Environment Variables

Create a `.env` file:

```env
PRIVATE_KEY=your_private_key_here
HYPERION_RPC_URL=your_hyperion_rpc_url
LAZCHAIN_RPC_URL=your_lazchain_rpc_url
METIS_SEPOLIA_RPC_URL=your_metis_sepolia_rpc_url
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

### StakingRewards Contract

#### Core Functions
- `stake(uint256 _amount)`: Stake USDT tokens
- `unstake(uint256 _amount)`: Unstake USDT tokens and claim USDC rewards
- `calculateReward(address _user)`: Calculate pending rewards for a user

#### View Functions
- `getStakedBalance(address _user)`: Get user's staked balance
- `getPendingReward(address _user)`: Get user's pending rewards
- `getRewardBalance(address _user)`: Get user's reward balance
- `totalStaked()`: Get total amount staked
- `rewardRate()`: Get current reward rate
- `stakingToken()`: Get staking token address (USDT)
- `rewardToken()`: Get reward token address (USDC)
- `ammAddress()`: Get AMM contract address

#### Admin Functions
- `setRewardRate(uint256 _rewardRate)`: Set reward rate (owner only)
- `setAMMAddress(address _ammAddress)`: Set AMM address (owner only)

### BuyVault Contract

#### Core Functions
- `buyUSDC(uint256 minTokenAmount)`: Buy USDC with METIS
- `buyUSDT(uint256 minTokenAmount)`: Buy USDT with METIS

#### View Functions
- `getUSDCAmount(uint256 metisAmount)`: Calculate USDC amount for METIS
- `getUSDTAmount(uint256 metisAmount)`: Calculate USDT amount for METIS
- `getContractInfo()`: Get contract information

#### Admin Functions
- `setUSDCPrice(uint256 _usdcPrice)`: Set USDC price (owner only)
- `setUSDTPrice(uint256 _usdtPrice)`: Set USDT price (owner only)
- `withdrawTokens(address token, address to, uint256 amount)`: Withdraw tokens (owner only)
- `withdrawMETIS(address to, uint256 amount)`: Withdraw METIS (owner only)
- `pause()` and `unpause()`: Emergency pause/unpause (owner only)
- `emergencyWithdrawMETIS()`: Emergency METIS withdrawal (owner only)

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

## 🔒 Security Features

- **Reentrancy Protection**: All critical functions protected
- **Ownable Access Control**: Admin functions restricted to owner
- **Emergency Pause**: Ability to pause all operations
- **Fee Limits**: Maximum 10% trading fee
- **Input Validation**: Comprehensive parameter validation
- **Safe Math**: Built-in overflow protection (Solidity 0.8.28)

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

### Staking Tokens
```javascript
// Approve USDT for staking
await usdt.approve(stakingRewards.address, stakeAmount);

// Stake USDT to earn USDC rewards
await stakingRewards.stake(stakeAmount);

// Check pending rewards
const pendingReward = await stakingRewards.getPendingReward(user.address);

// Unstake and claim rewards
await stakingRewards.unstake(stakedAmount);
```

### Buying Tokens with METIS
```javascript
// Calculate USDC amount for METIS
const usdcAmount = await buyVault.getUSDCAmount(metisAmount);

// Buy USDC with METIS
await buyVault.buyUSDC(usdcAmount * 95n / 100n); // 5% slippage tolerance
```

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

## 📞 Support

For issues and questions:
1. Check the test suite for usage examples
2. Review contract documentation
3. Open an issue in the repository

## 📄 License

MIT License - see LICENSE file for details

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk. Always test thoroughly on testnets before mainnet deployment.
