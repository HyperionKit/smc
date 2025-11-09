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
  const [deployer] = await ethers.getSigners();
  console.log("Funding staking contract with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Get token contracts
  const usdcToken = await ethers.getContractAt("Token", TOKENS.USDC);
  const stakingContract = await ethers.getContractAt("StakingRewards", STAKING_CONTRACT_ADDRESS);

  console.log("\n📊 Contract Information:");
  console.log("Staking Contract:", STAKING_CONTRACT_ADDRESS);
  console.log("Reward Token (USDC):", await stakingContract.rewardToken());
  console.log("Reward Rate:", ethers.formatEther(await stakingContract.rewardRate()), "tokens/second");

  // Check deployer's USDC balance
  const deployerUsdcBalance = await usdcToken.balanceOf(deployer.address);
  console.log("\n💰 Deployer USDC Balance:", ethers.formatUnits(deployerUsdcBalance, 6));

  // Calculate funding amount (1 day worth of rewards at current rate)
  const rewardRate = await stakingContract.rewardRate();
  const dailyRewards = rewardRate * 86400n; // 24 hours * 60 minutes * 60 seconds
  const fundingAmount = dailyRewards / (10n ** 12n); // Convert from 18 decimals to 6 decimals (USDC)

  console.log("\n📈 Funding Calculation:");
  console.log("Reward Rate:", ethers.formatEther(rewardRate), "tokens/second");
  console.log("Daily Rewards:", ethers.formatUnits(dailyRewards, 6), "USDC/day");
  console.log("Funding Amount:", ethers.formatUnits(fundingAmount, 6), "USDC");

  if (deployerUsdcBalance < fundingAmount) {
    console.log("❌ Insufficient USDC balance to fund the contract");
    console.log("Required:", ethers.formatEther(fundingAmount));
    console.log("Available:", ethers.formatUnits(deployerUsdcBalance, 6));
    return;
  }

  try {
    console.log("\n🚀 Funding staking contract...");
    
    // Transfer USDC to staking contract
    const transferTx = await usdcToken.transfer(STAKING_CONTRACT_ADDRESS, fundingAmount);
    await transferTx.wait();
    
    console.log("✅ Staking contract funded successfully!");
    console.log("Amount transferred:", ethers.formatUnits(fundingAmount, 6), "USDC");

    // Check contract balance
    const contractBalance = await usdcToken.balanceOf(STAKING_CONTRACT_ADDRESS);
    console.log("Contract USDC balance:", ethers.formatUnits(contractBalance, 6));

    // Check deployer's remaining balance
    const remainingBalance = await usdcToken.balanceOf(deployer.address);
    console.log("Deployer remaining USDC:", ethers.formatUnits(remainingBalance, 6));

  } catch (error: any) {
    console.log("❌ Failed to fund contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 