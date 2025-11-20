import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Hyperion Bridge Address
const HYPERION_BRIDGE_ADDRESS = "0xfF064Fd496256e84b68dAE2509eDA84a3c235550";

// Lazchain Testnet Chain ID
const LAZCHAIN_CHAIN_ID = 133718;

// Lazchain Token Addresses
const LAZCHAIN_TOKENS = {
  USDT: "0x9D81C1a89bE608417B5Bb1C1cF5858594D01E8a3",
  USDC: "0x677B021cCBA318A93BACB1653fD7bE0882ceE9Fd",
  DAI: "0xeC53e4a54b3AB36fb684966c222Ff6f347C7e84c",
  WETH: "0xef63df9fa0E5f79127AaC0B2a0ec969CC30be532"
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
  console.log("🔧 Adding Lazchain Token Mappings to Hyperion Bridge");
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Connect to Bridge contract
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = Bridge.attach(HYPERION_BRIDGE_ADDRESS);

  console.log("📋 Current Bridge Configuration:");
  console.log(`   Bridge Address: ${HYPERION_BRIDGE_ADDRESS}`);
  console.log(`   Owner: ${await bridge.owner()}\n`);

  // Check if Lazchain is supported
  const isLazchainSupported = await bridge.supportedChains(LAZCHAIN_CHAIN_ID);
  console.log(`   Lazchain (${LAZCHAIN_CHAIN_ID}) supported: ${isLazchainSupported ? "✅" : "❌"}\n`);

  const results: any[] = [];

  // Add Lazchain token mappings
  console.log("💰 Adding Lazchain token mappings...");
  for (const [symbol, lazchainTokenAddress] of Object.entries(LAZCHAIN_TOKENS)) {
    try {
      // Check if mapping already exists
      const existingAddress = await bridge.tokenAddresses(symbol, LAZCHAIN_CHAIN_ID);
      
      if (existingAddress.toLowerCase() === lazchainTokenAddress.toLowerCase() && existingAddress !== ethers.ZeroAddress) {
        console.log(`   ⚠️  ${symbol} mapping already exists, skipping...`);
        results.push({
          symbol,
          lazchainTokenAddress,
          chainId: LAZCHAIN_CHAIN_ID,
          status: "already_mapped"
        });
        continue;
      }

      const decimals = TOKEN_DECIMALS[symbol];
      console.log(`   Adding ${symbol} mapping: ${lazchainTokenAddress} (${decimals} decimals)...`);
      
      const tx = await bridge.addToken(lazchainTokenAddress, symbol, LAZCHAIN_CHAIN_ID, decimals);
      const receipt = await tx.wait();
      
      console.log(`   ✅ ${symbol} mapping added (Tx: ${receipt.hash})`);
      
      results.push({
        symbol,
        lazchainTokenAddress,
        chainId: LAZCHAIN_CHAIN_ID,
        decimals,
        status: "added",
        txHash: receipt.hash
      });
    } catch (error: any) {
      console.error(`   ❌ Error adding ${symbol} mapping:`, error.message);
      results.push({
        symbol,
        lazchainTokenAddress,
        chainId: LAZCHAIN_CHAIN_ID,
        status: "error",
        error: error.message
      });
    }
  }

  // Verify mappings
  console.log("\n✅ Verifying Lazchain token mappings...");
  for (const [symbol] of Object.entries(LAZCHAIN_TOKENS)) {
    const mappedAddress = await bridge.tokenAddresses(symbol, LAZCHAIN_CHAIN_ID);
    const isActive = await bridge.activeTokens(LAZCHAIN_CHAIN_ID, symbol);
    console.log(`   ${symbol}: ${mappedAddress} (Active: ${isActive ? "✅" : "❌"})`);
  }

  // Save results
  const outputDir = path.join(__dirname, "../../dpsmc/hyperion/bridge");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `lazchain-mappings-config-${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify({
    network: "Hyperion Testnet",
    bridgeAddress: HYPERION_BRIDGE_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    results
  }, null, 2));

  console.log(`\n📄 Configuration saved to: ${outputFile}`);
  console.log("\n✅ Lazchain token mapping configuration on Hyperion complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

