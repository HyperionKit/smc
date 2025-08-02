import { ethers } from "hardhat";

async function swapDAIToWETH() {
  console.log("🔄 SMC DeFi Swap: DAI → WETH");
  console.log("=================================");

  const [user] = await ethers.getSigners();
  console.log(`👤 User: ${user.address}`);

  // Contract addresses (Hyperion deployment)
  const daiAddress = "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb";
  const wethAddress = "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4";
  const ammAddress = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

  // Swap configuration
  const fromToken = "DAI";
  const toToken = "WETH";
  const amount = 100; // 100 DAI

  console.log("\n=== Contract Addresses ===");
  console.log("DAI:", daiAddress);
  console.log("WETH:", wethAddress);
  console.log("AMM:", ammAddress);

  console.log("\n=== Swap Configuration ===");
  console.log("From Token:", fromToken);
  console.log("To Token:", toToken);
  console.log("Amount:", amount);

  try {
    // Get contract instances
    const dai = await ethers.getContractAt("SimpleERC20", daiAddress);
    const weth = await ethers.getContractAt("SimpleERC20", wethAddress);
    const amm = await ethers.getContractAt("EnhancedAMM", ammAddress);

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
    const pool = await amm.getPool(daiAddress, wethAddress);
    
    if (!pool.exists) {
      console.log("❌ Pool does not exist");
      process.exit(1);
    }
    
    console.log("Pool reserves - DAI:", ethers.formatUnits(pool.reserveA, 18), "WETH:", ethers.formatUnits(pool.reserveB, 18));

    // Calculate expected output
    const expectedOutput = await amm.getAmountOut(swapAmount, pool.reserveA, pool.reserveB);
    console.log(`Expected ${toToken} output:`, ethers.formatUnits(expectedOutput, 18));

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

    // Check WETH balance before
    const wethBalanceBefore = await weth.balanceOf(userAddress);
    console.log(`2. WETH balance before:`, ethers.formatUnits(wethBalanceBefore, 18));

    // Execute swap
    console.log("3. Executing swap...");
    const swapTx = await amm.connect(user).swap(daiAddress, wethAddress, swapAmount, 0); // minAmountOut = 0 for testing
    await swapTx.wait();
    console.log("✅ Swap executed successfully!");

    // Check WETH balance after
    const wethBalanceAfter = await weth.balanceOf(userAddress);
    const wethReceived = wethBalanceAfter - wethBalanceBefore;
    console.log(`4. WETH received:`, ethers.formatUnits(wethReceived, 18));
    console.log(`5. WETH balance after:`, ethers.formatUnits(wethBalanceAfter, 18));

    // Calculate slippage
    const slippage = ((Number(expectedOutput) - Number(wethReceived)) / Number(expectedOutput)) * 100;
    console.log(`6. Slippage: ${slippage.toFixed(4)}%`);

    console.log("\n🎉 DAI → WETH swap completed successfully!");

  } catch (error: any) {
    console.error("❌ Swap failed:", error.message);
    process.exit(1);
  }
}

// Run the swap
swapDAIToWETH()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
