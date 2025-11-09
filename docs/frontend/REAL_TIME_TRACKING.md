# Real-Time Transaction Tracking Integration Guide

## Overview

This guide explains how to integrate real-time transaction tracking into your frontend to display the "Total value transferred via Hyperkit Contracts" metric and other live statistics.

## Architecture

### 1. TransactionTracker Contract
- **Purpose**: Centralized contract that tracks all transactions across the DeFi ecosystem
- **Functions**: Records transactions, maintains statistics, provides real-time data
- **Events**: Emits `TransactionRecorded` events for real-time updates

### 2. Real-Time Monitor
- **Purpose**: Backend service that listens to blockchain events and updates statistics
- **Output**: JSON file with current statistics updated every 5 seconds
- **Location**: `dpsmc/tracker/hyperion/real-time-stats.json`

### 3. Frontend Integration
- **Purpose**: Display real-time statistics in the UI
- **Methods**: File polling, WebSocket, or direct contract calls

## Frontend Integration Methods

### Method 1: File Polling (Recommended)

```javascript
// Real-time stats component
class RealTimeStatsComponent {
  constructor() {
    this.statsFile = '/api/stats/real-time-stats.json';
    this.updateInterval = 5000; // 5 seconds
    this.currentStats = null;
  }

  async startTracking() {
    // Initial load
    await this.updateStats();
    
    // Set up polling
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
      totalValueElement.textContent = `$${parseFloat(stats.totalValueTransferred).toLocaleString()}`;
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

    // Update contract breakdown
    this.updateContractBreakdown(stats.contractStats);
    
    // Update recent transactions
    this.updateRecentTransactions(stats.recentTransactions);
  }

  updateContractBreakdown(contractStats) {
    const breakdownContainer = document.getElementById('contract-breakdown');
    if (!breakdownContainer) return;

    breakdownContainer.innerHTML = '';
    
    Object.entries(contractStats).forEach(([type, stats]) => {
      if (stats.totalTransactions > 0) {
        const contractElement = document.createElement('div');
        contractElement.className = 'contract-stat';
        contractElement.innerHTML = `
          <div class="contract-type">${type.toUpperCase()}</div>
          <div class="contract-value">$${parseFloat(stats.totalValue).toLocaleString()}</div>
          <div class="contract-tx">${stats.totalTransactions} tx</div>
        `;
        breakdownContainer.appendChild(contractElement);
      }
    });
  }

  updateRecentTransactions(transactions) {
    const txContainer = document.getElementById('recent-transactions');
    if (!txContainer) return;

    txContainer.innerHTML = '';
    
    transactions.slice(0, 5).forEach(tx => {
      const txElement = document.createElement('div');
      txElement.className = 'transaction-item';
      txElement.innerHTML = `
        <div class="tx-type">${tx.contractType.toUpperCase()}</div>
        <div class="tx-token">${tx.tokenSymbol}</div>
        <div class="tx-amount">${parseFloat(tx.amount).toFixed(2)}</div>
        <div class="tx-value">$${parseFloat(tx.valueUSD).toFixed(2)}</div>
        <div class="tx-time">${new Date(tx.timestamp).toLocaleTimeString()}</div>
      `;
      txContainer.appendChild(txElement);
    });
  }
}
```

### Method 2: Direct Contract Integration

