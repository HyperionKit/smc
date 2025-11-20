# Bridge Status Monitoring Guide

## Overview

This guide explains how to monitor bridge status, balances, and activity across all networks to ensure smooth bidirectional transfers.

## Monitoring Tools

### 1. Bridge Status Check

Check current status of all bridges including balances, configuration, and funding requirements.

```bash
npx hardhat run scripts/bridge/check-bridge-status.ts
```

**Output includes:**
- Bridge configuration (owner, fee, paused status)
- Token balances for all supported tokens
- Funding requirements vs current balances
- Supported networks
- Relayer status
- Funding recommendations

**Saved to:** `dpsmc/{network}/bridge/bridge-status-{timestamp}.json`

### 2. Bridge Balance Monitor

Monitor bridge balances across all networks with alerts for low balances.

```bash
# One-time check
npx hardhat run scripts/bridge/monitor-bridge-balances.ts

# Continuous monitoring (every 5 minutes)
npx hardhat run scripts/bridge/monitor-bridge-balances.ts --continuous --interval 300
```

**Features:**
- Real-time balance monitoring
- Alert thresholds (Critical: 20%, Warning: 50% of minimum)
- Status indicators (OK, WARNING, CRITICAL)
- Continuous monitoring option

**Saved to:** `dpsmc/report/bridge/bridge-monitor-{timestamp}.json`

### 3. Bridge Activity Monitor

Track deposits and withdrawals across all networks.

```bash
# One-time check
npx hardhat run scripts/bridge/monitor-bridge-activity.ts

# Continuous monitoring
npx hardhat run scripts/bridge/monitor-bridge-activity.ts --continuous --interval 300

# Check specific block range
npx hardhat run scripts/bridge/monitor-bridge-activity.ts --from-block 1000000
```

**Features:**
- Deposit and withdrawal tracking
- Recent transaction history
- Activity summaries
- Block range scanning

**Saved to:** `dpsmc/report/bridge/bridge-activity-{timestamp}.json`

## Monitoring Procedures

### Daily Monitoring

1. **Check Bridge Status**
   ```bash
   npx hardhat run scripts/bridge/check-bridge-status.ts
   ```

2. **Review Balance Alerts**
   - Check for WARNING or CRITICAL status
   - Identify bridges needing funding
   - Plan funding operations

3. **Review Activity**
   ```bash
   npx hardhat run scripts/bridge/monitor-bridge-activity.ts
   ```
   - Check deposit/withdrawal volumes
   - Verify relayer activity
   - Identify any anomalies

### Continuous Monitoring

For production environments, set up continuous monitoring:

```bash
# Balance monitoring (every 5 minutes)
npx hardhat run scripts/bridge/monitor-bridge-balances.ts --continuous --interval 300

# Activity monitoring (every 5 minutes)
npx hardhat run scripts/bridge/monitor-bridge-activity.ts --continuous --interval 300
```

### Alert Thresholds

**Balance Alerts:**
- **CRITICAL**: Balance < 20% of minimum recommended
- **WARNING**: Balance < 50% of minimum recommended
- **OK**: Balance >= 100% of minimum recommended

**Minimum Recommended Amounts:**
- USDT: 10,000 tokens
- USDC: 10,000 tokens
- DAI: 10,000 tokens
- WETH: 100 tokens

## Funding Procedures

### When to Fund

Fund bridges when:
- Balance falls below minimum recommended
- Alert status is WARNING or CRITICAL
- Expected withdrawal volume exceeds current balance
- After large withdrawal events

### How to Fund

1. **Check Current Status**
   ```bash
   npx hardhat run scripts/bridge/check-bridge-status.ts
   ```

2. **Fund Specific Network**
   ```bash
   # Hyperion
   npx hardhat run scripts/bridge/fund-bridge-contract.ts --network metis-hyperion-testnet

   # Mantle
   npx hardhat run scripts/bridge/fund-bridge-contract-mantle.ts --network mantle-testnet

   # Lazchain
   npx hardhat run scripts/bridge/fund-bridge-contract-lazchain.ts --network lazchain-testnet

   # Metis Sepolia
   npx hardhat run scripts/bridge/fund-bridge-contract-metissepolia.ts --network metis-sepolia-testnet
   ```

3. **Verify Funding**
   ```bash
   npx hardhat run scripts/bridge/check-bridge-status.ts
   ```

## Monitoring Best Practices

### 1. Regular Checks

- **Daily**: Check bridge status and balances
- **Weekly**: Review activity reports
- **Monthly**: Analyze trends and adjust funding

### 2. Automated Alerts

Set up automated monitoring with alerts:
- Low balance alerts
- Unusual activity alerts
- Relayer status alerts

### 3. Documentation

- Keep records of all monitoring checks
- Document funding operations
- Track balance trends over time

### 4. Proactive Management

- Fund bridges before they reach critical levels
- Monitor withdrawal patterns
- Adjust funding based on usage

## Troubleshooting

### Issue: Balance Monitor Shows Errors

**Possible Causes:**
- Network RPC unavailable
- Contract address incorrect
- Network not accessible

**Solution:**
- Check RPC URL configuration
- Verify contract addresses
- Check network connectivity

### Issue: Activity Monitor Shows No Activity

**Possible Causes:**
- No recent transactions
- Block range too narrow
- Network synchronization issues

**Solution:**
- Expand block range
- Check network status
- Verify bridge is operational

### Issue: Alerts Not Triggering

**Possible Causes:**
- Thresholds set incorrectly
- Monitoring script not running
- Balance calculation errors

**Solution:**
- Verify threshold settings
- Check monitoring script execution
- Review balance calculations

## Monitoring Dashboard

Create a monitoring dashboard using the JSON output files:

1. **Parse Status Files**
   - Read `bridge-status-*.json` files
   - Extract balance information
   - Calculate funding needs

2. **Parse Monitor Files**
   - Read `bridge-monitor-*.json` files
   - Display current balances
   - Show alert status

3. **Parse Activity Files**
   - Read `bridge-activity-*.json` files
   - Display transaction history
   - Show activity trends

## Integration with External Tools

### Prometheus/Grafana

Export monitoring data to Prometheus:
- Bridge balances as metrics
- Activity counts as metrics
- Alert status as metrics

### Webhook Alerts

Send alerts to external services:
- Slack notifications
- Email alerts
- SMS notifications

## Summary

Regular monitoring ensures:
- Bridges remain funded
- Transfers complete successfully
- Issues are detected early
- System operates smoothly

Use the monitoring tools regularly and set up automated monitoring for production environments.

