# Real-Time Transaction Tracking Frontend Integration Guide

## 🎯 **Overview**

This guide shows you how to integrate the TransactionTracker contract into your frontend to display **real-time total value transferred** across all your DeFi contracts.

## 📊 **What You'll Get**

- **Real-time Total Value**: Live display of total value transferred via Hyperkit Contracts
- **Transaction Counts**: Real-time transaction counts by contract type
- **Recent Activity**: Live transaction history
- **Auto-updating**: Data updates every 5 seconds automatically

## 🚀 **Quick Start Integration**

### 1. **Install Dependencies**

```bash
npm install ethers@6.15.0
# or
yarn add ethers@6.15.0
```

### 2. **Create TransactionTracker Service**

```typescript
// services/TransactionTrackerService.ts
import { ethers } from 'ethers';

export class TransactionTrackerService {
  private contract: ethers.Contract;
  private provider: ethers.Provider;

  // Contract addresses
  private static readonly TRANSACTION_TRACKER_ADDRESS = "0xB2c2cbe757c3Ded19BC19A75804eeB7D6CC9704b";
  private static readonly NETWORK_RPC = "https://hyperion-rpc.metisdevops.link";

  constructor() {
    this.provider = new ethers.JsonRpcProvider(TransactionTrackerService.NETWORK_RPC);
    this.contract = new ethers.Contract(
      TransactionTrackerService.TRANSACTION_TRACKER_ADDRESS,
      this.getABI(),
      this.provider
    );
  }

  private getABI() {
    return [
      "function getGlobalStats() view returns (uint256 totalTransactions, uint256 totalValueTransferredUSD, uint256 lastTransactionTime)",
      "function getAllContractStats() view returns (string[] contractTypes, tuple(uint256 totalTransactions, uint256 totalValueUSD, uint256 lastTransactionTime, bool isActive)[] stats)",
      "function getRecentTransactions(uint256 count) view returns (tuple(address user, address contractAddress, string contractType, address tokenAddress, string tokenSymbol, uint256 amount, uint256 valueInUSD, uint256 timestamp, string txHash)[] transactions)",
      "function getUserTransactions(address user, uint256 count) view returns (tuple(address user, address contractAddress, string contractType, address tokenAddress, string tokenSymbol, uint256 amount, uint256 valueInUSD, uint256 timestamp, string txHash)[] transactions)",
      "function getUserTotalValue(address user) view returns (uint256)",
      "event TransactionRecorded(address indexed user, address indexed contractAddress, string contractType, address indexed tokenAddress, string tokenSymbol, uint256 amount, uint256 valueInUSD, uint256 timestamp, string txHash)"
    ];
  }

  // Get global statistics
  async getGlobalStats() {
    try {
      const [totalTx, totalValue, lastTxTime] = await this.contract.getGlobalStats();
      return {
        totalTransactions: Number(totalTx),
        totalValueTransferred: ethers.formatEther(totalValue),
        lastTransactionTime: Number(lastTxTime) * 1000 // Convert to milliseconds
      };
    } catch (error) {
      console.error('Error fetching global stats:', error);
      return {
        totalTransactions: 0,
        totalValueTransferred: "0",
        lastTransactionTime: 0
      };
    }
  }

  // Get contract-specific statistics
  async getContractStats() {
    try {
      const [contractTypes, contractStats] = await this.contract.getAllContractStats();
      
      const stats = {};
      for (let i = 0; i < contractTypes.length; i++) {
        const type = contractTypes[i];
        const stat = contractStats[i];
        stats[type] = {
          totalTransactions: Number(stat.totalTransactions),
          totalValue: ethers.formatEther(stat.totalValueUSD),
          lastTransactionTime: Number(stat.lastTransactionTime) * 1000,
          isActive: stat.isActive
        };
      }
      
      return stats;
    } catch (error) {
      console.error('Error fetching contract stats:', error);
      return {};
    }
  }

  // Get recent transactions
  async getRecentTransactions(count: number = 10) {
    try {
      const transactions = await this.contract.getRecentTransactions(count);
      return transactions.map(tx => ({
        user: tx.user,
        contractType: tx.contractType,
        tokenSymbol: tx.tokenSymbol,
        amount: ethers.formatUnits(tx.amount, tx.tokenSymbol === "USDT" || tx.tokenSymbol === "USDC" ? 6 : 18),
        valueUSD: ethers.formatEther(tx.valueInUSD),
        timestamp: Number(tx.timestamp) * 1000,
        txHash: tx.txHash
      }));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  // Listen for new transactions
  onTransactionRecorded(callback: (transaction: any) => void) {
    this.contract.on("TransactionRecorded", (
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
      const transaction = {
        user,
        contractAddress,
        contractType,
        tokenAddress,
        tokenSymbol,
        amount: ethers.formatUnits(amount, tokenSymbol === "USDT" || tokenSymbol === "USDC" ? 6 : 18),
        valueUSD: ethers.formatEther(valueInUSD),
        timestamp: Number(timestamp) * 1000,
        txHash
      };
      
      callback(transaction);
    });
  }
}
```