```javascript
// Direct contract integration
class ContractStatsTracker {
  constructor(provider, trackerAddress) {
    this.provider = provider;
    this.trackerAddress = trackerAddress;
    this.trackerContract = new ethers.Contract(trackerAddress, TRACKER_ABI, provider);
  }

  async getGlobalStats() {
    const [totalTx, totalValue, lastTxTime] = await this.trackerContract.getGlobalStats();
    
    return {
      totalTransactions: Number(totalTx),
      totalValueTransferred: ethers.formatEther(totalValue),
      lastTransactionTime: Number(lastTxTime)
    };
  }

  async getContractStats(contractType) {
    const stats = await this.trackerContract.getContractStats(contractType);
    
    return {
      totalTransactions: Number(stats.totalTransactions),
      totalValueUSD: ethers.formatEther(stats.totalValueUSD),
      lastTransactionTime: Number(stats.lastTransactionTime),
      isActive: stats.isActive
    };
  }

  async getRecentTransactions(count = 10) {
    const transactions = await this.trackerContract.getRecentTransactions(count);
    
    return transactions.map(tx => ({
      user: tx.user,
      contractType: tx.contractType,
      tokenSymbol: tx.tokenSymbol,
      amount: ethers.formatUnits(tx.amount, 18),
      valueUSD: ethers.formatEther(tx.valueInUSD),
      timestamp: new Date(Number(tx.timestamp) * 1000).toISOString(),
      txHash: tx.txHash
    }));
  }

  // Listen to real-time events
  listenToEvents(callback) {
    this.trackerContract.on("TransactionRecorded", (
      user, contractAddress, contractType, tokenAddress, 
      tokenSymbol, amount, valueInUSD, timestamp, txHash
    ) => {
      const transaction = {
        user,
        contractAddress,
        contractType,
        tokenAddress,
        tokenSymbol,
        amount: ethers.formatUnits(amount, 18),
        valueUSD: ethers.formatEther(valueInUSD),
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
        txHash
      };
      
      callback(transaction);
    });
  }
}
```

### Method 3: WebSocket Integration

```javascript
// WebSocket integration for real-time updates
class WebSocketStatsTracker {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(this.wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleUpdate(data);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  handleUpdate(data) {
    // Update UI with new data
    this.updateUI(data);
  }

  updateUI(data) {
    // Same UI update logic as Method 1
  }
}
```

## HTML Structure

```html
<!-- Total Value Transferred Section -->
<div class="stats-section">
  <div class="stats-header">
    <h3>Total value transferred</h3>
    <p>via Hyperkit Contracts</p>
  </div>
  
  <div class="stats-value">
    <span class="currency">$</span>
    <span id="total-value-transferred">0</span>
  </div>
  
  <div class="stats-actions">
    <a href="/stats" class="explore-link">
      <span class="icon">📊</span>
      Explore Stats
      <span class="external-icon">↗</span>
    </a>
  </div>
</div>

<!-- Contract Breakdown -->
<div class="contract-breakdown">
  <h4>Contract Activity</h4>
  <div id="contract-breakdown" class="breakdown-grid">
    <!-- Populated by JavaScript -->
  </div>
</div>

<!-- Recent Transactions -->
<div class="recent-transactions">
  <h4>Recent Transactions</h4>
  <div id="recent-transactions" class="tx-list">
    <!-- Populated by JavaScript -->
  </div>
</div>

<!-- Last Update -->
<div class="last-update">
  <small>Last updated: <span id="last-update-time">--</span></small>
</div>
```

## CSS Styling

```css
.stats-section {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.stats-header h3 {
  color: #ffffff;
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.stats-header p {
  color: #a0a0a0;
  margin: 0;
  font-size: 14px;
}

.stats-value {
  margin: 20px 0;
  font-size: 32px;
  font-weight: 700;
}

.stats-value .currency {
  color: #8b5cf6;
}

.stats-value #total-value-transferred {
  color: #ffffff;
}

.explore-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
  text-decoration: none;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  transition: all 0.2s ease;
}

.explore-link:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.contract-stat {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.contract-type {
  color: #a0a0a0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.contract-value {
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  margin: 8px 0 4px 0;
}

.contract-tx {
  color: #8b5cf6;
  font-size: 12px;
}

.tx-list {
  margin-top: 16px;
}

.transaction-item {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.tx-type {
  color: #8b5cf6;
  font-weight: 600;
}

.tx-token {
  color: #ffffff;
}

.tx-amount {
  color: #a0a0a0;
}

.tx-value {
  color: #10b981;
  font-weight: 600;
}

.tx-time {
  color: #6b7280;
  font-size: 12px;
}

.last-update {
  text-align: center;
  margin-top: 24px;
}

.last-update small {
  color: #6b7280;
  font-size: 12px;
}
```

## Implementation Steps

### 1. Deploy TransactionTracker
```bash
npx hardhat run scripts/tracker/deploy-transaction-tracker.ts --network metis-hyperion-testnet
```

