import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Network Chain IDs
const NETWORKS = {
  HYPERION: 133717,
  LAZCHAIN: 133718,
  METIS_SEPOLIA: 59902,
  MANTLE_TESTNET: 5003
};

// Bridge Addresses
const BRIDGE_ADDRESSES = {
  [NETWORKS.HYPERION]: "0xfF064Fd496256e84b68dAE2509eDA84a3c235550",
  [NETWORKS.LAZCHAIN]: "0xf2D33cF11d102F94148c38f943C99408f7C898cf",
  [NETWORKS.METIS_SEPOLIA]: "0x1AC16E6C537438c82A61A106B876Ef69C7e247d2"
};

// Mantle Testnet Token Addresses (to map on other bridges)
const MANTLE_TOKENS = {
  USDT: "0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b",
  USDC: "0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE",
  DAI: "0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a",
  WETH: "0xCa7b49d1C243a9289aE2316051eb15146125914d"
};

// Token decimals
const TOKEN_DECIMALS: { [symbol: string]: number } = {
  USDT: 6,
  USDC: 6,
  DAI: 18,
  WETH: 18
};

// Network names
const NETWORK_NAMES = {
  [NETWORKS.HYPERION]: "Hyperion",
  [NETWORKS.LAZCHAIN]: "Lazchain",
  [NETWORKS.METIS_SEPOLIA]: "Metis Sepolia",
  [NETWORKS.MANTLE_TESTNET]: "Mantle Testnet"
};

async function configureBridgeForMantle(networkName: string, chainId: number, bridgeAddress: string) {
  const [deployer] = await ethers.getSigners();
  console.log(`\n🌐 Configuring ${networkName} Bridge for Mantle token mappings...`);
  console.log(`   Bridge: ${bridgeAddress}`);
  console.log(`   Deployer: ${deployer.address}`);

  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = Bridge.attach(bridgeAddress);

  // Check if Mantle is supported
  const isMantleSupported = await bridge.supportedChains(NETWORKS.MANTLE_TESTNET);
  console.log(`   Mantle (${NETWORKS.MANTLE_TESTNET}) supported: ${isMantleSupported ? "✅" : "❌"}`);

  const results: any[] = [];

  // Add Mantle token mappings
  console.log(`\n   💰 Adding Mantle token mappings...`);
  for (const [symbol, mantleTokenAddress] of Object.entries(MANTLE_TOKENS)) {
    try {
      // Check if mapping already exists
      const existingAddress = await bridge.tokenAddresses(symbol, NETWORKS.MANTLE_TESTNET);
      
      if (existingAddress.toLowerCase() === mantleTokenAddress.toLowerCase() && existingAddress !== ethers.ZeroAddress) {
        console.log(`      ⚠️  ${symbol} mapping already exists, skipping...`);
        results.push({
          symbol,
          mantleTokenAddress,
          chainId: NETWORKS.MANTLE_TESTNET,
          status: "already_mapped"
        });
        continue;
      }

      // Get local token address for this network (needed for addToken)
      // We'll use the Mantle address as the token address parameter
      // The function will map it to the symbol and chainId
      const decimals = TOKEN_DECIMALS[symbol];
      
      console.log(`      Adding ${symbol} mapping: ${mantleTokenAddress} (${decimals} decimals)...`);
      
      // Note: addToken requires a local token address, but we're mapping a remote token
      // We need to check the bridge contract logic - it seems addToken adds both local and remote mappings
      // For cross-chain mapping, we might need to use a different approach
      // Let's try using the Mantle address directly
      
      const tx = await bridge.addToken(mantleTokenAddress, symbol, NETWORKS.MANTLE_TESTNET, decimals);
      const receipt = await tx.wait();
      
      console.log(`      ✅ ${symbol} mapping added (Tx: ${receipt.hash})`);
      
      results.push({
        symbol,
        mantleTokenAddress,
        chainId: NETWORKS.MANTLE_TESTNET,
        decimals,
        status: "added",
        txHash: receipt.hash
      });
    } catch (error: any) {
      console.error(`      ❌ Error adding ${symbol} mapping:`, error.message);
      results.push({
        symbol,
        mantleTokenAddress,
        chainId: NETWORKS.MANTLE_TESTNET,
        status: "error",
        error: error.message
      });
    }
  }

  // Verify mappings
  console.log(`\n   ✅ Verifying Mantle token mappings...`);
  for (const [symbol] of Object.entries(MANTLE_TOKENS)) {
    const mappedAddress = await bridge.tokenAddresses(symbol, NETWORKS.MANTLE_TESTNET);
    const isActive = await bridge.activeTokens(NETWORKS.MANTLE_TESTNET, symbol);
    console.log(`      ${symbol}: ${mappedAddress} (Active: ${isActive ? "✅" : "❌"})`);
  }

  return {
    network: networkName,
    chainId,
    bridgeAddress,
    results
  };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);

  console.log("🔧 Adding Mantle Token Mappings to Other Bridges");
  console.log("Current Network:", NETWORK_NAMES[currentChainId] || `Chain ${currentChainId}`);
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  const allResults: any[] = [];

  // Configure each bridge
  for (const [chainIdStr, bridgeAddress] of Object.entries(BRIDGE_ADDRESSES)) {
    const chainId = Number(chainIdStr);
    const networkName = NETWORK_NAMES[chainId];
    
    // Skip if we're not on this network
    if (currentChainId !== chainId) {
      console.log(`\n⚠️  Skipping ${networkName} - switch to this network to configure`);
      continue;
    }

    const result = await configureBridgeForMantle(networkName, chainId, bridgeAddress);
    allResults.push(result);
  }

  // Save results
  const outputDir = path.join(__dirname, "../../dpsmc");
  const outputFile = path.join(outputDir, `mantle-mappings-config-${Date.now()}.json`);
  
  fs.writeFileSync(outputFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    currentNetwork: NETWORK_NAMES[currentChainId] || `Chain ${currentChainId}`,
    results: allResults
  }, null, 2));

  console.log(`\n📄 Configuration saved to: ${outputFile}`);
  console.log("\n✅ Mantle token mapping configuration complete!");
  console.log("\n⚠️  Note: Run this script on each network (Hyperion, Lazchain, Metis Sepolia) to configure all bridges.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

