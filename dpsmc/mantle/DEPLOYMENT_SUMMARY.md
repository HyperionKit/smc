# Mantle Testnet Deployment Summary

**Network:** Mantle Testnet (Sepolia)  
**Chain ID:** 5003  
**Explorer:** https://sepolia.mantlescan.xyz  
**Deployer:** `0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff`  
**Deployment Date:** $(date)

## ✅ Deployed Contracts

### Token Contracts

| Token | Name | Symbol | Address | Decimals | Total Supply |
|-------|------|--------|---------|----------|--------------|
| USDT | Tether USD | USDT | `0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b` | 6 | 40,000,000 |
| USDC | USD Coin | USDC | `0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE` | 6 | 40,000,000 |
| DAI | Dai Stablecoin | DAI | `0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a` | 18 | 40,000,000 |
| WETH | Wrapped Ether | WETH | `0xCa7b49d1C243a9289aE2316051eb15146125914d` | 18 | 40,000,000 |

### DeFi System Contracts

| Contract | Type | Address | Status |
|----------|------|---------|--------|
| LiquidityPool | AMM/Swap | `0x93c714601b8bc0C9A9d605CEc99786847654598e` | ✅ Deployed & Configured |
| BuyVault | Token Purchase | `0x1E0B86323fdFFa099AAEeE9B3C8B2f8C6E20fFa5` | ✅ Deployed |
| StakingRewards | Staking | `0x1a80Db4cf9E26BafCf672c534Ab219630fFE1A5E` | ✅ Deployed |

## 📊 Trading Pairs

All 6 trading pairs have been created and initialized with 1,000,000 tokens of liquidity each:

- ✅ **USDT-USDC** - 1M USDT + 1M USDC
- ✅ **USDT-DAI** - 1M USDT + 1M DAI
- ✅ **USDT-WETH** - 1M USDT + 1M WETH
- ✅ **USDC-DAI** - 1M USDC + 1M DAI
- ✅ **USDC-WETH** - 1M USDC + 1M WETH
- ✅ **DAI-WETH** - 1M DAI + 1M WETH

## 🔗 Block Explorer Links

### Tokens
- [USDT](https://sepolia.mantlescan.xyz/address/0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b)
- [USDC](https://sepolia.mantlescan.xyz/address/0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE)
- [DAI](https://sepolia.mantlescan.xyz/address/0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a)
- [WETH](https://sepolia.mantlescan.xyz/address/0xCa7b49d1C243a9289aE2316051eb15146125914d)

### Contracts
- [LiquidityPool](https://sepolia.mantlescan.xyz/address/0x93c714601b8bc0C9A9d605CEc99786847654598e)
- [BuyVault](https://sepolia.mantlescan.xyz/address/0x1E0B86323fdFFa099AAEeE9B3C8B2f8C6E20fFa5)
- [StakingRewards](https://sepolia.mantlescan.xyz/address/0x1a80Db4cf9E26BafCf672c534Ab219630fFE1A5E)

## 📝 Next Steps

1. **Verify Contracts** on Mantle block explorer
2. **Deploy Additional Contracts:**
   - ✅ BuyVault (for METIS → USDC/USDT purchases) - **DEPLOYED**
   - ✅ StakingRewards (for USDT staking → USDC rewards) - **DEPLOYED**
   - Bridge (for cross-chain transfers)
   - Faucet (for test token distribution)
   - TransactionTracker (for analytics)

3. **Test Trading Pairs** - Execute swaps on all pairs
4. **Add More Liquidity** if needed
5. **Deploy Frontend Integration**

## 🚀 Deployment Commands Used

```bash
# Deploy tokens
npx hardhat run scripts/swap/script/mantle/deploy-tokens.ts --network mantle-testnet

# Deploy liquidity pool
npx hardhat run scripts/swap/script/mantle/deploy-liquidity-pool.ts --network mantle-testnet

# Setup liquidity pools
npx hardhat run scripts/swap/script/mantle/setup-liquidity-pools.ts --network mantle-testnet

# Deploy BuyVault
npx hardhat run scripts/buy/deploy-buy-contract.ts --network mantle-testnet

# Deploy StakingRewards
npx hardhat run scripts/stake/deploy-staking-contract.ts --network mantle-testnet
```

## 📋 Contract Configuration

- **Trading Fee:** 0.3% (30 basis points)
- **Max Fee:** 10% (1000 basis points)
- **Initial Liquidity per Pair:** 1,000,000 tokens
- **Minimum Liquidity:** 1,000 (locked)

---

**Status:** ✅ Core DeFi System Deployed and Operational

## 📊 Deployment Statistics

- **Total Contracts Deployed:** 7
- **Trading Pairs:** 6 (all active with liquidity)
- **Total Liquidity:** 6,000,000 tokens (1M per pair)
- **Network:** Mantle Testnet (Sepolia)
- **Chain ID:** 5003