### 2. Start Real-Time Monitor
```bash
npx hardhat run scripts/tracker/monitor-transactions.ts --network metis-hyperion-testnet
```

### 3. Set Up Frontend API
Create an API endpoint that serves the stats file:

```javascript
// Express.js example
app.get('/api/stats/real-time-stats.json', (req, res) => {
  const statsPath = path.join(__dirname, '../dpsmc/tracker/hyperion/real-time-stats.json');
  res.sendFile(statsPath);
});
```

### 4. Integrate Frontend Component
```javascript
// Initialize the component
const statsTracker = new RealTimeStatsComponent();
statsTracker.startTracking();
```

## Real-Time Features

### 1. Live Updates
- **Event-Driven**: Updates triggered by new transactions
- **Polling**: Regular updates every 5 seconds
- **WebSocket**: Real-time push notifications

### 2. Transaction Details
- **User Address**: Who made the transaction
- **Contract Type**: Swap, Buy, Stake, Bridge, Faucet
- **Token Information**: Symbol, amount, USD value
- **Timestamps**: When the transaction occurred
- **Transaction Hash**: Blockchain transaction ID

### 3. Statistics Breakdown
- **Total Value**: Sum of all transaction values
- **Transaction Count**: Number of transactions
- **Contract Activity**: Breakdown by contract type
- **Recent Activity**: Latest transactions

## Performance Considerations

### 1. Caching
```javascript
// Cache stats for 1 second to prevent excessive API calls
class CachedStatsTracker {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 1000; // 1 second
  }

  async getStats(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await this.fetchStats(key);
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

### 2. Debouncing
```javascript
// Debounce UI updates to prevent excessive re-renders
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedUpdate = debounce((stats) => {
  updateUI(stats);
}, 100);
```

### 3. Error Handling
```javascript
// Graceful error handling
async function updateStats() {
  try {
    const stats = await fetchStats();
    updateUI(stats);
  } catch (error) {
    console.error('Failed to update stats:', error);
    showErrorState();
  }
}

function showErrorState() {
  const element = document.getElementById('total-value-transferred');
  if (element) {
    element.textContent = '--';
    element.style.opacity = '0.5';
  }
}
```

## Testing

### 1. Manual Testing
```javascript
// Test the integration
async function testIntegration() {
  const tracker = new RealTimeStatsComponent();
  
  // Simulate stats update
  const mockStats = {
    totalValueTransferred: "1234567.89",
    totalTransactions: 1234,
    lastUpdateTime: new Date().toISOString(),
    contractStats: {
      swap: { totalValue: "500000", totalTransactions: 500, lastTransaction: "" },
      buy: { totalValue: "300000", totalTransactions: 300, lastTransaction: "" }
    },
    recentTransactions: []
  };
  
  tracker.updateUI(mockStats);
}
```

### 2. Automated Testing
```javascript
// Unit tests
describe('RealTimeStatsComponent', () => {
  it('should update UI with new stats', () => {
    const component = new RealTimeStatsComponent();
    const mockStats = { /* ... */ };
    
    component.updateUI(mockStats);
    
    expect(document.getElementById('total-value-transferred').textContent)
      .toBe('$1,234,567.89');
  });
});
```

## Deployment Checklist

- [ ] Deploy TransactionTracker contract
- [ ] Configure contract addresses in tracker
- [ ] Start real-time monitor service
- [ ] Set up API endpoint for stats file
- [ ] Integrate frontend component
- [ ] Test real-time updates
- [ ] Monitor performance and errors
- [ ] Set up logging and alerting

## Troubleshooting

### Common Issues

1. **Stats not updating**: Check if monitor service is running
2. **High API calls**: Implement caching and debouncing
3. **Network errors**: Add retry logic and error handling
4. **Performance issues**: Optimize polling frequency and UI updates

### Debug Commands

```bash
# Check if monitor is running
ps aux | grep monitor-transactions

# Check stats file
cat dpsmc/tracker/hyperion/real-time-stats.json

# Check contract events
npx hardhat run scripts/tracker/debug-events.ts --network metis-hyperion-testnet
```

This integration provides a complete real-time transaction tracking system that will display live statistics in your frontend, including the "Total value transferred via Hyperkit Contracts" metric. 