import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Metis Sepolia contract addresses
const STAKING_TOKEN_ADDRESS = "0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898"; // USDT
const REWARD_TOKEN_ADDRESS = "0x16d44fBBc8E1F3FBB6ac0674a44EECfa528604DD"; // USDC
const AMM_ADDRESS = "0x5AC81bC04fc19871E103667ee4b3f0B77b960D7d"; // LiquidityPool
const REWARD_RATE = ethers.parseEther("0.3"); // 0.3 tokens per second

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying StakingRewards contract on Metis Sepolia Testnet");
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
    network: "Metis Sepolia Testnet",
    chainId: 59902,
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

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "metis_testnet", "stake");
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

