import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Lazchain contract addresses
const STAKING_TOKEN_ADDRESS = "0x9D81C1a89bE608417B5Bb1C1cF5858594D01E8a3"; // USDT
const REWARD_TOKEN_ADDRESS = "0x677B021cCBA318A93BACB1653fD7bE0882ceE9Fd"; // USDC
const AMM_ADDRESS = "0xE07471cbe06bC3Dd3F74001A2EFBEeA1D60f51f8"; // LiquidityPool
const REWARD_RATE = ethers.parseEther("0.3"); // 0.3 tokens per second

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying StakingRewards contract on Lazchain Testnet");
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

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

  // Save deployment info
  const deploymentInfo = {
    network: "Lazchain Testnet",
    chainId: 133718,
    stakingRewardsAddress: stakingRewardsAddress,
    deployer: deployer.address,
    configuration: {
      stakingToken: STAKING_TOKEN_ADDRESS,
      rewardToken: REWARD_TOKEN_ADDRESS,
      ammAddress: AMM_ADDRESS,
      rewardRate: ethers.formatEther(REWARD_RATE)
    },
    deploymentTime: new Date().toISOString()
  };

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "lazai", "stake");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentDir, `staking-deployment-${Date.now()}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

