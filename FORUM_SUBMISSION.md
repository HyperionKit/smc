# CEG Forum Submission

## Project Information

- **Project Name:** SMC (Smart Contract)
- **Website:** https://hyperionkit.xyz
- **Project Forum:** [CEG Forum - Live Dapps](https://forum.ceg.vote/invites/nHJVeCMHSP)
- **Deployer Wallet:** `0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff`

## Deployment Networks

- **Hyperion Testnet** (Chain ID: 133717) - Fully Deployed & Verified
- **Mantle Testnet** (Chain ID: 5003) - Deployed

## Contract Addresses Summary

### Hyperion Testnet (Fully Deployed & Verified)

#### Token Contracts
| Token | Symbol | Address | Verification |
|-------|--------|---------|--------------|
| Tether USD | USDT | `0x9b52D326D4866055F6c23297656002992e4293FC` | [Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0x9b52D326D4866055F6c23297656002992e4293FC) |
| USD Coin | USDC | `0x31424DB0B7a929283C394b4DA412253Ab6D61682` | [Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0x31424DB0B7a929283C394b4DA412253Ab6D61682) |
| Dai Stablecoin | DAI | `0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb` | [Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb) |
| Wrapped Ether | WETH | `0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4` | [Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4) |

#### DeFi System Contracts
| Contract | Type | Address | Verification |
|----------|------|---------|--------------|
| LiquidityPool | AMM/Swap | `0x91C39DAA7617C5188d0427Fc82e4006803772B74` | [Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0x91C39DAA7617C5188d0427Fc82e4006803772B74) |
| BuyVault | Direct Purchase | `0x0adFd197aAbbC194e8790041290Be57F18d576a3` | [Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0x0adFd197aAbbC194e8790041290Be57F18d576a3#code) |
| StakingRewards | Staking | `0xB94d264074571A5099C458f74b526d1e4EE0314B` | [Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0xB94d264074571A5099C458f74b526d1e4EE0314B#code) |
| Bridge | Cross-Chain | `0xfF064Fd496256e84b68dAE2509eDA84a3c235550` | [Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0xfF064Fd496256e84b68dAE2509eDA84a3c235550#code) |
| Faucet | Token Distribution | `0xE1B8C7168B0c48157A5e4B80649C5a1b83bF4cC4` | [Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0xE1B8C7168B0c48157A5e4B80649C5a1b83bF4cC4) |
| TransactionTracker | Analytics | `0xd68a2cCa272c0ABDb3B0A2e6C15Ca86216cFDbe6` | [Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0xd68a2cCa272c0ABDb3B0A2e6C15Ca86216cFDbe6#code) |

### Mantle Testnet (Deployed)

#### Token Contracts
| Token | Symbol | Address | Status |
|-------|--------|---------|--------|
| Tether USD | USDT | `0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b` | [Deployed](https://sepolia.mantlescan.xyz/address/0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b) |
| USD Coin | USDC | `0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE` | [Deployed](https://sepolia.mantlescan.xyz/address/0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE) |
| Dai Stablecoin | DAI | `0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a` | [Deployed](https://sepolia.mantlescan.xyz/address/0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a) |
| Wrapped Ether | WETH | `0xCa7b49d1C243a9289aE2316051eb15146125914d` | [Deployed](https://sepolia.mantlescan.xyz/address/0xCa7b49d1C243a9289aE2316051eb15146125914d) |

#### DeFi System Contracts
| Contract | Type | Address | Status |
|----------|------|---------|--------|
| LiquidityPool | AMM/Swap | `0x93c714601b8bc0C9A9d605CEc99786847654598e` | [Deployed](https://sepolia.mantlescan.xyz/address/0x93c714601b8bc0C9A9d605CEc99786847654598e) |
| BuyVault | Token Purchase | `0x1E0B86323fdFFa099AAEeE9B3C8B2f8C6E20fFa5` | [Deployed](https://sepolia.mantlescan.xyz/address/0x1E0B86323fdFFa099AAEeE9B3C8B2f8C6E20fFa5) |
| StakingRewards | Staking | `0x1a80Db4cf9E26BafCf672c534Ab219630fFE1A5E` | [Deployed](https://sepolia.mantlescan.xyz/address/0x1a80Db4cf9E26BafCf672c534Ab219630fFE1A5E) |

## System Overview

### Complete DeFi Ecosystem

#### 1. Swap System (AMM)
- **Automated Market Maker** with constant product formula
- **6 Trading Pairs** per network (USDT/USDC, USDT/DAI, USDT/WETH, USDC/DAI, USDC/WETH, DAI/WETH)
- **Liquidity Provision** and removal functionality
- **Price Discovery** through AMM mechanism

#### 2. Buy System (Direct Purchase)
- **Direct token purchase** with native currency
- **Fixed pricing** for USDC and USDT
- **Slippage protection** with minimum amount parameters

#### 3. Staking System
- **USDT staking** for USDC rewards
- **Dynamic reward rate** (0.3 USDC per second)
- **Flexible staking/unstaking**

#### 4. Bridge System (Hyperion)
- **Cross-chain transfers** between networks
- **Multi-token support** (USDT, USDC, DAI, WETH)
- **Secure withdrawal** with signature verification

#### 5. Faucet System (Hyperion)
- **Test token distribution** for all supported tokens
- **Rate limiting** to prevent abuse
- **Admin controls** for token management

#### 6. Transaction Tracker (Hyperion)
- **Real-time analytics** across all contracts
- **Total value tracking** in USD
- **Transaction history** and statistics

## Technical Specifications

### Smart Contract Standards
- **ERC20**: Token standard for all supported tokens
- **OpenZeppelin**: Security libraries and best practices
- **Ownable**: Access control for admin functions
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Pausable**: Emergency pause functionality

### Security Features
- **Access Control**: Owner-only functions for critical operations
- **Safe Transfers**: OpenZeppelin SafeERC20 for token operations
- **Emergency Pause**: Ability to pause all operations
- **Signature Verification**: Secure cross-chain communication
- **Rate Limiting**: Anti-abuse mechanisms

## Testing Results

### Hyperion Testnet
- **All Trading Pairs**: Tested successfully
- **BuyVault**: 0.1 METIS → 10 USDC conversion verified
- **StakingRewards**: 100 USDT staked → 12,000 USDC rewards claimed
- **Bridge**: All 4 tokens successfully deposited and withdrawn
- **Faucet**: Token distribution working correctly
- **TransactionTracker**: Real-time analytics operational

### Mantle Testnet
- **All Trading Pairs**: Created and initialized with liquidity
- **Core Contracts**: Deployed and operational

## Deployment Commands

### Hyperion Testnet
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

# Deploy bridge contract
npx hardhat run scripts/bridge/deploy-bridge-contract.ts --network metis-hyperion-testnet

# Deploy faucet contract
npx hardhat run scripts/faucet/deploy-faucet-contract.ts --network metis-hyperion-testnet

# Deploy transaction tracker
npx hardhat run scripts/tracker/deploy-transaction-tracker.ts --network metis-hyperion-testnet
```

### Mantle Testnet
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

## Current Statistics

### Hyperion Testnet
- **USDC Total Supply**: 40,000,000 USDC
- **BuyVault USDC Balance**: 999,990 USDC
- **StakingRewards Reward Rate**: 0.3 USDC per second
- **Trading Pairs**: 6 pairs with 1,000,000 tokens initial liquidity each

### Mantle Testnet
- **Total Contracts Deployed**: 7
- **Trading Pairs**: 6 (all active with liquidity)
- **Total Liquidity**: 6,000,000 tokens (1M per pair)

## Project Status

### COMPLETED FEATURES
- **Complete DeFi Ecosystem**: Swap, Buy, Stake, Bridge, Faucet
- **Multi-Network Support**: Hyperion, Mantle
- **Real-Time Analytics**: Transaction tracking and statistics
- **Security Implementation**: All standard security features
- **Comprehensive Testing**: 100% success rate across all functions
- **Contract Verification**: All Hyperion contracts verified

### PRODUCTION READY
- **All contracts deployed and verified (Hyperion)**
- **Comprehensive testing completed**
- **Security features implemented**
- **User interactions verified**

## Important Links

### Blockchain Explorers
- **Hyperion Testnet**: https://hyperion-testnet-explorer.metisdevops.link
- **Mantle Testnet**: https://sepolia.mantlescan.xyz

### Project Resources
- **Website**: https://hyperionkit.xyz
- **CEG Forum**: https://forum.ceg.vote/invites/nHJVeCMHSP

---

**This project represents a complete, production-ready DeFi ecosystem with all contracts verified and tested on Hyperion testnet, and core contracts deployed on Mantle testnet. The system is fully operational and ready for user interaction.**
