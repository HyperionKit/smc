import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TransactionTracker on Lazchain Testnet");
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Deploy TransactionTracker
  console.log("\n🚀 Deploying TransactionTracker...");
  const TransactionTracker = await ethers.getContractFactory("TransactionTracker");
  const transactionTracker = await TransactionTracker.deploy(deployer.address);
  await transactionTracker.waitForDeployment();

  const trackerAddress = await transactionTracker.getAddress();
  console.log("✅ TransactionTracker deployed to:", trackerAddress);

  // Lazchain contract addresses
  const CONTRACTS = {
    LiquidityPool: "0xE07471cbe06bC3Dd3F74001A2EFBEeA1D60f51f8",
    BuyVault: "0x66d12d47034F8D6221586e32bac8bE6819467E07",
    StakingRewards: "0x84d0A880C970A53154D4d6B25E3825046D677603",
    Bridge: "0xf2D33cF11d102F94148c38f943C99408f7C898cf",
    Faucet: "0x04107Dd22f966aB3f9A130798FEc45602476F6a5"
  };

  // Add contracts to tracker
  console.log("\n📊 Adding contracts to tracker...");
  
  for (const [contractName, contractAddress] of Object.entries(CONTRACTS)) {
    if (contractAddress !== "0x0000000000000000000000000000000000000000") {
      try {
        const contractType = getContractType(contractName);
        console.log(`   Adding ${contractName} (${contractType}) at ${contractAddress}...`);
        
        const addTx = await transactionTracker.addContract(contractAddress, contractType);
        await addTx.wait();
        
        console.log(`   ✅ ${contractName} added successfully`);
      } catch (error: any) {
        console.log(`   ❌ Failed to add ${contractName}: ${error.message}`);
      }
    } else {
      console.log(`   ⏳ Skipping ${contractName} (not yet deployed)`);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: "Lazchain Testnet",
    chainId: 133718,
    deployer: deployer.address,
    transactionTracker: trackerAddress,
    contracts: CONTRACTS,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "tracker", "lazai");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentDir, "transaction-tracker-deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);

  console.log("\n🎉 TransactionTracker deployment completed successfully!");
  console.log(`\n🔗 TransactionTracker Address: ${trackerAddress}`);
  console.log("\n📝 Note: Update contract addresses in this script after deploying other contracts, then re-run to add them to the tracker.");
}

function getContractType(contractName: string): string {
  switch (contractName) {
    case "LiquidityPool":
      return "swap";
    case "BuyVault":
      return "buy";
    case "StakingRewards":
      return "stake";
    case "Bridge":
      return "bridge";
    case "Faucet":
      return "faucet";
    default:
      return "unknown";
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

