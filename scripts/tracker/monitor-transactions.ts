import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Configuration
const TRANSACTION_TRACKER_ADDRESS = "0xd68a2cCa272c0ABDb3B0A2e6C15Ca86216cFDbe6"; // Update with actual address
const UPDATE_INTERVAL = 5000; // 5 seconds
const STATS_FILE = path.join(__dirname, "..", "..", "dpsmc", "tracker", "hyperion", "real-time-stats.json");

interface RealTimeStats {
  totalValueTransferred: string;
  totalTransactions: number;
  lastUpdateTime: string;
  contractStats: {
    [key: string]: {
      totalValue: string;
      totalTransactions: number;
      lastTransaction: string;
    };
  };
  recentTransactions: Array<{
    user: string;
    contractType: string;
    tokenSymbol: string;
    amount: string;
    valueUSD: string;
    timestamp: string;
    txHash: string;
  }>;
}

async function main() {
  console.log("🚀 Starting Real-Time Transaction Monitor...");
  console.log("📊 TransactionTracker Address:", TRANSACTION_TRACKER_ADDRESS);
  console.log("⏱️ Update Interval:", UPDATE_INTERVAL, "ms");

  const transactionTracker = await ethers.getContractAt("TransactionTracker", TRANSACTION_TRACKER_ADDRESS);
  
  // Initialize stats file
  const initialStats: RealTimeStats = {
    totalValueTransferred: "0",
    totalTransactions: 0,
    lastUpdateTime: new Date().toISOString(),
    contractStats: {
      swap: { totalValue: "0", totalTransactions: 0, lastTransaction: "" },
      buy: { totalValue: "0", totalTransactions: 0, lastTransaction: "" },
      stake: { totalValue: "0", totalTransactions: 0, lastTransaction: "" },
      bridge: { totalValue: "0", totalTransactions: 0, lastTransaction: "" },
      faucet: { totalValue: "0", totalTransactions: 0, lastTransaction: "" }
    },
    recentTransactions: []
  };

  // Create directory if it doesn't exist
  const statsDir = path.dirname(STATS_FILE);
  if (!fs.existsSync(statsDir)) {
    fs.mkdirSync(statsDir, { recursive: true });
  }

  // Write initial stats
  fs.writeFileSync(STATS_FILE, JSON.stringify(initialStats, null, 2));

  console.log("📁 Stats file initialized:", STATS_FILE);

  // Set up event listener for new transactions
  transactionTracker.on("TransactionRecorded", async (
    user: string,
    contractAddress: string,
    contractType: string,
    tokenAddress: string,
    tokenSymbol: string,
    amount: bigint,
    valueInUSD: bigint,
    timestamp: bigint,
    txHash: string
  ) => {
    console.log(`\n🆕 New Transaction Recorded!`);
    console.log(`   User: ${user}`);
    console.log(`   Contract: ${contractType} (${contractAddress})`);
    console.log(`   Token: ${tokenSymbol} (${tokenAddress})`);
    console.log(`   Amount: ${ethers.formatUnits(amount, 18)} ${tokenSymbol}`);
    console.log(`   Value: $${ethers.formatEther(valueInUSD)}`);
    console.log(`   Time: ${new Date(Number(timestamp) * 1000).toISOString()}`);
    console.log(`   TX Hash: ${txHash}`);

    // Update stats immediately
    await updateStats();
  });

  // Periodic stats update
  setInterval(async () => {
    await updateStats();
  }, UPDATE_INTERVAL);

  console.log("✅ Monitor started successfully!");
  console.log("📡 Listening for new transactions...");
  console.log("🔄 Updating stats every", UPDATE_INTERVAL, "ms");
  console.log("💡 Press Ctrl+C to stop monitoring");

  // Keep the script running
  process.on('SIGINT', () => {
    console.log("\n🛑 Stopping monitor...");
    process.exit(0);
  });
}

