import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Mantle Testnet Bridge Address
const MANTLE_BRIDGE_ADDRESS = "0xd6629696A52E914433b0924f1f49d42216708276";

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

// Mantle Testnet Chain ID
const MANTLE_TESTNET_CHAIN_ID = 5003;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🔧 Configuring Mantle tokens on Mantle Bridge");
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Connect to Bridge contract
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = Bridge.attach(MANTLE_BRIDGE_ADDRESS);

  console.log("📋 Current Bridge Configuration:");
  console.log(`   Bridge Address: ${MANTLE_BRIDGE_ADDRESS}`);
  console.log(`   Owner: ${await bridge.owner()}\n`);

  // Check current token support
  console.log("🔍 Checking current token support...");
  for (const [symbol, address] of Object.entries(MANTLE_TOKENS)) {
    const isSupported = await bridge.supportedTokens(address);
    console.log(`   ${symbol} (${address}): ${isSupported ? "✅ Supported" : "❌ Not Supported"}`);
  }

  // Add tokens to bridge
  console.log("\n💰 Adding Mantle tokens to bridge...");
  const results: any[] = [];

  for (const [symbol, tokenAddress] of Object.entries(MANTLE_TOKENS)) {
    try {
      const decimals = TOKEN_DECIMALS[symbol];
      const isSupported = await bridge.supportedTokens(tokenAddress);

      if (isSupported) {
        console.log(`   ⚠️  ${symbol} already supported, skipping...`);
        results.push({
          symbol,
          tokenAddress,
          chainId: MANTLE_TESTNET_CHAIN_ID,
          decimals,
          status: "already_supported"
        });
        continue;
      }

      console.log(`   Adding ${symbol} (${tokenAddress}, ${decimals} decimals)...`);
      const tx = await bridge.addToken(tokenAddress, symbol, MANTLE_TESTNET_CHAIN_ID, decimals);
      const receipt = await tx.wait();
      
      console.log(`   ✅ ${symbol} added successfully (Tx: ${receipt.hash})`);
      
      results.push({
        symbol,
        tokenAddress,
        chainId: MANTLE_TESTNET_CHAIN_ID,
        decimals,
        status: "added",
        txHash: receipt.hash
      });
    } catch (error: any) {
      console.error(`   ❌ Error adding ${symbol}:`, error.message);
      results.push({
        symbol,
        tokenAddress,
        chainId: MANTLE_TESTNET_CHAIN_ID,
        decimals: TOKEN_DECIMALS[symbol],
        status: "error",
        error: error.message
      });
    }
  }

  // Verify final configuration
  console.log("\n✅ Final Token Support Status:");
  for (const [symbol, address] of Object.entries(MANTLE_TOKENS)) {
    const isSupported = await bridge.supportedTokens(address);
    const symbolMapping = await bridge.tokenSymbols(address);
    console.log(`   ${symbol}: ${isSupported ? "✅" : "❌"} (Symbol: ${symbolMapping})`);
  }

  // Save results
  const outputDir = path.join(__dirname, "../../dpsmc/mantle/bridge");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `mantle-tokens-config-${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify({
    network: "Mantle Testnet",
    chainId: MANTLE_TESTNET_CHAIN_ID,
    bridgeAddress: MANTLE_BRIDGE_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    results
  }, null, 2));

  console.log(`\n📄 Configuration saved to: ${outputFile}`);
  console.log("\n✅ Mantle token configuration complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

