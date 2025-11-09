import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

// Faucet contract address (Hyperion deployment)
const FAUCET_ADDRESS = "0xE1B8C7168B0c48157A5e4B80649C5a1b83bF4cC4";

// Funding amounts for each token
const FUNDING_AMOUNTS = {
  USDT: ethers.parseUnits("100000", 6),   // 100,000 USDT
  USDC: ethers.parseUnits("100000", 6),   // 100,000 USDC
  DAI: ethers.parseUnits("100000", 18),   // 100,000 DAI
  WETH: ethers.parseUnits("100", 18)      // 100 WETH
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Funding Faucet contract with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Get Faucet contract
  const faucet = await ethers.getContractAt("Faucet", FAUCET_ADDRESS);
  console.log("Faucet contract address:", FAUCET_ADDRESS);

  // Check faucet configuration
  console.log("\n📊 Faucet Configuration:");
  console.log(`   Owner: ${await faucet.owner()}`);
  console.log(`   Drip Interval: ${await faucet.dripInterval()} seconds`);
  console.log(`   Max Drips Per User: ${await faucet.maxDripPerUser()}`);
  console.log(`   Paused: ${await faucet.paused()}`);

  // Fund each token
  const tokenSymbols = ["USDT", "USDC", "DAI", "WETH"];

  for (const symbol of tokenSymbols) {
    console.log(`\n💰 Funding ${symbol}...`);
    
    const tokenAddress = TOKENS[symbol as keyof typeof TOKENS];
    const fundingAmount = FUNDING_AMOUNTS[symbol as keyof typeof FUNDING_AMOUNTS];
    const decimals = symbol === "USDT" || symbol === "USDC" ? 6 : 18;

    // Get token contract
    const token = await ethers.getContractAt("Token", tokenAddress);
    
    // Check if token is supported by faucet
    const isSupported = await faucet.isSupportedToken(tokenAddress);
    if (!isSupported) {
      console.log(`   ❌ ${symbol} is not supported by faucet. Skipping...`);
      continue;
    }

    // Check deployer's token balance
    const deployerBalance = await token.balanceOf(deployer.address);
    console.log(`   Deployer ${symbol} balance: ${ethers.formatUnits(deployerBalance, decimals)}`);

    if (deployerBalance < fundingAmount) {
      console.log(`   ❌ Insufficient ${symbol} balance. Need ${ethers.formatUnits(fundingAmount, decimals)}, have ${ethers.formatUnits(deployerBalance, decimals)}`);
      continue;
    }

    // Check faucet's current balance
    const faucetBalance = await token.balanceOf(FAUCET_ADDRESS);
    console.log(`   Faucet ${symbol} balance: ${ethers.formatUnits(faucetBalance, decimals)}`);

    // Check deployer's allowance
    const allowance = await token.allowance(deployer.address, FAUCET_ADDRESS);
    console.log(`   Current allowance: ${ethers.formatUnits(allowance, decimals)} ${symbol}`);

    // Approve tokens if needed
    if (allowance < fundingAmount) {
      console.log(`   Approving ${ethers.formatUnits(fundingAmount, decimals)} ${symbol}...`);
      const approveTx = await token.approve(FAUCET_ADDRESS, fundingAmount);
      await approveTx.wait();
      console.log(`   ✅ Approved ${ethers.formatUnits(fundingAmount, decimals)} ${symbol}`);
    }

    // Fund the faucet
    console.log(`   Funding faucet with ${ethers.formatUnits(fundingAmount, decimals)} ${symbol}...`);
    const fundTx = await faucet.fundFaucet(tokenAddress, fundingAmount);
    await fundTx.wait();
    console.log(`   ✅ Successfully funded faucet with ${ethers.formatUnits(fundingAmount, decimals)} ${symbol}`);

    // Check new faucet balance
    const newFaucetBalance = await token.balanceOf(FAUCET_ADDRESS);
    console.log(`   New faucet ${symbol} balance: ${ethers.formatUnits(newFaucetBalance, decimals)}`);
  }

  // Display final faucet balances
  console.log("\n📊 Final Faucet Balances:");
  const supportedTokens = await faucet.getSupportedTokens();
  
  for (const tokenAddress of supportedTokens) {
    const tokenInfo = await faucet.getTokenInfo(tokenAddress);
    console.log(`   ${tokenInfo.symbol}: ${ethers.formatUnits(tokenInfo.faucetBalance, tokenInfo.decimals)}`);
  }

  // Get faucet statistics
  console.log("\n📈 Faucet Statistics:");
  const stats = await faucet.getFaucetStats();
  console.log(`   Total Users: ${stats._totalUsers}`);
  console.log(`   Total Drips: ${stats._totalDrips}`);
  console.log(`   Drip Interval: ${stats._dripInterval} seconds`);
  console.log(`   Max Drips Per User: ${stats._maxDripPerUser}`);

  console.log("\n🎉 Faucet funding completed successfully!");

  console.log("\n📋 Next Steps:");
  console.log("   1. Test faucet drip functionality");
  console.log("   2. Deploy faucet on other networks");
  console.log("   3. Create user interface for faucet interaction");
  console.log("   4. Monitor faucet usage and refill as needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 