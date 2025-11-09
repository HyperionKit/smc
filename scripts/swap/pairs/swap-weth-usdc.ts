import { ethers } from "hardhat";

async function swapWETHToUSDC() {
  console.log("🔄 SMC DeFi Swap: WETH → USDC");
  console.log("=================================");

  const [user] = await ethers.getSigners();
  console.log(`👤 User: ${user.address}`);

  // Contract addresses (Hyperion deployment)
  const wethAddress = "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4";
  const usdcAddress = "0x31424DB0B7a929283C394b4DA412253Ab6D61682";
  const ammAddress = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

  // Swap configuration
  const fromToken = "WETH";
  const toToken = "USDC";
  const amount = 100; // 100 WETH

  console.log("\n=== Contract Addresses ===");
  console.log("WETH:", wethAddress);
  console.log("USDC:", usdcAddress);
  console.log("AMM:", ammAddress);

  console.log("\n=== Swap Configuration ===");
  console.log("From Token:", fromToken);
  console.log("To Token:", toToken);
  console.log("Amount:", amount);

  try {
    // Get contract instances
    const weth = await ethers.getContractAt("Token", wethAddress);
    const usdc = await ethers.getContractAt("Token", usdcAddress);
    const amm = await ethers.getContractAt("LiquidityPool", ammAddress);

    const swapAmount = ethers.parseUnits(amount.toString(), 18); // WETH has 18 decimals
    const userAddress = await user.getAddress();

    // Check balance
    const balance = await weth.balanceOf(userAddress);
    console.log(`${fromToken} balance:`, ethers.formatUnits(balance, 18));

    if (balance < swapAmount) {
      console.log(`❌ Insufficient ${fromToken} balance`);
      console.log(`💡 Try a smaller amount or get more ${fromToken} first`);
      process.exit(1);
    }

    // Get pool info
    const pool = await amm.getPool(wethAddress, usdcAddress);
    
    if (!pool.exists) {
      console.log("❌ Pool does not exist");
      process.exit(1);
    }
    
    console.log("Pool reserves - WETH:", ethers.formatUnits(pool.reserveA, 18), "USDC:", ethers.formatUnits(pool.reserveB, 6));

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
    console.log("\n1. Approving WETH for AMM...");
    const approveTx = await weth.connect(user).approve(ammAddress, swapAmount);
    await approveTx.wait();
    console.log("✅ WETH approved");

    // Check USDC balance before
    const usdcBalanceBefore = await usdc.balanceOf(userAddress);
    console.log(`2. USDC balance before:`, ethers.formatUnits(usdcBalanceBefore, 6));

    // Execute swap
    console.log("3. Executing swap...");
    const swapTx = await amm.connect(user).swap(wethAddress, usdcAddress, swapAmount, 0); // minAmountOut = 0 for testing
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

    console.log("\n🎉 WETH → USDC swap completed successfully!");

  } catch (error: any) {
    console.error("❌ Swap failed:", error.message);
    process.exit(1);
  }
}

// Run the swap
swapWETHToUSDC()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
