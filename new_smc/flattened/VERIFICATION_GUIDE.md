# 🔍 Smart Contract Verification Guide

## 📋 Overview
This guide will help you verify your deployed smart contracts on the block explorer.

## 🎯 Contract Addresses to Verify

### Core Contracts
- **EnhancedAMM**: [Will be updated after deployment]
- **StakingRewards**: [Will be updated after deployment]
- **UniswapV2Integration**: [Will be updated after deployment]

### Token Contracts
- **USDT**: [Will be updated after deployment]
- **USDC**: [Will be updated after deployment]
- **DAI**: [Will be updated after deployment]
- **WETH**: [Will be updated after deployment]
- **WBTC**: [Will be updated after deployment]

## 🔧 Verification Steps

### Step 1: Access Block Explorer
1. Go to your network's block explorer (e.g., Blockscout for Hyperion)
2. Navigate to the "Verify Contract" section

### Step 2: Enter Contract Information
1. **Contract Address**: Enter the deployed contract address
2. **Contract Name**: Enter the contract name (e.g., "EnhancedAMM")
3. **Compiler Version**: Select "v0.8.20+commit.a1b79de6"
4. **Optimization**: Enable optimization with 200 runs
5. **EVM Version**: Select "shanghai"

### Step 3: Upload Source Code
1. **Verification Method**: Select "Solidity (Single file)"
2. **Contract Code**: Copy and paste the flattened contract code from the `flattened/` directory
3. **License Type**: Select "MIT License (MIT)"

### Step 4: Verify and Publish
1. Click "Verify & Publish"
2. Wait for verification to complete
3. Check that all functions and events are properly verified

## 📁 Flattened Contract Files
- `flattened/SimpleERC20.sol` - ERC20 token implementation
- `flattened/EnhancedAMM.sol` - Automated Market Maker
- `flattened/StakingRewards.sol` - Staking and rewards contract
- `flattened/UniswapV2Integration.sol` - Uniswap V2 integration

## ⚠️ Important Notes
- All contracts use OpenZeppelin Contracts v5.4.0
- All contracts are compiled with Solidity 0.8.20
- All contracts include reentrancy protection and access control
- Flattened contracts have been cleaned of duplicate SPDX licenses

## 🛡️ Security Features
- **Reentrancy Protection**: All contracts use ReentrancyGuard
- **Access Control**: All contracts use Ownable for admin functions
- **Pausable**: Core contracts can be paused in emergencies
- **Safe Math**: Built-in overflow/underflow protection in Solidity 0.8+

## 📞 Support
If you encounter any issues during verification, check:
1. Compiler version matches exactly
2. Optimization settings are correct
3. EVM version is set to "shanghai"
4. All constructor arguments are provided correctly
