import { ethers } from "hardhat";

// Faucet contract address (update after deployment)
const FAUCET_ADDRESS = "0xE1B8C7168B0c48157A5e4B80649C5a1b83bF4cC4"; // TODO: Update with actual faucet address

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Managing Faucet contract with owner account:", owner.address);

  const balance = await ethers.provider.getBalance(owner.address);
  console.log("Owner balance:", ethers.formatEther(balance), "METIS");

  // Get Faucet contract
  const faucet = await ethers.getContractAt("Faucet", FAUCET_ADDRESS);
  console.log("Faucet contract address:", FAUCET_ADDRESS);

  // Check if caller is owner
  const isOwner = await faucet.owner() === owner.address;
  console.log(`\n🔐 Owner Status: ${isOwner ? "✅ Is Owner" : "❌ Not Owner"}`);

  if (!isOwner) {
    console.log("❌ Caller is not the owner. Cannot perform management operations.");
    return;
  }

  // Display faucet configuration
  console.log("\n📊 Faucet Configuration:");
  console.log(`   Owner: ${await faucet.owner()}`);
  console.log(`   Drip Interval: ${await faucet.dripInterval()} seconds`);
  console.log(`   Max Drips Per User: ${await faucet.maxDripPerUser()}`);
  console.log(`   Paused: ${await faucet.paused()}`);

  // Get faucet statistics
  console.log("\n📈 Faucet Statistics:");
  const stats = await faucet.getFaucetStats();
  console.log(`   Total Users: ${stats.totalUsers}`);
  console.log(`   Total Drips: ${stats.totalDrips}`);
  console.log(`   Drip Interval: ${stats.dripInterval} seconds`);
  console.log(`   Max Drips Per User: ${stats.maxDripPerUser}`);

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

  console.log("\n🔧 Faucet Management Functions:");
  console.log("📋 Available management operations:");
  console.log("   1. Add new token to faucet");
  console.log("   2. Remove token from faucet");
  console.log("   3. Update token drip amount and max balance");
  console.log("   4. Set token active/inactive status");
  console.log("   5. Update drip interval");
  console.log("   6. Update max drips per user");
  console.log("   7. Fund faucet with tokens");
  console.log("   8. Emergency withdraw tokens");
  console.log("   9. Emergency withdraw ETH");
  console.log("   10. Pause/Unpause faucet");

  console.log("\n🎉 Faucet management overview completed!");

  console.log("\n📋 Next Steps:");
  console.log("   1. Uncomment management operations as needed");
  console.log("   2. Fund faucet with tokens for distribution");
  console.log("   3. Test faucet functionality");
  console.log("   4. Deploy faucet on other networks");
  console.log("   5. Monitor faucet usage and refill as needed");

  // Example management operations (commented out)
  /*
  // Example: Update drip interval to 12 hours
  console.log("\n⚙️ Updating drip interval to 12 hours...");
  const newInterval = 12 * 60 * 60; // 12 hours
  const updateIntervalTx = await faucet.setDripInterval(newInterval);
  await updateIntervalTx.wait();
  console.log("✅ Drip interval updated successfully");

  // Example: Fund faucet with USDT
  console.log("\n💰 Funding faucet with USDT...");
  const usdtAddress = "0x9b52D326D4866055F6c23297656002992e4293FC";
  const fundAmount = ethers.parseUnits("50000", 6); // 50,000 USDT
  
  const usdt = await ethers.getContractAt("SimpleERC20", usdtAddress);
  const approveTx = await usdt.approve(FAUCET_ADDRESS, fundAmount);
  await approveTx.wait();
  
  const fundTx = await faucet.fundFaucet(usdtAddress, fundAmount);
  await fundTx.wait();
  console.log("✅ Faucet funded successfully");

  // Example: Update token configuration
  console.log("\n🔧 Updating USDT configuration...");
  const newDripAmount = ethers.parseUnits("2000", 6); // 2000 USDT per drip
  const newMaxBalance = ethers.parseUnits("20000", 6); // Max 20,000 USDT balance
  
  const updateTokenTx = await faucet.updateToken(usdtAddress, newDripAmount, newMaxBalance);
  await updateTokenTx.wait();
  console.log("✅ Token configuration updated successfully");
  */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 