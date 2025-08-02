import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

// BuyVault address (deployed)
const BUY_CONTRACT_ADDRESS = "0x0adFd197aAbbC194e8790041290Be57F18d576a3";

// Funding amounts (using substantial amounts from user's balance)
const USDC_AMOUNT = 1000000; // 1,000,000 USDC (6 decimals)
const USDT_AMOUNT = 1000000; // 1,000,000 USDT (6 decimals)

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("💰 Funding BuyVault with USDC and USDT");
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer METIS balance:", ethers.formatEther(balance), "METIS");

  // Get contracts
  const buyContract = await ethers.getContractAt("BuyVault", BUY_CONTRACT_ADDRESS);
  const usdcToken = await ethers.getContractAt("SimpleERC20", TOKENS.USDC);
  const usdtToken = await ethers.getContractAt("SimpleERC20", TOKENS.USDT);

  console.log(`\n📊 BuyVault: ${BUY_CONTRACT_ADDRESS}`);
  console.log(`USDC Token: ${TOKENS.USDC}`);
  console.log(`USDT Token: ${TOKENS.USDT}`);

  try {
    // Get token decimals
    const usdcDecimals = await usdcToken.decimals();
    const usdtDecimals = await usdtToken.decimals();
    
    console.log(`\n📊 Token Decimals:`);
    console.log(`USDC: ${usdcDecimals} decimals`);
    console.log(`USDT: ${usdtDecimals} decimals`);

    // Check deployer's token balances
    const deployerUSDCBalance = await usdcToken.balanceOf(deployer.address);
    const deployerUSDTBalance = await usdtToken.balanceOf(deployer.address);

    console.log("\n📋 Deployer Token Balances:");
    console.log(`USDC: ${ethers.formatUnits(deployerUSDCBalance, usdcDecimals)} USDC`);
    console.log(`USDT: ${ethers.formatUnits(deployerUSDTBalance, usdtDecimals)} USDT`);

    // Calculate funding amounts with correct decimals
    const usdcAmount = BigInt(USDC_AMOUNT) * (BigInt(10) ** BigInt(usdcDecimals));
    const usdtAmount = BigInt(USDT_AMOUNT) * (BigInt(10) ** BigInt(usdtDecimals));

    console.log(`\n📊 Funding Amounts:`);
    console.log(`USDC: ${USDC_AMOUNT} USDC (${usdcAmount} wei)`);
    console.log(`USDT: ${USDT_AMOUNT} USDT (${usdtAmount} wei)`);

    // Check if deployer has enough tokens
    if (deployerUSDCBalance < usdcAmount) {
      console.log(`❌ Insufficient USDC balance`);
      console.log(`Required: ${USDC_AMOUNT} USDC`);
      console.log(`Available: ${ethers.formatUnits(deployerUSDCBalance, usdcDecimals)} USDC`);
      return;
    }

    if (deployerUSDTBalance < usdtAmount) {
      console.log(`❌ Insufficient USDT balance`);
      console.log(`Required: ${USDT_AMOUNT} USDT`);
      console.log(`Available: ${ethers.formatUnits(deployerUSDTBalance, usdtDecimals)} USDT`);
      return;
    }

    // Get current contract info
    const contractInfo = await (buyContract as any).getContractInfo();
    console.log("\n📋 Current Contract Info:");
    console.log(`USDC Balance: ${ethers.formatUnits(contractInfo[2], usdcDecimals)} USDC`);
    console.log(`USDT Balance: ${ethers.formatUnits(contractInfo[3], usdtDecimals)} USDT`);
    console.log(`METIS Balance: ${ethers.formatEther(contractInfo[4])} METIS`);

    console.log("\n🚀 Funding contract with tokens...");

    // Fund with USDC
    console.log(`\n📤 Transferring ${USDC_AMOUNT} USDC to contract...`);
    const usdcTx = await usdcToken.transfer(BUY_CONTRACT_ADDRESS, usdcAmount);
    await usdcTx.wait();
    console.log(`✅ USDC transfer successful!`);

    // Fund with USDT
    console.log(`\n📤 Transferring ${USDT_AMOUNT} USDT to contract...`);
    const usdtTx = await usdtToken.transfer(BUY_CONTRACT_ADDRESS, usdtAmount);
    await usdtTx.wait();
    console.log(`✅ USDT transfer successful!`);

    // Get updated contract info
    const newContractInfo = await (buyContract as any).getContractInfo();
    console.log("\n📋 Updated Contract Info:");
    console.log(`USDC Balance: ${ethers.formatUnits(newContractInfo[2], usdcDecimals)} USDC`);
    console.log(`USDT Balance: ${ethers.formatUnits(newContractInfo[3], usdtDecimals)} USDT`);
    console.log(`METIS Balance: ${ethers.formatEther(newContractInfo[4])} METIS`);

    // Get updated deployer balances
    const newDeployerUSDCBalance = await usdcToken.balanceOf(deployer.address);
    const newDeployerUSDTBalance = await usdtToken.balanceOf(deployer.address);

    console.log("\n📋 Updated Deployer Balances:");
    console.log(`USDC: ${ethers.formatUnits(newDeployerUSDCBalance, usdcDecimals)} USDC`);
    console.log(`USDT: ${ethers.formatUnits(newDeployerUSDTBalance, usdtDecimals)} USDT`);

    console.log("\n🎉 Contract funding completed successfully!");
    console.log("\n💡 Next Steps:");
    console.log("1. Test buying USDC: npx hardhat run scripts/buy/buy-usdc-with-metis.ts --network hyperion");
    console.log("2. Test buying USDT: npx hardhat run scripts/buy/buy-usdt-with-metis.ts --network hyperion");
    console.log("3. Check prices: npx hardhat run scripts/buy/check-buy-prices.ts --network hyperion");

  } catch (error: any) {
    console.log(`❌ Failed to fund contract: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 