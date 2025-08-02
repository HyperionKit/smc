# USDT-USDC Swap Pair Documentation

## Overview
The USDT-USDC trading pair represents one of the most liquid stablecoin pairs in the DeFi ecosystem. Both USDT (Tether) and USDC (USD Coin) are USD-pegged stablecoins with high market capitalization and widespread adoption.

## Token Information

### USDT (Tether)
- **Symbol**: USDT
- **Name**: Tether USD
- **Decimals**: 6
- **Total Supply**: 40,000,000 USDT
- **Contract Address**: 0x9b52D326D4866055F6c23297656002992e4293FC
- **Description**: USDT is a stablecoin pegged to the US Dollar, issued by Tether Limited.

### USDC (USD Coin)
- **Symbol**: USDC
- **Name**: USD Coin
- **Decimals**: 6
- **Total Supply**: 40,000,000 USDC
- **Contract Address**: 0x31424DB0B7a929283C394b4DA412253Ab6D61682
- **Description**: USDC is a stablecoin pegged to the US Dollar, issued by Circle and Coinbase.

## Trading Pair Details

### Pool Information
- **Pair Address**: 0x91C39DAA7617C5188d0427Fc82e4006803772B74
- **Liquidity Provider Fee**: 0.3% (30 basis points)
- **Minimum Liquidity**: 1,000 tokens
- **Pool Type**: Automated Market Maker (AMM)

### Contract Verification
- [LiquidityPool Verified on Blockscout](https://hyperion-testnet-explorer.metisdevops.link/address/0x91C39DAA7617C5188d0427Fc82e4006803772B74#code)
- [USDT Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0x9b52D326D4866055F6c23297656002992e4293FC#code)
- [USDC Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0x31424DB0B7a929283C394b4DA412253Ab6D61682#code)

### Trading Features
- **24/7 Trading**: Available round the clock
- **Instant Swaps**: No order book required
- **Slippage Protection**: Built-in slippage tolerance
- **Price Impact**: Minimal due to high liquidity

## Trading Parameters

### Swap Fees
- **Standard Fee**: 0.3%
- **Protocol Fee**: 0.05%
- **LP Fee**: 0.25%

### Slippage Tolerance
- **Recommended**: 0.1% - 0.5%
- **Maximum**: 5%
- **Emergency**: 10%

### Minimum Trade Amount
- **USDT**: 1 USDT
- **USDC**: 1 USDC

## Price Information

### Price Calculation
The price is calculated using the constant product formula:
```
x * y = k
```
Where:
- x = USDT reserve
- y = USDC reserve
- k = constant product

### Price Impact
- **Small trades (< $1,000)**: < 0.01%
- **Medium trades ($1,000 - $10,000)**: 0.01% - 0.05%
- **Large trades (> $10,000)**: 0.05% - 0.1%

## Liquidity Provision

### Adding Liquidity
1. Navigate to the Liquidity page
2. Select USDT and USDC
3. Enter the amount of tokens to provide
4. Approve tokens and confirm transaction

### Removing Liquidity
1. Select the USDT-USDC pair
2. Enter the percentage of liquidity to remove
3. Confirm the transaction

### LP Token Rewards
- **Trading Fees**: 0.25% of all trades
- **Reward Distribution**: Proportional to LP share
- **Compounding**: Automatic reinvestment

## Security Features

### Smart Contract Security
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Overflow Protection**: Safe math operations
- **Access Control**: Owner-only functions protected
- **Pausable**: Emergency pause functionality

### Risk Management
- **Slippage Protection**: Prevents excessive price impact
- **Minimum Output**: Ensures minimum received amount
- **Deadline Protection**: Transaction timeout

## Usage Examples

### Basic Swap
```javascript
// Swap 100 USDT for USDC
const amountIn = ethers.utils.parseUnits("100", 6); // 100 USDT
const minAmountOut = ethers.utils.parseUnits("99.5", 6); // 99.5 USDC minimum

await ammContract.swap(
    usdtAddress,
    usdcAddress,
    amountIn,
    minAmountOut
);
```

### Add Liquidity
```javascript
// Add 1000 USDT and 1000 USDC as liquidity
const amountA = ethers.utils.parseUnits("1000", 6);
const amountB = ethers.utils.parseUnits("1000", 6);

await ammContract.addLiquidity(
    usdtAddress,
    usdcAddress,
    amountA,
    amountB
);
```

## Monitoring and Analytics

### Key Metrics
- **Total Value Locked (TVL)**: [Current TVL]
- **24h Trading Volume**: [Current Volume]
- **Number of Trades**: [Current Count]
- **Unique Traders**: [Current Count]

### Price Charts
- **Real-time Price**: [Current Price]
- **Price History**: [Historical Data]
- **Volume Analysis**: [Volume Charts]

## Integration Guide

### Frontend Integration
```javascript
// Get pool reserves
const reserves = await ammContract.getReserves(usdtAddress, usdcAddress);

// Calculate swap amount
const amountOut = await ammContract.getAmountOut(amountIn, reserveIn, reserveOut);

// Get user balance
const balance = await usdtContract.balanceOf(userAddress);
```

### API Endpoints
- **Pool Info**: `/api/pools/usdt-usdc`
- **Price Data**: `/api/price/usdt-usdc`
- **Trade History**: `/api/trades/usdt-usdc`

## Troubleshooting

### Common Issues
1. **Insufficient Balance**: Ensure sufficient token balance
2. **Slippage Too High**: Reduce trade size or increase slippage tolerance
3. **Transaction Failed**: Check gas limit and network congestion
4. **Pool Not Found**: Verify token addresses and pool existence

### Support
- **Documentation**: [Link to docs]
- **Discord**: [Discord link]
- **Telegram**: [Telegram link]
- **Email**: [Support email]

## Legal and Compliance

### Regulatory Information
- **USDT**: Regulated by various jurisdictions
- **USDC**: Regulated by US authorities
- **Trading**: Subject to local regulations

### Terms of Service
- **Usage**: Subject to platform terms
- **Risks**: Trading involves risk
- **Liability**: Limited liability as per terms

---

*Last Updated: [Date]*
*Version: 1.0*