import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

const AMM_ADDRESS = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

// Example: Claim rewards from USDT-USDC staking
const TOKEN_A = "USDT";
const TOKEN_B = "USDC";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("Claiming rewards with account:", user.address);

  const balance = await ethers.provider.getBalance(user.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Get LiquidityPool contract
  const amm = await ethers.getContractAt("LiquidityPool", AMM_ADDRESS) as any;
  console.log("LiquidityPool address:", AMM_ADDRESS);

  const tokenAAddress = TOKENS[TOKEN_A as keyof typeof TOKENS];
  const tokenBAddress = TOKENS[TOKEN_B as keyof typeof TOKENS];

  console.log(`\n📊 Checking ${TOKEN_A}-${TOKEN_B} staking rewards...`);

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

    // Get user's staking info
    const stakingInfo = await amm.getUserStakingInfo(tokenAAddress, tokenBAddress, user.address);
    console.log(`\n💰 Your staking info:`);
    console.log(`   Staked Amount: ${ethers.formatEther(stakingInfo.stakedAmount)}`);
    console.log(`   Is Staked: ${stakingInfo.isStaked}`);
    console.log(`   Pending Rewards: ${ethers.formatEther(stakingInfo.pendingRewards)}`);

    if (!stakingInfo.isStaked) {
      console.log(`❌ You don't have any staked liquidity in the ${TOKEN_A}-${TOKEN_B} pair`);
      return;
    }

    if (stakingInfo.pendingRewards === 0n) {
      console.log(`❌ No pending rewards to claim`);
      console.log(`   You need to wait longer to accumulate rewards`);
      return;
    }

    // Get reward token info
    const rewardToken = await ethers.getContractAt("SimpleERC20", poolInfo.rewardToken);
    const rewardTokenSymbol = await rewardToken.symbol();
    const rewardTokenDecimals = await rewardToken.decimals();

    console.log(`\n🎁 Claiming ${ethers.formatUnits(stakingInfo.pendingRewards, rewardTokenDecimals)} ${rewardTokenSymbol}...`);
    
    // Claim rewards
    const tx = await amm.claimRewards(tokenAAddress, tokenBAddress);
    console.log(`🔗 Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Rewards claimed successfully!`);
    console.log(`   Gas used: ${receipt?.gasUsed?.toString()}`);

    // Get updated staking info
    const newStakingInfo = await amm.getUserStakingInfo(tokenAAddress, tokenBAddress, user.address);
    console.log(`\n📊 Updated staking info:`);
    console.log(`   Staked Amount: ${ethers.formatEther(newStakingInfo.stakedAmount)}`);
    console.log(`   Is Staked: ${newStakingInfo.isStaked}`);
    console.log(`   Pending Rewards: ${ethers.formatEther(newStakingInfo.pendingRewards)}`);

    // Check user's reward token balance
    const rewardBalance = await rewardToken.balanceOf(user.address);
    console.log(`\n💰 Your ${rewardTokenSymbol} balance: ${ethers.formatUnits(rewardBalance, rewardTokenDecimals)}`);

  } catch (error: any) {
    console.log(`❌ Failed to claim rewards: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 