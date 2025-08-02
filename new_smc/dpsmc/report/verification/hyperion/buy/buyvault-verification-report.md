# 🔍 BuyVault Contract Verification Report

## Contract Details
- **Address:** `0x0adFd197aAbbC194e8790041290Be57F18d576a3`
- **Name:** BuyVault
- **Network:** Hyperion Testnet
- **Chain ID:** 133717
- **RPC URL:** https://hyperion-testnet.metisdevops.link

## Verification Status
⚠️ **Manual Verification Required**

The automated verification APIs for Hyperion testnet are not available. 
This is common with newer or less popular testnets.

## Verification Data
All necessary verification data has been saved to:
`verification/hyperion/buyvault-verification.json`

## Manual Verification Steps
1. **Source Code:** Available in `contracts/buy/BuyContract.sol`
2. **Constructor Arguments:** 
   - USDC Address: `0x31424DB0B7a929283C394b4DA412253Ab6D61682`
   - USDT Address: `0x9b52D326D4866055F6c23297656002992e4293FC`
   - USDC Price: `10000000000000000` (0.01 METIS per USDC)
   - USDT Price: `10000000000000000` (0.01 METIS per USDT)
3. **Compiler Version:** 0.8.28
4. **Optimizer:** Enabled (200 runs)
5. **ViaIR:** Enabled

## Contract Features
The BuyVault contract includes:
- `buyUSDC(uint256 minTokenAmount)` - Buy USDC with METIS
- `buyUSDT(uint256 minTokenAmount)` - Buy USDT with METIS
- `getUSDCAmount(uint256 metisAmount)` - Calculate USDC amount for METIS
- `getUSDTAmount(uint256 metisAmount)` - Calculate USDT amount for METIS
- `getContractInfo()` - Get contract information
- `setUSDCPrice(uint256 _usdcPrice)` - Set USDC price (owner only)
- `setUSDTPrice(uint256 _usdtPrice)` - Set USDT price (owner only)
- `withdrawTokens(address token, address to, uint256 amount)` - Withdraw tokens (owner only)
- `withdrawMETIS(address to, uint256 amount)` - Withdraw METIS (owner only)
- `pause()` and `unpause()` - Emergency pause/unpause (owner only)
- `emergencyWithdrawMETIS()` - Emergency METIS withdrawal (owner only)

## Pricing Configuration
- **USDC Price:** 0.01 METIS per USDC (0.1 METIS = 10 USDC)
- **USDT Price:** 0.01 METIS per USDT (0.1 METIS = 10 USDT)
- **Minimum Purchase:** 0.001 METIS
- **Price Precision:** 1e18

## Alternative Verification Methods
1. **Block Explorer:** Check if Hyperion has a block explorer with manual verification
2. **Sourcify:** Try manual verification on https://sourcify.dev
3. **Local Verification:** Use the saved verification data for manual verification

## Deployment Confirmation
✅ Contract successfully deployed and tested
✅ All functions working correctly
✅ User interactions verified
✅ System fully operational
✅ Price calculations working correctly (0.1 METIS = 10 USDC/USDT)

## Contract Balances
- **USDC Balance:** 1,000,000 USDC (funded)
- **USDT Balance:** 1,000,000 USDT (funded)
- **METIS Balance:** Variable (from user purchases)

---
**Note:** This contract is fully functional and tested. The lack of automated verification does not affect the contract's operation.
