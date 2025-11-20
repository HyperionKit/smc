import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Hyperion Bridge Address
const HYPERION_BRIDGE_ADDRESS = "0xfF064Fd496256e84b68dAE2509eDA84a3c235550";

// Network Chain IDs
const MANTLE_TESTNET_CHAIN_ID = 5003;
const MANTLE_MAINNET_CHAIN_ID = 5000;

// Mantle Testnet Token Addresses
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

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🔧 Enabling Mantle Support on Hyperion Bridge");
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Connect to Bridge contract
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = Bridge.attach(HYPERION_BRIDGE_ADDRESS);

  console.log("📋 Current Bridge Configuration:");
  console.log(`   Bridge Address: ${HYPERION_BRIDGE_ADDRESS}`);
  console.log(`   Owner: ${await bridge.owner()}\n`);

  // Check current supported chains
  console.log("🔍 Checking current supported chains...");
  const isMantleTestnetSupported = await bridge.supportedChains(MANTLE_TESTNET_CHAIN_ID);
  const isMantleMainnetSupported = await bridge.supportedChains(MANTLE_MAINNET_CHAIN_ID);
  
  console.log(`   Mantle Testnet (${MANTLE_TESTNET_CHAIN_ID}): ${isMantleTestnetSupported ? "✅ Supported" : "❌ Not Supported"}`);
  console.log(`   Mantle Mainnet (${MANTLE_MAINNET_CHAIN_ID}): ${isMantleMainnetSupported ? "✅ Supported" : "❌ Not Supported"}\n`);

  const results: any = {
    chainSupport: [],
    tokenMappings: []
  };

  // Enable Mantle Testnet support
  if (!isMantleTestnetSupported) {
    console.log("🌐 Enabling Mantle Testnet support...");
    try {
      const tx = await bridge.setChainSupport(MANTLE_TESTNET_CHAIN_ID, true);
      const receipt = await tx.wait();
      console.log(`   ✅ Mantle Testnet enabled (Tx: ${receipt.hash})`);
      results.chainSupport.push({
        chainId: MANTLE_TESTNET_CHAIN_ID,
        network: "Mantle Testnet",
        status: "enabled",
        txHash: receipt.hash
      });
    } catch (error: any) {
      console.error(`   ❌ Error enabling Mantle Testnet:`, error.message);
      results.chainSupport.push({
        chainId: MANTLE_TESTNET_CHAIN_ID,
        network: "Mantle Testnet",
        status: "error",
        error: error.message
      });
    }
  } else {
    console.log("   ⚠️  Mantle Testnet already supported");
    results.chainSupport.push({
      chainId: MANTLE_TESTNET_CHAIN_ID,
      network: "Mantle Testnet",
      status: "already_enabled"
    });
  }

  // Enable Mantle Mainnet support
  if (!isMantleMainnetSupported) {
    console.log("\n🌐 Enabling Mantle Mainnet support...");
    try {
      const tx = await bridge.setChainSupport(MANTLE_MAINNET_CHAIN_ID, true);
      const receipt = await tx.wait();
      console.log(`   ✅ Mantle Mainnet enabled (Tx: ${receipt.hash})`);
      results.chainSupport.push({
        chainId: MANTLE_MAINNET_CHAIN_ID,
        network: "Mantle Mainnet",
        status: "enabled",
        txHash: receipt.hash
      });
    } catch (error: any) {
      console.error(`   ❌ Error enabling Mantle Mainnet:`, error.message);
      results.chainSupport.push({
        chainId: MANTLE_MAINNET_CHAIN_ID,
        network: "Mantle Mainnet",
        status: "error",
        error: error.message
      });
    }
  } else {
    console.log("   ⚠️  Mantle Mainnet already supported");
    results.chainSupport.push({
      chainId: MANTLE_MAINNET_CHAIN_ID,
      network: "Mantle Mainnet",
      status: "already_enabled"
    });
  }

  // Add Mantle token mappings
  console.log("\n💰 Adding Mantle Testnet token mappings...");
  for (const [symbol, mantleTokenAddress] of Object.entries(MANTLE_TOKENS)) {
    try {
      // Check if mapping already exists
      const existingAddress = await bridge.tokenAddresses(symbol, MANTLE_TESTNET_CHAIN_ID);
      
      if (existingAddress.toLowerCase() === mantleTokenAddress.toLowerCase() && existingAddress !== ethers.ZeroAddress) {
        console.log(`   ⚠️  ${symbol} mapping already exists, skipping...`);
        results.tokenMappings.push({
          symbol,
          mantleTokenAddress,
          chainId: MANTLE_TESTNET_CHAIN_ID,
          status: "already_mapped"
        });
        continue;
      }

      const decimals = TOKEN_DECIMALS[symbol];
      console.log(`   Adding ${symbol} mapping: ${mantleTokenAddress} (${decimals} decimals)...`);
      
      const tx = await bridge.addToken(mantleTokenAddress, symbol, MANTLE_TESTNET_CHAIN_ID, decimals);
      const receipt = await tx.wait();
      
      console.log(`   ✅ ${symbol} mapping added (Tx: ${receipt.hash})`);
      
      results.tokenMappings.push({
        symbol,
        mantleTokenAddress,
        chainId: MANTLE_TESTNET_CHAIN_ID,
        decimals,
        status: "added",
        txHash: receipt.hash
      });
    } catch (error: any) {
      console.error(`   ❌ Error adding ${symbol} mapping:`, error.message);
      results.tokenMappings.push({
        symbol,
        mantleTokenAddress,
        chainId: MANTLE_TESTNET_CHAIN_ID,
        status: "error",
        error: error.message
      });
    }
  }

  // Verify final configuration
  console.log("\n✅ Final Configuration Status:");
  const finalMantleTestnetSupport = await bridge.supportedChains(MANTLE_TESTNET_CHAIN_ID);
  const finalMantleMainnetSupport = await bridge.supportedChains(MANTLE_MAINNET_CHAIN_ID);
  
  console.log(`   Mantle Testnet (${MANTLE_TESTNET_CHAIN_ID}): ${finalMantleTestnetSupport ? "✅ Supported" : "❌ Not Supported"}`);
  console.log(`   Mantle Mainnet (${MANTLE_MAINNET_CHAIN_ID}): ${finalMantleMainnetSupport ? "✅ Supported" : "❌ Not Supported"}`);
  
  console.log("\n   Mantle Token Mappings:");
  for (const [symbol] of Object.entries(MANTLE_TOKENS)) {
    const mappedAddress = await bridge.tokenAddresses(symbol, MANTLE_TESTNET_CHAIN_ID);
    const isActive = await bridge.activeTokens(MANTLE_TESTNET_CHAIN_ID, symbol);
    console.log(`      ${symbol}: ${mappedAddress} (Active: ${isActive ? "✅" : "❌"})`);
  }

  // Save results
  const outputDir = path.join(__dirname, "../../dpsmc/hyperion/bridge");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `mantle-support-config-${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify({
    network: "Hyperion Testnet",
    bridgeAddress: HYPERION_BRIDGE_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    results
  }, null, 2));

  console.log(`\n📄 Configuration saved to: ${outputFile}`);
  console.log("\n✅ Mantle support configuration on Hyperion complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

