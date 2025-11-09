# Staking System Documentation

## Overview

The Staking System allows users to stake their ERC20 tokens and earn rewards in different tokens. This system provides a way for users to earn passive income while contributing to the ecosystem's liquidity and stability.

## Core Components

### StakingRewards.sol

The main smart contract that handles token staking and reward distribution.

**Key Features:**
- Multi-token staking support
- Configurable reward rates
- Flexible reward token distribution
- Emergency pause functionality
- Automatic reward calculation and distribution

## Smart Contract Functions

### User Functions

#### `stake(address token, uint256 amount)`
Stake tokens to start earning rewards.

**Parameters:**
- `token` - Address of the token to stake
- `amount` - Amount of tokens to stake (in token decimals)

**Requirements:**
- Contract must not be paused
- Token must be supported for staking
- User must have sufficient token balance
- User must approve contract to spend tokens

**Events:**
- `TokensStaked(address indexed user, address indexed token, uint256 amount, uint256 timestamp)`

#### `unstake(address token, uint256 amount)`
Unstake tokens and stop earning rewards for that amount.

**Parameters:**
- `token` - Address of the staked token
- `amount` - Amount of tokens to unstake

**Requirements:**
- User must have sufficient staked balance
- Contract must not be paused

**Events:**
- `TokensUnstaked(address indexed user, address indexed token, uint256 amount, uint256 timestamp)`

#### `claimRewards()`
Claim all accumulated rewards for the caller.

**Requirements:**
- User must have staked tokens
- User must have accumulated rewards
- Contract must not be paused

**Events:**
- `RewardsClaimed(address indexed user, address indexed rewardToken, uint256 amount, uint256 timestamp)`

#### `getStakedBalance(address user, address token)`
Get the staked balance of a specific token for a user.

**Parameters:**
- `user` - Address of the user
- `token` - Address of the staked token

**Returns:**
- `uint256` - Staked balance

#### `getPendingRewards(address user)`
Get the pending rewards for a user.

**Parameters:**
- `user` - Address of the user

**Returns:**
- `uint256` - Pending reward amount

### Admin Functions

#### `addStakingToken(address token, uint256 rewardRate)`
Add a new token for staking with a specific reward rate.

**Parameters:**
- `token` - Address of the token to add
- `rewardRate` - Reward rate per second per token

**Requirements:**
- Caller must be contract owner
- Token must not already be supported

**Events:**
- `StakingTokenAdded(address indexed token, uint256 rewardRate)`

#### `removeStakingToken(address token)`
Remove a token from staking support.

**Parameters:**
- `token` - Address of the token to remove

**Requirements:**
- Caller must be contract owner
- Token must be currently supported
- No active stakes for this token

**Events:**
- `StakingTokenRemoved(address indexed token)`

#### `setRewardRate(address token, uint256 newRate)`
Update the reward rate for a staking token.

**Parameters:**
- `token` - Address of the staking token
- `newRate` - New reward rate per second per token

**Requirements:**
- Caller must be contract owner
- Token must be supported

**Events:**
- `RewardRateUpdated(address indexed token, uint256 newRate)`

#### `setRewardToken(address newRewardToken)`
Set the token used for reward distribution.

**Parameters:**
- `newRewardToken` - Address of the new reward token

**Requirements:**
- Caller must be contract owner
- Token must be a valid ERC20

**Events:**
- `RewardTokenUpdated(address indexed newRewardToken)`

#### `fundRewards(uint256 amount)`
Add reward tokens to the contract for distribution.

**Parameters:**
- `amount` - Amount of reward tokens to add

**Requirements:**
- Caller must be contract owner
- Contract must be approved to spend reward tokens

**Events:**
- `RewardsFunded(uint256 amount, uint256 timestamp)`

#### `emergencyWithdraw(address token, address to, uint256 amount)`
Emergency withdrawal of tokens from the contract.

**Parameters:**
- `token` - Address of the token to withdraw
- `to` - Address to send tokens to
- `amount` - Amount of tokens to withdraw

**Requirements:**
- Caller must be contract owner

#### `pause()` and `unpause()`
Emergency pause/unpause functionality.

**Requirements:**
- Caller must be contract owner

### View Functions

#### `isStakingToken(address token)`
Check if a token is supported for staking.

**Returns:**
- `bool` - True if token is supported for staking

#### `getRewardRate(address token)`
Get the current reward rate for a staking token.

**Returns:**
- `uint256` - Reward rate per second per token

#### `getRewardToken()`
Get the address of the reward token.

**Returns:**
- `address` - Reward token address

#### `getTotalStaked(address token)`
Get the total amount staked for a specific token.

**Returns:**
- `uint256` - Total staked amount

#### `getStakingStats()`
Get comprehensive staking statistics.

