# Bridge Operations Guide - Complete Bidirectional Transfer Setup

## 📋 Overview

This guide explains how to set up and operate bidirectional cross-chain transfers between all networks (Hyperion, Mantle, Lazchain, Metis Sepolia).

## 🔑 Key Concepts

### How Bidirectional Transfers Work

1. **Deposit Phase** (Source Network):
   - User deposits tokens on Network A
   - Tokens are locked in Bridge A
   - Deposit event is emitted

2. **Withdrawal Phase** (Destination Network):
   - Relayer monitors deposit event on Network A
   - Relayer creates signature for withdrawal
   - Relayer calls `withdraw()` on Bridge B
   - Tokens are released from Bridge B to user

### Critical Requirement: Bridge Funding

**The destination bridge MUST have tokens available for withdrawals to work.**

- Bridge A locks tokens when user deposits
- Bridge B releases tokens when user withdraws
- Bridge B needs to be pre-funded with tokens

---

## 🚀 Step 1: Fund All Bridges

### Bridge Addresses by Network

| Network | Bridge Address | Status |
|---------|---------------|--------|
| Hyperion | `0xfF064Fd496256e84b68dAE2509eDA84a3c235550` | ✅ Deployed |
| Mantle | `0xd6629696A52E914433b0924f1f49d42216708276` | ✅ Deployed |
| Lazchain | `0xf2D33cF11d102F94148c38f943C99408f7C898cf` | ✅ Deployed |
| Metis Sepolia | `0x1AC16E6C537438c82A61A106B876Ef69C7e247d2` | ✅ Deployed |

### Funding Commands

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

### Recommended Funding Amounts

For each bridge, fund with:
- **USDT**: 10,000 - 100,000 tokens
- **USDC**: 10,000 - 100,000 tokens
- **DAI**: 10,000 - 100,000 tokens
- **WETH**: 100 - 1,000 tokens

**Note**: Adjust amounts based on expected usage volume.

---

## 🔐 Step 2: Configure Relayers

### What is a Relayer?

A relayer is an authorized address that can process withdrawals on the destination bridge. The relayer:
1. Monitors deposit events on source networks
2. Creates signatures for withdrawals
3. Calls `withdraw()` on destination bridges

### Current Relayer Status

All bridges have the deployer address (`0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff`) set as the initial relayer.

### Add Additional Relayers

```bash
# Add relayer to Hyperion Bridge
npx hardhat run scripts/bridge/manage-bridge.ts --network metis-hyperion-testnet

# Add relayer to Mantle Bridge
npx hardhat run scripts/bridge/manage-bridge-mantle.ts --network mantle-testnet

# Add relayer to Lazchain Bridge
npx hardhat run scripts/bridge/manage-bridge-lazchain.ts --network lazchain-testnet

# Add relayer to Metis Sepolia Bridge
npx hardhat run scripts/bridge/manage-bridge-metissepolia.ts --network metis-sepolia-testnet
```

### Relayer Requirements

- Must have native currency for gas fees
- Must monitor deposit events across all networks
- Must have access to private key for signing withdrawals
- Should be a reliable, always-on service

---

## 🔄 Step 3: Test Bidirectional Transfers

### Test Flow: Hyperion → Mantle → Hyperion

#### 3.1 Deposit on Hyperion

```bash
npx hardhat run scripts/bridge/test-bridge-deposit.ts --network metis-hyperion-testnet
```

This will:
- Deposit tokens on Hyperion bridge
- Lock tokens in Hyperion bridge
- Emit deposit event with deposit ID

#### 3.2 Process Withdrawal on Mantle

```bash
npx hardhat run scripts/bridge/test-bridge-withdrawal-mantle.ts --network mantle-testnet
```

This will:
- Relayer creates signature for withdrawal
- Call `withdraw()` on Mantle bridge
- Release tokens to user on Mantle

#### 3.3 Deposit Back on Mantle

```bash
npx hardhat run scripts/bridge/test-bridge-deposit-mantle.ts --network mantle-testnet
```

#### 3.4 Process Withdrawal on Hyperion

```bash
npx hardhat run scripts/bridge/test-bridge-withdrawal.ts --network metis-hyperion-testnet
```

---

## 📊 Step 4: Monitor Bridge Status

### Check Bridge Balances

```typescript
// Check token balance on bridge
const bridge = await ethers.getContractAt("Bridge", BRIDGE_ADDRESS);
const token = await ethers.getContractAt("Token", TOKEN_ADDRESS);
const balance = await token.balanceOf(BRIDGE_ADDRESS);
console.log(`Bridge ${symbol} balance: ${ethers.formatUnits(balance, decimals)}`);
```

### Check Supported Networks

```typescript
const isSupported = await bridge.supportedChains(CHAIN_ID);
console.log(`Chain ${CHAIN_ID} supported: ${isSupported}`);
```

### Check Token Mappings

```typescript
const tokenAddress = await bridge.tokenAddresses("USDT", DESTINATION_CHAIN_ID);
console.log(`USDT on chain ${DESTINATION_CHAIN_ID}: ${tokenAddress}`);
```

