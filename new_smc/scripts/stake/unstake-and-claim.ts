import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

const STAKING_CONTRACT_ADDRESS = "0xB94d264074571A5099C458f74b526d1e4EE0314B";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("Unstaking USDT and claiming rewards with account:", user.address);

  const balance = await ethers.provider.getBalance(user.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Get StakingRewards contract
  const stakingContract = await ethers.getContractAt("StakingRewards", STAKING_CONTRACT_ADDRESS);
  console.log("Staking contract address:", STAKING_CONTRACT_ADDRESS);

  // Get token contracts
  const usdtToken = await ethers.getContractAt("SimpleERC20", TOKENS.USDT);
  const usdcToken = await ethers.getContractAt("SimpleERC20", TOKENS.USDC);

  console.log(`\n📊 Current staking status...`);

  try {
    // Check current staking info
    const stakedBalance = await stakingContract.getStakedBalance(user.address);
    const pendingReward = await stakingContract.getPendingReward(user.address);
    const totalStaked = await stakingContract.totalStaked();
    
    console.log(`✅ Current staking info:`);
    console.log(`   Your Staked: ${ethers.formatUnits(stakedBalance, 6)} USDT`);
    console.log(`   Total Staked: ${ethers.formatEther(totalStaked)} USDT`);
    console.log(`   Pending Rewards: ${ethers.formatUnits(pendingReward, 6)} USDC`);

    if (stakedBalance === 0n) {
      console.log(`❌ You don't have any USDT staked`);
      return;
    }

    // Check user's current token balances
    const userUsdtBalance = await usdtToken.balanceOf(user.address);
    const userUsdcBalance = await usdcToken.balanceOf(user.address);
    
    console.log(`\n💰 Current token balances:`);
    console.log(`   USDT Balance: ${ethers.formatUnits(userUsdtBalance, 6)}`);
    console.log(`   USDC Balance: ${ethers.formatUnits(userUsdcBalance, 6)}`);

    // Unstake all USDT and claim rewards
    console.log(`\n🚀 Unstaking ${ethers.formatUnits(stakedBalance, 6)} USDT and claiming rewards...`);
    
    const tx = await stakingContract.unstake(stakedBalance);
    console.log(`🔗 Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Unstaking successful!`);
    console.log(`   Gas used: ${receipt?.gasUsed?.toString()}`);

    // Check updated balances
    const newUserUsdtBalance = await usdtToken.balanceOf(user.address);
    const newUserUsdcBalance = await usdcToken.balanceOf(user.address);
    const newStakedBalance = await stakingContract.getStakedBalance(user.address);
    
    console.log(`\n📊 Updated balances:`);
    console.log(`   USDT Balance: ${ethers.formatUnits(newUserUsdtBalance, 6)} (+${ethers.formatUnits(newUserUsdtBalance - userUsdtBalance, 6)})`);
    console.log(`   USDC Balance: ${ethers.formatUnits(newUserUsdcBalance, 6)} (+${ethers.formatUnits(newUserUsdcBalance - userUsdcBalance, 6)})`);
    console.log(`   Staked Balance: ${ethers.formatUnits(newStakedBalance, 6)} USDT`);

    // Calculate rewards earned
    const usdcEarned = newUserUsdcBalance - userUsdcBalance;
    const usdtReturned = newUserUsdtBalance - userUsdtBalance;
    
    console.log(`\n🎉 Summary:`);
    console.log(`   USDT Returned: ${ethers.formatUnits(usdtReturned, 6)} USDT`);
    console.log(`   USDC Earned: ${ethers.formatUnits(usdcEarned, 6)} USDC`);
    console.log(`   Total Value Earned: ~${ethers.formatUnits(usdcEarned, 6)} USDC (rewards)`);

  } catch (error: any) {
    console.log(`❌ Failed to unstake: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 