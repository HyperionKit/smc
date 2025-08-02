import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

const AMM_ADDRESS = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";

// Test amounts
const TEST_AMOUNTS = [
  ethers.parseEther("0.01"),  // 0.01 ETH
  ethers.parseEther("0.1"),   // 0.1 ETH
  ethers.parseEther("1"),     // 1 ETH
  ethers.parseEther("10")     // 10 ETH
];

async function main() {
  const [user] = await ethers.getSigners();
  console.log("Checking buy prices with account:", user.address);

  // Get LiquidityPool contract
  const amm = await ethers.getContractAt("LiquidityPool", AMM_ADDRESS) as any;
  console.log("LiquidityPool address:", AMM_ADDRESS);

  console.log("\n📊 ETH to Token Buy Prices\n");

  // Check prices for each token
  const tokensToCheck = ["USDT", "USDC", "DAI"];
  
  for (const tokenSymbol of tokensToCheck) {
    const tokenAddress = TOKENS[tokenSymbol as keyof typeof TOKENS];
    const wethAddress = TOKENS.WETH;

    console.log(`\n💰 ${tokenSymbol} Prices:`);
    console.log("=" .repeat(50));

    try {
      // Check if WETH-Token pair exists
      const pairInfo = await amm.getPairInfo(wethAddress, tokenAddress);
      console.log(`✅ WETH-${tokenSymbol} pair found:`);
      console.log(`   WETH Reserve: ${ethers.formatEther(pairInfo.reserveA)} WETH`);
      console.log(`   ${tokenSymbol} Reserve: ${ethers.formatEther(pairInfo.reserveB)} ${tokenSymbol}`);
      console.log(`   Total Liquidity: ${ethers.formatEther(pairInfo.totalLiquidity)}`);

      // Get token info
      const tokenContract = await ethers.getContractAt("SimpleERC20", tokenAddress);
      const tokenDecimals = await tokenContract.decimals();

      console.log(`\n📈 Price Quotes:`);
      console.log("| ETH Amount | Token Output | Rate (Token/ETH) | Price Impact |");
      console.log("|------------|--------------|------------------|--------------|");

      for (const ethAmount of TEST_AMOUNTS) {
        try {
          const tokenOutput = await amm.getBuyAmountOut(ethAmount, tokenAddress);
          const rate = tokenOutput * BigInt(10**18) / ethAmount;
          const priceImpact = (Number(ethAmount) / Number(pairInfo.reserveA)) * 100;

          console.log(`| ${ethers.formatEther(ethAmount)} ETH | ${ethers.formatUnits(tokenOutput, tokenDecimals)} ${tokenSymbol} | ${ethers.formatUnits(rate, tokenDecimals)} | ${priceImpact.toFixed(4)}% |`);
        } catch (error) {
          console.log(`| ${ethers.formatEther(ethAmount)} ETH | ❌ Error | - | - |`);
        }
      }

    } catch (error: any) {
      console.log(`❌ Failed to get ${tokenSymbol} prices: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("💡 Price Information:");
  console.log("- Rates are calculated using the AMM formula");
  console.log("- Price impact increases with larger amounts");
  console.log("- 0.3% trading fee is applied to all transactions");
  console.log("- Slippage protection is recommended for large trades");
  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 