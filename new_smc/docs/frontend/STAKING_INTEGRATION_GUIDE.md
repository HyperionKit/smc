# Staking Contract Integration Guide - TypeScript

## 🎯 **StakingRewards Contract Overview**

Your StakingRewards contract allows users to:
- **Stake USDT** and earn **USDC rewards**
- **Unstake** their USDT at any time
- **Claim rewards** in USDC
- **View** their staked balance and pending rewards

## ✅ **Correct Staking Integration**

### 1. **Staking Contract Interface**

```typescript
// StakingRewards contract ABI
const STAKING_ABI = [
  {
    "inputs": [
      {"name": "_amount", "type": "uint256"}
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "_amount", "type": "uint256"}
    ],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "_user", "type": "address"}
    ],
    "name": "getStakedBalance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "_user", "type": "address"}
    ],
    "name": "getPendingReward",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "_user", "type": "address"}
    ],
    "name": "getRewardBalance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardRate",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stakingToken",
    "outputs": [{"name": "", "type": "address"},
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardToken",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses
const CONTRACTS = {
  STAKING: "0xB94d264074571A5099C458f74b526d1e4EE0314B",
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC", // Staking token
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682"  // Reward token
};
```

### 2. **Staking Service Class**

```typescript
import { ethers } from 'ethers';

export class StakingService {
  private stakingContract: ethers.Contract;
  private usdtContract: ethers.Contract;
  private usdcContract: ethers.Contract;
  private provider: ethers.Provider;
  private signer: ethers.Signer;

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.stakingContract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
    
    // Token contracts for approvals and balances
    const tokenABI = [
      'function approve(address spender, uint256 amount) returns (bool)',
      'function allowance(address owner, address spender) view returns (uint256)',
      'function balanceOf(address account) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];
    
    this.usdtContract = new ethers.Contract(CONTRACTS.USDT, tokenABI, signer);
    this.usdcContract = new ethers.Contract(CONTRACTS.USDC, tokenABI, provider);
  }

  /**
   * Stake USDT tokens
   */
  async stake(amount: string): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      // 1. Convert amount to proper format (USDT has 6 decimals)
      const amountInWei = ethers.parseUnits(amount, 6);
      
      // 2. Check user has enough USDT
      const userAddress = await this.signer.getAddress();
      const userBalance = await this.usdtContract.balanceOf(userAddress);
      
      if (userBalance < amountInWei) {
        return { success: false, error: 'Insufficient USDT balance' };
      }
      
      // 3. Approve USDT spending
      await this.approveUSDT(amountInWei);
      
      // 4. Stake tokens
      const tx = await this.stakingContract.stake(amountInWei);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash
      };
      
    } catch (error: any) {
      console.error('Stake error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unstake USDT tokens
   */
  async unstake(amount: string): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      // 1. Convert amount to proper format
      const amountInWei = ethers.parseUnits(amount, 6);
      
      // 2. Check user has enough staked
      const userAddress = await this.signer.getAddress();
      const stakedBalance = await this.stakingContract.getStakedBalance(userAddress);
      
      if (stakedBalance < amountInWei) {
        return { success: false, error: 'Insufficient staked balance' };
      }
      
      // 3. Unstake tokens
      const tx = await this.stakingContract.unstake(amountInWei);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash
      };
      
    } catch (error: any) {
      console.error('Unstake error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's staking information
   */
  async getUserStakingInfo(userAddress: string) {
    try {
      const [stakedBalance, pendingReward, rewardBalance] = await Promise.all([
        this.stakingContract.getStakedBalance(userAddress),
        this.stakingContract.getPendingReward(userAddress),
        this.stakingContract.getRewardBalance(userAddress)
      ]);

      return {
        stakedBalance: ethers.formatUnits(stakedBalance, 6), // USDT (6 decimals)
        pendingReward: ethers.formatUnits(pendingReward, 6), // USDC (6 decimals)
        rewardBalance: ethers.formatUnits(rewardBalance, 6), // USDC (6 decimals)
        stakedBalanceWei: stakedBalance,
        pendingRewardWei: pendingReward,
        rewardBalanceWei: rewardBalance
      };
    } catch (error: any) {
      console.error('Error getting staking info:', error);
      return {
        stakedBalance: '0',
        pendingReward: '0',
        rewardBalance: '0',
        stakedBalanceWei: 0n,
        pendingRewardWei: 0n,
        rewardBalanceWei: 0n
      };
    }
  }

  /**
   * Get user's USDT balance
   */
  async getUSDTBalance(userAddress: string): Promise<string> {
    try {
      const balance = await this.usdtContract.balanceOf(userAddress);
      return ethers.formatUnits(balance, 6);
    } catch (error) {
      console.error('Error getting USDT balance:', error);
      return '0';
    }
  }

  /**
   * Get user's USDC balance
   */
  async getUSDCBalance(userAddress: string): Promise<string> {
    try {
      const balance = await this.usdcContract.balanceOf(userAddress);
      return ethers.formatUnits(balance, 6);
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return '0';
    }
  }

  /**
   * Get reward rate
   */
  async getRewardRate(): Promise<string> {
    try {
      const rate = await this.stakingContract.rewardRate();
      return ethers.formatUnits(rate, 18); // Reward rate in 18 decimals
    } catch (error) {
      console.error('Error getting reward rate:', error);
      return '0';
    }
  }

  /**
   * Approve USDT spending for staking contract
   */
  private async approveUSDT(amount: bigint) {
    try {
      const userAddress = await this.signer.getAddress();
      const currentAllowance = await this.usdtContract.allowance(userAddress, CONTRACTS.STAKING);
      
      if (currentAllowance < amount) {
        const approveTx = await this.usdtContract.approve(CONTRACTS.STAKING, amount);
        await approveTx.wait();
        console.log('USDT approved for staking');
      }
    } catch (error) {
      console.error('Error approving USDT:', error);
      throw error;
    }
  }
}
```

