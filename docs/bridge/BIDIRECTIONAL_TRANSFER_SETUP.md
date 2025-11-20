# Bidirectional Bridge Transfer Setup - Quick Reference

## ✅ Current Status

### Bridges Deployed
- ✅ Hyperion: `0xfF064Fd496256e84b68dAE2509eDA84a3c235550`
- ✅ Mantle: `0xd6629696A52E914433b0924f1f49d42216708276`
- ✅ Lazchain: `0xf2D33cF11d102F94148c38f943C99408f7C898cf`
- ✅ Metis Sepolia: `0x1AC16E6C537438c82A61A106B876Ef69C7e247d2`

### Configuration Status
- ✅ Token mappings configured on all bridges
- ✅ Supported networks configured on all bridges
- ✅ Relayers configured (deployer address)
- ⚠️ **Bridges need to be funded** for withdrawals to work

---

## 🚀 Quick Start: Enable Bidirectional Transfers

### Step 1: Fund All Bridges

```bash
# Fund Hyperion Bridge
npx hardhat run scripts/bridge/fund-bridge-contract.ts --network metis-hyperion-testnet

# Fund Mantle Bridge
npx hardhat run scripts/bridge/fund-bridge-contract-mantle.ts --network mantle-testnet

# Fund Lazchain Bridge
npx hardhat run scripts/bridge/fund-bridge-contract-lazchain.ts --network lazchain-testnet

# Fund Metis Sepolia Bridge
npx hardhat run scripts/bridge/fund-bridge-contract-metissepolia.ts --network metis-sepolia-testnet
```

### Step 2: Verify Bridge Balances

Check each bridge has sufficient tokens for expected withdrawal volume.

### Step 3: Test Bidirectional Transfer

1. Deposit on Network A
2. Process withdrawal on Network B
3. Deposit back on Network B
4. Process withdrawal on Network A

---

## 🔄 Bidirectional Transfer Flow

```
User on Hyperion                    User on Mantle
     |                                    |
     | 1. Deposit 100 USDT              |
     |---------------------------------->| (Tokens locked in Hyperion bridge)
     |                                    |
     | 2. Relayer processes withdrawal   |
     |<----------------------------------| (Tokens released from Mantle bridge)
     |                                    |
     | 3. Deposit 100 USDT back          |
     |<----------------------------------| (Tokens locked in Mantle bridge)
     |                                    |
     | 4. Relayer processes withdrawal    |
     |---------------------------------->| (Tokens released from Hyperion bridge)
     |                                    |
```

---

## 📊 Network Compatibility

All networks support bidirectional transfers with each other:

```
Hyperion ↔ Mantle ✅
Hyperion ↔ Lazchain ✅
Hyperion ↔ Metis Sepolia ✅
Mantle ↔ Lazchain ✅
Mantle ↔ Metis Sepolia ✅
Lazchain ↔ Metis Sepolia ✅
```

---

## 💡 Key Points

1. **Bridges are deployed** on all 4 networks ✅
2. **Token mappings are configured** bidirectionally ✅
3. **Supported networks are configured** on all bridges ✅
4. **Relayers are configured** on all bridges ✅
5. **Bridges must be funded** before withdrawals work ⚠️

---

## 📚 Documentation

- **Complete Operations Guide**: `docs/bridge/BRIDGE_OPERATIONS_GUIDE.md`
- **Frontend Integration**: `docs/frontend/COMPLETE_FRONTEND_INTEGRATION_GUIDE.md`
- **Bridge Compatibility**: `docs/bridge/BRIDGE_COMPATIBILITY.md`
- **Token Mapping System**: `docs/bridge/TOKEN_MAPPING_SYSTEM.md`

---

## 🎯 Summary

**Bidirectional transfers work between all networks once bridges are funded!**

The infrastructure is complete - just fund the bridges and you're ready to go! 🚀

