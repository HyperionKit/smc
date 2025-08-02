import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

const AMM_ADDRESS = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

// Example: Stake USDT-USDC liquidity
const TOKEN_A = "USDT";
const TOKEN_B = "USDC";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("Staking liquidity with account:", user.address);

  const balance = await ethers.provider.getBalance(user.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Get LiquidityPool contract
  const amm = await ethers.getContractAt("LiquidityPool", AMM_ADDRESS) as any;
  console.log("LiquidityPool address:", AMM_ADDRESS);

  const tokenAAddress = TOKENS[TOKEN_A as keyof typeof TOKENS];
  const tokenBAddress = TOKENS[TOKEN_B as keyof typeof TOKENS];

  console.log(`\n📊 Staking ${TOKEN_A}-${TOKEN_B} liquidity...`);

  try {
    // Check if staking pool exists
    const poolInfo = await amm.getStakingPoolInfo(tokenAAddress, tokenBAddress);
    if (!poolInfo.exists) {
      console.log(`❌ Staking pool does not exist for ${TOKEN_A}-${TOKEN_B}`);
      return;
    }

    console.log(`✅ Staking pool found:`);
    console.log(`   Reward Token: ${poolInfo.rewardToken}`);
    console.log(`   Total Staked: ${ethers.formatEther(poolInfo.totalStaked)}`);
    console.log(`   Reward Rate: ${ethers.formatEther(poolInfo.rewardRate)} tokens/second`);

    // Check user's liquidity position
    const userLiquidity = await amm.getUserLiquidity(tokenAAddress, tokenBAddress, user.address);
    console.log(`\n💰 Your liquidity: ${ethers.formatEther(userLiquidity)}`);

    if (userLiquidity === 0n) {
      console.log(`❌ You don't have any liquidity in the ${TOKEN_A}-${TOKEN_B} pair`);
      console.log(`   Add liquidity first using the addLiquidity function`);
      return;
    }

    // Check if already staked
    const stakingInfo = await amm.getUserStakingInfo(tokenAAddress, tokenBAddress, user.address);
    if (stakingInfo.isStaked) {
      console.log(`❌ You have already staked your liquidity`);
      console.log(`   Staked Amount: ${ethers.formatEther(stakingInfo.stakedAmount)}`);
      console.log(`   Pending Rewards: ${ethers.formatEther(stakingInfo.pendingRewards)}`);
      return;
    }

    // Check minimum stake amount
    const minStakeAmount = await amm.MIN_STAKE_AMOUNT();
    if (userLiquidity < minStakeAmount) {
      console.log(`❌ Insufficient liquidity to stake`);
      console.log(`   Required: ${ethers.formatEther(minStakeAmount)}`);
      console.log(`   Available: ${ethers.formatEther(userLiquidity)}`);
      return;
    }

    console.log(`\n🚀 Staking your liquidity...`);
    
    // Stake liquidity
    const tx = await amm.stakeLiquidity(tokenAAddress, tokenBAddress);
    console.log(`🔗 Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Liquidity staked successfully!`);
    console.log(`   Gas used: ${receipt?.gasUsed?.toString()}`);

    // Get updated staking info
    const newStakingInfo = await amm.getUserStakingInfo(tokenAAddress, tokenBAddress, user.address);
    console.log(`\n📊 Updated staking info:`);
    console.log(`   Staked Amount: ${ethers.formatEther(newStakingInfo.stakedAmount)}`);
    console.log(`   Is Staked: ${newStakingInfo.isStaked}`);
    console.log(`   Pending Rewards: ${ethers.formatEther(newStakingInfo.pendingRewards)}`);

  } catch (error: any) {
    console.log(`❌ Failed to stake liquidity: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 