### 3. **React Component Integration**

```typescript
import React, { useState, useEffect } from 'react';
import { useAccount, useProvider, useSigner } from 'wagmi';
import { StakingService } from './StakingService';

export const StakingComponent: React.FC = () => {
  const { address } = useAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();
  
  const [stakingService, setStakingService] = useState<StakingService | null>(null);
  const [stakingInfo, setStakingInfo] = useState({
    stakedBalance: '0',
    pendingReward: '0',
    rewardBalance: '0'
  });
  const [balances, setBalances] = useState({
    usdt: '0',
    usdc: '0'
  });
  const [rewardRate, setRewardRate] = useState('0');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (provider && signer) {
      const service = new StakingService(provider, signer);
      setStakingService(service);
      loadStakingData();
    }
  }, [provider, signer]);

  useEffect(() => {
    if (stakingService && address) {
      loadStakingData();
    }
  }, [stakingService, address]);

  const loadStakingData = async () => {
    if (!stakingService || !address) return;
    
    try {
      const [stakingInfo, usdtBalance, usdcBalance, rate] = await Promise.all([
        stakingService.getUserStakingInfo(address),
        stakingService.getUSDTBalance(address),
        stakingService.getUSDCBalance(address),
        stakingService.getRewardRate()
      ]);

      setStakingInfo(stakingInfo);
      setBalances({ usdt: usdtBalance, usdc: usdcBalance });
      setRewardRate(rate);
    } catch (error) {
      console.error('Error loading staking data:', error);
    }
  };

  const handleStake = async () => {
    if (!stakingService || !stakeAmount) {
      setError('Please enter an amount to stake');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await stakingService.stake(stakeAmount);
      
      if (result.success) {
        alert(`Staking successful! TX: ${result.txHash}`);
        setStakeAmount('');
        await loadStakingData(); // Refresh data
      } else {
        setError(result.error || 'Staking failed');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!stakingService || !unstakeAmount) {
      setError('Please enter an amount to unstake');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await stakingService.unstake(unstakeAmount);
      
      if (result.success) {
        alert(`Unstaking successful! TX: ${result.txHash}`);
        setUnstakeAmount('');
        await loadStakingData(); // Refresh data
      } else {
        setError(result.error || 'Unstaking failed');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxStake = () => {
    setStakeAmount(balances.usdt);
  };

  const handleMaxUnstake = () => {
    setUnstakeAmount(stakingInfo.stakedBalance);
  };

  return (
    <div className="staking-container">
      <h2>Stake USDT, Earn USDC</h2>
      
      {/* Staking Info */}
      <div className="staking-info">
        <div className="info-card">
          <h3>Your Staking</h3>
          <p>Staked USDT: {stakingInfo.stakedBalance}</p>
          <p>Pending USDC: {stakingInfo.pendingReward}</p>
          <p>Claimed USDC: {stakingInfo.rewardBalance}</p>
        </div>
        
        <div className="info-card">
          <h3>Your Balances</h3>
          <p>USDT Balance: {balances.usdt}</p>
          <p>USDC Balance: {balances.usdc}</p>
        </div>
        
        <div className="info-card">
          <h3>Reward Rate</h3>
          <p>{rewardRate} USDC per USDT per second</p>
        </div>
      </div>

      {/* Stake Section */}
      <div className="stake-section">
        <h3>Stake USDT</h3>
        <div className="input-group">
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Enter USDT amount"
          />
          <button type="button" onClick={handleMaxStake}>Max</button>
        </div>
        <button
          onClick={handleStake}
          disabled={isLoading || !stakeAmount}
          className="stake-button"
        >
          {isLoading ? 'Staking...' : 'Stake USDT'}
        </button>
      </div>

      {/* Unstake Section */}
      <div className="unstake-section">
        <h3>Unstake USDT</h3>
        <div className="input-group">
          <input
            type="number"
            value={unstakeAmount}
            onChange={(e) => setUnstakeAmount(e.target.value)}
            placeholder="Enter USDT amount"
          />
          <button type="button" onClick={handleMaxUnstake}>Max</button>
        </div>
        <button
          onClick={handleUnstake}
          disabled={isLoading || !unstakeAmount}
          className="unstake-button"
        >
          {isLoading ? 'Unstaking...' : 'Unstake USDT'}
        </button>
      </div>

      {/* Error Display */}
      {error && <div className="error">{error}</div>}

      {/* Refresh Button */}
      <button onClick={loadStakingData} className="refresh-button">
        Refresh Data
      </button>
    </div>
  );
};
```

