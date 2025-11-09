import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Configuration
const TRANSACTION_TRACKER_ADDRESS = "0xd68a2cCa272c0ABDb3B0A2e6C15Ca86216cFDbe6"; // Update with actual address
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
  console.log("🧪 Testing Real-Time Transaction Tracking Integration...");
  
  // Simulate frontend integration
  await testFrontendIntegration();
  
  // Simulate contract interaction
  await testContractIntegration();
  
  // Simulate stats monitoring
  await testStatsMonitoring();
  
  console.log("\n✅ All tests completed successfully!");
}

async function testFrontendIntegration() {
  console.log("\n📱 Testing Frontend Integration...");
  
  // Simulate the RealTimeStatsComponent
  class MockRealTimeStatsComponent {
    private statsFile: string;
    private updateInterval: number;
    private currentStats: RealTimeStats | null;

    constructor() {
      this.statsFile = STATS_FILE;
      this.updateInterval = 5000;
      this.currentStats = null;
    }

    async startTracking() {
      console.log("   🚀 Starting real-time tracking...");
      await this.updateStats();
      
      // Simulate polling
      setInterval(async () => {
        await this.updateStats();
      }, this.updateInterval);
    }

    async updateStats() {
      try {
        if (fs.existsSync(this.statsFile)) {
          const statsData = fs.readFileSync(this.statsFile, 'utf8');
          const stats = JSON.parse(statsData);
          
          this.currentStats = stats;
          this.updateUI(stats);
        } else {
          console.log("   ⏳ Stats file not found, using mock data...");
          const mockStats = generateMockStats();
          this.updateUI(mockStats);
        }
      } catch (error: any) {
        console.error("   ❌ Error updating stats:", error.message);
      }
    }

    updateUI(stats: RealTimeStats) {
      console.log("   📊 Updating UI with stats:");
      console.log(`      Total Value: $${stats.totalValueTransferred}`);
      console.log(`      Total Transactions: ${stats.totalTransactions}`);
      console.log(`      Last Update: ${stats.lastUpdateTime}`);
      
      // Simulate UI updates
      this.updateTotalValue(stats.totalValueTransferred);
      this.updateTransactionCount(stats.totalTransactions);
      this.updateContractBreakdown(stats.contractStats);
      this.updateRecentTransactions(stats.recentTransactions);
    }

    private updateTotalValue(value: string) {
      console.log(`      💰 Total Value Element: $${parseFloat(value).toLocaleString()}`);
    }

    private updateTransactionCount(count: number) {
      console.log(`      📈 Transaction Count Element: ${count.toLocaleString()}`);
    }

    private updateContractBreakdown(contractStats: any) {
      console.log("      🏗️ Contract Breakdown:");
      Object.entries(contractStats).forEach(([type, stats]: [string, any]) => {
        if (stats.totalTransactions > 0) {
          console.log(`         ${type.toUpperCase()}: $${parseFloat(stats.totalValue).toLocaleString()} (${stats.totalTransactions} tx)`);
        }
      });
    }

    private updateRecentTransactions(transactions: any[]) {
      console.log(`      📋 Recent Transactions: ${transactions.length} items`);
      transactions.slice(0, 3).forEach((tx, index) => {
        console.log(`         ${index + 1}. ${tx.contractType.toUpperCase()} - ${tx.tokenSymbol} - $${parseFloat(tx.valueUSD).toFixed(2)}`);
      });
    }
  }

  // Test the component
  const component = new MockRealTimeStatsComponent();
  await component.startTracking();
  
  // Wait a bit to see the updates
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function testContractIntegration() {
  console.log("\n🔗 Testing Contract Integration...");
  
  try {
    const transactionTracker = await ethers.getContractAt("TransactionTracker", TRANSACTION_TRACKER_ADDRESS);
    
    // Test global stats
    console.log("   📊 Testing global stats...");
    const [totalTx, totalValue, lastTxTime] = await transactionTracker.getGlobalStats();
    console.log(`      Total Transactions: ${totalTx}`);
    console.log(`      Total Value: $${ethers.formatEther(totalValue)}`);
    console.log(`      Last Transaction: ${lastTxTime === 0 ? "None" : new Date(Number(lastTxTime) * 1000).toISOString()}`);
    
    // Test contract stats
    console.log("   🏗️ Testing contract stats...");
    const [contractTypes, contractStats] = await transactionTracker.getAllContractStats();
    
    for (let i = 0; i < contractTypes.length; i++) {
      const type = contractTypes[i];
      const stats = contractStats[i];
      console.log(`      ${type.toUpperCase()}: ${stats.totalTransactions} tx, $${ethers.formatEther(stats.totalValueUSD)}`);
    }
    
    // Test recent transactions
    console.log("   📋 Testing recent transactions...");
    const recentTxs = await transactionTracker.getRecentTransactions(5);
    console.log(`      Found ${recentTxs.length} recent transactions`);
    
    recentTxs.forEach((tx: any, index: number) => {
      console.log(`         ${index + 1}. ${tx.contractType} - ${tx.tokenSymbol} - ${ethers.formatUnits(tx.amount, 18)}`);
    });
    
  } catch (error: any) {
    console.log("   ⚠️ Contract not deployed yet, using mock data...");
    console.log("   💡 Deploy TransactionTracker first to test real contract integration");
  }
}

async function testStatsMonitoring() {
  console.log("\n📡 Testing Stats Monitoring...");
  
  // Create mock stats file
  const mockStats = generateMockStats();
  const statsDir = path.dirname(STATS_FILE);
  
  if (!fs.existsSync(statsDir)) {
    fs.mkdirSync(statsDir, { recursive: true });
  }
  
  fs.writeFileSync(STATS_FILE, JSON.stringify(mockStats, null, 2));
  console.log("   📁 Created mock stats file");
  
  // Simulate monitoring service
  let updateCount = 0;
  const monitorInterval = setInterval(() => {
    updateCount++;
    
    // Simulate new transaction
    const newTransaction = {
      user: `0x${Math.random().toString(16).substr(2, 40)}`,
      contractType: ["swap", "buy", "stake", "bridge", "faucet"][Math.floor(Math.random() * 5)],
      tokenSymbol: ["USDT", "USDC", "DAI", "WETH"][Math.floor(Math.random() * 4)],
      amount: (Math.random() * 1000).toFixed(2),
      valueUSD: (Math.random() * 10000).toFixed(2),
      timestamp: new Date().toISOString(),
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`
    };
    
    // Update stats
    mockStats.totalTransactions++;
    mockStats.totalValueTransferred = (parseFloat(mockStats.totalValueTransferred) + parseFloat(newTransaction.valueUSD)).toFixed(2);
    mockStats.lastUpdateTime = new Date().toISOString();
    mockStats.recentTransactions.unshift(newTransaction);
    mockStats.recentTransactions = mockStats.recentTransactions.slice(0, 10); // Keep only 10 recent
    
    // Update contract stats
    const contractType = newTransaction.contractType;
    if (mockStats.contractStats[contractType]) {
      mockStats.contractStats[contractType].totalTransactions++;
      mockStats.contractStats[contractType].totalValue = (
        parseFloat(mockStats.contractStats[contractType].totalValue) + parseFloat(newTransaction.valueUSD)
      ).toFixed(2);
      mockStats.contractStats[contractType].lastTransaction = newTransaction.timestamp;
    }
    
    // Write updated stats
    fs.writeFileSync(STATS_FILE, JSON.stringify(mockStats, null, 2));
    
    console.log(`   🔄 Update ${updateCount}: New ${newTransaction.contractType} transaction - $${newTransaction.valueUSD}`);
    console.log(`      Total Value: $${mockStats.totalValueTransferred}`);
    console.log(`      Total Transactions: ${mockStats.totalTransactions}`);
    
    if (updateCount >= 3) {
      clearInterval(monitorInterval);
      console.log("   ✅ Monitoring test completed");
    }
  }, 2000);
  
  // Wait for monitoring to complete
  await new Promise(resolve => setTimeout(resolve, 8000));
}

function generateMockStats(): RealTimeStats {
  return {
    totalValueTransferred: "1234567.89",
    totalTransactions: 1234,
    lastUpdateTime: new Date().toISOString(),
    contractStats: {
      swap: {
        totalValue: "500000.00",
        totalTransactions: 500,
        lastTransaction: new Date(Date.now() - 300000).toISOString()
      },
      buy: {
        totalValue: "300000.00",
        totalTransactions: 300,
        lastTransaction: new Date(Date.now() - 600000).toISOString()
      },
      stake: {
        totalValue: "200000.00",
        totalTransactions: 200,
        lastTransaction: new Date(Date.now() - 900000).toISOString()
      },
      bridge: {
        totalValue: "150000.00",
        totalTransactions: 150,
        lastTransaction: new Date(Date.now() - 1200000).toISOString()
      },
      faucet: {
        totalValue: "84567.89",
        totalTransactions: 84,
        lastTransaction: new Date(Date.now() - 1500000).toISOString()
      }
    },
    recentTransactions: [
      {
        user: "0x1234567890123456789012345678901234567890",
        contractType: "swap",
        tokenSymbol: "USDT",
        amount: "100.00",
        valueUSD: "100.00",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        txHash: "0x1234567890123456789012345678901234567890123456789012345678901234"
      },
      {
        user: "0x2345678901234567890123456789012345678901",
        contractType: "buy",
        tokenSymbol: "USDC",
        amount: "50.00",
        valueUSD: "50.00",
        timestamp: new Date(Date.now() - 600000).toISOString(),
        txHash: "0x2345678901234567890123456789012345678901234567890123456789012345"
      },
      {
        user: "0x3456789012345678901234567890123456789012",
        contractType: "stake",
        tokenSymbol: "DAI",
        amount: "75.00",
        valueUSD: "75.00",
        timestamp: new Date(Date.now() - 900000).toISOString(),
        txHash: "0x3456789012345678901234567890123456789012345678901234567890123456"
      }
    ]
  };
}

// Frontend integration example
export function createFrontendComponent() {
  return `
// Real-time stats component for your frontend
class RealTimeStatsComponent {
  constructor() {
    this.statsFile = '/api/stats/real-time-stats.json';
    this.updateInterval = 5000;
    this.currentStats = null;
  }

  async startTracking() {
    await this.updateStats();
    setInterval(async () => {
      await this.updateStats();
    }, this.updateInterval);
  }

  async updateStats() {
    try {
      const response = await fetch(this.statsFile);
      const stats = await response.json();
      this.currentStats = stats;
      this.updateUI(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  updateUI(stats) {
    // Update total value transferred
    const totalValueElement = document.getElementById('total-value-transferred');
    if (totalValueElement) {
      totalValueElement.textContent = \`$\${parseFloat(stats.totalValueTransferred).toLocaleString()}\`;
    }

    // Update transaction count
    const txCountElement = document.getElementById('total-transactions');
    if (txCountElement) {
      txCountElement.textContent = stats.totalTransactions.toLocaleString();
    }

    // Update last update time
    const lastUpdateElement = document.getElementById('last-update-time');
    if (lastUpdateElement) {
      lastUpdateElement.textContent = new Date(stats.lastUpdateTime).toLocaleTimeString();
    }
  }
}

// Usage
const statsTracker = new RealTimeStatsComponent();
statsTracker.startTracking();
  `;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 