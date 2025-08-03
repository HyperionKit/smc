import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying StakingRewards contract with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Contract addresses (Hyperion deployment)
  const STAKING_TOKEN_ADDRESS = "0x9b52D326D4866055F6c23297656002992e4293FC"; // USDT
  const REWARD_TOKEN_ADDRESS = "0x31424DB0B7a929283C394b4DA412253Ab6D61682"; // USDC
  const AMM_ADDRESS = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";
  const REWARD_RATE = ethers.parseEther("0.3"); // 0.3 tokens per second

  // Deploy StakingRewards contract
  const StakingRewards = await ethers.getContractFactory("contracts/staking/Staking.sol:StakingRewards");
  const stakingRewards = await StakingRewards.deploy(
    STAKING_TOKEN_ADDRESS,
    REWARD_TOKEN_ADDRESS,
    AMM_ADDRESS,
    REWARD_RATE
  );
  await stakingRewards.waitForDeployment();
  
  const stakingRewardsAddress = await stakingRewards.getAddress();
  
  console.log("\n🎉 StakingRewards deployed successfully!");
  console.log("Contract address:", stakingRewardsAddress);
  console.log("Deployer:", deployer.address);

  console.log("\n📋 Contract Features:");
  console.log("✅ Staking Functions: stake, unstake");
  console.log("✅ Reward Calculation: calculateReward");
  console.log("✅ Admin Functions: setRewardRate, setAMMAddress (owner only)");
  console.log("✅ View Functions: getStakedBalance, getRewardBalance, getPendingReward");

  console.log("\n🔧 Configuration:");
  console.log("- Staking Token: USDT");
  console.log("- Reward Token: USDC");
  console.log("- AMM Address: " + AMM_ADDRESS);
  console.log("- Reward Rate: " + ethers.formatEther(REWARD_RATE) + " tokens/second");
  console.log("- Owner: " + deployer.address);

  console.log("\n📝 Next Steps:");
  console.log("1. Fund contract with reward tokens");
  console.log("2. Test staking functionality");
  console.log("3. Verify contract on explorer");

  console.log("\n💡 Usage Examples:");
  console.log("- Stake: stake(amount)");
  console.log("- Unstake: unstake(amount)");
  console.log("- Check balance: getStakedBalance(user)");
  console.log("- Check rewards: getPendingReward(user)");

  // Save deployment info
  console.log("\n📄 Deployment Info:");
  console.log("Network: Hyperion Testnet");
  console.log("Chain ID: 133717");
  console.log("Explorer: https://hyperion-testnet-explorer.metisdevops.link");
  console.log("Contract: https://hyperion-testnet-explorer.metisdevops.link/address/" + stakingRewardsAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 