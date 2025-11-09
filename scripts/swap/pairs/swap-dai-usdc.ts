import { ethers } from "hardhat";

async function swapDAIToUSDC() {
  console.log("🔄 SMC DeFi Swap: DAI → USDC");
  console.log("=================================");

  const [user] = await ethers.getSigners();
  console.log(`👤 User: ${user.address}`);

  // Contract addresses (Hyperion deployment)
  const daiAddress = "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb";
  const usdcAddress = "0x31424DB0B7a929283C394b4DA412253Ab6D61682";
  const ammAddress = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

  // Swap configuration
  const fromToken = "DAI";
  const toToken = "USDC";
  const amount = 100; // 100 DAI

  console.log("\n=== Contract Addresses ===");
  console.log("DAI:", daiAddress);
  console.log("USDC:", usdcAddress);
  console.log("AMM:", ammAddress);

  console.log("\n=== Swap Configuration ===");
  console.log("From Token:", fromToken);
  console.log("To Token:", toToken);
  console.log("Amount:", amount);

  try {
    // Get contract instances
    const dai = await ethers.getContractAt("Token", daiAddress);
    const usdc = await ethers.getContractAt("Token", usdcAddress);
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
    const [reserveA, reserveB, totalLiquidity] = await amm.getPairInfo(daiAddress, usdcAddress);
    
    console.log("Pool reserves - DAI:", ethers.formatUnits(reserveA, 18), "USDC:", ethers.formatUnits(reserveB, 6));

    // Calculate expected output
    const expectedOutput = await amm.getAmountOut(swapAmount, daiAddress, usdcAddress);
    console.log(`Expected ${toToken} output:`, ethers.formatUnits(expectedOutput, 6));

    // Calculate price impact
    const priceBefore = Number(reserveB) / Number(reserveA);
    const newReserveA = Number(reserveA) + Number(swapAmount);
    const newReserveB = Number(reserveB) - Number(expectedOutput);
    const priceAfter = newReserveB / newReserveA;
    const priceImpact = ((priceBefore - priceAfter) / priceBefore) * 100;
    console.log(`Price impact: ${priceImpact.toFixed(4)}%`);

    // Approve tokens
    console.log("\n1. Approving DAI for AMM...");
    const approveTx = await dai.connect(user).approve(ammAddress, swapAmount);
    await approveTx.wait();
    console.log("✅ DAI approved");

    // Check USDC balance before
    const usdcBalanceBefore = await usdc.balanceOf(userAddress);
    console.log(`2. USDC balance before:`, ethers.formatUnits(usdcBalanceBefore, 6));

    // Execute swap
    console.log("3. Executing swap...");
    const swapTx = await amm.connect(user).swap(daiAddress, usdcAddress, swapAmount, 0); // minAmountOut = 0 for testing
    await swapTx.wait();
    console.log("✅ Swap executed successfully!");

    // Check USDC balance after
    const usdcBalanceAfter = await usdc.balanceOf(userAddress);
    const usdcReceived = usdcBalanceAfter - usdcBalanceBefore;
    console.log(`4. USDC received:`, ethers.formatUnits(usdcReceived, 6));
    console.log(`5. USDC balance after:`, ethers.formatUnits(usdcBalanceAfter, 6));

    // Calculate slippage
    const slippage = ((Number(expectedOutput) - Number(usdcReceived)) / Number(expectedOutput)) * 100;
    console.log(`6. Slippage: ${slippage.toFixed(4)}%`);

    console.log("\n🎉 DAI → USDC swap completed successfully!");

  } catch (error: any) {
    console.error("❌ Swap failed:", error.message);
    process.exit(1);
  }
}

// Run the swap
swapDAIToUSDC()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
