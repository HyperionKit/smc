import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

const AMM_ADDRESS = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

// Token decimals
const DECIMALS = {
  USDT: 6,
  USDC: 6,
  DAI: 18,
  WETH: 18
};

// Test pairs
const PAIRS = [
  { from: "USDT", to: "USDC", amount: 100 },
  { from: "USDT", to: "DAI", amount: 100 },
  { from: "USDT", to: "WETH", amount: 100 },
  { from: "USDC", to: "USDT", amount: 100 },
  { from: "USDC", to: "DAI", amount: 100 },
  { from: "USDC", to: "WETH", amount: 100 },
  { from: "DAI", to: "USDT", amount: 100 },
  { from: "DAI", to: "USDC", amount: 100 },
  { from: "DAI", to: "WETH", amount: 100 },
  { from: "WETH", to: "USDT", amount: 1 },
  { from: "WETH", to: "USDC", amount: 1 },
  { from: "WETH", to: "DAI", amount: 1 }
];

async function testAllPairs() {
  console.log("🚀 Starting comprehensive pair testing...\n");

  // Get signers
  const [deployer] = await ethers.getSigners();
  const user = deployer; // Using deployer as test user

  console.log(`👤 Test User: ${await user.getAddress()}`);
  console.log(`💰 User Balance: ${ethers.formatEther(await ethers.provider.getBalance(user.address))} ETH\n`);

  // Get contract instances
  const amm = await ethers.getContractAt("LiquidityPool", AMM_ADDRESS);
  
  const tokens = {
    USDT: await ethers.getContractAt("contracts/SimpleERC20.sol:SimpleERC20", TOKENS.USDT),
    USDC: await ethers.getContractAt("contracts/SimpleERC20.sol:SimpleERC20", TOKENS.USDC),
    DAI: await ethers.getContractAt("contracts/SimpleERC20.sol:SimpleERC20", TOKENS.DAI),
    WETH: await ethers.getContractAt("contracts/SimpleERC20.sol:SimpleERC20", TOKENS.WETH)
  };

  let successCount = 0;
  let failureCount = 0;
  const results: any[] = [];

  // Test each pair
  for (const pair of PAIRS) {
    console.log(`\n🔄 Testing ${pair.from} → ${pair.to} (${pair.amount} ${pair.from})`);
    console.log("=" .repeat(50));

    try {
      const fromToken = tokens[pair.from as keyof typeof tokens];
      const toToken = tokens[pair.to as keyof typeof tokens];
      const fromAddress = TOKENS[pair.from as keyof typeof TOKENS];
      const toAddress = TOKENS[pair.to as keyof typeof TOKENS];
      const fromDecimals = DECIMALS[pair.from as keyof typeof DECIMALS];
      const toDecimals = DECIMALS[pair.to as keyof typeof DECIMALS];

      // Check initial balances
      const initialFromBalance = await fromToken.balanceOf(user.address);
      const initialToBalance = await toToken.balanceOf(user.address);

      console.log(`📊 Initial ${pair.from} balance: ${ethers.formatUnits(initialFromBalance, fromDecimals)}`);
      console.log(`📊 Initial ${pair.to} balance: ${ethers.formatUnits(initialToBalance, toDecimals)}`);

      // Check if user has enough tokens
      const swapAmount = ethers.parseUnits(pair.amount.toString(), fromDecimals);
      if (initialFromBalance < swapAmount) {
        console.log(`❌ Insufficient ${pair.from} balance for swap`);
        results.push({
          pair: `${pair.from} → ${pair.to}`,
          status: "FAILED",
          reason: "Insufficient balance"
        });
        failureCount++;
        continue;
      }

      // Get pool info
      const [reserveA, reserveB, totalLiquidity] = await amm.getPairInfo(fromAddress, toAddress);
      console.log(`🏊 Pool reserves - ${pair.from}: ${ethers.formatUnits(reserveA, fromDecimals)}, ${pair.to}: ${ethers.formatUnits(reserveB, toDecimals)}`);

      // Calculate expected output
      const expectedOutput = await amm.getAmountOut(swapAmount, fromAddress, toAddress);
      console.log(`📈 Expected ${pair.to} output: ${ethers.formatUnits(expectedOutput, toDecimals)}`);

      // Calculate price impact
      const priceBefore = Number(reserveB) / Number(reserveA);
      const newReserveA = Number(reserveA) + Number(swapAmount);
      const newReserveB = Number(reserveB) - Number(expectedOutput);
      const priceAfter = newReserveB / newReserveA;
      const priceImpact = ((priceBefore - priceAfter) / priceBefore) * 100;
      console.log(`📊 Price impact: ${priceImpact.toFixed(4)}%`);

      // Set slippage tolerance (1%)
      const slippageTolerance = 0.01;
      const minAmountOut = expectedOutput * BigInt(Math.floor((1 - slippageTolerance) * 1000)) / 1000n;

      // Approve tokens
      console.log(`✅ Approving ${pair.from}...`);
      const approveTx = await fromToken.approve(AMM_ADDRESS, swapAmount);
      await approveTx.wait();

      // Execute swap
      console.log(`🔄 Executing swap...`);
      const swapTx = await amm.swap(fromAddress, toAddress, swapAmount, minAmountOut);
      const swapReceipt = await swapTx.wait();

      // Check final balances
      const finalFromBalance = await fromToken.balanceOf(user.address);
      const finalToBalance = await toToken.balanceOf(user.address);

      console.log(`📊 Final ${pair.from} balance: ${ethers.formatUnits(finalFromBalance, fromDecimals)}`);
      console.log(`📊 Final ${pair.to} balance: ${ethers.formatUnits(finalToBalance, toDecimals)}`);

      // Calculate actual output
      const actualOutput = finalToBalance - initialToBalance;
      const actualInput = initialFromBalance - finalFromBalance;

      console.log(`💸 Actual ${pair.from} spent: ${ethers.formatUnits(actualInput, fromDecimals)}`);
      console.log(`💸 Actual ${pair.to} received: ${ethers.formatUnits(actualOutput, toDecimals)}`);

      // Calculate slippage
      const slippage = ((Number(expectedOutput) - Number(actualOutput)) / Number(expectedOutput)) * 100;
      console.log(`📊 Slippage: ${slippage.toFixed(4)}%`);

      // Verify swap was successful
      if (actualOutput > 0) {
        console.log(`✅ Swap successful! Transaction hash: ${swapReceipt?.hash}`);
        successCount++;
        results.push({
          pair: `${pair.from} → ${pair.to}`,
          status: "SUCCESS",
          input: ethers.formatUnits(actualInput, fromDecimals),
          output: ethers.formatUnits(actualOutput, toDecimals),
          slippage: slippage.toFixed(4) + "%",
          priceImpact: priceImpact.toFixed(4) + "%",
          txHash: swapReceipt?.hash
        });
      } else {
        console.log(`❌ Swap failed: No tokens received`);
        failureCount++;
        results.push({
          pair: `${pair.from} → ${pair.to}`,
          status: "FAILED",
          reason: "No tokens received"
        });
      }

    } catch (error: any) {
      console.log(`❌ Swap failed: ${error.message}`);
      failureCount++;
      results.push({
        pair: `${pair.from} → ${pair.to}`,
        status: "FAILED",
        reason: error.message
      });
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successful swaps: ${successCount}`);
  console.log(`❌ Failed swaps: ${failureCount}`);
  console.log(`📊 Success rate: ${((successCount / PAIRS.length) * 100).toFixed(2)}%`);

  console.log("\n📝 DETAILED RESULTS:");
  console.log("-".repeat(60));
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.pair}: ${result.status}`);
    if (result.status === "SUCCESS") {
      console.log(`   Input: ${result.input} | Output: ${result.output}`);
      console.log(`   Slippage: ${result.slippage} | Price Impact: ${result.priceImpact}`);
      console.log(`   TX: ${result.txHash}`);
    } else {
      console.log(`   Reason: ${result.reason}`);
    }
    console.log("");
  });

  // Check if all pairs are working
  if (successCount === PAIRS.length) {
    console.log("🎉 ALL PAIRS ARE WORKING PERFECTLY!");
  } else if (successCount > 0) {
    console.log("⚠️  SOME PAIRS ARE WORKING, BUT THERE ARE ISSUES WITH OTHERS");
  } else {
    console.log("💥 NO PAIRS ARE WORKING - THERE MIGHT BE A SYSTEMIC ISSUE");
  }
}

// Run the test
testAllPairs()
  .then(() => {
    console.log("\n🏁 Testing completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  }); 