---

## 🛠️ Step 5: Bridge Management

### Pause/Unpause Bridge

```typescript
// Pause bridge (emergency only)
await bridge.pause();

// Unpause bridge
await bridge.unpause();
```

### Update Bridge Fee

```typescript
const newFee = ethers.parseEther("0.002"); // 0.002 ETH
await bridge.setBridgeFee(newFee);
```

### Add/Remove Supported Networks

```typescript
// Add network support
await bridge.setChainSupport(CHAIN_ID, true);

// Remove network support
await bridge.setChainSupport(CHAIN_ID, false);
```

### Add/Remove Relayers

```typescript
// Add relayer
await bridge.addRelayer(RELAYER_ADDRESS);

// Remove relayer
await bridge.removeRelayer(RELAYER_ADDRESS);
```

---

## 🧪 Step 5: Test Bidirectional Transfers

### Test Network Pair Readiness

Check if all network pairs are ready for bidirectional transfers:

```bash
npx hardhat run scripts/bridge/test-all-network-pairs.ts
```

This will verify:
- Bridge balances on both networks
- Token mappings configuration
- Supported network configuration
- Overall readiness status

### Test Specific Network Pair

Test bidirectional transfer between Hyperion and Mantle:

```bash
npx hardhat run scripts/bridge/test-bidirectional-hyperion-mantle.ts
```

### Verify Bridge Configurations

Verify all bridge configurations:

```bash
npx hardhat run scripts/bridge/verify-bridge-configs.ts
```

This checks:
- Supported networks
- Token mappings
- Relayer configuration
- Token support status

### Testing Procedures

1. **Pre-Test Checklist:**
   - Verify bridge balances using `check-bridge-status.ts`
   - Verify configurations using `verify-bridge-configs.ts`
   - Check network pair readiness using `test-all-network-pairs.ts`

2. **Execute Test:**
   - Deposit tokens on source network
   - Process withdrawal on destination network (relayer required)
   - Deposit back on destination network
   - Process withdrawal on source network (relayer required)

3. **Verify Results:**
   - Check token balances before and after
   - Verify deposit/withdrawal events
   - Confirm tokens transferred correctly

---

## 🔍 Troubleshooting

### Issue: Withdrawal Fails

**Possible Causes:**
1. Destination bridge has insufficient token balance
   - **Solution**: Fund the destination bridge
2. Relayer signature is invalid
   - **Solution**: Verify relayer is authorized and signature is correct
3. Deposit ID already processed
   - **Solution**: Use a new deposit ID
4. Token not supported on destination chain
   - **Solution**: Verify token mapping is configured

### Issue: Deposit Fails

**Possible Causes:**
1. Token not approved for bridge
   - **Solution**: Approve token spending first
2. Insufficient bridge fee
   - **Solution**: Send enough native currency for bridge fee
3. Destination chain not supported
   - **Solution**: Verify chain ID is in supported networks
4. Token not active on destination chain
   - **Solution**: Verify token mapping is active

### Issue: Bridge Balance Depleted

**Solution**: 
1. Monitor bridge balances regularly
2. Fund bridges proactively
3. Set up alerts for low balances
4. Rebalance funds between bridges as needed

---

## 📊 Step 4: Monitor Bridge Status

### Check Bridge Status

Use the status check script to verify all bridges:

```bash
npx hardhat run scripts/bridge/check-bridge-status.ts
```

This will:
- Check balances on all networks
- Display funding requirements
- Show supported networks
- Verify relayer status
- Generate funding recommendations

### Monitor Bridge Balances

Monitor balances continuously:

```bash
# One-time check
npx hardhat run scripts/bridge/monitor-bridge-balances.ts

# Continuous monitoring (every 5 minutes)
npx hardhat run scripts/bridge/monitor-bridge-balances.ts --continuous --interval 300
```

### Monitor Bridge Activity

Track deposits and withdrawals:

```bash
# One-time check
npx hardhat run scripts/bridge/monitor-bridge-activity.ts

# Continuous monitoring
npx hardhat run scripts/bridge/monitor-bridge-activity.ts --continuous --interval 300
```

See `docs/bridge/BRIDGE_STATUS_MONITORING.md` for detailed monitoring procedures.

## 📈 Best Practices

### 1. Fund Bridges Proactively

- Fund all bridges before enabling public use
- Monitor balances and refill as needed
- Keep reserves for unexpected demand
- Use monitoring tools to track balance levels

### 2. Multiple Relayers

- Set up multiple relayers for redundancy
- Use different keys for security
- Monitor relayer availability
- Test relayer functionality regularly

### 3. Regular Monitoring

- Check bridge balances daily using `check-bridge-status.ts`
- Monitor deposit/withdrawal events using `monitor-bridge-activity.ts`
- Track transaction volumes
- Set up alerts for anomalies
- Use continuous monitoring for production

### 4. Security

- Keep relayer keys secure
- Use hardware wallets for relayer keys
- Implement rate limiting
- Monitor for suspicious activity
- Review activity logs regularly

### 5. Documentation

