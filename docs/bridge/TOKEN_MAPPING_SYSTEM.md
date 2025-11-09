# 🌉 Bridge Token Mapping System

## Overview

The Bridge contract implements a sophisticated **token mapping system** that enables cross-chain transfers of equivalent tokens across different networks, even when they have different contract addresses.

## 🎯 Problem Solved

**Challenge**: How to recognize that these tokens are the same across networks?
- **Hyperion USDT**: `0x9b52D326D4866055F6c23297656002992e4293FC`
- **Lazchain USDT**: `0xCc752FaCdF711D338F35D073F44f363CbC624a6c`
- **Metis Sepolia USDT**: `0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898`

**Solution**: Token mapping system using **symbols** as the universal identifier.

## 🔧 How It Works

### 1. **Symbol-Based Mapping**
```solidity
// Token mapping: symbol => chainId => tokenAddress
mapping(string => mapping(uint256 => address)) public tokenAddresses;

// Reverse mapping: tokenAddress => symbol
mapping(address => string) public addressToSymbol;

// Token decimals mapping: symbol => chainId => decimals
mapping(string => mapping(uint256 => uint8)) public tokenDecimals;

// Active tokens per chain: chainId => symbol[] => bool
mapping(uint256 => mapping(string => bool)) public activeTokens;
```

### 2. **Cross-Chain Token Recognition**

When a user deposits USDT on Hyperion to bridge to Lazchain:

1. **Input**: USDT address on Hyperion (`0x9b52D326D4866055F6c23297656002992e4293FC`)
2. **Lookup**: Contract finds the symbol "USDT" for this address
3. **Mapping**: Contract maps "USDT" to the equivalent address on Lazchain (`0xCc752FaCdF711D338F35D073F44f363CbC624a6c`)
4. **Validation**: Ensures USDT is active on both source and destination chains
5. **Processing**: Proceeds with the cross-chain transfer

### 3. **Token Configuration Process**

```typescript
// Add USDT mapping for all networks
await bridge.addToken("0x9b52D326D4866055F6c23297656002992e4293FC", "USDT", 133717, 6); // Hyperion
await bridge.addToken("0xCc752FaCdF711D338F35D073F44f363CbC624a6c", "USDT", 133713, 6);  // Lazchain
await bridge.addToken("0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898", "USDT", 59902, 6);   // Metis Sepolia
```

## 📊 Current Token Mappings

### USDT (6 decimals)
| Network | Chain ID | Address |
|---------|----------|---------|
| Hyperion | 133717 | `0x9b52D326D4866055F6c23297656002992e4293FC` |
| Lazchain | 133713 | `0xCc752FaCdF711D338F35D073F44f363CbC624a6c` |
| Metis Sepolia | 59902 | `0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898` |

### USDC (6 decimals)
| Network | Chain ID | Address |
|---------|----------|---------|
| Hyperion | 133717 | `0x31424DB0B7a929283C394b4DA412253Ab6D61682` |
| Lazchain | 133713 | `0x77Db75D0bDcE5A03b5c35dDBff1F18dA4161Bc2f` |
| Metis Sepolia | 59902 | `0x16d44fBBc8E1F3FBB6ac0674a44EECfa528604DD` |

### DAI (18 decimals)
| Network | Chain ID | Address |
|---------|----------|---------|
| Hyperion | 133717 | `0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb` |
| Lazchain | 133713 | `0x3391955a3F863843351eC119cb83958bFa98096c` |
| Metis Sepolia | 59902 | `0x23E380def17aAA8554297069422039517B2997b9` |

### WETH (18 decimals)
| Network | Chain ID | Address |
|---------|----------|---------|
| Hyperion | 133717 | `0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4` |
| Lazchain | 133713 | `0x7adF2929085ED1bA7C55c61d738193D62f925Cf3` |
| Metis Sepolia | 59902 | `0x1A3d532875aD585776c814E7749a5e7a58b3E49b` |

## 🔍 Key Functions

### View Functions
```solidity
// Get token address for a symbol on a specific chain
function getTokenAddress(string calldata symbol, uint256 chainId) external view returns (address);

// Get token symbol for an address
function getTokenSymbol(address token) external view returns (string memory);

// Get token decimals for a symbol on a specific chain
function getTokenDecimals(string calldata symbol, uint256 chainId) external view returns (uint8);

// Check if token is active on a specific chain
function isTokenActive(string calldata symbol, uint256 chainId) external view returns (bool);

// Get all token mappings for a symbol
function getTokenMappings(string calldata symbol) external view returns (TokenMapping[] memory);
```

