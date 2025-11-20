import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TransactionTracker on Mantle Testnet");
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

  // Mantle Testnet contract addresses
  const CONTRACTS = {
    LiquidityPool: "0x93c714601b8bc0C9A9d605CEc99786847654598e",
    BuyVault: "0x1E0B86323fdFFa099AAEeE9B3C8B2f8C6E20fFa5",
    StakingRewards: "0x1a80Db4cf9E26BafCf672c534Ab219630fFE1A5E",
    Bridge: "0xd6629696A52E914433b0924f1f49d42216708276",
    Faucet: "0x0e04CB9E80579aA464Af122457fa2c477c126868"
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
    network: "Mantle Testnet",
    chainId: 5003,
    deployer: deployer.address,
    transactionTracker: trackerAddress,
    contracts: CONTRACTS,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "tracker", "mantle");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentDir, "transaction-tracker-deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);

  console.log("\n🎉 TransactionTracker deployment completed successfully!");
  console.log(`\n🔗 TransactionTracker Address: ${trackerAddress}`);
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

