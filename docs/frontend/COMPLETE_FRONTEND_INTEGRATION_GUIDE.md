# Complete Frontend Integration Guide - Multi-Network DeFi Ecosystem

## 🎯 Overview

This comprehensive guide shows you how to integrate all DeFi contracts across **4 networks** (Hyperion, Mantle, Lazchain, Metis Sepolia) into your frontend application.

## 📋 Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Network Configuration](#network-configuration)
3. [Contract Addresses](#contract-addresses)
4. [Swap/AMM Integration](#swapamm-integration)
5. [Buy System Integration](#buy-system-integration)
6. [Staking Integration](#staking-integration)
7. [Bridge Integration](#bridge-integration)
8. [Faucet Integration](#faucet-integration)
9. [Transaction Tracker Integration](#transaction-tracker-integration)
10. [Multi-Network Support](#multi-network-support)
11. [Complete Example](#complete-example)

---

## 🚀 Setup & Configuration

### 1. Install Dependencies

```bash
npm install ethers@^6.15.0
# or
yarn add ethers@^6.15.0
```

### 2. Project Structure

```
frontend/
├── src/
│   ├── config/
│   │   ├── networks.ts          # Network configurations
│   │   └── contracts.ts         # Contract addresses
│   ├── services/
│   │   ├── SwapService.ts       # AMM/Swap interactions
│   │   ├── BuyService.ts        # BuyVault interactions
│   │   ├── StakingService.ts    # Staking interactions
│   │   ├── BridgeService.ts     # Bridge interactions
│   │   ├── FaucetService.ts    # Faucet interactions
│   │   └── TrackerService.ts    # TransactionTracker
│   ├── hooks/
│   │   └── useWeb3.ts           # Web3 connection hook
│   └── utils/
│       └── format.ts            # Formatting utilities
```

---

## 🌐 Network Configuration

### networks.ts

```typescript
import { Chain } from '@wagmi/core';

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const NETWORKS: Record<string, NetworkConfig> = {
  HYPERION: {
    chainId: 133717,
    name: 'Hyperion Testnet',
    rpcUrl: 'https://hyperion-testnet.metisdevops.link',
    explorerUrl: 'https://hyperion-testnet-explorer.metisdevops.link',
    nativeCurrency: {
      name: 'METIS',
      symbol: 'METIS',
      decimals: 18,
    },
  },
  MANTLE: {
    chainId: 5003,
    name: 'Mantle Testnet',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    explorerUrl: 'https://sepolia.mantlescan.xyz',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
  },
  LAZCHAIN: {
    chainId: 133718,
    name: 'Lazchain Testnet',
    rpcUrl: 'https://testnet.lazai.network',
    explorerUrl: 'https://testnet-explorer.lazai.network',
    nativeCurrency: {
      name: 'LAZAI',
      symbol: 'LAZAI',
      decimals: 18,
    },
  },
  METIS_SEPOLIA: {
    chainId: 59902,
    name: 'Metis Sepolia Testnet',
    rpcUrl: 'https://metis-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.explorer.metis.io',
    nativeCurrency: {
      name: 'METIS',
      symbol: 'METIS',
      decimals: 18,
    },
  },
};

// Chain IDs mapping
export const CHAIN_IDS = {
  HYPERION: 133717,
  MANTLE: 5003,
  LAZCHAIN: 133718,
  METIS_SEPOLIA: 59902,
} as const;
```

---

## 📝 Contract Addresses

### contracts.ts

```typescript
export interface ContractAddresses {
  tokens: {
    USDT: string;
    USDC: string;
    DAI: string;
    WETH: string;
  };
  liquidityPool: string;
  buyVault: string;
  stakingRewards: string;
  bridge: string;
  faucet: string;
  transactionTracker: string;
}

export const CONTRACTS: Record<string, ContractAddresses> = {
  HYPERION: {
    tokens: {
      USDT: '0x9b52D326D4866055F6c23297656002992e4293FC',
      USDC: '0x31424DB0B7a929283C394b4DA412253Ab6D61682',
      DAI: '0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb',
      WETH: '0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4',
    },
    liquidityPool: '0x91C39DAA7617C5188d0427Fc82e4006803772B74',
    buyVault: '0x0adFd197aAbbC194e8790041290Be57F18d576a3',
    stakingRewards: '0xB94d264074571A5099C458f74b526d1e4EE0314B',
    bridge: '0xfF064Fd496256e84b68dAE2509eDA84a3c235550',
    faucet: '0xE1B8C7168B0c48157A5e4B80649C5a1b83bF4cC4',
    transactionTracker: '0xd68a2cCa272c0ABDb3B0A2e6C15Ca86216cFDbe6',
  },
  MANTLE: {
    tokens: {
      USDT: '0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b',
      USDC: '0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE',
      DAI: '0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a',
      WETH: '0xCa7b49d1C243a9289aE2316051eb15146125914d',
    },
    liquidityPool: '0x93c714601b8bc0C9A9d605CEc99786847654598e',
    buyVault: '0x1E0B86323fdFFa099AAEeE9B3C8B2f8C6E20fFa5',
    stakingRewards: '0x1a80Db4cf9E26BafCf672c534Ab219630fFE1A5E',
    bridge: '0xd6629696A52E914433b0924f1f49d42216708276',
    faucet: '0x0e04CB9E80579aA464Af122457fa2c477c126868',
    transactionTracker: '0xB2ceDc981CD73877F35bE616c850C36C435cF055',
  },
  LAZCHAIN: {
    tokens: {
      USDT: '0x9D81C1a89bE608417B5Bb1C1cF5858594D01E8a3',
      USDC: '0x677B021cCBA318A93BACB1653fD7bE0882ceE9Fd',
      DAI: '0xeC53e4a54b3AB36fb684966c222Ff6f347C7e84c',
      WETH: '0xef63df9fa0E5f79127AaC0B2a0ec969CC30be532',
    },
    liquidityPool: '0xE07471cbe06bC3Dd3F74001A2EFBEeA1D60f51f8',
    buyVault: '0x66d12d47034F8D6221586e32bac8bE6819467E07',
    stakingRewards: '0x84d0A880C970A53154D4d6B25E3825046D677603',
    bridge: '0xf2D33cF11d102F94148c38f943C99408f7C898cf',
    faucet: '0x04107Dd22f966aB3f9A130798FEc45602476F6a5',
    transactionTracker: '0x815BF4455296f9F52Cf4cE5B5B4A1c7D615f6152',
  },
  METIS_SEPOLIA: {
    tokens: {
      USDT: '0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898',
      USDC: '0x16d44fBBc8E1F3FBB6ac0674a44EECfa528604DD',
      DAI: '0x23E380def17aAA8554297069422039517B2997b9',
      WETH: '0x1A3d532875aD585776c814E7749a5e7a58b3E49b',
    },
    liquidityPool: '0x5AC81bC04fc19871E103667ee4b3f0B77b960D7d',
    buyVault: '0xf3d5C21e02943539364A3A4dd2Cba88408024A5f',
    stakingRewards: '0xCfaf530E5c6568D3953DfFcB2363Ae4F77332afa',
    bridge: '0x1AC16E6C537438c82A61A106B876Ef69C7e247d2',
    faucet: '0x50888Ced4d0BCcB1CD7494245716Ac005A42a8D9',
    transactionTracker: '0x3A9f855553050b5A2cfbeC92E2AF4a891a4B3885',
  },
};
```

---

## 💱 Swap/AMM Integration

### SwapService.ts

```typescript
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

const LIQUIDITY_POOL_ABI = [
  'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address to) external returns (uint256 amountOut)',
  'function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256 amountOut)',
  'function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external returns (uint256 liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity) external returns (uint256 amountA, uint256 amountB)',
  'function getReserves(address tokenA, address tokenB) external view returns (uint256 reserveA, uint256 reserveB)',
];

export class SwapService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;
  private network: string;

  constructor(provider: ethers.Provider, signer: ethers.Signer, network: string) {
    this.signer = signer;
    this.network = network;
    const addresses = CONTRACTS[network];
    this.contract = new ethers.Contract(
      addresses.liquidityPool,
      LIQUIDITY_POOL_ABI,
      signer
    );
  }

  // Get quote for swap
  async getQuote(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<bigint> {
    return await this.contract.getAmountOut(tokenIn, tokenOut, amountIn);
  }

  // Execute swap
  async swap(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    minAmountOut: bigint,
    recipient: string
  ): Promise<ethers.ContractTransactionResponse> {
    // Approve token first
    const tokenContract = new ethers.Contract(
      tokenIn,
      ['function approve(address spender, uint256 amount) external returns (bool)'],
      this.signer
    );
    await tokenContract.approve(this.contract.target, amountIn);
    
    // Execute swap
    return await this.contract.swap(tokenIn, tokenOut, amountIn, minAmountOut, recipient);
  }

  // Get reserves for a pair
  async getReserves(tokenA: string, tokenB: string): Promise<{ reserveA: bigint; reserveB: bigint }> {
    const [reserveA, reserveB] = await this.contract.getReserves(tokenA, tokenB);
    return { reserveA, reserveB };
  }

  // Add liquidity
  async addLiquidity(
    tokenA: string,
    tokenB: string,
    amountA: bigint,
    amountB: bigint
  ): Promise<ethers.ContractTransactionResponse> {
    // Approve both tokens
    const tokenAContract = new ethers.Contract(
      tokenA,
      ['function approve(address spender, uint256 amount) external returns (bool)'],
      this.signer
    );
    const tokenBContract = new ethers.Contract(
      tokenB,
      ['function approve(address spender, uint256 amount) external returns (bool)'],
      this.signer
    );
    
    await tokenAContract.approve(this.contract.target, amountA);
    await tokenBContract.approve(this.contract.target, amountB);
    
    return await this.contract.addLiquidity(tokenA, tokenB, amountA, amountB);
  }
}
```

---

## 🛒 Buy System Integration

### BuyService.ts

```typescript
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

const BUY_VAULT_ABI = [
  'function buyUSDC(uint256 minAmount) external payable returns (uint256 amount)',
  'function buyUSDT(uint256 minAmount) external payable returns (uint256 amount)',
  'function getUSDCAmount(uint256 nativeAmount) external view returns (uint256)',
  'function getUSDTAmount(uint256 nativeAmount) external view returns (uint256)',
  'function usdcPrice() external view returns (uint256)',
  'function usdtPrice() external view returns (uint256)',
];

export class BuyService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(provider: ethers.Provider, signer: ethers.Signer, network: string) {
    this.signer = signer;
    const addresses = CONTRACTS[network];
    this.contract = new ethers.Contract(
      addresses.buyVault,
      BUY_VAULT_ABI,
      signer
    );
  }

  // Get USDC amount for native currency
  async getUSDCAmount(nativeAmount: bigint): Promise<bigint> {
    return await this.contract.getUSDCAmount(nativeAmount);
  }

  // Get USDT amount for native currency
  async getUSDTAmount(nativeAmount: bigint): Promise<bigint> {
    return await this.contract.getUSDTAmount(nativeAmount);
  }

  // Buy USDC with native currency
  async buyUSDC(nativeAmount: bigint, minAmount: bigint): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.buyUSDC(minAmount, { value: nativeAmount });
  }

  // Buy USDT with native currency
  async buyUSDT(nativeAmount: bigint, minAmount: bigint): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.buyUSDT(minAmount, { value: nativeAmount });
  }

  // Get current prices
  async getPrices(): Promise<{ usdcPrice: bigint; usdtPrice: bigint }> {
    const [usdcPrice, usdtPrice] = await Promise.all([
      this.contract.usdcPrice(),
      this.contract.usdtPrice(),
    ]);
    return { usdcPrice, usdtPrice };
  }
}
```

---

## 🏦 Staking Integration

### StakingService.ts

```typescript
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

const STAKING_ABI = [
  'function stake(uint256 amount) external returns (bool)',
  'function unstake(uint256 amount) external returns (bool)',
  'function claimReward() external returns (bool)',
  'function getStakedBalance(address user) external view returns (uint256)',
  'function getPendingReward(address user) external view returns (uint256)',
  'function rewardRate() external view returns (uint256)',
  'function stakingToken() external view returns (address)',
  'function rewardToken() external view returns (address)',
];

export class StakingService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(provider: ethers.Provider, signer: ethers.Signer, network: string) {
    this.signer = signer;
    const addresses = CONTRACTS[network];
    this.contract = new ethers.Contract(
      addresses.stakingRewards,
      STAKING_ABI,
      signer
    );
  }

  // Stake tokens
  async stake(amount: bigint): Promise<ethers.ContractTransactionResponse> {
    // Approve staking token first
    const stakingTokenAddress = await this.contract.stakingToken();
    const tokenContract = new ethers.Contract(
      stakingTokenAddress,
      ['function approve(address spender, uint256 amount) external returns (bool)'],
      this.signer
    );
    await tokenContract.approve(this.contract.target, amount);
    
    return await this.contract.stake(amount);
  }

  // Unstake tokens
  async unstake(amount: bigint): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.unstake(amount);
  }

  // Claim rewards
  async claimReward(): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.claimReward();
  }

  // Get user staking info
  async getUserInfo(userAddress: string): Promise<{
    stakedBalance: bigint;
    pendingReward: bigint;
  }> {
    const [stakedBalance, pendingReward] = await Promise.all([
      this.contract.getStakedBalance(userAddress),
      this.contract.getPendingReward(userAddress),
    ]);
    return { stakedBalance, pendingReward };
  }

  // Get reward rate
  async getRewardRate(): Promise<bigint> {
    return await this.contract.rewardRate();
  }
}
```

---

## 🌉 Bridge Integration

### BridgeService.ts

```typescript
import { ethers } from 'ethers';
import { CONTRACTS, CHAIN_IDS } from '../config/contracts';

const BRIDGE_ABI = [
  'function deposit(address _token, uint256 _amount, uint256 _destinationChainId, address _recipient) external payable returns (uint256 depositId)',
  'function withdraw(bytes32 _depositId, address _token, uint256 _amount, address _recipient, bytes calldata _signature) external',
  'function bridgeFee() external view returns (uint256)',
  'function getTokenAddress(address _token, uint256 _chainId) external view returns (address)',
  'function isSupportedNetwork(uint256 _chainId) external view returns (bool)',
];

export class BridgeService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;
  private network: string;

  constructor(provider: ethers.Provider, signer: ethers.Signer, network: string) {
    this.signer = signer;
    this.network = network;
    const addresses = CONTRACTS[network];
    this.contract = new ethers.Contract(
      addresses.bridge,
      BRIDGE_ABI,
      signer
    );
  }

  // Deposit tokens for cross-chain transfer
  async deposit(
    token: string,
    amount: bigint,
    destinationChainId: number,
    recipient: string
  ): Promise<ethers.ContractTransactionResponse> {
    // Approve token first
    const tokenContract = new ethers.Contract(
      token,
      ['function approve(address spender, uint256 amount) external returns (bool)'],
      this.signer
    );
    await tokenContract.approve(this.contract.target, amount);
    
    // Get bridge fee
    const fee = await this.contract.bridgeFee();
    
    // Execute deposit
    return await this.contract.deposit(token, amount, destinationChainId, recipient, {
      value: fee,
    });
  }

  // Get bridge fee
  async getBridgeFee(): Promise<bigint> {
    return await this.contract.bridgeFee();
  }

  // Check if network is supported
  async isNetworkSupported(chainId: number): Promise<boolean> {
    return await this.contract.isSupportedNetwork(chainId);
  }

  // Get token address on destination chain
  async getTokenAddressOnChain(token: string, chainId: number): Promise<string> {
    return await this.contract.getTokenAddress(token, chainId);
  }
}
```

---

## 🚰 Faucet Integration

### FaucetService.ts

```typescript
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

const FAUCET_ABI = [
  'function drip(address token) external returns (bool)',
  'function getTokenInfo(address token) external view returns (tuple(string symbol, uint8 decimals, uint256 dripAmount, uint256 maxBalance, bool isActive, uint256 faucetBalance))',
  'function getSupportedTokens() external view returns (address[])',
  'function canDrip(address user, address token) external view returns (bool)',
  'function dripInterval() external view returns (uint256)',
];

export class FaucetService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(provider: ethers.Provider, signer: ethers.Signer, network: string) {
    this.signer = signer;
    const addresses = CONTRACTS[network];
    this.contract = new ethers.Contract(
      addresses.faucet,
      FAUCET_ABI,
      signer
    );
  }

  // Request tokens from faucet
  async drip(token: string): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.drip(token);
  }

  // Check if user can drip
  async canDrip(userAddress: string, token: string): Promise<boolean> {
    return await this.contract.canDrip(userAddress, token);
  }

  // Get token info
  async getTokenInfo(token: string): Promise<{
    symbol: string;
    decimals: number;
    dripAmount: bigint;
    maxBalance: bigint;
    isActive: boolean;
    faucetBalance: bigint;
  }> {
    return await this.contract.getTokenInfo(token);
  }

  // Get all supported tokens
  async getSupportedTokens(): Promise<string[]> {
    return await this.contract.getSupportedTokens();
  }

  // Get drip interval
  async getDripInterval(): Promise<bigint> {
    return await this.contract.dripInterval();
  }
}
```

---

## 📊 Transaction Tracker Integration

### TrackerService.ts

```typescript
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

const TRACKER_ABI = [
  'function getGlobalStats() external view returns (uint256 totalTransactions, uint256 totalValue, uint256 lastTransactionTime)',
  'function getContractStats(string contractType) external view returns (uint256 totalTransactions, uint256 totalValue, uint256 lastTransactionTime, bool isActive)',
  'function getAllContractStats() external view returns (tuple(string contractType, uint256 totalTransactions, uint256 totalValue, uint256 lastTransactionTime, bool isActive)[])',
];

export class TrackerService {
  private contract: ethers.Contract;
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider, network: string) {
    this.provider = provider;
    const addresses = CONTRACTS[network];
    this.contract = new ethers.Contract(
      addresses.transactionTracker,
      TRACKER_ABI,
      provider
    );
  }

  // Get global statistics
  async getGlobalStats(): Promise<{
    totalTransactions: bigint;
    totalValue: bigint;
    lastTransactionTime: bigint;
  }> {
    const [totalTransactions, totalValue, lastTransactionTime] = 
      await this.contract.getGlobalStats();
    return { totalTransactions, totalValue, lastTransactionTime };
  }

  // Get stats for specific contract type
  async getContractStats(contractType: string): Promise<{
    totalTransactions: bigint;
    totalValue: bigint;
    lastTransactionTime: bigint;
    isActive: boolean;
  }> {
    const [totalTransactions, totalValue, lastTransactionTime, isActive] = 
      await this.contract.getContractStats(contractType);
    return { totalTransactions, totalValue, lastTransactionTime, isActive };
  }

  // Get all contract stats
  async getAllContractStats(): Promise<Array<{
    contractType: string;
    totalTransactions: bigint;
    totalValue: bigint;
    lastTransactionTime: bigint;
    isActive: boolean;
  }>> {
    return await this.contract.getAllContractStats();
  }
}
```

---

## 🔄 Multi-Network Support

### useWeb3.ts Hook

```typescript
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NETWORKS } from '../config/networks';

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [network, setNetwork] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);

      // Get initial account and chain
      provider.getSigner().then(setSigner);
      provider.getNetwork().then((network) => {
        setChainId(Number(network.chainId));
        // Find network name
        const networkName = Object.entries(NETWORKS).find(
          ([_, config]) => config.chainId === Number(network.chainId)
        )?.[0];
        setNetwork(networkName || null);
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
        provider.getSigner().then(setSigner);
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setChainId(Number(network.chainId));
      
      // Find network name
      const networkName = Object.entries(NETWORKS).find(
        ([_, config]) => config.chainId === Number(network.chainId)
      )?.[0];
      setNetwork(networkName || null);
    }
  };

  const switchNetwork = async (targetChainId: number) => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      } catch (error: any) {
        // Chain not added, add it
        if (error.code === 4902) {
          const networkConfig = Object.values(NETWORKS).find(
            (config) => config.chainId === targetChainId
          );
          if (networkConfig) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${targetChainId.toString(16)}`,
                  chainName: networkConfig.name,
                  nativeCurrency: networkConfig.nativeCurrency,
                  rpcUrls: [networkConfig.rpcUrl],
                  blockExplorerUrls: [networkConfig.explorerUrl],
                },
              ],
            });
          }
        }
      }
    }
  };

  return {
    provider,
    signer,
    account,
    chainId,
    network,
    connect,
    switchNetwork,
  };
}
```

---

## 🎨 Complete Example

### App.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { useWeb3 } from './hooks/useWeb3';
import { SwapService } from './services/SwapService';
import { BuyService } from './services/BuyService';
import { StakingService } from './services/StakingService';
import { BridgeService } from './services/BridgeService';
import { FaucetService } from './services/FaucetService';
import { TrackerService } from './services/TrackerService';
import { CONTRACTS, NETWORKS } from './config/contracts';

function App() {
  const { provider, signer, account, network, connect, switchNetwork } = useWeb3();
  const [swapService, setSwapService] = useState<SwapService | null>(null);
  const [buyService, setBuyService] = useState<BuyService | null>(null);
  const [trackerService, setTrackerService] = useState<TrackerService | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (provider && signer && network) {
      setSwapService(new SwapService(provider, signer, network));
      setBuyService(new BuyService(provider, signer, network));
      setTrackerService(new TrackerService(provider, network));
    }
  }, [provider, signer, network]);

  // Update stats every 5 seconds
  useEffect(() => {
    if (!trackerService) return;

    const updateStats = async () => {
      const globalStats = await trackerService.getGlobalStats();
      setStats(globalStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [trackerService]);

  const handleSwap = async () => {
    if (!swapService || !network) return;
    
    const addresses = CONTRACTS[network];
    const amountIn = ethers.parseUnits('100', 6); // 100 USDT
    const minAmountOut = await swapService.getQuote(
      addresses.tokens.USDT,
      addresses.tokens.USDC,
      amountIn
    );
    
    await swapService.swap(
      addresses.tokens.USDT,
      addresses.tokens.USDC,
      amountIn,
      minAmountOut,
      account!
    );
  };

  const handleBuy = async () => {
    if (!buyService) return;
    
    const nativeAmount = ethers.parseEther('0.1');
    const usdcAmount = await buyService.getUSDCAmount(nativeAmount);
    const minAmount = usdcAmount * 95n / 100n; // 5% slippage
    
    await buyService.buyUSDC(nativeAmount, minAmount);
  };

  if (!account) {
    return (
      <div>
        <button onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div>
      <div>
        <p>Network: {network}</p>
        <p>Account: {account}</p>
        {stats && (
          <div>
            <p>Total Transactions: {stats.totalTransactions.toString()}</p>
            <p>Total Value: ${ethers.formatEther(stats.totalValue)}</p>
          </div>
        )}
      </div>
      
      <div>
        <button onClick={handleSwap}>Swap USDT → USDC</button>
        <button onClick={handleBuy}>Buy USDC</button>
      </div>

      <div>
        <h3>Switch Network</h3>
        {Object.entries(NETWORKS).map(([name, config]) => (
          <button
            key={name}
            onClick={() => switchNetwork(config.chainId)}
          >
            {config.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
```

---

## 📚 Additional Resources

- **Contract ABIs**: Available in `artifacts/contracts/` directory
- **TypeScript Types**: Generated in `typechain-types/` directory
- **Testing Examples**: See `scripts/` directory for interaction examples

---

## 🔒 Security Best Practices

1. **Always validate user input** before sending transactions
2. **Check token approvals** before executing swaps/stakes
3. **Handle errors gracefully** with try-catch blocks
4. **Use slippage protection** for all swaps
5. **Verify network** before executing transactions
6. **Display transaction status** to users
7. **Handle transaction failures** with user-friendly messages

---

## 🐛 Troubleshooting

### Common Issues

1. **"User rejected transaction"**: User cancelled in wallet
2. **"Insufficient funds"**: Not enough native currency for gas
3. **"Token approval required"**: Need to approve token spending first
4. **"Network mismatch"**: Wrong network selected in wallet
5. **"Contract not found"**: Check contract address for current network

---

**This guide provides complete integration for all contracts across all networks. Use the service classes to interact with each contract type, and the useWeb3 hook to manage wallet connections and network switching.**

