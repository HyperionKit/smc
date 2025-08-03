import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

const STAKING_CONTRACT_ADDRESS = "0xB94d264074571A5099C458f74b526d1e4EE0314B";
const AMM_ADDRESS = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

// Example: Stake USDT-USDC liquidity
const TOKEN_A = "USDT";
const TOKEN_B = "USDC";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("Staking USDT with account:", user.address);

  const balance = await ethers.provider.getBalance(user.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Get StakingRewards contract
  const stakingContract = await ethers.getContractAt("StakingRewards", STAKING_CONTRACT_ADDRESS);
  console.log("Staking contract address:", STAKING_CONTRACT_ADDRESS);

  // Get token contracts
  const usdtToken = await ethers.getContractAt("SimpleERC20", TOKENS.USDT);
  const usdcToken = await ethers.getContractAt("SimpleERC20", TOKENS.USDC);

  console.log(`\n📊 Staking USDT for USDC rewards...`);

  try {
    // Check contract info
    console.log(`✅ Staking contract info:`);
    console.log(`   Staking Token: ${await stakingContract.stakingToken()}`);
    console.log(`   Reward Token: ${await stakingContract.rewardToken()}`);
    console.log(`   Reward Rate: ${ethers.formatEther(await stakingContract.rewardRate())} tokens/second`);
    console.log(`   Total Staked: ${ethers.formatEther(await stakingContract.totalStaked())}`);

    // Check user's USDT balance
    const userUsdtBalance = await usdtToken.balanceOf(user.address);
    console.log(`\n💰 Your USDT balance: ${ethers.formatUnits(userUsdtBalance, 6)}`);

    if (userUsdtBalance === 0n) {
      console.log(`❌ You don't have any USDT to stake`);
      return;
    }

    // Check if already staked
    const stakedBalance = await stakingContract.getStakedBalance(user.address);
    if (stakedBalance > 0n) {
      console.log(`❌ You have already staked USDT`);
      console.log(`   Staked Amount: ${ethers.formatUnits(stakedBalance, 6)} USDT`);
      console.log(`   Pending Rewards: ${ethers.formatUnits(await stakingContract.getPendingReward(user.address), 6)} USDC`);
      return;
    }

    // Calculate stake amount (50% of user's USDT balance)
    const stakeAmount = userUsdtBalance / 2n;
    console.log(`\n🚀 Staking ${ethers.formatUnits(stakeAmount, 6)} USDT...`);
    
    // Approve USDT for staking contract
    const allowance = await usdtToken.allowance(user.address, STAKING_CONTRACT_ADDRESS);
    if (allowance < stakeAmount) {
      console.log("Approving USDT for staking contract...");
      const approveTx = await usdtToken.approve(STAKING_CONTRACT_ADDRESS, ethers.MaxUint256);
      await approveTx.wait();
      console.log("✅ USDT approved");
    }

    // Stake USDT
    const tx = await stakingContract.stake(stakeAmount);
    console.log(`🔗 Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ USDT staked successfully!`);
    console.log(`   Gas used: ${receipt?.gasUsed?.toString()}`);

    // Get updated staking info
    const newStakedBalance = await stakingContract.getStakedBalance(user.address);
    const pendingReward = await stakingContract.getPendingReward(user.address);
    console.log(`\n📊 Updated staking info:`);
    console.log(`   Staked Amount: ${ethers.formatUnits(newStakedBalance, 6)} USDT`);
    console.log(`   Pending Rewards: ${ethers.formatUnits(pendingReward, 6)} USDC`);

  } catch (error: any) {
    console.log(`❌ Failed to stake USDT: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 