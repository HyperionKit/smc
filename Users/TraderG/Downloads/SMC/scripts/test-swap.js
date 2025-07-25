const { ethers } = require("hardhat");

async function main() {
    const [deployer, user] = await ethers.getSigners();
    
    // Load deployment info
    const fs = require('fs');
    const deploymentFile = `deployment-${hre.network.name}.json`;
    
    if (!fs.existsSync(deploymentFile)) {
        console.error(`Deployment file ${deploymentFile} not found. Please run deploy-swap.js first.`);
        return;
    }
    
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    
    // Get contract instances
    const tokenSwap = await ethers.getContractAt("TokenSwap", deployment.contracts.tokenSwap);
    const tokenA = await ethers.getContractAt("SimpleERC20", deployment.contracts.tokenA);
    const tokenB = await ethers.getContractAt("SimpleERC20", deployment.contracts.tokenB);
    const router = await ethers.getContractAt("UniswapV2Router02", deployment.contracts.router);
    
    console.log("=== SWAP TESTING ===");
    console.log("TokenSwap:", deployment.contracts.tokenSwap);
    console.log("Token A:", deployment.contracts.tokenA);
    console.log("Token B:", deployment.contracts.tokenB);
    console.log("Router:", deployment.contracts.router);
    console.log("====================\n");

    // Transfer some tokens to user for testing
    console.log("1. Transferring tokens to user for testing...");
    await tokenA.transfer(user.address, ethers.parseEther("100"));
    await tokenB.transfer(user.address, ethers.parseEther("100"));
    console.log(`Transferred 100 TKA and 100 TKB to ${user.address}`);

    // Check initial balances
    console.log("\n2. Checking initial balances...");
    const userTokenABalance = await tokenA.balanceOf(user.address);
    const userTokenBBalance = await tokenB.balanceOf(user.address);
    console.log(`User Token A balance: ${ethers.formatEther(userTokenABalance)} TKA`);
    console.log(`User Token B balance: ${ethers.formatEther(userTokenBBalance)} TKB`);

    // Get swap quote
    console.log("\n3. Getting swap quote...");
    const swapAmount = ethers.parseEther("10"); // Swap 10 TKA for TKB
    const expectedOutput = await tokenSwap.getAmountOut(
        deployment.contracts.tokenA,
        deployment.contracts.tokenB,
        swapAmount
    );
    console.log(`Expected output for ${ethers.formatEther(swapAmount)} TKA: ${ethers.formatEther(expectedOutput)} TKB`);

    // Calculate minimum output with slippage
    const minOutput = await tokenSwap.calculateMinAmountOut(expectedOutput);
    console.log(`Minimum output with slippage: ${ethers.formatEther(minOutput)} TKB`);

    // Approve tokens for swap
    console.log("\n4. Approving tokens for swap...");
    await tokenA.connect(user).approve(deployment.contracts.tokenSwap, swapAmount);
    console.log(`Approved ${ethers.formatEther(swapAmount)} TKA for swap`);

    // Execute swap
    console.log("\n5. Executing swap...");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now
    
    const swapTx = await tokenSwap.connect(user).swapExactTokensForTokens(
        deployment.contracts.tokenA,
        deployment.contracts.tokenB,
        swapAmount,
        minOutput,
        deadline
    );
    
    console.log("Swap transaction submitted:", swapTx.hash);
    await swapTx.wait();
    console.log("Swap completed successfully!");

    // Check final balances
    console.log("\n6. Checking final balances...");
    const finalTokenABalance = await tokenA.balanceOf(user.address);
    const finalTokenBBalance = await tokenB.balanceOf(user.address);
    
    console.log(`Final Token A balance: ${ethers.formatEther(finalTokenABalance)} TKA`);
    console.log(`Final Token B balance: ${ethers.formatEther(finalTokenBBalance)} TKB`);
    
    const tokenASpent = userTokenABalance - finalTokenABalance;
    const tokenBReceived = finalTokenBBalance - userTokenBBalance;
    
    console.log(`\nSwap Summary:`);
    console.log(`TKA spent: ${ethers.formatEther(tokenASpent)}`);
    console.log(`TKB received: ${ethers.formatEther(tokenBReceived)}`);
    console.log(`Actual rate: ${ethers.formatEther(tokenBReceived)} TKB per ${ethers.formatEther(tokenASpent)} TKA`);

    // Test reverse swap
    console.log("\n7. Testing reverse swap (TKB -> TKA)...");
    const reverseAmount = ethers.parseEther("5"); // Swap 5 TKB for TKA
    
    const expectedReverseOutput = await tokenSwap.getAmountOut(
        deployment.contracts.tokenB,
        deployment.contracts.tokenA,
        reverseAmount
    );
    console.log(`Expected output for ${ethers.formatEther(reverseAmount)} TKB: ${ethers.formatEther(expectedReverseOutput)} TKA`);

    // Approve for reverse swap
    await tokenB.connect(user).approve(deployment.contracts.tokenSwap, reverseAmount);
    
    const reverseSwapTx = await tokenSwap.connect(user).swapExactTokensForTokens(
        deployment.contracts.tokenB,
        deployment.contracts.tokenA,
        reverseAmount,
        expectedReverseOutput * 95n / 100n, // 5% slippage tolerance
        deadline
    );
    
    await reverseSwapTx.wait();
    console.log("Reverse swap completed!");

    // Final balance check
    const veryFinalTokenABalance = await tokenA.balanceOf(user.address);
    const veryFinalTokenBBalance = await tokenB.balanceOf(user.address);
    
    console.log(`\nVery final balances:`);
    console.log(`Token A: ${ethers.formatEther(veryFinalTokenABalance)} TKA`);
    console.log(`Token B: ${ethers.formatEther(veryFinalTokenBBalance)} TKB`);

    // Test pair existence check
    console.log("\n8. Testing pair existence check...");
    const pairExists = await tokenSwap.pairExists(deployment.contracts.tokenA, deployment.contracts.tokenB);
    console.log(`Pair exists for TKA/TKB: ${pairExists}`);

    // Test slippage update (owner only)
    console.log("\n9. Testing slippage update...");
    const currentSlippage = await tokenSwap.slippageTolerance();
    console.log(`Current slippage tolerance: ${currentSlippage} basis points (${currentSlippage / 100}%)`);
    
    const newSlippage = 100; // 1%
    await tokenSwap.updateSlippageTolerance(newSlippage);
    console.log(`Updated slippage tolerance to: ${newSlippage} basis points (${newSlippage / 100}%)`);

    console.log("\n=== SWAP TESTING COMPLETED ===");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 