import { ethers } from "hardhat";

// Network Chain IDs
const NETWORKS = {
  HYPERION: 133717,
  // Temporarily disabled networks
  // LAZCHAIN: 133713,
  // METIS_SEPOLIA: 59902,
  // Mantle Networks
  MANTLE_TESTNET: 5003,
  MANTLE_MAINNET: 5000
};

// Token addresses for each network
const TOKEN_ADDRESSES: { [chainId: number]: { [symbol: string]: string } } = {
  [NETWORKS.HYPERION]: {
    USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
    USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
    DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
    WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
  },
  // Temporarily disabled - will be updated after Mantle deployment
  // [NETWORKS.LAZCHAIN]: {
  //   USDT: "0xCc752FaCdF711D338F35D073F44f363CbC624a6c",
  //   USDC: "0x77Db75D0bDcE5A03b5c35dDBff1F18dA4161Bc2f",
  //   DAI: "0x3391955a3F863843351eC119cb83958bFa98096c",
  //   WETH: "0x7adF2929085ED1bA7C55c61d738193D62f925Cf3"
  // },
  // [NETWORKS.METIS_SEPOLIA]: {
  //   USDT: "0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898",
  //   USDC: "0x16d44fBBc8E1F3FBB6ac0674a44EECfa528604DD",
  //   DAI: "0x23E380def17aAA8554297069422039517B2997b9",
  //   WETH: "0x1A3d532875aD585776c814E7749a5e7a58b3E49b"
  // },
  // Mantle Testnet - Update with actual addresses after deployment
  [NETWORKS.MANTLE_TESTNET]: {
    USDT: "0x0000000000000000000000000000000000000000", // TODO: Update after deployment
    USDC: "0x0000000000000000000000000000000000000000", // TODO: Update after deployment
    DAI: "0x0000000000000000000000000000000000000000", // TODO: Update after deployment
    WETH: "0x0000000000000000000000000000000000000000"  // TODO: Update after deployment
  }
};

// Token decimals for each token
const TOKEN_DECIMALS: { [symbol: string]: number } = {
  USDT: 6,
  USDC: 6,
  DAI: 18,
  WETH: 18
};

