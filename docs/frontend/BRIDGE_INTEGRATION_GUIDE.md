# Bridge Contract Integration Guide - TypeScript

## 🚨 **Current Issue Analysis**

Your Bridge contract call is failing because of incorrect argument ordering. The transaction data shows:

```
Function: deposit(address _token, uint256 _amount, uint256 _destinationChainId, address _recipient)
Arguments: [USDC_ADDRESS, 133713, MISSING, MISSING]
```

**Problem**: You're passing the Chain ID (133713) as the amount, and missing the destination chain ID and recipient address.

## ✅ **Correct Bridge Integration**

### 1. **Bridge Contract Interface**

```typescript
// Bridge contract ABI (essential functions only)
const BRIDGE_ABI = [
  {
    "inputs": [
      {"name": "_token", "type": "address"},
      {"name": "_amount", "type": "uint256"},
      {"name": "_destinationChainId", "type": "uint256"},
      {"name": "_recipient", "type": "address"}
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bridgeFee",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses
const CONTRACTS = {
  BRIDGE: "0xfF064Fd496256e84b68dAE2509eDA84a3c235550",
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

// Network chain IDs
const NETWORKS = {
  HYPERION: 133717,
  LAZCHAIN: 133713,
  METIS_SEPOLIA: 59902
};
```

### 2. **Bridge Service Class**

```typescript
import { ethers } from 'ethers';

export class BridgeService {
  private bridgeContract: ethers.Contract;
  private provider: ethers.Provider;
  private signer: ethers.Signer;

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.bridgeContract = new ethers.Contract(CONTRACTS.BRIDGE, BRIDGE_ABI, signer);
  }

  /**
   * Bridge tokens to another network
   */
  async bridgeTokens(
    tokenAddress: string,
    amount: string, // Amount in token decimals (e.g., "1.5" for 1.5 USDC)
    destinationChainId: number,
    recipientAddress: string
  ) {
    try {
      // 1. Get token contract to check decimals
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function decimals() view returns (uint8)'],
        this.provider
      );
      
      const decimals = await tokenContract.decimals();
      
      // 2. Convert amount to proper format
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      // 3. Get bridge fee
      const bridgeFee = await this.bridgeContract.bridgeFee();
      
      // 4. Approve tokens first (if not already approved)
      await this.approveTokens(tokenAddress, amountInWei);
      
      // 5. Call deposit function with correct arguments
      const tx = await this.bridgeContract.deposit(
        tokenAddress,           // _token
        amountInWei,           // _amount (correct format)
        destinationChainId,    // _destinationChainId
        recipientAddress,      // _recipient
        {
          value: bridgeFee     // Bridge fee in ETH
        }
      );
      
      // 6. Wait for transaction
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        amount: amount,
        destinationChainId: destinationChainId,
        recipient: recipientAddress
      };
      
    } catch (error: any) {
      console.error('Bridge error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Approve tokens for bridge contract
   */
  private async approveTokens(tokenAddress: string, amount: bigint) {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ],
      this.signer
    );

    // Check current allowance
    const currentAllowance = await tokenContract.allowance(
      await this.signer.getAddress(),
      CONTRACTS.BRIDGE
    );

    // If allowance is insufficient, approve
    if (currentAllowance < amount) {
      const approveTx = await tokenContract.approve(CONTRACTS.BRIDGE, amount);
      await approveTx.wait();
      console.log('Tokens approved for bridge');
    }
  }

  /**
   * Get bridge fee
   */
  async getBridgeFee(): Promise<string> {
    const fee = await this.bridgeContract.bridgeFee();
    return ethers.formatEther(fee);
  }

  /**
   * Get user's token balance
   */
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function balanceOf(address account) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ],
      this.provider
    );

    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(userAddress),
      tokenContract.decimals()
    ]);

    return ethers.formatUnits(balance, decimals);
  }
}
```

### 3. **React Component Integration**

