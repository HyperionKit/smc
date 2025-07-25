# SMC Cross-Chain Bridge Protocol

A comprehensive cross-chain bridge and messaging system deployed across Metis networks for seamless token transfers and communication between different blockchains.

## 🏗️ Architecture Overview

The SMC Bridge Protocol implements a **Lock & Mint** bridge architecture with the following components:

### Core Contracts

1. **Bridge.sol** - Main bridge contract handling token deposits and withdrawals
2. **WrappedTokenFactory.sol** - Factory for creating and managing wrapped tokens
3. **MessageSender.sol** - Handles cross-chain message sending
4. **MessageReceiver.sol** - Processes incoming cross-chain messages
5. **Relayer.sol** - On-chain relayer for processing bridge requests
6. **SimpleERC20.sol** - Simple ERC20 token implementation for test networks

### Bridge Flow

```
User (Chain A) → Bridge.deposit() → Tokens Locked → Event Emitted
                ↓
            Relayer (Off-chain) → Monitor Events → Create Relay Request
                ↓
            Bridge (Chain B) → withdraw() → Tokens Minted/Unlocked
```

## 🚀 Features

- **Lock & Mint Bridge**: Secure token bridging with wrapped token support
- **Multi-Chain Support**: Deployed on Hyperion, Metis Sepolia, and Lazchain
- **Role-Based Access Control**: Secure permission management
- **Reentrancy Protection**: Protection against reentrancy attacks
- **Daily Limits**: Configurable daily transfer limits
- **Emergency Controls**: Pause/unpause functionality
- **Event Monitoring**: Comprehensive event logging for transparency
- **Complete Token Support**: All major tokens (USDT, DAI, WETH, WBTC, WMETIS) deployed and configured

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- Hardhat
- Metamask or similar wallet
- Access to Metis network RPC endpoints

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd SMC

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
# Private key for deployment
PRIVATE_KEY=your_private_key_here

# RPC URLs
HYPERION_RPC_URL=https://hyperion-testnet.metisdevops.link
METIS_SEPOLIA_RPC_URL=https://metis-sepolia-rpc.publicnode.com
LAZCHAIN_RPC_URL=https://lazai-testnet.metisdevops.link
```

## 🚀 Deployment Status

### ✅ All Networks Successfully Deployed

The bridge system has been successfully deployed across all three networks with complete token support:

#### **Hyperion (Chain ID: 133717)**
- **Bridge**: `0xde1a73D5B10fA76bD34d0A5Cbe32B98f71aBf3c5`
- **WrappedTokenFactory**: `0xE4963e82980D43084EA2727f79296c2CF1E83BD4`
- **Relayer**: `0x21a3C78C9f1EA96A9d9237923Fe6aa5f6dE70E50`
- **MessageSender**: `0x40c99ce650539343469227bf2CF6a50464c462ac`
- **MessageReceiver**: `0x5E611953702Ee324F3449c3dD30bb0830910d860`

#### **Lazchain (Chain ID: 133718)**
- **Bridge**: `0xBeD930CdDA3C055543B94C5705cAaf515676e7d0`
- **WrappedTokenFactory**: `0x0e04CB9E80579aA464Af122457fa2c477c126868`
- **Relayer**: `0x39425b0c9fC5652939652a647fB9d3F9556A8fb5`
- **MessageSender**: `0xB12e09416f59B4b2D55C9b6f02DFe904D787ed30`
- **MessageReceiver**: `0x358cA843FB26f7FFf6A5C9Cd953e91CD6c201824`

#### **Metis Sepolia (Chain ID: 59902)**
- **Bridge**: `0xB12e09416f59B4b2D55C9b6f02DFe904D787ed30`
- **WrappedTokenFactory**: `0x358cA843FB26f7FFf6A5C9Cd953e91CD6c201824`
- **Relayer**: `0x43d8de17246A99286AEF50766B3767eC99D9D77D`
- **MessageSender**: `0xE35043F1D5883DeBDB7969200D000feD5a83e4eB`
- **MessageReceiver**: `0x7d36cb23D321E51867d39beA50E460f0ed8Db640`

## 💰 Token Contracts

### **Hyperion Tokens** (Existing)
- **USDT**: `0x3c099E287eC71b4AA61A7110287D715389329237`
- **DAI**: `0xc4c33c42684ad16e84800c25d5dE7B650E9F95Ca`
- **WETH**: `0x9AB236Ec38492099a4d35552e6dC7D9442607f9A`
- **WBTC**: `0x63d940F5b04235aba7E921a3b508aB1360D32706`
- **WMETIS**: `0x94765A5Ad79aE18c6913449Bf008A0B5f247D301`

### **Lazchain Tokens** (Newly Deployed)
- **USDT**: `0x2a674069ACe9DEeDCCde6643e010879Df93109D7`
- **DAI**: `0xABA4D433F08441E27aCD0A52503b9e4Ffb339145`
- **WETH**: `0x95526419b7c0d0A89De72C72b0fde0BBBd2075a0`
- **WBTC**: `0xa9924388E4B07CC302746578e3D998acF876E007`
- **WMETIS**: `0xaD519266FeC8D387d716d4605968E3028346b3f7`

### **Metis Sepolia Tokens** (Newly Deployed)
- **USDT**: `0xa9924388E4B07CC302746578e3D998acF876E007`
- **DAI**: `0xaD519266FeC8D387d716d4605968E3028346b3f7`
- **WETH**: `0x51d4D1E96999D1000F3074b194a9590fbf2892fC`
- **WBTC**: `0x5b97A5DECF36Acf95b0Aff9b02b792B9Cf0b6576`
- **WMETIS**: `0x805facACF938e5F31C33D11C906f18A26ee82a1A`

## 🔄 Bridge Usage

### For Users

#### 1. Bridge Tokens Out (Lock)

```javascript
// Approve tokens first
await token.approve(bridgeAddress, amount);

