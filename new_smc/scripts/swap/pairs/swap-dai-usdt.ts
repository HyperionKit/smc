import { ethers } from "hardhat";

async function swapDAIToUSDT() {
  console.log("🔄 SMC DeFi Swap: DAI → USDT");
  console.log("=================================");

  const [user] = await ethers.getSigners();
  console.log(`👤 User: ${user.address}`);

  // Contract addresses (Hyperion deployment)
  const daiAddress = "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb";
  const usdtAddress = "0x9b52D326D4866055F6c23297656002992e4293FC";
  const ammAddress = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

  // Swap configuration
  const fromToken = "DAI";
  const toToken = "USDT";
  const amount = 100; // 100 DAI

  console.log("\n=== Contract Addresses ===");
  console.log("DAI:", daiAddress);
  console.log("USDT:", usdtAddress);
  console.log("AMM:", ammAddress);

  console.log("\n=== Swap Configuration ===");
  console.log("From Token:", fromToken);
  console.log("To Token:", toToken);
  console.log("Amount:", amount);

  try {
    // Get contract instances
    const dai = await ethers.getContractAt("SimpleERC20", daiAddress);
    const usdt = await ethers.getContractAt("SimpleERC20", usdtAddress);
    const amm = await ethers.getContractAt("LiquidityPool", ammAddress);

    const swapAmount = ethers.parseUnits(amount.toString(), 18); // DAI has 18 decimals
    const userAddress = await user.getAddress();

    // Check balance
    const balance = await dai.balanceOf(userAddress);
    console.log(`${fromToken} balance:`, ethers.formatUnits(balance, 18));

    if (balance < swapAmount) {
      console.log(`❌ Insufficient ${fromToken} balance`);
      console.log(`💡 Try a smaller amount or get more ${fromToken} first`);
      process.exit(1);
    }

    // Get pool info
    const pool = await amm.getPool(daiAddress, usdtAddress);
    
    if (!pool.exists) {
      console.log("❌ Pool does not exist");
      process.exit(1);
    }
    
    console.log("Pool reserves - DAI:", ethers.formatUnits(pool.reserveA, 18), "USDT:", ethers.formatUnits(pool.reserveB, 6));

    // Calculate expected output
    const expectedOutput = await amm.getAmountOut(swapAmount, pool.reserveA, pool.reserveB);
    console.log(`Expected ${toToken} output:`, ethers.formatUnits(expectedOutput, 6));

    // Calculate price impact
    const priceBefore = Number(pool.reserveB) / Number(pool.reserveA);
    const newReserveA = Number(pool.reserveA) + Number(swapAmount);
    const newReserveB = Number(pool.reserveB) - Number(expectedOutput);
    const priceAfter = newReserveB / newReserveA;
    const priceImpact = ((priceBefore - priceAfter) / priceBefore) * 100;
    console.log(`Price impact: ${priceImpact.toFixed(4)}%`);

    // Approve tokens
    console.log("\n1. Approving DAI for AMM...");
    const approveTx = await dai.connect(user).approve(ammAddress, swapAmount);
    await approveTx.wait();
    console.log("✅ DAI approved");

    // Check USDT balance before
    const usdtBalanceBefore = await usdt.balanceOf(userAddress);
    console.log(`2. USDT balance before:`, ethers.formatUnits(usdtBalanceBefore, 6));

    // Execute swap
    console.log("3. Executing swap...");
    const swapTx = await amm.connect(user).swap(daiAddress, usdtAddress, swapAmount, 0); // minAmountOut = 0 for testing
    await swapTx.wait();
    console.log("✅ Swap executed successfully!");

    // Check USDT balance after
    const usdtBalanceAfter = await usdt.balanceOf(userAddress);
    const usdtReceived = usdtBalanceAfter - usdtBalanceBefore;
    console.log(`4. USDT received:`, ethers.formatUnits(usdtReceived, 6));
    console.log(`5. USDT balance after:`, ethers.formatUnits(usdtBalanceAfter, 6));

    // Calculate slippage
    const slippage = ((Number(expectedOutput) - Number(usdtReceived)) / Number(expectedOutput)) * 100;
    console.log(`6. Slippage: ${slippage.toFixed(4)}%`);

    console.log("\n🎉 DAI → USDT swap completed successfully!");

  } catch (error: any) {
    console.error("❌ Swap failed:", error.message);
    process.exit(1);
  }
}

// Run the swap
swapDAIToUSDT()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
