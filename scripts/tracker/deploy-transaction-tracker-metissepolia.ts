import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TransactionTracker on Metis Sepolia Testnet");
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

  // Metis Sepolia contract addresses
  const CONTRACTS = {
    LiquidityPool: "0x5AC81bC04fc19871E103667ee4b3f0B77b960D7d",
    BuyVault: "0xf3d5C21e02943539364A3A4dd2Cba88408024A5f",
    StakingRewards: "0xCfaf530E5c6568D3953DfFcB2363Ae4F77332afa",
    Bridge: "0x1AC16E6C537438c82A61A106B876Ef69C7e247d2",
    Faucet: "0x50888Ced4d0BCcB1CD7494245716Ac005A42a8D9"
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
    network: "Metis Sepolia Testnet",
    chainId: 59902,
    deployer: deployer.address,
    transactionTracker: trackerAddress,
    contracts: CONTRACTS,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "tracker", "metis_testnet");
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