### 4. **Usage Example**

```typescript
// In your main app component
import { StakingComponent } from './StakingComponent';

function App() {
  return (
    <div>
      <h1>DeFi Staking</h1>
      <StakingComponent />
    </div>
  );
}
```

## 🔧 **Key Points for Staking Integration**

### 1. **Correct Function Calls**
```typescript
// ✅ CORRECT staking
await stakingContract.stake(ethers.parseUnits("100", 6)); // 100 USDT

// ✅ CORRECT unstaking
await stakingContract.unstake(ethers.parseUnits("50", 6)); // 50 USDT
```

### 2. **Token Approval Required**
```typescript
// Always approve USDT before staking
await usdtContract.approve(stakingAddress, amount);
```

### 3. **Decimal Handling**
```typescript
// USDT and USDC both have 6 decimals
const amountInWei = ethers.parseUnits("100", 6); // 100 USDT
const displayAmount = ethers.formatUnits(balance, 6); // Display balance
```

## 🚨 **Common Mistakes to Avoid**

1. **❌ Wrong Decimals**: USDT/USDC use 6 decimals, not 18
2. **❌ Missing Approval**: Must approve USDT before staking
3. **❌ Insufficient Balance**: Check user has enough USDT to stake
4. **❌ Insufficient Staked**: Check user has enough staked to unstake
5. **❌ Not Refreshing Data**: Always refresh after transactions

## ✅ **Testing Your Integration**

```typescript
// Test function to verify your integration
async function testStakingIntegration() {
  const stakingService = new StakingService(provider, signer);
  
  // Test staking
  const stakeResult = await stakingService.stake("100"); // 100 USDT
  console.log('Stake result:', stakeResult);
  
  // Test getting info
  const info = await stakingService.getUserStakingInfo(userAddress);
  console.log('Staking info:', info);
  
  // Test unstaking
  const unstakeResult = await stakingService.unstake("50"); // 50 USDT
  console.log('Unstake result:', unstakeResult);
}
```

## 📊 **Expected Behavior**

1. **Staking**: User stakes USDT → receives staking position
2. **Rewards**: User earns USDC rewards over time based on reward rate
3. **Unstaking**: User can unstake USDT at any time
4. **Rewards**: Rewards are automatically calculated and can be viewed

This should resolve your Staking contract integration issues! 🎯 