async function updateStats() {
  try {
    const transactionTracker = await ethers.getContractAt("TransactionTracker", TRANSACTION_TRACKER_ADDRESS);
    
    // Get global stats
    const [totalTx, totalValue, lastTxTime] = await transactionTracker.getGlobalStats();
    
    // Get contract stats
    const [contractTypes, contractStats] = await transactionTracker.getAllContractStats();
    
    // Get recent transactions
    const recentTxs = await transactionTracker.getRecentTransactions(10);
    
    // Build stats object
    const stats: RealTimeStats = {
      totalValueTransferred: ethers.formatEther(totalValue),
      totalTransactions: Number(totalTx),
      lastUpdateTime: new Date().toISOString(),
      contractStats: {},
      recentTransactions: []
    };

    // Process contract stats
    for (let i = 0; i < contractTypes.length; i++) {
      const type = contractTypes[i];
      const contractStat = contractStats[i];
      
      stats.contractStats[type] = {
        totalValue: ethers.formatEther(contractStat.totalValueUSD),
        totalTransactions: Number(contractStat.totalTransactions),
        lastTransaction: contractStat.lastTransactionTime === 0 
          ? "" 
          : new Date(Number(contractStat.lastTransactionTime) * 1000).toISOString()
      };
    }

    // Process recent transactions
    for (const tx of recentTxs) {
      stats.recentTransactions.push({
        user: tx.user,
        contractType: tx.contractType,
        tokenSymbol: tx.tokenSymbol,
        amount: ethers.formatUnits(tx.amount, 18),
        valueUSD: ethers.formatEther(tx.valueInUSD),
        timestamp: new Date(Number(tx.timestamp) * 1000).toISOString(),
        txHash: tx.txHash
      });
    }

    // Write to file
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));

    // Log current stats
    console.log(`\n📊 Current Stats (${new Date().toISOString()}):`);
    console.log(`   Total Value: $${stats.totalValueTransferred}`);
    console.log(`   Total Transactions: ${stats.totalTransactions}`);
    console.log(`   Recent Transactions: ${stats.recentTransactions.length}`);
    
    // Log contract breakdown
    for (const [type, stat] of Object.entries(stats.contractStats)) {
      if (Number(stat.totalTransactions) > 0) {
        console.log(`   ${type.toUpperCase()}: $${stat.totalValue} (${stat.totalTransactions} tx)`);
      }
    }

  } catch (error: any) {
    console.error("❌ Error updating stats:", error.message);
  }
}

// Function to get current stats (for frontend integration)
export async function getCurrentStats(): Promise<RealTimeStats> {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const statsData = fs.readFileSync(STATS_FILE, 'utf8');
      return JSON.parse(statsData);
    }
  } catch (error) {
    console.error("Error reading stats file:", error);
  }
  
  return {
    totalValueTransferred: "0",
    totalTransactions: 0,
    lastUpdateTime: new Date().toISOString(),
    contractStats: {
      swap: { totalValue: "0", totalTransactions: 0, lastTransaction: "" },
      buy: { totalValue: "0", totalTransactions: 0, lastTransaction: "" },
      stake: { totalValue: "0", totalTransactions: 0, lastTransaction: "" },
      bridge: { totalValue: "0", totalTransactions: 0, lastTransaction: "" },
      faucet: { totalValue: "0", totalTransactions: 0, lastTransaction: "" }
    },
    recentTransactions: []
  };
}

// Function to start monitoring (for programmatic use)
export async function startMonitoring(trackerAddress: string) {
  const originalAddress = TRANSACTION_TRACKER_ADDRESS;
  (global as any).TRANSACTION_TRACKER_ADDRESS = trackerAddress;
  
  try {
    await main();
  } finally {
    (global as any).TRANSACTION_TRACKER_ADDRESS = originalAddress;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      // Keep running
    })
    .catch((error) => {
      console.error("❌ Monitor error:", error);
      process.exit(1);
    });
} 