=== Step 1: Deploying USDT Token ===
✅ USDT deployed to: 0x78CA53B2ec805A8d4181B6200207776AA310D2E3

=== Step 2: Deploying USDC Token ===
✅ USDC deployed to: 0xB8FB510cE79CD2D99a4470D0a15255180c899D7E

=== Step 3: Deploying SimpleAMM ===
✅ SimpleAMM deployed to: 0xB9feD4C71B3f220ef33F0EC59F9b3d035c05e88A

=== Step 4: Deploying StakingRewards ===
✅ StakingRewards deployed to: 0x9c214C481FFB26FAD892F59F6138c4Fe310A850E

=== Step 5: Setting up Liquidity Pool ===
Approving USDT for AMM...
Approving USDC for AMM...
Creating USDT/USDC liquidity pool...
✅ Liquidity pool created successfully!

=== Step 6: Setting up Staking Pools ===
Approving USDT for staking rewards...
Approving USDC for staking rewards...
Creating USDT staking pool (stake USDT, earn USDC)...
Creating USDC staking pool (stake USDC, earn USDT)...
✅ Staking pools created successfully!

=== Step 7: Verification ===
USDT Details:
  Name: Tether USD
  Symbol: USDT
  Decimals: 6n
  Total Supply: 40000000.0 USDT
  Owner: 0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff

USDC Details:
  Name: USD Coin
  Symbol: USDC
  Decimals: 6n
  Total Supply: 40000000.0 USDC
  Owner: 0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff

Liquidity Pool Details:
  Token A: 0x78CA53B2ec805A8d4181B6200207776AA310D2E3
  Token B: 0xB8FB510cE79CD2D99a4470D0a15255180c899D7E
  Reserve A: 1000000.0
  Reserve B: 1000000.0
  Total Supply: 1000000000000

USDT Staking Pool:
  Staking Token: 0x78CA53B2ec805A8d4181B6200207776AA310D2E3
  Reward Token: 0xB8FB510cE79CD2D99a4470D0a15255180c899D7E
  Total Staked: 0.0
  Reward Rate: 0.192901 per second

USDC Staking Pool:
  Staking Token: 0xB8FB510cE79CD2D99a4470D0a15255180c899D7E
  Reward Token: 0x78CA53B2ec805A8d4181B6200207776AA310D2E3
  Total Staked: 0.0
  Reward Rate: 0.192901 per second

=== Deployment Summary ===
{
  "network": "metisSepolia",
  "deployer": "0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff",
  "contracts": {
    "USDT": {
      "address": "0x78CA53B2ec805A8d4181B6200207776AA310D2E3",
      "name": "Tether USD",
      "symbol": "USDT",
      "decimals": 6,
      "totalSupply": "40000000"
    },
    "USDC": {
      "address": "0xB8FB510cE79CD2D99a4470D0a15255180c899D7E",
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "totalSupply": "40000000"
    },
    "SimpleAMM": "0xB9feD4C71B3f220ef33F0EC59F9b3d035c05e88A",
    "StakingRewards": "0x9c214C481FFB26FAD892F59F6138c4Fe310A850E"
  },
  "setup": {
    "initialLiquidity": "1000000",
    "stakingRewardAmount": "500000",
    "swapFee": "0.3%"
  },
  "timestamp": "2025-08-02T08:55:24.855Z"
}