**Returns:**
- `uint256 totalStakers` - Total number of stakers
- `uint256 totalStaked` - Total amount staked across all tokens
- `uint256 totalRewardsDistributed` - Total rewards distributed
- `uint256 rewardTokenBalance` - Current reward token balance

## Deployment Scripts

### `scripts/stake/create-staking-pools.ts`
Creates staking pools for supported tokens.

**Features:**
- Adds staking tokens (USDT, USDC, DAI, WETH)
- Sets initial reward rates
- Configures reward token (USDC)
- Initializes staking pools

### `scripts/stake/stake-liquidity.ts`
Demonstrates staking tokens in the staking pools.

**Features:**
- Shows complete staking workflow
- Handles token approvals
- Executes staking transactions
- Displays staking information

### `scripts/stake/claim-rewards.ts`
Demonstrates claiming rewards from staking.

**Features:**
- Shows reward calculation
- Executes reward claiming
- Displays reward information
- Handles reward distribution

## Usage Examples

### Basic Staking

```javascript
// Approve tokens for staking
const tokenContract = await ethers.getContractAt("IERC20", tokenAddress);
await tokenContract.approve(stakingAddress, amount);

// Stake tokens
const tx = await stakingContract.stake(tokenAddress, amount);
await tx.wait();

// Check staked balance
const stakedBalance = await stakingContract.getStakedBalance(userAddress, tokenAddress);
```

### Claiming Rewards

```javascript
// Check pending rewards
const pendingRewards = await stakingContract.getPendingRewards(userAddress);

// Claim rewards
const tx = await stakingContract.claimRewards();
await tx.wait();
```

### Admin Pool Management

```javascript
// Add new staking token
const rewardRate = ethers.parseEther("0.0001"); // 0.0001 tokens per second
const tx = await stakingContract.addStakingToken(tokenAddress, rewardRate);
await tx.wait();

// Update reward rate
const newRate = ethers.parseEther("0.0002");
const tx2 = await stakingContract.setRewardRate(tokenAddress, newRate);
await tx2.wait();
```

## Reward Calculation

### How Rewards Work

1. **Reward Rate**: Set per token per second (e.g., 0.0001 USDC per USDT per second)
2. **Accumulation**: Rewards accumulate based on staked amount and time
3. **Distribution**: Rewards are distributed in a different token (e.g., USDC for staking USDT)
4. **Claiming**: Users can claim rewards at any time

### Reward Formula

```
Rewards = StakedAmount × RewardRate × TimeStaked
```

### Example Calculation

- User stakes 1000 USDT
- Reward rate: 0.0001 USDC per USDT per second
- Time staked: 3600 seconds (1 hour)
- Rewards earned: 1000 × 0.0001 × 3600 = 360 USDC

## Security Features

### Access Control
- Owner-only functions for critical operations
- Pausable functionality for emergency situations
- Safe token transfers using OpenZeppelin's SafeERC20

### Reward Protection
- Configurable reward rates
- Owner-controlled reward funding
- Transparent reward calculation

### Emergency Functions
- Emergency pause/unpause
- Emergency token withdrawal
- Reward token management

## Integration with DeFi Ecosystem

The Staking System integrates seamlessly with the broader DeFi ecosystem:

1. **Token Acquisition**: Users can stake tokens purchased through the Buy system
2. **Liquidity Provision**: Staked tokens contribute to ecosystem liquidity
3. **Reward Utilization**: Earned rewards can be used in the Swap system
4. **Cross-chain Transfer**: Staked tokens can be bridged to other networks

## Performance Considerations

### Gas Optimization
- Efficient reward calculation
- Minimal storage updates
- Optimized loops and calculations

### Scalability
- Support for multiple staking tokens
- Configurable reward rates
- Extensible architecture

## Monitoring and Analytics

### Key Metrics
- Total value locked (TVL)
- Reward distribution rate
- Staker participation
- Average staking duration

### Events for Tracking
- `TokensStaked` - Track staking activity
- `TokensUnstaked` - Monitor unstaking
- `RewardsClaimed` - Track reward distribution
- `RewardRateUpdated` - Monitor rate changes

## Troubleshooting

### Common Issues

1. **Insufficient Balance**: Ensure sufficient token balance for staking
2. **Token Not Approved**: Approve contract to spend tokens
3. **Token Not Supported**: Verify token is in supported staking list
4. **Contract Paused**: Check if contract is paused
5. **No Rewards Available**: Verify reward token balance in contract

### Error Messages
- "StakingRewards: insufficient balance"
- "StakingRewards: token not approved"
- "StakingRewards: token not supported"
- "StakingRewards: contract is paused"
- "StakingRewards: no rewards to claim"

## Future Enhancements

### Planned Features
- Locked staking periods
- Tiered reward rates
- Governance token integration
- Auto-compounding rewards
- Staking NFTs

### Potential Improvements
- Flash loan integration
- Cross-chain staking
- Mobile app integration
- Advanced analytics dashboard
- Social staking features 