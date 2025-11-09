# Buy System Documentation

## Overview

The Buy System allows users to purchase ERC20 tokens using native currency (ETH/METIS) through a simple and secure smart contract. This system provides a direct way for users to acquire tokens without needing to go through decentralized exchanges.

## Core Components

### BuyContract.sol

The main smart contract that handles token purchases with native currency.

**Key Features:**
- Direct token purchases with native currency
- Configurable token prices
- Owner-only price management
- Emergency pause functionality
- Automatic token distribution

## Smart Contract Functions

### User Functions

#### `buyTokens(address token, uint256 amount)`
Purchase tokens with native currency.

**Parameters:**
- `token` - Address of the token to purchase
- `amount` - Amount of tokens to purchase (in token decimals)

**Requirements:**
- Contract must not be paused
- Token must be supported
- Sufficient native currency must be sent
- Token must be available in contract

**Events:**
- `TokensPurchased(address indexed buyer, address indexed token, uint256 amount, uint256 cost)`

### Admin Functions

#### `setTokenPrice(address token, uint256 price)`
Set the price of a token in wei per token unit.

**Parameters:**
- `token` - Address of the token
- `price` - Price in wei per token unit

**Requirements:**
- Caller must be contract owner
- Token must be supported

**Events:**
- `TokenPriceUpdated(address indexed token, uint256 newPrice)`

#### `addSupportedToken(address token, uint256 initialPrice)`
Add a new token to the supported tokens list.

**Parameters:**
- `token` - Address of the token to add
- `initialPrice` - Initial price in wei per token unit

**Requirements:**
- Caller must be contract owner
- Token must not already be supported

**Events:**
- `TokenAdded(address indexed token, uint256 initialPrice)`

#### `removeSupportedToken(address token)`
Remove a token from the supported tokens list.

**Parameters:**
- `token` - Address of the token to remove

**Requirements:**
- Caller must be contract owner
- Token must be currently supported

**Events:**
- `TokenRemoved(address indexed token)`

#### `withdrawTokens(address token, address to, uint256 amount)`
Withdraw tokens from the contract (emergency function).

**Parameters:**
- `token` - Address of the token to withdraw
- `to` - Address to send tokens to
- `amount` - Amount of tokens to withdraw

**Requirements:**
- Caller must be contract owner
- Contract must have sufficient token balance

#### `withdrawETH(address to, uint256 amount)`
Withdraw native currency from the contract.

**Parameters:**
- `to` - Address to send ETH to
- `amount` - Amount of ETH to withdraw

**Requirements:**
- Caller must be contract owner
- Contract must have sufficient ETH balance

#### `pause()` and `unpause()`
Emergency pause/unpause functionality.

**Requirements:**
- Caller must be contract owner

### View Functions

#### `getTokenPrice(address token)`
Get the current price of a token.

**Returns:**
- `uint256` - Price in wei per token unit

#### `isTokenSupported(address token)`
Check if a token is supported.

**Returns:**
- `bool` - True if token is supported

#### `calculatePurchaseCost(address token, uint256 amount)`
Calculate the cost in native currency for purchasing a specific amount of tokens.

**Parameters:**
- `token` - Address of the token
- `amount` - Amount of tokens to purchase

**Returns:**
- `uint256` - Cost in wei

#### `getSupportedTokens()`
Get list of all supported tokens.

**Returns:**
- `address[]` - Array of supported token addresses

## Deployment Scripts

### `scripts/buy/deploy-buy-contract.ts`
Deploys the BuyContract and configures initial settings.

**Features:**
- Deploys BuyContract with owner address
- Adds supported tokens (USDT, USDC, DAI, WETH)
- Sets initial token prices
- Saves deployment information

### `scripts/buy/fund-buy-contract.ts`
Funds the BuyContract with tokens for distribution.

**Features:**
- Transfers tokens from deployer to contract
- Handles token approvals
- Verifies funding success

### `scripts/buy/buy-usdc-with-metis.ts`
Demonstrates purchasing USDC with native currency.

**Features:**
- Shows complete purchase workflow
- Calculates costs
- Handles token approvals
- Executes purchase transaction

### `scripts/buy/check-buy-price.ts`
Utility script to check current token prices.

**Features:**
- Displays all supported token prices
- Shows purchase cost calculations
- Provides price comparison

### `scripts/buy/test-buy-calculation.ts`
Tests the price calculation functionality.

**Features:**
- Validates price calculations
- Tests edge cases
- Verifies mathematical accuracy

## Usage Examples

### Basic Token Purchase

```javascript
// Get token price
const price = await buyContract.getTokenPrice(tokenAddress);

// Calculate purchase cost
const tokenAmount = ethers.parseUnits("100", 6); // 100 USDC
const cost = await buyContract.calculatePurchaseCost(tokenAddress, tokenAmount);

// Execute purchase
const tx = await buyContract.buyTokens(tokenAddress, tokenAmount, {
    value: cost
});
await tx.wait();
```

### Admin Price Update

```javascript
// Update token price
const newPrice = ethers.parseEther("0.001"); // 0.001 ETH per token
const tx = await buyContract.setTokenPrice(tokenAddress, newPrice);
await tx.wait();
```

## Security Features

### Access Control
- Owner-only functions for critical operations
- Pausable functionality for emergency situations
- Safe token transfers using OpenZeppelin's SafeERC20

### Price Protection
- Configurable token prices
- Owner-controlled price updates
- Transparent price calculation

### Emergency Functions
- Emergency pause/unpause
- Token withdrawal capability
- ETH withdrawal capability

## Integration with DeFi Ecosystem

The Buy System integrates seamlessly with the broader DeFi ecosystem:

1. **Token Acquisition**: Users can acquire tokens directly without DEX interaction
2. **Liquidity Provision**: Purchased tokens can be used in the Swap system
3. **Staking**: Tokens can be staked in the Staking system
4. **Cross-chain Transfer**: Tokens can be bridged to other networks

## Performance Considerations

### Gas Optimization
- Efficient storage patterns
- Minimal external calls
- Optimized loops and calculations

### Scalability
- Support for multiple tokens
- Configurable pricing
- Extensible architecture

## Monitoring and Analytics

### Key Metrics
- Total tokens sold
- Revenue generated
- Popular tokens
- Purchase frequency

### Events for Tracking
- `TokensPurchased` - Track individual purchases
- `TokenPriceUpdated` - Monitor price changes
- `TokenAdded/TokenRemoved` - Track supported tokens

## Troubleshooting

### Common Issues

1. **Insufficient ETH**: Ensure sufficient native currency is sent
2. **Token Not Supported**: Verify token is in supported list
3. **Contract Paused**: Check if contract is paused
4. **Insufficient Token Supply**: Verify contract has token balance

### Error Messages
- "BuyContract: insufficient ETH sent"
- "BuyContract: token not supported"
- "BuyContract: contract is paused"
- "BuyContract: insufficient token balance"

## Future Enhancements

### Planned Features
- Dynamic pricing based on supply/demand
- Batch purchases
- Referral system
- Loyalty rewards
- Integration with price oracles

### Potential Improvements
- Flash loan integration
- Automated market making
- Cross-chain purchases
- Mobile app integration 