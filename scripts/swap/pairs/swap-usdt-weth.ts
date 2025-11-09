import { ethers } from "hardhat";

async function main() {
  console.log("=== USDT to WETH Swap Script ===\n");

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`Using signer: ${signer.address}\n`);

  // Contract addresses (Hyperion deployment)
  const USDT_ADDRESS = "0x9b52D326D4866055F6c23297656002992e4293FC";
  const WETH_ADDRESS = "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4";
  const AMM_ADDRESS = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

  // Initialize contracts
  const usdtContract = await ethers.getContractAt("Token", USDT_ADDRESS, signer);
  const wethContract = await ethers.getContractAt("Token", WETH_ADDRESS, signer);
  const ammContract = await ethers.getContractAt("LiquidityPool", AMM_ADDRESS, signer);

  try {
    // Get user balances before swap
    const usdtBalanceBefore = await usdtContract.balanceOf(signer.address);
    const wethBalanceBefore = await wethContract.balanceOf(signer.address);

    console.log("=== Pre-Swap Balances ===");
    console.log(`USDT Balance: ${ethers.formatUnits(usdtBalanceBefore, 6)} USDT`);
    console.log(`WETH Balance: ${ethers.formatUnits(wethBalanceBefore, 18)} WETH\n`);

    // Swap parameters
    const swapAmount = ethers.parseUnits("1000", 6); // 1000 USDT
    const minAmountOut = ethers.parseUnits("0.5", 18); // 0.5 WETH minimum (0.5% slippage)

    console.log("=== Swap Parameters ===");
    console.log(`Swap Amount: ${ethers.formatUnits(swapAmount, 6)} USDT`);
    console.log(`Minimum Output: ${ethers.formatUnits(minAmountOut, 18)} WETH`);
    console.log(`Slippage Tolerance: 0.5%\n`);

    // Check if user has enough USDT
    if (usdtBalanceBefore < swapAmount) {
      throw new Error(`Insufficient USDT balance. Required: ${ethers.formatUnits(swapAmount, 6)} USDT`);
    }

    // Check allowance
    const allowance = await usdtContract.allowance(signer.address, AMM_ADDRESS);
    if (allowance < swapAmount) {
      console.log("Approving USDT for AMM...");
      const approveTx = await usdtContract.approve(AMM_ADDRESS, ethers.MaxUint256);
      await approveTx.wait();
      console.log("✅ USDT approved for AMM\n");
    }

    // Get pool info
    const poolInfo = await ammContract.getPool(USDT_ADDRESS, WETH_ADDRESS);
    console.log("=== Pool Info ===");
    console.log(`Token A: ${poolInfo.tokenA}`);
    console.log(`Token B: ${poolInfo.tokenB}`);
    console.log(`Reserve A: ${ethers.formatUnits(poolInfo.reserveA, 6)}`);
    console.log(`Reserve B: ${ethers.formatUnits(poolInfo.reserveB, 18)}`);
    console.log(`Total Supply: ${ethers.formatUnits(poolInfo.totalSupply, 18)}`);
    console.log(`Pool Fee: ${poolInfo.fee} basis points\n`);

    // Calculate expected output
    const expectedOutput = await ammContract.getAmountOut(swapAmount, poolInfo.reserveA, poolInfo.reserveB);
    console.log(`Expected Output: ${ethers.formatUnits(expectedOutput, 18)} WETH`);

    // Execute swap
    console.log("\n=== Executing Swap ===");
    const swapTx = await ammContract.swap(
      USDT_ADDRESS,
      WETH_ADDRESS,
      swapAmount,
      minAmountOut
    );

    console.log(`Transaction hash: ${swapTx.hash}`);
    console.log("Waiting for confirmation...");
    
    const receipt = await swapTx.wait();
    console.log(`✅ Swap completed! Block: ${receipt?.blockNumber}\n`);

    // Get user balances after swap
    const usdtBalanceAfter = await usdtContract.balanceOf(signer.address);
    const wethBalanceAfter = await wethContract.balanceOf(signer.address);

    console.log("=== Post-Swap Balances ===");
    console.log(`USDT Balance: ${ethers.formatUnits(usdtBalanceAfter, 6)} USDT`);
    console.log(`WETH Balance: ${ethers.formatUnits(wethBalanceAfter, 18)} WETH\n`);

    // Calculate actual amounts
    const usdtSpent = usdtBalanceBefore - usdtBalanceAfter;
    const wethReceived = wethBalanceAfter - wethBalanceBefore;

    console.log("=== Swap Summary ===");
    console.log(`USDT Spent: ${ethers.formatUnits(usdtSpent, 6)} USDT`);
    console.log(`WETH Received: ${ethers.formatUnits(wethReceived, 18)} WETH`);
    console.log(`Effective Rate: 1 USDT = ${ethers.formatUnits(wethReceived * ethers.parseUnits("1", 6) / usdtSpent, 18)} WETH`);

    // Calculate fees
    const fee = usdtSpent - wethReceived;
    const feePercentage = (fee * 10000n) / usdtSpent; // Basis points
    console.log(`Total Fee: ${ethers.formatUnits(fee, 6)} USDT (${Number(feePercentage) / 100}%)`);

  } catch (error) {
    console.error("❌ Swap failed:", error);
    process.exit(1);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