### Admin Functions
```solidity
// Add a supported token with mapping
function addToken(address token, string calldata symbol, uint256 chainId, uint8 decimals) external onlyOwner;

// Remove a supported token
function removeToken(address token, uint256 chainId) external onlyOwner;
```

## 🚀 Usage Examples

### 1. **Deposit USDT from Hyperion to Lazchain**
```typescript
// User has USDT on Hyperion and wants to bridge to Lazchain
const hyperionUSDT = "0x9b52D326D4866055F6c23297656002992e4293FC";
const amount = ethers.parseUnits("100", 6); // 100 USDT
const destinationChainId = 133713; // Lazchain
const destinationAddress = user.address;

// Bridge automatically maps Hyperion USDT to Lazchain USDT
await bridge.deposit(hyperionUSDT, amount, destinationChainId, destinationAddress, { value: bridgeFee });
```

### 2. **Query Token Mappings**
```typescript
// Get all USDT mappings across networks
const usdtMappings = await bridge.getTokenMappings("USDT");
console.log(`USDT is available on ${usdtMappings.length} networks`);

// Get specific token address
const lazchainUSDT = await bridge.getTokenAddress("USDT", 133713);
console.log(`Lazchain USDT address: ${lazchainUSDT}`);
```

### 3. **Verify Token Support**
```typescript
// Check if USDT is active on Metis Sepolia
const isActive = await bridge.isTokenActive("USDT", 59902);
console.log(`USDT active on Metis Sepolia: ${isActive}`);

// Get token decimals
const decimals = await bridge.getTokenDecimals("USDT", 59902);
console.log(`USDT decimals on Metis Sepolia: ${decimals}`);
```

## 🔒 Security Features

### 1. **Symbol Validation**
- Only tokens with registered symbols can be bridged
- Prevents bridging of unknown or malicious tokens

### 2. **Cross-Chain Verification**
- Verifies token is active on both source and destination chains
- Prevents bridging to unsupported networks

### 3. **Decimal Consistency**
- Stores and validates token decimals per network
- Ensures proper amount calculations across chains

### 4. **Owner Controls**
- Only bridge owner can add/remove token mappings
- Prevents unauthorized token additions

## 📈 Benefits

### 1. **Universal Recognition**
- Same token symbol recognized across all networks
- No need to remember different addresses per network

### 2. **Scalability**
- Easy to add new tokens and networks
- Flexible mapping system supports any ERC20 token

### 3. **User Experience**
- Users only need to know the token symbol
- Bridge handles all address mapping automatically

### 4. **Maintainability**
- Centralized token management
- Easy to update mappings when tokens are redeployed

## 🔄 Workflow Example

### Complete Cross-Chain Transfer Flow

1. **User Initiates Transfer**
   ```
   User wants to bridge 100 USDT from Hyperion to Lazchain
   ```

2. **Token Recognition**
   ```
   Input: 0x9b52D326D4866055F6c23297656002992e4293FC (Hyperion USDT)
   Lookup: addressToSymbol[token] → "USDT"
   ```

3. **Cross-Chain Mapping**
   ```
   Symbol: "USDT"
   Source Chain: 133717 (Hyperion)
   Destination Chain: 133713 (Lazchain)
   Mapped Address: 0xCc752FaCdF711D338F35D073F44f363CbC624a6c
   ```

4. **Validation**
   ```
   Check: activeTokens[133717]["USDT"] → true
   Check: activeTokens[133713]["USDT"] → true
   Check: supportedChains[133713] → true
   ```

5. **Processing**
   ```
   Transfer: 100 USDT from user to bridge on Hyperion
   Event: TokenDeposited with deposit ID
   ```

6. **Relayer Processing**
   ```
   Relayer monitors deposit events
   Processes withdrawal on Lazchain
   Transfers: 100 USDT from bridge to user on Lazchain
   ```

## 🎯 Key Advantages

- **🔗 Universal Compatibility**: Works with any ERC20 token
- **🌐 Multi-Network Support**: Seamless cross-chain transfers
- **🛡️ Security**: Comprehensive validation and access controls
- **📊 Transparency**: All mappings are publicly viewable
- **⚡ Efficiency**: Fast token recognition and processing
- **🔧 Flexibility**: Easy to add new tokens and networks

This token mapping system ensures that users can seamlessly bridge their tokens across different networks without worrying about different contract addresses, making the cross-chain experience smooth and intuitive. 