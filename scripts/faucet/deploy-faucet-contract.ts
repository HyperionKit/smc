import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

// Token configuration for faucet
const TOKEN_CONFIG = {
  USDT: {
    symbol: "USDT",
    decimals: 6,
    dripAmount: ethers.parseUnits("1000", 6), // 1000 USDT per drip
    maxBalance: ethers.parseUnits("10000", 6)  // Max 10,000 USDT balance
  },
  USDC: {
    symbol: "USDC",
    decimals: 6,
    dripAmount: ethers.parseUnits("1000", 6), // 1000 USDC per drip
    maxBalance: ethers.parseUnits("10000", 6)  // Max 10,000 USDC balance
  },
  DAI: {
    symbol: "DAI",
    decimals: 18,
    dripAmount: ethers.parseUnits("1000", 18), // 1000 DAI per drip
    maxBalance: ethers.parseUnits("10000", 18)  // Max 10,000 DAI balance
  },
  WETH: {
    symbol: "WETH",
    decimals: 18,
    dripAmount: ethers.parseUnits("1", 18),    // 1 WETH per drip
    maxBalance: ethers.parseUnits("10", 18)    // Max 10 WETH balance
  }
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Faucet contract with account:", deployer.address);

  // Deploy Faucet contract
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(deployer.address);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();

  console.log("✅ Faucet contract deployed to:", faucetAddress);

  // Configure supported tokens
  console.log("\n💰 Configuring supported tokens...");

  const tokenSymbols = ["USDT", "USDC", "DAI", "WETH"];

  for (const symbol of tokenSymbols) {
    const tokenAddress = TOKENS[symbol as keyof typeof TOKENS];
    const config = TOKEN_CONFIG[symbol as keyof typeof TOKEN_CONFIG];

    console.log(`\n🔧 Adding ${symbol} to faucet...`);
    console.log(`   Address: ${tokenAddress}`);
    console.log(`   Drip Amount: ${ethers.formatUnits(config.dripAmount, config.decimals)} ${symbol}`);
    console.log(`   Max Balance: ${ethers.formatUnits(config.maxBalance, config.decimals)} ${symbol}`);

    const tx = await faucet.addToken(
      tokenAddress,
      config.symbol,
      config.decimals,
      config.dripAmount,
      config.maxBalance
    );
    await tx.wait();
    console.log(`   ✅ ${symbol} added successfully`);
  }

  // Configure faucet settings
  console.log("\n⚙️ Configuring faucet settings...");

  // Set drip interval to 1 hour for testing (can be changed later)
  const dripInterval = 1 * 60 * 60; // 1 hour
  const setIntervalTx = await faucet.setDripInterval(dripInterval);
  await setIntervalTx.wait();
  console.log(`   ✅ Drip interval set to ${dripInterval} seconds (${dripInterval / 3600} hours)`);

  // Set max drips per user
  const maxDripsPerUser = 100; // 100 total drips per user
  const setMaxDripsTx = await faucet.setMaxDripPerUser(maxDripsPerUser);
  await setMaxDripsTx.wait();
  console.log(`   ✅ Max drips per user set to ${maxDripsPerUser}`);

  // Display faucet configuration
  console.log("\n📊 Faucet Configuration:");
  console.log(`   Contract Address: ${faucetAddress}`);
  console.log(`   Owner: ${await faucet.owner()}`);
  console.log(`   Drip Interval: ${await faucet.dripInterval()} seconds`);
  console.log(`   Max Drips Per User: ${await faucet.maxDripPerUser()}`);
  console.log(`   Paused: ${await faucet.paused()}`);

  // Display supported tokens
  console.log("\n💰 Supported Tokens:");
  const supportedTokens = await faucet.getSupportedTokens();
  
  for (const tokenAddress of supportedTokens) {
    const tokenInfo = await faucet.getTokenInfo(tokenAddress);
    console.log(`\n   ${tokenInfo.symbol}:`);
    console.log(`     Address: ${tokenAddress}`);
    console.log(`     Decimals: ${tokenInfo.decimals}`);
    console.log(`     Drip Amount: ${ethers.formatUnits(tokenInfo.dripAmount, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    console.log(`     Max Balance: ${ethers.formatUnits(tokenInfo.maxBalance, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    console.log(`     Active: ${tokenInfo.isActive ? "✅ Yes" : "❌ No"}`);
    console.log(`     Faucet Balance: ${ethers.formatUnits(tokenInfo.faucetBalance, tokenInfo.decimals)} ${tokenInfo.symbol}`);
  }

  // Get faucet statistics
  console.log("\n📈 Faucet Statistics:");
  const stats = await faucet.getFaucetStats();
  console.log(`   Total Users: ${stats.totalUsers}`);
  console.log(`   Total Drips: ${stats.totalDrips}`);
  console.log(`   Drip Interval: ${stats.dripInterval} seconds`);
  console.log(`   Max Drips Per User: ${stats.maxDripPerUser}`);

  console.log("\n🎉 Faucet deployment and configuration completed successfully!");

  // Save deployment info
  const deploymentInfo = {
    network: "Hyperion Testnet",
    chainId: 133717,
    faucetAddress: faucetAddress,
    deployer: deployer.address,
    dripInterval: dripInterval,
    maxDripsPerUser: maxDripsPerUser,
    supportedTokens: tokenSymbols.map(symbol => ({
      symbol,
      address: TOKENS[symbol as keyof typeof TOKENS],
      config: TOKEN_CONFIG[symbol as keyof typeof TOKEN_CONFIG]
    })),
    deploymentTime: new Date().toISOString()
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for reference
  const fs = require('fs');
  const deploymentPath = `dpsmc/hyperion/faucet/faucet-deployment-${Date.now()}.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);

  console.log("\n📋 Next Steps:");
  console.log("   1. Fund the faucet with tokens for distribution");
  console.log("   2. Test faucet functionality");
  console.log("   3. Deploy faucet on other networks (Lazchain, Metis Sepolia)");
  console.log("   4. Create user interface for faucet interaction");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 