# Bridge Compatibility Matrix

This document provides a comprehensive overview of bridge compatibility across all supported networks in the DeFi ecosystem.

## 🌐 Network Compatibility Matrix

### Supported Networks

| Network | Chain ID | Status | Bridge Deployed |
|---------|----------|--------|-----------------|
| Hyperion Testnet | 133717 | ✅ Active | ✅ Yes |
| Mantle Testnet | 5003 | ✅ Active | ⏳ Pending |
| Mantle Mainnet | 5000 | ✅ Active | ⏳ Pending |
| Lazchain Testnet | 133718 | ✅ Active | ⏳ Pending |
| Metis Sepolia Testnet | 59902 | ✅ Active | ⏳ Pending |

### Cross-Network Compatibility

The bridge system supports bidirectional transfers between all compatible networks. Once a bridge is deployed on any network, it can communicate with bridges on other compatible networks.

#### Compatibility Rules

1. **Hyperion Testnet** (133717)
   - Compatible with: Mantle Testnet, Mantle Mainnet, Lazchain, Metis Sepolia
   - Bridge Status: ✅ Deployed

2. **Mantle Testnet** (5003)
   - Compatible with: Hyperion, Mantle Mainnet, Lazchain, Metis Sepolia
   - Bridge Status: ⏳ Pending Deployment

3. **Mantle Mainnet** (5000)
   - Compatible with: Hyperion, Mantle Testnet, Lazchain, Metis Sepolia
   - Bridge Status: ⏳ Pending Deployment

4. **Lazchain Testnet** (133718)
   - Compatible with: Hyperion, Mantle Testnet, Mantle Mainnet, Metis Sepolia
   - Bridge Status: ⏳ Pending Deployment

5. **Metis Sepolia Testnet** (59902)
   - Compatible with: Hyperion, Mantle Testnet, Mantle Mainnet, Lazchain
   - Bridge Status: ⏳ Pending Deployment

## 💰 Token Mappings

All supported tokens are mapped across all networks using a symbol-based mapping system. The bridge uses the token symbol (USDT, USDC, DAI, WETH) to identify corresponding tokens on different networks.

### Token Addresses by Network

#### USDT (6 decimals)

| Network | Chain ID | Address |
|---------|----------|---------|
| Hyperion | 133717 | `0x9b52D326D4866055F6c23297656002992e4293FC` |
| Mantle Testnet | 5003 | `0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b` |
| Mantle Mainnet | 5000 | `TBD` |
| Lazchain | 133718 | `0x9D81C1a89bE608417B5Bb1C1cF5858594D01E8a3` |
| Metis Sepolia | 59902 | `0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898` |

#### USDC (6 decimals)

| Network | Chain ID | Address |
|---------|----------|---------|
| Hyperion | 133717 | `0x31424DB0B7a929283C394b4DA412253Ab6D61682` |
| Mantle Testnet | 5003 | `0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE` |
| Mantle Mainnet | 5000 | `TBD` |
| Lazchain | 133718 | `0x677B021cCBA318A93BACB1653fD7bE0882ceE9Fd` |
| Metis Sepolia | 59902 | `0x16d44fBBc8E1F3FBB6ac0674a44EECfa528604DD` |

#### DAI (18 decimals)

| Network | Chain ID | Address |
|---------|----------|---------|
| Hyperion | 133717 | `0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb` |
| Mantle Testnet | 5003 | `0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a` |
| Mantle Mainnet | 5000 | `TBD` |
| Lazchain | 133718 | `0xeC53e4a54b3AB36fb684966c222Ff6f347C7e84c` |
| Metis Sepolia | 59902 | `0x23E380def17aAA8554297069422039517B2997b9` |

#### WETH (18 decimals)

| Network | Chain ID | Address |
|---------|----------|---------|
| Hyperion | 133717 | `0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4` |
| Mantle Testnet | 5003 | `0xCa7b49d1C243a9289aE2316051eb15146125914d` |
| Mantle Mainnet | 5000 | `TBD` |
| Lazchain | 133718 | `0xef63df9fa0E5f79127AaC0B2a0ec969CC30be532` |
| Metis Sepolia | 59902 | `0x1A3d532875aD585776c814E7749a5e7a58b3E49b` |

## 🔄 Transfer Flow

### Deposit Process

