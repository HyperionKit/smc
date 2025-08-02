=== Step 1: Deploying USDT Token ===
✅ USDT deployed to: 0xb90eF6506DCd8af84a32DF4E7F267A47b84B7015

=== Step 2: Deploying USDC Token ===
✅ USDC deployed to: 0xC15391811bf4451729f5DDa579eEC03cc8A3564A

=== Step 3: Deploying SimpleAMM ===
✅ SimpleAMM deployed to: 0x14268a3af7E8527E6e2ec76B76b8E09538754214

=== Step 4: Deploying StakingRewards ===
✅ StakingRewards deployed to: 0x85230a4e1dcecD302F4d5afeFC7772A90ebaD82B

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
  Token A: 0xb90eF6506DCd8af84a32DF4E7F267A47b84B7015
  Token B: 0xC15391811bf4451729f5DDa579eEC03cc8A3564A
  Reserve A: 1000000.0
  Reserve B: 1000000.0
  Total Supply: 1000000000000

USDT Staking Pool:
  Staking Token: 0xb90eF6506DCd8af84a32DF4E7F267A47b84B7015
  Reward Token: 0xC15391811bf4451729f5DDa579eEC03cc8A3564A
  Total Staked: 0.0
  Reward Rate: 0.192901 per second

USDC Staking Pool:
  Staking Token: 0xC15391811bf4451729f5DDa579eEC03cc8A3564A
  Reward Token: 0xb90eF6506DCd8af84a32DF4E7F267A47b84B7015
  Total Staked: 0.0
  Reward Rate: 0.192901 per second

=== Deployment Summary ===
{
  "network": "lazchain",
  "deployer": "0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff",
  "contracts": {
    "USDT": {
      "address": "0xb90eF6506DCd8af84a32DF4E7F267A47b84B7015",
      "name": "Tether USD",
      "symbol": "USDT",
      "decimals": 6,
      "totalSupply": "40000000"
    },
    "USDC": {
      "address": "0xC15391811bf4451729f5DDa579eEC03cc8A3564A",
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "totalSupply": "40000000"
    },
    "SimpleAMM": "0x14268a3af7E8527E6e2ec76B76b8E09538754214",
    "StakingRewards": "0x85230a4e1dcecD302F4d5afeFC7772A90ebaD82B"
  },
  "setup": {
    "initialLiquidity": "1000000",
    "stakingRewardAmount": "500000",
    "swapFee": "0.3%"
  },
  "timestamp": "2025-08-02T08:52:57.219Z"
}