import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

// Faucet contract address (update after deployment)
const FAUCET_ADDRESS = "0xE1B8C7168B0c48157A5e4B80649C5a1b83bF4cC4"; // TODO: Update with actual faucet address

async function main() {
  const [user] = await ethers.getSigners();
  console.log("Testing Faucet drip with account:", user.address);

  const balance = await ethers.provider.getBalance(user.address);
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

  // Get supported tokens
  const supportedTokens = await faucet.getSupportedTokens();
  console.log(`\n💰 Supported Tokens: ${supportedTokens.length} tokens`);

  // Test drip for each token
  for (const tokenAddress of supportedTokens) {
    console.log(`\n🌊 Testing drip for token: ${tokenAddress}`);
    
    // Get token info
    const tokenInfo = await faucet.getTokenInfo(tokenAddress);
    console.log(`   Token: ${tokenInfo.symbol}`);
    console.log(`   Drip Amount: ${ethers.formatUnits(tokenInfo.dripAmount, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    console.log(`   Max Balance: ${ethers.formatUnits(tokenInfo.maxBalance, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    console.log(`   Active: ${tokenInfo.isActive ? "✅ Yes" : "❌ No"}`);
    console.log(`   Faucet Balance: ${ethers.formatUnits(tokenInfo.faucetBalance, tokenInfo.decimals)} ${tokenInfo.symbol}`);

    if (!tokenInfo.isActive) {
      console.log(`   ❌ Token is not active. Skipping...`);
      continue;
    }

    // Get user's current balance
    const token = await ethers.getContractAt("SimpleERC20", tokenAddress);
    const userBalanceBefore = await token.balanceOf(user.address);
    console.log(`   User balance before: ${ethers.formatUnits(userBalanceBefore, tokenInfo.decimals)} ${tokenInfo.symbol}`);

    // Check if user can drip
    const userInfo = await faucet.getUserTokenInfo(user.address, tokenAddress);
    console.log(`   Last drip time: ${userInfo.lastDripTime}`);
    console.log(`   Total dripped: ${userInfo.totalDripped}`);
    console.log(`   Token dripped: ${ethers.formatUnits(userInfo.tokenDripped, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    console.log(`   Can drip: ${userInfo.canDrip ? "✅ Yes" : "❌ No"}`);

    if (userInfo.timeUntilNextDrip > 0) {
      const hours = Math.floor(Number(userInfo.timeUntilNextDrip) / 3600);
      const minutes = Math.floor((Number(userInfo.timeUntilNextDrip) % 3600) / 60);
      console.log(`   Time until next drip: ${hours}h ${minutes}m`);
    }

    // Try to drip if possible
    if (userInfo.canDrip) {
      console.log(`   Attempting to drip ${ethers.formatUnits(tokenInfo.dripAmount, tokenInfo.decimals)} ${tokenInfo.symbol}...`);
      
      try {
        const dripTx = await faucet.drip(tokenAddress);
        await dripTx.wait();
        
        // Check new balance
        const userBalanceAfter = await token.balanceOf(user.address);
        const received = userBalanceAfter - userBalanceBefore;
        
        console.log(`   ✅ Drip successful!`);
        console.log(`   User balance after: ${ethers.formatUnits(userBalanceAfter, tokenInfo.decimals)} ${tokenInfo.symbol}`);
        console.log(`   Received: ${ethers.formatUnits(received, tokenInfo.decimals)} ${tokenInfo.symbol}`);
        console.log(`   Transaction hash: ${dripTx.hash}`);
        
      } catch (error: any) {
        console.log(`   ❌ Drip failed: ${error.message}`);
      }
    } else {
      console.log(`   ⏳ Cannot drip at this time`);
    }
  }

  // Test dripAll function
  console.log(`\n🌊 Testing dripAll function...`);
  
  try {
    const dripAllTx = await faucet.dripAll();
    await dripAllTx.wait();
    console.log(`   ✅ dripAll successful!`);
    console.log(`   Transaction hash: ${dripAllTx.hash}`);
  } catch (error: any) {
    console.log(`   ❌ dripAll failed: ${error.message}`);
  }

  // Get updated user info for all tokens
  console.log(`\n📊 Updated User Information:`);
  for (const tokenAddress of supportedTokens) {
    const tokenInfo = await faucet.getTokenInfo(tokenAddress);
    const userInfo = await faucet.getUserTokenInfo(user.address, tokenAddress);
    const token = await ethers.getContractAt("SimpleERC20", tokenAddress);
    const userBalance = await token.balanceOf(user.address);
    
    console.log(`\n   ${tokenInfo.symbol}:`);
    console.log(`     Current Balance: ${ethers.formatUnits(userBalance, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    console.log(`     Total Dripped: ${userInfo.totalDripped}`);
    console.log(`     Token Dripped: ${ethers.formatUnits(userInfo.tokenDripped, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    console.log(`     Can Drip: ${userInfo.canDrip ? "✅ Yes" : "❌ No"}`);
  }

  // Get faucet statistics
  console.log("\n📈 Faucet Statistics:");
  const stats = await faucet.getFaucetStats();
  console.log(`   Total Users: ${stats._totalUsers}`);
  console.log(`   Total Drips: ${stats._totalDrips}`);
  console.log(`   Drip Interval: ${stats._dripInterval} seconds`);
  console.log(`   Max Drips Per User: ${stats._maxDripPerUser}`);

  console.log("\n🎉 Faucet testing completed!");

  console.log("\n📋 Next Steps:");
  console.log("   1. Wait for drip interval to test again");
  console.log("   2. Test with different user accounts");
  console.log("   3. Test faucet management functions");
  console.log("   4. Deploy faucet on other networks");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 