// Network names for display
const NETWORK_NAMES = {
  [NETWORKS.HYPERION]: "Hyperion",
  // Temporarily disabled
  // [NETWORKS.LAZCHAIN]: "Lazchain",
  // [NETWORKS.METIS_SEPOLIA]: "Metis Sepolia",
  // Mantle Networks
  [NETWORKS.MANTLE_TESTNET]: "Mantle Testnet",
  [NETWORKS.MANTLE_MAINNET]: "Mantle Mainnet"
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Bridge contract with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Deploy Bridge contract
  console.log("\n🚀 Deploying Bridge contract...");
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await Bridge.deploy(deployer.address);
  await bridge.waitForDeployment();

  const bridgeAddress = await bridge.getAddress();
  console.log("✅ Bridge contract deployed to:", bridgeAddress);

  // Configure supported networks
  console.log("\n🌐 Configuring supported networks...");
  
  // Temporarily disabled: [NETWORKS.LAZCHAIN, NETWORKS.METIS_SEPOLIA]
  const supportedNetworks = [NETWORKS.MANTLE_TESTNET];
  
  for (const chainId of supportedNetworks) {
    const tx = await bridge.setChainSupport(chainId, true);
    await tx.wait();
    console.log(`✅ Added network: ${NETWORK_NAMES[chainId]} (Chain ID: ${chainId})`);
  }

  // Configure token mappings for all networks
  console.log("\n🔧 Configuring token mappings across all networks...");
  
  const tokens = ["USDT", "USDC", "DAI", "WETH"];
  
  for (const symbol of tokens) {
    console.log(`\n💰 Configuring ${symbol} mappings...`);
    
    for (const chainId of [NETWORKS.HYPERION, ...supportedNetworks]) {
      const tokenAddress = TOKEN_ADDRESSES[chainId][symbol];
      const decimals = TOKEN_DECIMALS[symbol];
      
      console.log(`   ${NETWORK_NAMES[chainId]}: ${tokenAddress} (${decimals} decimals)`);
      
      const tx = await bridge.addToken(tokenAddress, symbol, chainId, decimals);
      await tx.wait();
      console.log(`   ✅ Added ${symbol} for ${NETWORK_NAMES[chainId]}`);
    }
  }

  // Get bridge configuration
  console.log("\n📊 Bridge Configuration:");
  console.log(`   Contract Address: ${bridgeAddress}`);
  console.log(`   Owner: ${deployer.address}`);
  console.log(`   Bridge Fee: ${ethers.formatEther(await bridge.bridgeFee())} ETH`);
  console.log(`   Withdrawal Timeout: ${await bridge.withdrawalTimeout()} seconds`);

  // Display token mappings
  console.log("\n🌉 Token Mappings:");
  for (const symbol of tokens) {
    console.log(`\n   ${symbol}:`);
    for (const chainId of [NETWORKS.HYPERION, ...supportedNetworks]) {
      const tokenAddress = await bridge.getTokenAddress(symbol, chainId);
      const decimals = await bridge.getTokenDecimals(symbol, chainId);
      const isActive = await bridge.isTokenActive(symbol, chainId);
      const status = isActive ? "✅ Active" : "❌ Inactive";
      
      console.log(`     ${NETWORK_NAMES[chainId]}: ${tokenAddress} (${decimals} decimals) - ${status}`);
    }
  }

  // Check supported networks
  console.log("\n🌐 Supported Networks:");
  for (const chainId of [NETWORKS.HYPERION, ...supportedNetworks]) {
    const isSupported = await bridge.supportedChains(chainId);
    console.log(`   ${NETWORK_NAMES[chainId]} (${chainId}): ${isSupported ? "✅ Supported" : "❌ Not Supported"}`);
  }

  // Check relayer status
  console.log("\n🔐 Relayer Status:");
  const isRelayer = await bridge.relayers(deployer.address);
  console.log(`   Deployer (${deployer.address}): ${isRelayer ? "✅ Relayer" : "❌ Not Relayer"}`);

  // Get bridge statistics
  const stats = await bridge.getBridgeStats();
  console.log("\n📈 Bridge Statistics:");
  console.log(`   Total Deposits: ${stats.totalDeposits}`);
  console.log(`   Total Withdrawals: ${stats.totalWithdrawals}`);
  console.log(`   Current Fee: ${ethers.formatEther(stats.currentFee)} ETH`);
  console.log(`   Current Timeout: ${stats.currentTimeout} seconds`);

  // Test token mapping functions
  console.log("\n🧪 Testing Token Mapping Functions:");
  for (const symbol of tokens) {
    console.log(`\n   Testing ${symbol} mappings:`);
    const mappings = await bridge.getTokenMappings(symbol);
    console.log(`   Found ${mappings.length} active mappings for ${symbol}`);
    
    for (const mapping of mappings) {
      console.log(`     Chain ${mapping.chainId}: ${mapping.tokenAddress} (${mapping.decimals} decimals)`);
    }
  }

  console.log("\n🎉 Bridge deployment and token mapping configuration completed successfully!");
  console.log("\n📋 Next Steps:");
  console.log("   1. Fund the bridge with tokens for withdrawals");
  console.log("   2. Add additional relayers if needed");
  console.log("   3. Test bridge functionality across networks");
  console.log("   4. Deploy bridge on destination networks (Mantle Testnet)");

  // Save deployment info
  const deploymentInfo = {
    network: "Hyperion Testnet",
    chainId: NETWORKS.HYPERION,
    bridgeAddress: bridgeAddress,
    deployer: deployer.address,
    supportedNetworks: supportedNetworks.map(chainId => ({
      chainId,
      name: NETWORK_NAMES[chainId]
    })),
    tokenMappings: tokens.map(symbol => ({
      symbol,
      decimals: TOKEN_DECIMALS[symbol],
      addresses: Object.fromEntries(
        [NETWORKS.HYPERION, ...supportedNetworks].map(chainId => [
          NETWORK_NAMES[chainId],
          TOKEN_ADDRESSES[chainId][symbol]
        ])
      )
    })),
    bridgeFee: ethers.formatEther(await bridge.bridgeFee()),
    withdrawalTimeout: (await bridge.withdrawalTimeout()).toString(),
    deploymentTime: new Date().toISOString()
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for reference
  const fs = require('fs');
  const deploymentPath = `dpsmc/hyperion/bridge/bridge-deployment-${Date.now()}.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 