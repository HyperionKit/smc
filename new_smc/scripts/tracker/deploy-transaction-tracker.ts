import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TransactionTracker with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Deploy TransactionTracker
  console.log("\n🚀 Deploying TransactionTracker...");
  const TransactionTracker = await ethers.getContractFactory("TransactionTracker");
  const transactionTracker = await TransactionTracker.deploy(deployer.address);
  await transactionTracker.waitForDeployment();

  const trackerAddress = await transactionTracker.getAddress();
  console.log("✅ TransactionTracker deployed to:", trackerAddress);

  // Contract addresses (Hyperion deployment)
  const CONTRACTS = {
    // Swap contracts
    "LiquidityPool": "0x91C39DAA7617C5188d0427Fc82e4006803772B74", // Update with actual address
    
    // Buy contract
    "BuyVault": "0x0adFd197aAbbC194e8790041290Be57F18d576a3",
    
    // Staking contract
    "StakingRewards": "0xB94d264074571A5099C458f74b526d1e4EE0314B",
    
    // Bridge contract
    "Bridge": "0xfF064Fd496256e84b68dAE2509eDA84a3c235550", // Update with actual address
    
    // Faucet contract
    "Faucet": "0xE1B8C7168B0c48157A5e4B80649C5a1b83bF4cC4"
  };

  // Add contracts to tracker
  console.log("\n📊 Adding contracts to tracker...");
  
  for (const [contractName, contractAddress] of Object.entries(CONTRACTS)) {
    if (contractAddress !== "0x1234567890123456789012345678901234567890") { // Skip placeholder addresses
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
      console.log(`   ⏳ Skipping ${contractName} (placeholder address)`);
    }
  }

  // Get initial stats
  console.log("\n📈 Initial Statistics:");
  const [totalTx, totalValue, lastTxTime] = await transactionTracker.getGlobalStats();
  console.log(`   Total Transactions: ${totalTx}`);
  console.log(`   Total Value Transferred: $${ethers.formatEther(totalValue)}`);
  console.log(`   Last Transaction Time: ${lastTxTime === 0 ? "None" : new Date(Number(lastTxTime) * 1000).toISOString()}`);

  // Get contract stats
  console.log("\n🏗️ Contract Statistics:");
  const [contractTypes, contractStats] = await transactionTracker.getAllContractStats();
  
  for (let i = 0; i < contractTypes.length; i++) {
    const type = contractTypes[i];
    const stats = contractStats[i];
    console.log(`   ${type.toUpperCase()}:`);
    console.log(`     Total Transactions: ${stats.totalTransactions}`);
    console.log(`     Total Value: $${ethers.formatEther(stats.totalValueUSD)}`);
    console.log(`     Last Transaction: ${stats.lastTransactionTime === 0 ? "None" : new Date(Number(stats.lastTransactionTime) * 1000).toISOString()}`);
    console.log(`     Active: ${stats.isActive ? "✅ Yes" : "❌ No"}`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: "metis-hyperion-testnet",
    deployer: deployer.address,
    transactionTracker: trackerAddress,
    contracts: CONTRACTS,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  const deploymentPath = path.join(__dirname, "..", "..", "dpsmc", "tracker", "hyperion");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const deploymentFile = path.join(deploymentPath, "TRANSACTION_TRACKER_DEPLOYMENT.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Create deployment report
  const reportContent = `# Transaction Tracker Deployment Report - Hyperion

## Deployment Information
- **Network**: Metis Hyperion Testnet
- **Deployer**: ${deployer.address}
- **Transaction Tracker**: ${trackerAddress}
- **Deployment Time**: ${new Date().toISOString()}
- **Block Number**: ${await ethers.provider.getBlockNumber()}

## Tracked Contracts
${Object.entries(CONTRACTS).map(([name, addr]) => `- **${name}**: ${addr} (${getContractType(name)})`).join('\n')}

## Initial Statistics
- **Total Transactions**: ${totalTx}
- **Total Value Transferred**: $${ethers.formatEther(totalValue)}
- **Last Transaction**: ${lastTxTime === 0 ? "None" : new Date(Number(lastTxTime) * 1000).toISOString()}

## Contract Statistics
${contractTypes.map((type, i) => {
  const stats = contractStats[i];
  return `### ${type.toUpperCase()}
- **Total Transactions**: ${stats.totalTransactions}
- **Total Value**: $${ethers.formatEther(stats.totalValueUSD)}
- **Last Transaction**: ${stats.lastTransactionTime === 0 ? "None" : new Date(Number(stats.lastTransactionTime) * 1000).toISOString()}
- **Active**: ${stats.isActive ? "Yes" : "No"}`
}).join('\n\n')}

## Usage
The TransactionTracker contract tracks all transactions across the DeFi ecosystem and provides real-time statistics for the frontend.

### Key Functions
- \`recordTransaction()\`: Called by tracked contracts to record transactions
- \`getGlobalStats()\`: Get total transactions and value transferred
- \`getContractStats()\`: Get statistics for specific contract types
- \`getRecentTransactions()\`: Get recent transaction history
- \`getUserTransactions()\`: Get user-specific transaction history

## Integration
To integrate with frontend:
1. Call \`getGlobalStats()\` to get total value transferred
2. Listen to \`TransactionRecorded\` events for real-time updates
3. Use \`getRecentTransactions()\` to display transaction history
4. Call \`getContractStats()\` for contract-specific statistics

## Status: ✅ DEPLOYED AND CONFIGURED
`;

  const reportFile = path.join(deploymentPath, "TRANSACTION_TRACKER_DEPLOYMENT_REPORT.md");
  fs.writeFileSync(reportFile, reportContent);

  console.log(`📄 Deployment report saved to: ${reportFile}`);
  console.log("\n🎉 TransactionTracker deployment completed successfully!");
  console.log(`\n🔗 TransactionTracker Address: ${trackerAddress}`);
  console.log("📊 Ready to track transactions across all DeFi contracts!");
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