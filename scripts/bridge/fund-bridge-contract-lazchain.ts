import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Lazchain Testnet token addresses
const TOKENS = {
  USDT: "0x9D81C1a89bE608417B5Bb1C1cF5858594D01E8a3",
  USDC: "0x677B021cCBA318A93BACB1653fD7bE0882ceE9Fd",
  DAI: "0xeC53e4a54b3AB36fb684966c222Ff6f347C7e84c",
  WETH: "0xef63df9fa0E5f79127AaC0B2a0ec969CC30be532"
};

// Lazchain Bridge contract address
const BRIDGE_ADDRESS = "0xf2D33cF11d102F94148c38f943C99408f7C898cf";

// Funding amounts (adjust as needed)
const FUNDING_AMOUNTS = {
  USDT: ethers.parseUnits("10000", 6),  // 10,000 USDT
  USDC: ethers.parseUnits("10000", 6),  // 10,000 USDC
  DAI: ethers.parseUnits("10000", 18),  // 10,000 DAI
  WETH: ethers.parseUnits("100", 18)    // 100 WETH
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Funding Lazchain Bridge contract with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "LAZAI");

  // Get Bridge contract
  const bridge = await ethers.getContractAt("Bridge", BRIDGE_ADDRESS);
  console.log("Bridge contract address:", BRIDGE_ADDRESS);

  // Check bridge configuration
  console.log("\n📊 Bridge Configuration:");
  console.log(`   Owner: ${await bridge.owner()}`);
  console.log(`   Bridge Fee: ${ethers.formatEther(await bridge.bridgeFee())} ETH`);
  console.log(`   Paused: ${await bridge.paused()}`);

  // Fund each token
  const tokenConfigs = [
    { symbol: "USDT", address: TOKENS.USDT, amount: FUNDING_AMOUNTS.USDT, decimals: 6 },
    { symbol: "USDC", address: TOKENS.USDC, amount: FUNDING_AMOUNTS.USDC, decimals: 6 },
    { symbol: "DAI", address: TOKENS.DAI, amount: FUNDING_AMOUNTS.DAI, decimals: 18 },
    { symbol: "WETH", address: TOKENS.WETH, amount: FUNDING_AMOUNTS.WETH, decimals: 18 }
  ];

  const fundingResults: any[] = [];

  for (const config of tokenConfigs) {
    console.log(`\n💰 Funding ${config.symbol}...`);
    
    try {
      // Get token contract
      const token = await ethers.getContractAt("Token", config.address);
      
      // Check if token is supported by bridge
      const isSupported = await bridge.supportedTokens(config.address);
      if (!isSupported) {
        console.log(`❌ ${config.symbol} is not supported by bridge. Skipping...`);
        fundingResults.push({ symbol: config.symbol, status: "skipped", reason: "not supported" });
        continue;
      }

      // Check deployer's token balance
      const deployerBalance = await token.balanceOf(deployer.address);
      console.log(`   Deployer ${config.symbol} balance: ${ethers.formatUnits(deployerBalance, config.decimals)}`);

      if (deployerBalance < config.amount) {
        console.log(`❌ Insufficient ${config.symbol} balance. Need ${ethers.formatUnits(config.amount, config.decimals)}, have ${ethers.formatUnits(deployerBalance, config.decimals)}`);
        fundingResults.push({ 
          symbol: config.symbol, 
          status: "failed", 
          reason: "insufficient balance",
          required: ethers.formatUnits(config.amount, config.decimals),
          available: ethers.formatUnits(deployerBalance, config.decimals)
        });
        continue;
      }

      // Check bridge's current token balance
      const bridgeBalanceBefore = await token.balanceOf(BRIDGE_ADDRESS);
      console.log(`   Bridge ${config.symbol} balance (before): ${ethers.formatUnits(bridgeBalanceBefore, config.decimals)}`);

      // Transfer tokens to bridge
      console.log(`   Transferring ${ethers.formatUnits(config.amount, config.decimals)} ${config.symbol} to bridge...`);
      
      const tx = await token.transfer(BRIDGE_ADDRESS, config.amount);
      await tx.wait();
      
      // Check bridge balance after
      const bridgeBalanceAfter = await token.balanceOf(BRIDGE_ADDRESS);
      console.log(`   Bridge ${config.symbol} balance (after): ${ethers.formatUnits(bridgeBalanceAfter, config.decimals)}`);
      
      console.log(`✅ Successfully funded bridge with ${ethers.formatUnits(config.amount, config.decimals)} ${config.symbol}`);
      fundingResults.push({ 
        symbol: config.symbol, 
        status: "success",
        amount: ethers.formatUnits(config.amount, config.decimals),
        txHash: tx.hash
      });
    } catch (error: any) {
      console.log(`❌ Error funding ${config.symbol}: ${error.message}`);
      fundingResults.push({ symbol: config.symbol, status: "error", error: error.message });
    }
  }

  // Display final bridge balances
  console.log("\n📊 Final Bridge Balances:");
  for (const config of tokenConfigs) {
    try {
      const token = await ethers.getContractAt("Token", config.address);
      const bridgeBalance = await token.balanceOf(BRIDGE_ADDRESS);
      console.log(`   ${config.symbol}: ${ethers.formatUnits(bridgeBalance, config.decimals)}`);
    } catch (error) {
      console.log(`   ${config.symbol}: Error checking balance`);
    }
  }

  // Save funding results
  const fundingInfo = {
    network: "Lazchain Testnet",
    chainId: 133718,
    bridgeAddress: BRIDGE_ADDRESS,
    deployer: deployer.address,
    fundingResults: fundingResults,
    timestamp: new Date().toISOString()
  };

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "lazai", "bridge");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const fundingPath = path.join(deploymentDir, `bridge-funding-${Date.now()}.json`);
  fs.writeFileSync(fundingPath, JSON.stringify(fundingInfo, null, 2));
  console.log(`\n💾 Funding info saved to: ${fundingPath}`);

  console.log("\n🎉 Bridge funding completed!");
  console.log("\n📋 Next Steps:");
  console.log("   1. Verify bridge balances on block explorer");
  console.log("   2. Test bridge deposit functionality");
  console.log("   3. Test bridge withdrawal functionality");
  console.log("   4. Monitor bridge balances regularly");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