- Keep records of all bridge operations
- Document relayer configurations
- Track funding transactions
- Maintain bridge status dashboard
- Save monitoring reports for audit

---

## 🔗 Network Compatibility Matrix

| From → To | Hyperion | Mantle | Lazchain | Metis Sepolia |
|-----------|----------|--------|----------|---------------|
| **Hyperion** | - | ✅ | ✅ | ✅ |
| **Mantle** | ✅ | - | ✅ | ✅ |
| **Lazchain** | ✅ | ✅ | - | ✅ |
| **Metis Sepolia** | ✅ | ✅ | ✅ | - |

**All networks support bidirectional transfers with each other.**

---

## 📝 Example: Complete Bidirectional Transfer

### Scenario: Transfer 100 USDT from Hyperion to Mantle and back

#### Step 1: Fund Mantle Bridge
```bash
# Ensure Mantle bridge has USDT
npx hardhat run scripts/bridge/fund-bridge-contract-mantle.ts --network mantle-testnet
```

#### Step 2: Deposit on Hyperion
```typescript
const bridge = await ethers.getContractAt("Bridge", HYPERION_BRIDGE);
const usdt = await ethers.getContractAt("Token", HYPERION_USDT);

// Approve first
await usdt.approve(HYPERION_BRIDGE, ethers.parseUnits("100", 6));

// Deposit
await bridge.deposit(
  HYPERION_USDT,
  ethers.parseUnits("100", 6),
  5003, // Mantle chain ID
  USER_ADDRESS,
  { value: await bridge.bridgeFee() }
);
```

#### Step 3: Process Withdrawal on Mantle
```typescript
const mantleBridge = await ethers.getContractAt("Bridge", MANTLE_BRIDGE);
const mantleUsdt = await ethers.getContractAt("Token", MANTLE_USDT);

// Relayer creates signature
const messageHash = ethers.keccak256(
  ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256", "bytes32"],
    [USER_ADDRESS, MANTLE_USDT, ethers.parseUnits("100", 6), DEPOSIT_ID]
  )
);
const signature = await relayerSigner.signMessage(ethers.getBytes(messageHash));

// Withdraw
await mantleBridge.withdraw(
  USER_ADDRESS,
  MANTLE_USDT,
  ethers.parseUnits("100", 6),
  DEPOSIT_ID,
  signature
);
```

#### Step 4: Deposit Back on Mantle
```typescript
// Approve
await mantleUsdt.approve(MANTLE_BRIDGE, ethers.parseUnits("100", 6));

// Deposit back to Hyperion
await mantleBridge.deposit(
  MANTLE_USDT,
  ethers.parseUnits("100", 6),
  133717, // Hyperion chain ID
  USER_ADDRESS,
  { value: await mantleBridge.bridgeFee() }
);
```

#### Step 5: Process Withdrawal on Hyperion
```typescript
// Similar to Step 3, but on Hyperion bridge
await bridge.withdraw(USER_ADDRESS, HYPERION_USDT, amount, depositId, signature);
```

---

## 🎯 Summary

For bidirectional transfers to work:

1. ✅ **Bridges deployed** on all networks
2. ✅ **Token mappings configured** across all networks
3. ✅ **Supported networks configured** on all bridges
4. ✅ **Relayers configured** on all bridges
5. ⚠️ **Bridges must be funded** with tokens for withdrawals

**Once all bridges are funded, bidirectional transfers work seamlessly between all networks!**

---

## 📚 Additional Resources

- **Frontend Integration**: See `docs/frontend/COMPLETE_FRONTEND_INTEGRATION_GUIDE.md`
- **Bridge Compatibility**: See `docs/bridge/BRIDGE_COMPATIBILITY.md`
- **Token Mapping System**: See `docs/bridge/TOKEN_MAPPING_SYSTEM.md`
- **Status Monitoring**: See `docs/bridge/BRIDGE_STATUS_MONITORING.md`
- **Setup Summary**: See `docs/bridge/BRIDGE_SETUP_SUMMARY.md`
- **Deployment Summaries**: See `dpsmc/{network}/DEPLOYMENT_SUMMARY.md`

## 🔧 Available Scripts

### Status and Monitoring
- `check-bridge-status.ts` - Check status of all bridges
- `monitor-bridge-balances.ts` - Monitor bridge balances
- `monitor-bridge-activity.ts` - Monitor bridge activity
- `verify-bridge-configs.ts` - Verify bridge configurations

### Funding
- `fund-bridge-contract.ts` - Fund Hyperion bridge
- `fund-bridge-contract-mantle.ts` - Fund Mantle bridge
- `fund-bridge-contract-lazchain.ts` - Fund Lazchain bridge
- `fund-bridge-contract-metissepolia.ts` - Fund Metis Sepolia bridge

### Testing
- `test-all-network-pairs.ts` - Test all network pairs readiness
- `test-bidirectional-hyperion-mantle.ts` - Test Hyperion ↔ Mantle
- `test-bridge-deposit.ts` - Test deposit functionality
- `test-bridge-withdrawal.ts` - Test withdrawal functionality

