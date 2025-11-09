import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

// Bridge contract address (update after deployment)
const BRIDGE_ADDRESS = "0xfF064Fd496256e84b68dAE2509eDA84a3c235550"; // TODO: Update with actual bridge address

// Test withdrawal parameters (simulate a deposit from another chain)
const TEST_WITHDRAWAL = {
  user: "0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff", // Test user address
  token: TOKENS.USDT,
  amount: ethers.parseUnits("100", 6), // 100 USDT
  depositId: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // Mock deposit ID
  signature: "0x" // Mock signature - in production this would be a real signature
};

async function main() {
  const [relayer] = await ethers.getSigners();
  console.log("Testing Bridge withdrawal with relayer account:", relayer.address);

  const balance = await ethers.provider.getBalance(relayer.address);
  console.log("Relayer balance:", ethers.formatEther(balance), "METIS");

  // Get Bridge contract
  const bridge = await ethers.getContractAt("Bridge", BRIDGE_ADDRESS);
  console.log("Bridge contract address:", BRIDGE_ADDRESS);

  // Check if caller is a relayer
  const isRelayer = await bridge.relayers(relayer.address);
  console.log(`\n🔐 Relayer Status: ${isRelayer ? "✅ Is Relayer" : "❌ Not Relayer"}`);

  if (!isRelayer) {
    console.log("❌ Caller is not a relayer. Cannot test withdrawal.");
    console.log("📋 To become a relayer, the bridge owner must call addRelayer()");
    return;
  }

  // Check bridge configuration
  console.log("\n📊 Bridge Configuration:");
  console.log(`   Owner: ${await bridge.owner()}`);
  console.log(`   Bridge Fee: ${ethers.formatEther(await bridge.bridgeFee())} ETH`);
  console.log(`   Paused: ${await bridge.paused()}`);

  // Check if token is supported
  const isTokenSupported = await bridge.supportedTokens(TEST_WITHDRAWAL.token);
  console.log(`\n💰 Token Support: ${isTokenSupported ? "✅ Supported" : "❌ Not Supported"}`);

  if (!isTokenSupported) {
    console.log("❌ Token is not supported by bridge.");
    return;
  }

  // Get token contract
  const token = await ethers.getContractAt("Token", TEST_WITHDRAWAL.token);
  const tokenSymbol = await bridge.tokenSymbols(TEST_WITHDRAWAL.token);

  // Check bridge's token balance
  const bridgeBalance = await token.balanceOf(BRIDGE_ADDRESS);
  console.log(`\n💰 Bridge ${tokenSymbol} balance: ${ethers.formatUnits(bridgeBalance, 6)}`);

  if (bridgeBalance < TEST_WITHDRAWAL.amount) {
    console.log(`❌ Insufficient bridge balance. Need ${ethers.formatUnits(TEST_WITHDRAWAL.amount, 6)}, have ${ethers.formatUnits(bridgeBalance, 6)}`);
    console.log("📋 Fund the bridge first using fund-bridge-contract.ts");
    return;
  }

  // Check if withdrawal is already processed
  const isProcessed = await bridge.isWithdrawalProcessed(TEST_WITHDRAWAL.depositId);
  console.log(`\n📋 Withdrawal Status: ${isProcessed ? "❌ Already Processed" : "✅ Ready to Process"}`);

  if (isProcessed) {
    console.log("❌ Withdrawal already processed. Cannot process again.");
    return;
  }

  // Check user's balance before withdrawal
  const userBalanceBefore = await token.balanceOf(TEST_WITHDRAWAL.user);
  console.log(`\n👤 User ${tokenSymbol} balance before: ${ethers.formatUnits(userBalanceBefore, 6)}`);

  // Test withdrawal
  console.log(`\n🌉 Processing withdrawal...`);
  console.log(`   User: ${TEST_WITHDRAWAL.user}`);
  console.log(`   Token: ${tokenSymbol} (${TEST_WITHDRAWAL.token})`);
  console.log(`   Amount: ${ethers.formatUnits(TEST_WITHDRAWAL.amount, 6)} ${tokenSymbol}`);
  console.log(`   Deposit ID: ${TEST_WITHDRAWAL.depositId}`);

  try {
    const withdrawalTx = await bridge.withdraw(
      TEST_WITHDRAWAL.user,
      TEST_WITHDRAWAL.token,
      TEST_WITHDRAWAL.amount,
      TEST_WITHDRAWAL.depositId,
      TEST_WITHDRAWAL.signature
    );

    const receipt = await withdrawalTx.wait();
    console.log(`✅ Withdrawal successful!`);
    console.log(`   Transaction hash: ${receipt?.hash}`);
    console.log(`   Gas used: ${receipt?.gasUsed?.toString()}`);

    // Get withdrawal ID from event
    const withdrawalEvent = receipt?.logs?.find(log => {
      try {
        const parsed = bridge.interface.parseLog(log);
        return parsed?.name === "TokenWithdrawn";
      } catch {
        return false;
      }
    });

    if (withdrawalEvent) {
      const parsed = bridge.interface.parseLog(withdrawalEvent);
      const withdrawalId = parsed?.args?.withdrawalId;
      console.log(`   Withdrawal ID: ${withdrawalId}`);
    }

    // Check user's balance after withdrawal
    const userBalanceAfter = await token.balanceOf(TEST_WITHDRAWAL.user);
    console.log(`\n👤 User ${tokenSymbol} balance after: ${ethers.formatUnits(userBalanceAfter, 6)}`);
    console.log(`   Balance change: +${ethers.formatUnits(userBalanceAfter - userBalanceBefore, 6)} ${tokenSymbol}`);

    // Check bridge's balance after withdrawal
    const bridgeBalanceAfter = await token.balanceOf(BRIDGE_ADDRESS);
    console.log(`\n💰 Bridge ${tokenSymbol} balance after: ${ethers.formatUnits(bridgeBalanceAfter, 6)}`);
    console.log(`   Balance change: -${ethers.formatUnits(bridgeBalance - bridgeBalanceAfter, 6)} ${tokenSymbol}`);

  } catch (error: any) {
    console.log(`❌ Withdrawal failed: ${error.message}`);
    
    // Check if it's a signature verification error
    if (error.message.includes("invalid signature")) {
      console.log("\n📋 Note: This is expected in testing since we're using a mock signature.");
      console.log("📋 In production, relayers would use real signatures from the source chain.");
    }
  }

  // Get bridge statistics
  const stats = await bridge.getBridgeStats();
  console.log("\n📈 Bridge Statistics:");
  console.log(`   Total Deposits: ${stats.totalDeposits}`);
  console.log(`   Total Withdrawals: ${stats.totalWithdrawals}`);
  console.log(`   Current Fee: ${ethers.formatEther(stats.currentFee)} ETH`);

  console.log("\n🎉 Bridge withdrawal testing completed!");
  console.log("\n📋 Next Steps:");
  console.log("   1. Deploy bridge on destination networks");
  console.log("   2. Implement proper signature verification");
  console.log("   3. Set up relayer infrastructure");
  console.log("   4. Monitor cross-chain events");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 