### 3. **Create Real-Time Stats Component**

```typescript
// components/RealTimeStats.tsx
import React, { useState, useEffect } from 'react';
import { TransactionTrackerService } from '../services/TransactionTrackerService';

interface GlobalStats {
  totalTransactions: number;
  totalValueTransferred: string;
  lastTransactionTime: number;
}

interface ContractStats {
  [key: string]: {
    totalTransactions: number;
    totalValue: string;
    lastTransactionTime: number;
    isActive: boolean;
  };
}

interface Transaction {
  user: string;
  contractType: string;
  tokenSymbol: string;
  amount: string;
  valueUSD: string;
  timestamp: number;
  txHash: string;
}

export const RealTimeStats: React.FC = () => {
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalTransactions: 0,
    totalValueTransferred: "0",
    lastTransactionTime: 0
  });
  
  const [contractStats, setContractStats] = useState<ContractStats>({});
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const trackerService = new TransactionTrackerService();

  // Fetch all data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [global, contracts, recent] = await Promise.all([
        trackerService.getGlobalStats(),
        trackerService.getContractStats(),
        trackerService.getRecentTransactions(5)
      ]);

      setGlobalStats(global);
      setContractStats(contracts);
      setRecentTransactions(recent);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling every 5 seconds
    const interval = setInterval(fetchData, 5000);

    // Listen for new transactions
    const handleNewTransaction = (transaction: Transaction) => {
      console.log('🆕 New transaction:', transaction);
      
      // Update global stats
      setGlobalStats(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        totalValueTransferred: (parseFloat(prev.totalValueTransferred) + parseFloat(transaction.valueUSD)).toFixed(2),
        lastTransactionTime: transaction.timestamp
      }));

      // Update contract stats
      setContractStats(prev => ({
        ...prev,
        [transaction.contractType]: {
          ...prev[transaction.contractType],
          totalTransactions: (prev[transaction.contractType]?.totalTransactions || 0) + 1,
          totalValue: (parseFloat(prev[transaction.contractType]?.totalValue || "0") + parseFloat(transaction.valueUSD)).toFixed(2),
          lastTransactionTime: transaction.timestamp
        }
      }));

      // Add to recent transactions
      setRecentTransactions(prev => [transaction, ...prev.slice(0, 4)]);
    };

    trackerService.onTransactionRecorded(handleNewTransaction);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="real-time-stats loading">
        <div className="loading-spinner">🔄 Loading real-time data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="real-time-stats error">
        <div className="error-message">❌ Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="real-time-stats">
      {/* Main Total Value Display */}
      <div className="total-value-section">
        <h2>💰 Total Value Transferred via Hyperkit Contracts</h2>
        <div className="total-value">
          ${parseFloat(globalStats.totalValueTransferred).toLocaleString()}
        </div>
        <div className="total-transactions">
          {globalStats.totalTransactions.toLocaleString()} transactions
        </div>
        <div className="last-update">
          Last update: {new Date(globalStats.lastTransactionTime).toLocaleTimeString()}
        </div>
      </div>

      {/* Contract Breakdown */}
      <div className="contract-breakdown">
        <h3>📊 Contract Breakdown</h3>
        <div className="contract-grid">
          {Object.entries(contractStats).map(([type, stats]) => (
            <div key={type} className="contract-card">
              <div className="contract-type">{type.toUpperCase()}</div>
              <div className="contract-value">${parseFloat(stats.totalValue).toLocaleString()}</div>
              <div className="contract-transactions">{stats.totalTransactions} tx</div>
              <div className="contract-status">
                {stats.isActive ? '🟢 Active' : '🔴 Inactive'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="recent-transactions">
        <h3>📋 Recent Transactions</h3>
        <div className="transactions-list">
          {recentTransactions.map((tx, index) => (
            <div key={index} className="transaction-item">
              <div className="transaction-type">{tx.contractType.toUpperCase()}</div>
              <div className="transaction-details">
                <span className="token-symbol">{tx.tokenSymbol}</span>
                <span className="amount">{tx.amount}</span>
                <span className="value">${parseFloat(tx.valueUSD).toFixed(2)}</span>
              </div>
              <div className="transaction-time">
                {new Date(tx.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Indicator */}
      <div className="live-indicator">
        <span className="live-dot">🔴</span> Live Data
      </div>
    </div>
  );
};
```

