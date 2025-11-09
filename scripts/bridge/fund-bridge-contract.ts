import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

// Bridge contract address (Hyperion deployment)
const BRIDGE_ADDRESS = "0xfF064Fd496256e84b68dAE2509eDA84a3c235550";

// Funding amounts (adjust as needed)
const FUNDING_AMOUNTS = {
  USDT: ethers.parseUnits("100000", 6),  // 100,000 USDT
  USDC: ethers.parseUnits("100000", 6),  // 100,000 USDC
  DAI: ethers.parseUnits("100000", 18),  // 100,000 DAI
  WETH: ethers.parseUnits("1000", 18)    // 1,000 WETH
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Funding Bridge contract with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

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

  for (const config of tokenConfigs) {
    console.log(`\n💰 Funding ${config.symbol}...`);
    
    // Get token contract
    const token = await ethers.getContractAt("Token", config.address);
    
    // Check if token is supported by bridge
    const isSupported = await bridge.supportedTokens(config.address);
    if (!isSupported) {
      console.log(`❌ ${config.symbol} is not supported by bridge. Skipping...`);
      continue;
    }

    // Check deployer's token balance
    const deployerBalance = await token.balanceOf(deployer.address);
    console.log(`   Deployer ${config.symbol} balance: ${ethers.formatUnits(deployerBalance, config.decimals)}`);

    if (deployerBalance < config.amount) {
      console.log(`❌ Insufficient ${config.symbol} balance. Need ${ethers.formatUnits(config.amount, config.decimals)}, have ${ethers.formatUnits(deployerBalance, config.decimals)}`);
      continue;
    }

    // Check bridge's current token balance
    const bridgeBalance = await token.balanceOf(BRIDGE_ADDRESS);
    console.log(`   Bridge ${config.symbol} balance: ${ethers.formatUnits(bridgeBalance, config.decimals)}`);

    // Transfer tokens to bridge
    console.log(`   Transferring ${ethers.formatUnits(config.amount, config.decimals)} ${config.symbol} to bridge...`);
    
    const tx = await token.transfer(BRIDGE_ADDRESS, config.amount);
    await tx.wait();
    
    console.log(`✅ Successfully funded bridge with ${ethers.formatUnits(config.amount, config.decimals)} ${config.symbol}`);
  }

  // Display final bridge balances
  console.log("\n📊 Final Bridge Balances:");
  for (const config of tokenConfigs) {
    const token = await ethers.getContractAt("Token", config.address);
    const bridgeBalance = await token.balanceOf(BRIDGE_ADDRESS);
    console.log(`   ${config.symbol}: ${ethers.formatUnits(bridgeBalance, config.decimals)}`);
  }

  // Get bridge statistics
  const stats = await bridge.getBridgeStats();
  console.log("\n📈 Bridge Statistics:");
  console.log(`   Total Deposits: ${stats.totalDeposits}`);
  console.log(`   Total Withdrawals: ${stats.totalWithdrawals}`);
  console.log(`   Current Fee: ${ethers.formatEther(stats.currentFee)} ETH`);

  console.log("\n🎉 Bridge funding completed successfully!");
  console.log("\n📋 Next Steps:");
  console.log("   1. Test bridge deposit functionality");
  console.log("   2. Test bridge withdrawal functionality");
  console.log("   3. Deploy bridge on destination networks");
  console.log("   4. Configure relayers for cross-chain communication");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 