```typescript
import React, { useState, useEffect } from 'react';
import { useAccount, useProvider, useSigner } from 'wagmi';
import { BridgeService } from './BridgeService';

interface BridgeFormData {
  tokenAddress: string;
  amount: string;
  destinationChainId: number;
  recipientAddress: string;
}

export const BridgeComponent: React.FC = () => {
  const { address } = useAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();
  
  const [bridgeService, setBridgeService] = useState<BridgeService | null>(null);
  const [formData, setFormData] = useState<BridgeFormData>({
    tokenAddress: CONTRACTS.USDC,
    amount: '',
    destinationChainId: NETWORKS.LAZCHAIN,
    recipientAddress: address || ''
  });
  const [bridgeFee, setBridgeFee] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (provider && signer) {
      const service = new BridgeService(provider, signer);
      setBridgeService(service);
      loadBridgeInfo();
    }
  }, [provider, signer]);

  useEffect(() => {
    if (bridgeService && address && formData.tokenAddress) {
      loadTokenBalance();
    }
  }, [bridgeService, address, formData.tokenAddress]);

  const loadBridgeInfo = async () => {
    if (!bridgeService) return;
    
    try {
      const fee = await bridgeService.getBridgeFee();
      setBridgeFee(fee);
    } catch (error) {
      console.error('Error loading bridge fee:', error);
    }
  };

  const loadTokenBalance = async () => {
    if (!bridgeService || !address) return;
    
    try {
      const balance = await bridgeService.getTokenBalance(formData.tokenAddress, address);
      setTokenBalance(balance);
    } catch (error) {
      console.error('Error loading token balance:', error);
    }
  };

  const handleBridge = async () => {
    if (!bridgeService || !formData.amount || !formData.recipientAddress) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await bridgeService.bridgeTokens(
        formData.tokenAddress,
        formData.amount,
        formData.destinationChainId,
        formData.recipientAddress
      );

      if (result.success) {
        alert(`Bridge successful! TX: ${result.transactionHash}`);
        // Reset form
        setFormData(prev => ({ ...prev, amount: '' }));
      } else {
        setError(result.error || 'Bridge failed');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxAmount = () => {
    setFormData(prev => ({ ...prev, amount: tokenBalance }));
  };

  return (
    <div className="bridge-container">
      <h2>Bridge Tokens</h2>
      
      {/* Token Selection */}
      <div className="form-group">
        <label>Select Token:</label>
        <select
          value={formData.tokenAddress}
          onChange={(e) => setFormData(prev => ({ ...prev, tokenAddress: e.target.value }))}
        >
          <option value={CONTRACTS.USDT}>USDT</option>
          <option value={CONTRACTS.USDC}>USDC</option>
          <option value={CONTRACTS.DAI}>DAI</option>
          <option value={CONTRACTS.WETH}>WETH</option>
        </select>
      </div>

      {/* Amount Input */}
      <div className="form-group">
        <label>Amount:</label>
        <div className="amount-input">
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="Enter amount"
          />
          <button type="button" onClick={handleMaxAmount}>Max</button>
        </div>
        <small>Balance: {tokenBalance}</small>
      </div>

      {/* Destination Network */}
      <div className="form-group">
        <label>Destination Network:</label>
        <select
          value={formData.destinationChainId}
          onChange={(e) => setFormData(prev => ({ ...prev, destinationChainId: Number(e.target.value) }))}
        >
          <option value={NETWORKS.LAZCHAIN}>Lazchain</option>
          <option value={NETWORKS.METIS_SEPOLIA}>Metis Sepolia</option>
        </select>
      </div>

      {/* Recipient Address */}
      <div className="form-group">
        <label>Recipient Address:</label>
        <input
          type="text"
          value={formData.recipientAddress}
          onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))}
          placeholder="0x..."
        />
      </div>

      {/* Bridge Fee Info */}
      <div className="bridge-info">
        <p>Bridge Fee: {bridgeFee} ETH</p>
        <p>Estimated Time: ~5 minutes</p>
      </div>

      {/* Error Display */}
      {error && <div className="error">{error}</div>}

      {/* Bridge Button */}
      <button
        onClick={handleBridge}
        disabled={isLoading || !formData.amount || !formData.recipientAddress}
        className="bridge-button"
      >
        {isLoading ? 'Bridging...' : 'Bridge Tokens'}
      </button>
    </div>
  );
};
```

### 4. **Usage Example**

```typescript
// In your main app component
import { BridgeComponent } from './BridgeComponent';

function App() {
  return (
    <div>
      <h1>DeFi Bridge</h1>
      <BridgeComponent />
    </div>
  );
}
```

## 🔧 **Key Fixes for Your Current Issue**

### 1. **Correct Argument Order**
```typescript
// ❌ WRONG (what you're doing)
bridgeContract.deposit(
  tokenAddress,     // USDC address
  133713,          // Chain ID as amount (WRONG!)
  // Missing arguments
);

// ✅ CORRECT
bridgeContract.deposit(
  tokenAddress,           // USDC address
  ethers.parseUnits("1", 6), // 1 USDC (6 decimals)
  133713,                // Destination chain ID
  recipientAddress,      // Recipient address
  { value: bridgeFee }   // Bridge fee in ETH
);
```

### 2. **Token Approval Required**
```typescript
// Always approve tokens before bridging
await tokenContract.approve(bridgeAddress, amount);
```

### 3. **Include Bridge Fee**
```typescript
// Bridge fee must be sent with the transaction
const bridgeFee = await bridgeContract.bridgeFee();
await bridgeContract.deposit(..., { value: bridgeFee });
```

## 🚨 **Common Mistakes to Avoid**

1. **❌ Passing Chain ID as Amount**: `133713` is not a valid token amount
2. **❌ Missing Token Approval**: Must approve bridge contract to spend tokens
3. **❌ Missing Bridge Fee**: Must send ETH for bridge fee
4. **❌ Wrong Decimal Conversion**: USDC has 6 decimals, not 18
5. **❌ Missing Arguments**: All 4 arguments are required

## ✅ **Testing Your Integration**

```typescript
// Test function to verify your integration
async function testBridgeIntegration() {
  const bridgeService = new BridgeService(provider, signer);
  
  const result = await bridgeService.bridgeTokens(
    CONTRACTS.USDC,           // USDC token
    "1",                      // 1 USDC
    NETWORKS.LAZCHAIN,        // To Lazchain
    "0xYourRecipientAddress"  // Recipient
  );
  
  console.log('Bridge result:', result);
}
```

This should resolve your Bridge contract integration issues. The key is ensuring the arguments are passed in the correct order and format! 🎯 