### 4. **Add CSS Styling**

```css
/* styles/RealTimeStats.css */
.real-time-stats {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.total-value-section {
  text-align: center;
  margin-bottom: 32px;
}

.total-value-section h2 {
  font-size: 1.2rem;
  margin-bottom: 16px;
  opacity: 0.9;
}

.total-value {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.total-transactions {
  font-size: 1.1rem;
  opacity: 0.8;
  margin-bottom: 8px;
}

.last-update {
  font-size: 0.9rem;
  opacity: 0.6;
}

.contract-breakdown {
  margin-bottom: 32px;
}

.contract-breakdown h3 {
  font-size: 1.1rem;
  margin-bottom: 16px;
  opacity: 0.9;
}

.contract-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.contract-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.contract-type {
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 8px;
  opacity: 0.8;
}

.contract-value {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.contract-transactions {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 8px;
}

.contract-status {
  font-size: 0.8rem;
}

.recent-transactions {
  margin-bottom: 24px;
}

.recent-transactions h3 {
  font-size: 1.1rem;
  margin-bottom: 16px;
  opacity: 0.9;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.transaction-type {
  font-weight: bold;
  font-size: 0.9rem;
  opacity: 0.9;
}

.transaction-details {
  display: flex;
  gap: 8px;
  font-size: 0.9rem;
}

.token-symbol {
  font-weight: bold;
  color: #ffd700;
}

.amount {
  opacity: 0.8;
}

.value {
  font-weight: bold;
  color: #90ee90;
}

.transaction-time {
  font-size: 0.8rem;
  opacity: 0.6;
}

.live-indicator {
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.8;
}

.live-dot {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.loading {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  font-size: 1.2rem;
  opacity: 0.8;
}

.error {
  text-align: center;
  padding: 40px;
  color: #ff6b6b;
}

.error-message {
  font-size: 1.1rem;
}
```

### 5. **Use in Your Main App**

```typescript
// App.tsx or your main component
import React from 'react';
import { RealTimeStats } from './components/RealTimeStats';
import './styles/RealTimeStats.css';

function App() {
  return (
    <div className="app">
      <header>
        <h1>Hyperkit DeFi Platform</h1>
      </header>
      
      <main>
        {/* Your other components */}
        <div className="swap-section">
          {/* Swap component */}
        </div>
        
        <div className="buy-section">
          {/* Buy component */}
        </div>
        
        {/* Real-time stats display */}
        <RealTimeStats />
        
        <div className="stake-section">
          {/* Staking component */}
        </div>
        
        <div className="bridge-section">
          {/* Bridge component */}
        </div>
      </main>
    </div>
  );
}

export default App;
```

## 🔧 **Alternative: File-Based Integration**

If you prefer to use the stats file instead of direct contract calls:

```typescript
// components/RealTimeStatsFile.tsx
import React, { useState, useEffect } from 'react';

interface StatsData {
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

export const RealTimeStatsFile: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/stats/real-time-stats.json');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="real-time-stats">
      <div className="total-value-section">
        <h2>💰 Total Value Transferred via Hyperkit Contracts</h2>
        <div className="total-value">
          ${parseFloat(stats.totalValueTransferred).toLocaleString()}
        </div>
        <div className="total-transactions">
          {stats.totalTransactions.toLocaleString()} transactions
        </div>
      </div>
      
      {/* Rest of the component similar to above */}
    </div>
  );
};
```

## 🚀 **Deployment Steps**

1. **Start the Monitor**: Run the monitor script to keep stats updated
   ```bash
   npx hardhat run scripts/tracker/monitor-transactions.ts --network metis-hyperion-testnet
   ```

2. **Deploy Frontend**: Deploy your frontend with the RealTimeStats component

3. **Test Integration**: The component will automatically start displaying real-time data

## 📊 **Expected Results**

- **Real-time Updates**: Data updates every 5 seconds
- **Live Transactions**: New transactions appear immediately
- **Total Value**: Shows actual total value transferred across all contracts
- **Contract Breakdown**: Individual contract statistics
- **Recent Activity**: Live transaction history

## 🎯 **Key Features**

- ✅ **Real-time Updates**: Automatic data refresh every 5 seconds
- ✅ **Event Listening**: Immediate updates on new transactions
- ✅ **Error Handling**: Graceful error handling and fallbacks
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Performance Optimized**: Efficient data fetching and updates

Your frontend will now display **real-time total value transferred** across all your DeFi contracts! 🎉 