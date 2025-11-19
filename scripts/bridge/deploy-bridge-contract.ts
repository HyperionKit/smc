import { ethers } from "hardhat";

// Network Chain IDs
const NETWORKS = {
  HYPERION: 133717,
  LAZCHAIN: 133718,
  METIS_SEPOLIA: 59902,
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
  // Lazchain Network
  [NETWORKS.LAZCHAIN]: {
    USDT: "0x9D81C1a89bE608417B5Bb1C1cF5858594D01E8a3",
    USDC: "0x677B021cCBA318A93BACB1653fD7bE0882ceE9Fd",
    DAI: "0xeC53e4a54b3AB36fb684966c222Ff6f347C7e84c",
    WETH: "0xef63df9fa0E5f79127AaC0B2a0ec969CC30be532"
  },
  // Metis Sepolia Network
  [NETWORKS.METIS_SEPOLIA]: {
    USDT: "0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898",
    USDC: "0x16d44fBBc8E1F3FBB6ac0674a44EECfa528604DD",
    DAI: "0x23E380def17aAA8554297069422039517B2997b9",
    WETH: "0x1A3d532875aD585776c814E7749a5e7a58b3E49b"
  },
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
  [NETWORKS.LAZCHAIN]: "Lazchain",
  [NETWORKS.METIS_SEPOLIA]: "Metis Sepolia",
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
  
  // Get current network to determine which networks to support
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  // Determine supported networks based on current network
  let supportedNetworks: number[] = [];
  
  if (currentChainId === NETWORKS.HYPERION) {
    supportedNetworks = [NETWORKS.MANTLE_TESTNET, NETWORKS.MANTLE_MAINNET, NETWORKS.LAZCHAIN, NETWORKS.METIS_SEPOLIA];
  } else if (currentChainId === NETWORKS.LAZCHAIN) {
    supportedNetworks = [NETWORKS.HYPERION, NETWORKS.MANTLE_TESTNET, NETWORKS.MANTLE_MAINNET, NETWORKS.METIS_SEPOLIA];
  } else if (currentChainId === NETWORKS.METIS_SEPOLIA) {
    supportedNetworks = [NETWORKS.HYPERION, NETWORKS.MANTLE_TESTNET, NETWORKS.MANTLE_MAINNET, NETWORKS.LAZCHAIN];
  } else if (currentChainId === NETWORKS.MANTLE_TESTNET || currentChainId === NETWORKS.MANTLE_MAINNET) {
    supportedNetworks = [NETWORKS.HYPERION, NETWORKS.LAZCHAIN, NETWORKS.METIS_SEPOLIA];
    if (currentChainId === NETWORKS.MANTLE_TESTNET) {
      supportedNetworks.push(NETWORKS.MANTLE_MAINNET);
    } else {
      supportedNetworks.push(NETWORKS.MANTLE_TESTNET);
    }
  } else {
    // Default: support all networks
    supportedNetworks = [NETWORKS.HYPERION, NETWORKS.MANTLE_TESTNET, NETWORKS.MANTLE_MAINNET, NETWORKS.LAZCHAIN, NETWORKS.METIS_SEPOLIA];
  }
  
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
    
    // Include current network and all supported networks
    const allNetworks = [currentChainId, ...supportedNetworks.filter(id => id !== currentChainId)];
    
    for (const chainId of allNetworks) {
      if (TOKEN_ADDRESSES[chainId] && TOKEN_ADDRESSES[chainId][symbol]) {
        const tokenAddress = TOKEN_ADDRESSES[chainId][symbol];
        // Skip zero addresses (not configured)
        if (tokenAddress === "0x0000000000000000000000000000000000000000") {
          console.log(`   ⚠️  Skipping ${symbol} for ${NETWORK_NAMES[chainId]} (zero address - not configured)`);
          continue;
        }
        const decimals = TOKEN_DECIMALS[symbol];
        
        console.log(`   ${NETWORK_NAMES[chainId]}: ${tokenAddress} (${decimals} decimals)`);
        
        const tx = await bridge.addToken(tokenAddress, symbol, chainId, decimals);
        await tx.wait();
        console.log(`   ✅ Added ${symbol} for ${NETWORK_NAMES[chainId]}`);
      } else {
        console.log(`   ⚠️  Skipping ${symbol} for ${NETWORK_NAMES[chainId]} (address not configured)`);
      }
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
  const allNetworksForDisplay = [currentChainId, ...supportedNetworks.filter(id => id !== currentChainId)];
  for (const symbol of tokens) {
    console.log(`\n   ${symbol}:`);
    for (const chainId of allNetworksForDisplay) {
      try {
        const tokenAddress = await bridge.getTokenAddress(symbol, chainId);
        const decimals = await bridge.getTokenDecimals(symbol, chainId);
        const isActive = await bridge.isTokenActive(symbol, chainId);
        const status = isActive ? "✅ Active" : "❌ Inactive";
        
        console.log(`     ${NETWORK_NAMES[chainId]}: ${tokenAddress} (${decimals} decimals) - ${status}`);
      } catch (error) {
        console.log(`     ${NETWORK_NAMES[chainId]}: ❌ Not configured`);
      }
    }
  }

  // Check supported networks
  console.log("\n🌐 Supported Networks:");
  for (const chainId of allNetworksForDisplay) {
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
  const networkName = NETWORK_NAMES[currentChainId] || `Chain ${currentChainId}`;
  const networkDir = currentChainId === NETWORKS.HYPERION ? "hyperion" :
                     currentChainId === NETWORKS.LAZCHAIN ? "lazai" :
                     currentChainId === NETWORKS.METIS_SEPOLIA ? "metis_testnet" :
                     currentChainId === NETWORKS.MANTLE_TESTNET ? "mantle" : "unknown";
  
  const deploymentInfo = {
    network: networkName,
    chainId: currentChainId,
    bridgeAddress: bridgeAddress,
    deployer: deployer.address,
    supportedNetworks: [currentChainId, ...supportedNetworks.filter(id => id !== currentChainId)].map(chainId => ({
      chainId,
      name: NETWORK_NAMES[chainId]
    })),
    tokenMappings: tokens.map(symbol => ({
      symbol,
      decimals: TOKEN_DECIMALS[symbol],
      addresses: Object.fromEntries(
        allNetworksForDisplay
          .filter(chainId => TOKEN_ADDRESSES[chainId] && TOKEN_ADDRESSES[chainId][symbol])
          .map(chainId => [
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
  const deploymentDir = `dpsmc/${networkDir}/bridge`;
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  const deploymentPath = `${deploymentDir}/bridge-deployment-${Date.now()}.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 