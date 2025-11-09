# USDT-WETH Swap Pair Documentation

## Overview
The USDT-WETH trading pair represents one of the most liquid pairs in the DeFi ecosystem, combining the world's largest stablecoin (USDT) with Wrapped Ether (WETH), which represents Ethereum's native token in ERC-20 format.

## Token Information

### USDT (Tether)
- **Symbol**: USDT
- **Name**: Tether USD
- **Decimals**: 6
- **Total Supply**: 40,000,000 USDT
- **Contract Address**: 0x9b52D326D4866055F6c23297656002992e4293FC
- **Description**: USDT is a centralized stablecoin pegged to the US Dollar, issued by Tether Limited.

### WETH (Wrapped Ether)
- **Symbol**: WETH
- **Name**: Wrapped Ether
- **Decimals**: 18
- **Total Supply**: 40,000,000 WETH
- **Contract Address**: 0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4
- **Description**: WETH is the ERC-20 representation of Ethereum's native ETH token, allowing it to be used in DeFi protocols.

## Trading Pair Details

### Pool Information
- **Pair Address**: 0x91C39DAA7617C5188d0427Fc82e4006803772B74
- **Liquidity Provider Fee**: 0.3% (30 basis points)
- **Minimum Liquidity**: 1,000 tokens
- **Pool Type**: Automated Market Maker (AMM)

### Contract Verification
- [LiquidityPool Verified on Blockscout](https://hyperion-testnet-explorer.metisdevops.link/address/0x91C39DAA7617C5188d0427Fc82e4006803772B74#code)
- [USDT Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0x9b52D326D4866055F6c23297656002992e4293FC#code)
- [WETH Verified](https://hyperion-testnet-explorer.metisdevops.link/address/0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4#code)

### Trading Features
- **24/7 Trading**: Available round the clock
- **Instant Swaps**: No order book required
- **Slippage Protection**: Built-in slippage tolerance
- **Price Impact**: Varies based on trade size and liquidity

## Trading Parameters

### Swap Fees
- **Standard Fee**: 0.3%
- **Protocol Fee**: 0.05%
- **LP Fee**: 0.25%

### Slippage Tolerance
- **Recommended**: 0.5% - 1%
- **Maximum**: 5%
- **Emergency**: 10%

### Minimum Trade Amount
- **USDT**: 1 USDT
- **WETH**: 0.001 WETH

## Price Information

### Price Calculation
The price is calculated using the constant product formula:
```
x * y = k
```
Where:
- x = USDT reserve
- y = WETH reserve
- k = constant product

### Price Impact
- **Small trades (< $1,000)**: < 0.1%
- **Medium trades ($1,000 - $10,000)**: 0.1% - 0.5%
- **Large trades (> $10,000)**: 0.5% - 2%

## Liquidity Provision

### Adding Liquidity
1. Navigate to the Liquidity page
2. Select USDT and WETH
3. Enter the amount of tokens to provide
4. Approve tokens and confirm transaction

### Removing Liquidity
1. Select the USDT-WETH pair
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
// Swap 1000 USDT for WETH
const amountIn = ethers.utils.parseUnits("1000", 6); // 1000 USDT
const minAmountOut = ethers.utils.parseUnits("0.5", 18); // 0.5 WETH minimum

await ammContract.swap(
    usdtAddress,
    wethAddress,
    amountIn,
    minAmountOut
);
```

### Add Liquidity
```javascript
// Add 10000 USDT and 5 WETH as liquidity
const amountA = ethers.utils.parseUnits("10000", 6); // USDT
const amountB = ethers.utils.parseUnits("5", 18); // WETH

await ammContract.addLiquidity(
    usdtAddress,
    wethAddress,
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
const reserves = await ammContract.getReserves(usdtAddress, wethAddress);

// Calculate swap amount
const amountOut = await ammContract.getAmountOut(amountIn, reserveIn, reserveOut);

// Get user balance
const balance = await usdtContract.balanceOf(userAddress);
```

### API Endpoints
- **Pool Info**: `/api/pools/usdt-weth`
- **Price Data**: `/api/price/usdt-weth`
- **Trade History**: `/api/trades/usdt-weth`

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
- **WETH**: Represents ETH, subject to crypto regulations
- **Trading**: Subject to local regulations

### Terms of Service
- **Usage**: Subject to platform terms
- **Risks**: Trading involves risk
- **Liability**: Limited liability as per terms

---

*Last Updated: [Date]*
*Version: 1.0* 