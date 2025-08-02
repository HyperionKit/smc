import { ethers } from "hardhat";

async function main() {
  console.log("=== USDC to WETH Swap Script ===\n");

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`Using signer: ${signer.address}\n`);

  // Contract addresses (Hyperion deployment)
  const USDC_ADDRESS = "0x31424DB0B7a929283C394b4DA412253Ab6D61682";
  const WETH_ADDRESS = "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4";
  const AMM_ADDRESS = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

  // Initialize contracts
  const usdcContract = await ethers.getContractAt("SimpleERC20", USDC_ADDRESS, signer);
  const wethContract = await ethers.getContractAt("SimpleERC20", WETH_ADDRESS, signer);
  const ammContract = await ethers.getContractAt("EnhancedAMM", AMM_ADDRESS, signer);

  try {
    // Get user balances before swap
    const usdcBalanceBefore = await usdcContract.balanceOf(signer.address);
    const wethBalanceBefore = await wethContract.balanceOf(signer.address);

    console.log("=== Pre-Swap Balances ===");
    console.log(`USDC Balance: ${ethers.formatUnits(usdcBalanceBefore, 6)} USDC`);
    console.log(`WETH Balance: ${ethers.formatUnits(wethBalanceBefore, 18)} WETH\n`);

    // Swap parameters
    const swapAmount = ethers.parseUnits("1000", 6); // 1000 USDC
    const minAmountOut = ethers.parseUnits("0.5", 18); // 0.5 WETH minimum (0.5% slippage)

    console.log("=== Swap Parameters ===");
    console.log(`Swap Amount: ${ethers.formatUnits(swapAmount, 6)} USDC`);
    console.log(`Minimum Output: ${ethers.formatUnits(minAmountOut, 18)} WETH`);
    console.log(`Slippage Tolerance: 0.5%\n`);

    // Check if user has enough USDC
    if (usdcBalanceBefore < swapAmount) {
      throw new Error(`Insufficient USDC balance. Required: ${ethers.formatUnits(swapAmount, 6)} USDC`);
    }

    // Check allowance
    const allowance = await usdcContract.allowance(signer.address, AMM_ADDRESS);
    if (allowance < swapAmount) {
      console.log("Approving USDC for AMM...");
      const approveTx = await usdcContract.approve(AMM_ADDRESS, ethers.MaxUint256);
      await approveTx.wait();
      console.log("✅ USDC approved for AMM\n");
    }

    // Get pool info
    const poolInfo = await ammContract.getPool(USDC_ADDRESS, WETH_ADDRESS);
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
      USDC_ADDRESS,
      WETH_ADDRESS,
      swapAmount,
      minAmountOut
    );

    console.log(`Transaction hash: ${swapTx.hash}`);
    console.log("Waiting for confirmation...");
    
    const receipt = await swapTx.wait();
    console.log(`✅ Swap completed! Block: ${receipt?.blockNumber}\n`);

    // Get user balances after swap
    const usdcBalanceAfter = await usdcContract.balanceOf(signer.address);
    const wethBalanceAfter = await wethContract.balanceOf(signer.address);

    console.log("=== Post-Swap Balances ===");
    console.log(`USDC Balance: ${ethers.formatUnits(usdcBalanceAfter, 6)} USDC`);
    console.log(`WETH Balance: ${ethers.formatUnits(wethBalanceAfter, 18)} WETH\n`);

    // Calculate actual amounts
    const usdcSpent = usdcBalanceBefore - usdcBalanceAfter;
    const wethReceived = wethBalanceAfter - wethBalanceBefore;

    console.log("=== Swap Summary ===");
    console.log(`USDC Spent: ${ethers.formatUnits(usdcSpent, 6)} USDC`);
    console.log(`WETH Received: ${ethers.formatUnits(wethReceived, 18)} WETH`);
    console.log(`Effective Rate: 1 USDC = ${ethers.formatUnits(wethReceived * ethers.parseUnits("1", 6) / usdcSpent, 18)} WETH`);

    // Calculate fees
    const fee = usdcSpent - wethReceived;
    const feePercentage = (fee * 10000n) / usdcSpent; // Basis points
    console.log(`Total Fee: ${ethers.formatUnits(fee, 6)} USDC (${Number(feePercentage) / 100}%)`);

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