// Deposit tokens to bridge
await bridge.deposit(
    tokenAddress,    // Token to bridge
    recipient,       // Recipient on target chain
    amount,          // Amount to bridge
    targetChainId    // Target chain ID
);
```

#### 2. Bridge Tokens Back (Burn Wrapped Tokens)

```javascript
// Burn wrapped tokens
await wrappedTokenFactory.burnWrappedTokens(
    wrappedTokenAddress,
    amount,
    targetChainId
);
```

### For Relayers

#### 1. Start the Relayer

```bash
node scripts/relayer-standalone.js
```

The relayer will:
- Monitor bridge events across all networks
- Process cross-chain transfers
- Handle proof verification
- Execute withdrawals on target chains

#### 2. Manual Relay Processing

```javascript
// Create relay request
await relayer.createRelayRequest(
    depositTxHash,
    sender,
    recipient,
    token,
    amount,
    sourceChainId,
    targetChainId,
    proof
);

// Process relay after timeout
await relayer.processRelay(relayId);
```

## 🔧 Available Scripts

### **Deployment Scripts**
- `npx hardhat run scripts/deploy-single.js --network <network>` - Deploy to single network
- `npx hardhat run scripts/deploy-tokens.js --network <network>` - Deploy token contracts

### **Management Scripts**
- `node scripts/update-bridge-tokens.js` - Update bridge with new token addresses
- `node scripts/add-supported-token.js` - Add tokens to bridge support

### **Testing Scripts**
- `node scripts/test-bridge-complete.js` - Comprehensive bridge system test
- `node scripts/bridge-transfer-direct.js` - Test bridge transfers
- `node scripts/check-balances.js` - Check token balances across networks

### **Operational Scripts**
- `node scripts/relayer-standalone.js` - Run the bridge relayer
- `node scripts/check-bridge-config.js` - Check bridge configuration

## 🔧 Admin Functions

### Bridge Management

```javascript
// Add supported token
await bridge.addSupportedToken(
    tokenAddress,
    minAmount,
    maxAmount,
    dailyLimit
);

// Update token config
await bridge.updateTokenConfig(
    tokenAddress,
    newMinAmount,
    newMaxAmount,
    newDailyLimit
);

// Set bridge delay
await bridge.setBridgeDelay(newDelay);

// Emergency pause
await bridge.pause();
await bridge.unpause();
```

### Relayer Management

```javascript
// Add validator
await relayer.addValidator(validatorAddress);

// Remove validator
await relayer.removeValidator(validatorAddress);

// Pause relayer
await relayer.pause();
await relayer.unpause();
```

## 🧪 Testing

```bash
# Run comprehensive bridge test
node scripts/test-bridge-complete.js

# Test bridge transfers
node scripts/bridge-transfer-direct.js

# Check balances across networks
node scripts/check-balances.js

# Run Hardhat tests
npx hardhat test

# Run with coverage
npx hardhat coverage
```

## 📊 Monitoring

### Events to Monitor

- `BridgeDeposit` - When tokens are deposited for bridging
- `BridgeWithdraw` - When tokens are withdrawn on target chain
- `RelayRequestCreated` - When relay request is created
- `RelayProcessed` - When relay is processed
- `TokensMinted` - When wrapped tokens are minted
- `TokensBurned` - When wrapped tokens are burned

### Network Status

The relayer script provides real-time network status monitoring:

```bash
node scripts/relayer-standalone.js
```

This will show:
- Connection status for each network
- Current block numbers
- Gas prices
- Active relay requests

## 🔒 Security Features

- **Reentrancy Protection**: All critical functions protected
- **Role-Based Access**: Granular permission control
- **Daily Limits**: Prevent large-scale attacks
- **Proof Verification**: Cryptographic proof validation
- **Emergency Pause**: Quick response to threats
- **Transaction Replay Protection**: Unique nonces and hashes

## 🚨 Emergency Procedures

### Pause Bridge

```javascript
// Pause all bridge operations
await bridge.pause();

// Pause relayer
await relayer.pause();
```

### Emergency Withdraw

```javascript
// Emergency withdraw all tokens
await bridge.emergencyWithdraw(tokenAddress, recipient);
```

## 📈 Gas Optimization

- Batch operations for multiple transfers
- Efficient event indexing
- Optimized storage patterns
- Minimal external calls

## 🔄 Upgrade Path

The bridge system is designed to be upgradeable:

1. **Proxy Pattern**: Can be upgraded to use proxy contracts
2. **Modular Design**: Individual components can be upgraded
3. **Backward Compatibility**: Maintains compatibility with existing tokens

## 🎯 Current Status

### ✅ **FULLY OPERATIONAL**

- **All Networks**: Hyperion, Lazchain, Metis Sepolia ✅
- **All Tokens**: USDT, DAI, WETH, WBTC, WMETIS ✅
- **Bridge Contracts**: Deployed and configured ✅
- **Token Contracts**: Deployed with balances ✅
- **Bridge Support**: All tokens supported ✅
- **Relayer System**: Ready for operation ✅

### **Available Balances**
- **Hyperion**: 1,347.299886 USDT available for bridging
- **Lazchain**: 1,000,000 of each token available
- **Metis Sepolia**: 1,000,000 of each token available

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation

## 🔗 Links

- [Metis Documentation](https://docs.metis.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs/)