1. User calls `deposit()` on the source network bridge
2. Tokens are locked in the bridge contract
3. Bridge emits a `Deposit` event with deposit details
4. Relayer monitors the event and creates a signature
5. User (or relayer) calls `withdraw()` on the destination network bridge with the signature
6. Tokens are released to the user on the destination network

### Withdrawal Process

1. User provides deposit details and relayer signature
2. Bridge verifies the signature and deposit validity
3. If valid, tokens are transferred to the user
4. Bridge emits a `Withdrawal` event

## 🚀 Deployment Status

### Current Deployment Status

| Network | Bridge Address | Deployment Date | Status |
|---------|---------------|-----------------|--------|
| Hyperion | `0xfF064Fd496256e84b68dAE2509eDA84a3c235550` | 2024 | ✅ Deployed |
| Mantle Testnet | `TBD` | TBD | ⏳ Pending |
| Mantle Mainnet | `TBD` | TBD | ⏳ Pending |
| Lazchain | `TBD` | TBD | ⏳ Pending |
| Metis Sepolia | `TBD` | TBD | ⏳ Pending |

### Deployment Commands

```bash
# Deploy bridge on Hyperion
npx hardhat run scripts/bridge/deploy-bridge-contract.ts --network hyperion

# Deploy bridge on Mantle Testnet
npx hardhat run scripts/bridge/deploy-bridge-contract.ts --network mantle-testnet

# Deploy bridge on Lazchain
npx hardhat run scripts/bridge/deploy-bridge-contract.ts --network lazchain-testnet

# Deploy bridge on Metis Sepolia
npx hardhat run scripts/bridge/deploy-bridge-contract.ts --network metis-sepolia-testnet
```

## 🔐 Security Features

### Relayer System

- Bridges use a relayer-based withdrawal system
- Relayers sign withdrawal requests to authorize transfers
- Multiple relayers can be configured for redundancy
- Relayer addresses are managed by the bridge owner

### Security Measures

1. **Signature Verification**: All withdrawals require valid relayer signatures
2. **Timeout Protection**: Withdrawals have a timeout period to prevent replay attacks
3. **Pausable**: Bridges can be paused in case of emergencies
4. **Reentrancy Protection**: All functions are protected against reentrancy attacks
5. **Access Control**: Only authorized addresses can perform admin functions

## 📊 Bridge Configuration

### Default Settings

- **Bridge Fee**: 0.001 ETH (configurable)
- **Withdrawal Timeout**: 1 hour (configurable)
- **Minimum Deposit**: Token-specific (usually 0)

### Configuration Functions

- `setBridgeFee(uint256 newFee)`: Update bridge fee
- `setWithdrawalTimeout(uint256 newTimeout)`: Update withdrawal timeout
- `addRelayer(address relayer)`: Add a new relayer
- `removeRelayer(address relayer)`: Remove a relayer
- `pause()`: Pause bridge operations
- `unpause()`: Resume bridge operations

## 🔗 Block Explorer Links

### Hyperion
- Explorer: https://hyperion-testnet-explorer.metisdevops.link
- Bridge: https://hyperion-testnet-explorer.metisdevops.link/address/0xfF064Fd496256e84b68dAE2509eDA84a3c235550

### Mantle Testnet
- Explorer: https://sepolia.mantlescan.xyz
- Bridge: TBD

### Lazchain
- Explorer: https://lazai-testnet-explorer.metisdevops.link
- Bridge: TBD

### Metis Sepolia
- Explorer: https://sepolia.explorer.metis.io
- Bridge: TBD

## 📝 Notes

- All bridges use the same token mapping system based on token symbols
- Token addresses must be configured on each bridge for cross-chain transfers to work
- Bridges are independent contracts but share the same token mapping logic
- Relayers must be configured on both source and destination bridges for bidirectional transfers
- Bridge compatibility is bidirectional once bridges are deployed on both networks

## 🔄 Future Enhancements

1. **Automated Relayer System**: Implement automated relayers for faster withdrawals
2. **Multi-Signature Support**: Add multi-sig support for enhanced security
3. **Fee Optimization**: Implement dynamic fee calculation based on network conditions
4. **Cross-Chain Liquidity Pools**: Enable direct liquidity provision across chains
5. **Bridge Aggregation**: Aggregate multiple bridges for better rates and reliability

