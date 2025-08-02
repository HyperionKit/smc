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

// Test parameters
const METIS_AMOUNT = ethers.parseEther("0.1"); // 0.1 METIS
const SLIPPAGE_TOLERANCE = 0.95; // 95% of expected amount

async function main() {
  const [user] = await ethers.getSigners();
  console.log("💰 Buying USDC with METIS using BuyVault");
  console.log("User:", user.address);

  const balance = await ethers.provider.getBalance(user.address);
  console.log("User METIS balance:", ethers.formatEther(balance), "METIS");

  // Get contracts
  const buyContract = await ethers.getContractAt("BuyVault", BUY_CONTRACT_ADDRESS);
  const usdcToken = await ethers.getContractAt("SimpleERC20", TOKENS.USDC);

  console.log(`\n📊 BuyVault: ${BUY_CONTRACT_ADDRESS}`);
  console.log(`USDC Token: ${TOKENS.USDC}`);

  try {
    // Get token decimals
    const usdcDecimals = await usdcToken.decimals();
    console.log(`\n📊 USDC Decimals: ${usdcDecimals}`);

    // Get contract info
    const contractInfo = await (buyContract as any).getContractInfo();
    console.log("\n📋 Contract Info:");
    console.log(`USDC Price: ${ethers.formatEther(contractInfo[0])} METIS per USDC`);
    console.log(`USDT Price: ${ethers.formatEther(contractInfo[1])} METIS per USDT`);
    console.log(`USDC Balance: ${ethers.formatUnits(contractInfo[2], usdcDecimals)} USDC`);
    console.log(`USDT Balance: ${ethers.formatUnits(contractInfo[3], usdcDecimals)} USDT`);
    console.log(`METIS Balance: ${ethers.formatEther(contractInfo[4])} METIS`);

    // Check if contract has enough USDC
    if (contractInfo[2] === 0n) {
      console.log("\n❌ Contract has no USDC balance");
      console.log("Please fund the contract with USDC tokens first");
      return;
    }

    // Calculate expected USDC amount
    const expectedUSDC = await (buyContract as any).getUSDCAmount(METIS_AMOUNT);
    console.log(`\n📈 Expected USDC for ${ethers.formatEther(METIS_AMOUNT)} METIS: ${ethers.formatUnits(expectedUSDC, usdcDecimals)} USDC`);

    // Calculate minimum amount with slippage protection
    const minUSDCAmount = expectedUSDC * BigInt(Math.floor(SLIPPAGE_TOLERANCE * 100)) / BigInt(100);
    console.log(`🛡️ Minimum USDC amount (with ${(1-SLIPPAGE_TOLERANCE)*100}% slippage): ${ethers.formatUnits(minUSDCAmount, usdcDecimals)} USDC`);

    // Check user's current USDC balance
    const initialUSDCBalance = await usdcToken.balanceOf(user.address);
    console.log(`\n💰 Current USDC balance: ${ethers.formatUnits(initialUSDCBalance, usdcDecimals)} USDC`);

    // Check if user has enough METIS
    if (balance < METIS_AMOUNT) {
      console.log(`❌ Insufficient METIS balance`);
      console.log(`Required: ${ethers.formatEther(METIS_AMOUNT)} METIS`);
      console.log(`Available: ${ethers.formatEther(balance)} METIS`);
      return;
    }

    console.log(`\n🚀 Executing buy transaction...`);
    
    // Buy USDC with METIS
    const tx = await (buyContract as any).buyUSDC(minUSDCAmount, {
      value: METIS_AMOUNT
    });
    console.log(`🔗 Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Buy transaction successful!`);
    console.log(`Gas used: ${receipt?.gasUsed?.toString()}`);

    // Get updated USDC balance
    const finalUSDCBalance = await usdcToken.balanceOf(user.address);
    const usdcReceived = finalUSDCBalance - initialUSDCBalance;
    
    console.log(`\n📊 Transaction Results:`);
    console.log(`METIS spent: ${ethers.formatEther(METIS_AMOUNT)} METIS`);
    console.log(`USDC received: ${ethers.formatUnits(usdcReceived, usdcDecimals)} USDC`);
    console.log(`New USDC balance: ${ethers.formatUnits(finalUSDCBalance, usdcDecimals)} USDC`);

    // Calculate actual rate
    const actualRate = usdcReceived * BigInt(10**18) / METIS_AMOUNT;
    console.log(`Actual rate: ${ethers.formatUnits(actualRate, usdcDecimals)} USDC/METIS`);

    // Calculate slippage
    const slippage = expectedUSDC > usdcReceived 
      ? ((expectedUSDC - usdcReceived) * BigInt(10000)) / expectedUSDC
      : BigInt(0);
    const slippagePercent = Number(slippage) / 100;
    console.log(`Slippage: ${slippagePercent.toFixed(4)}%`);

    // Get updated contract info
    const newContractInfo = await (buyContract as any).getContractInfo();
    console.log(`\n📋 Updated Contract Info:`);
    console.log(`USDC Balance: ${ethers.formatUnits(newContractInfo[2], usdcDecimals)} USDC`);
    console.log(`METIS Balance: ${ethers.formatEther(newContractInfo[4])} METIS`);

  } catch (error: any) {
    console.log(`❌ Failed to buy USDC: ${error.message}`);
    
    if (error.message.includes("Insufficient USDC in contract")) {
      console.log(`💡 Solution: Fund the contract with USDC tokens`);
    } else if (error.message.includes("Amount below minimum")) {
      console.log(`💡 Solution: Increase the METIS amount (minimum: 0.001 METIS)`);
    } else if (error.message.includes("Insufficient token amount")) {
      console.log(`💡 Solution: Reduce slippage tolerance or increase METIS amount`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 