import { ethers } from "hardhat";

// BuyVault address (deployed)
const BUY_CONTRACT_ADDRESS = "0x0adFd197aAbbC194e8790041290Be57F18d576a3";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("🧮 Testing BuyVault calculation");
  console.log("User:", user.address);

  // Get BuyVault
  const buyContract = await ethers.getContractAt("BuyVault", BUY_CONTRACT_ADDRESS);

  try {
    // Get contract info
    const contractInfo = await (buyContract as any).getContractInfo();
    console.log("\n📋 Contract Info:");
    console.log(`USDC Price: ${ethers.formatEther(contractInfo[0])} METIS per USDC`);
    console.log(`USDT Price: ${ethers.formatEther(contractInfo[1])} METIS per USDT`);
    console.log(`USDC Balance: ${ethers.formatUnits(contractInfo[2], 6)} USDC`);
    console.log(`USDT Balance: ${ethers.formatUnits(contractInfo[3], 6)} USDT`);

    // Test different METIS amounts
    const testAmounts = [
      ethers.parseEther("0.1"),   // 0.1 METIS
      ethers.parseEther("1"),     // 1 METIS
      ethers.parseEther("10"),    // 10 METIS
    ];

    console.log("\n🧮 Testing USDC calculations:");
    for (const metisAmount of testAmounts) {
      const expectedUSDC = await (buyContract as any).getUSDCAmount(metisAmount);
      console.log(`\n${ethers.formatEther(metisAmount)} METIS:`);
      console.log(`  Raw result: ${expectedUSDC}`);
      console.log(`  As USDC (6 decimals): ${ethers.formatUnits(expectedUSDC, 6)} USDC`);
      console.log(`  As USDC (18 decimals): ${ethers.formatUnits(expectedUSDC, 18)} USDC`);
    }

    console.log("\n🧮 Manual calculation verification:");
    const metisAmount = ethers.parseEther("0.1");
    const usdcPrice = contractInfo[0];
    const PRICE_PRECISION = ethers.parseEther("1"); // 1e18
    
    console.log(`METIS Amount: ${ethers.formatEther(metisAmount)} METIS`);
    console.log(`USDC Price: ${ethers.formatEther(usdcPrice)} METIS per USDC`);
    console.log(`Price Precision: ${ethers.formatEther(PRICE_PRECISION)}`);
    
    const manualCalculation = (metisAmount * PRICE_PRECISION) / usdcPrice;
    console.log(`Manual calculation: ${manualCalculation}`);
    console.log(`Manual result (6 decimals): ${ethers.formatUnits(manualCalculation, 6)} USDC`);
    console.log(`Manual result (18 decimals): ${ethers.formatUnits(manualCalculation, 18)} USDC`);

    // Check if the contract has enough USDC for a small purchase
    const smallMetisAmount = ethers.parseEther("0.001"); // 0.001 METIS
    const smallExpectedUSDC = await (buyContract as any).getUSDCAmount(smallMetisAmount);
    console.log(`\n📊 Small purchase test (0.001 METIS):`);
    console.log(`Expected USDC: ${ethers.formatUnits(smallExpectedUSDC, 6)} USDC`);
    console.log(`Contract USDC Balance: ${ethers.formatUnits(contractInfo[2], 6)} USDC`);
    console.log(`Can purchase: ${contractInfo[2] >= smallExpectedUSDC ? "Yes" : "No"}`);

  } catch (error: any) {
    console.log(`❌ Failed to test calculation: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 