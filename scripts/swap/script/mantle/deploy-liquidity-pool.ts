import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Enhanced LiquidityPool with Staking & Buy features to Mantle Testnet");
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Deploy Enhanced LiquidityPool
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy();
  await liquidityPool.waitForDeployment();
  
  const liquidityPoolAddress = await liquidityPool.getAddress();
  
  console.log("\n🎉 Enhanced LiquidityPool deployed successfully to Mantle Testnet!");
  console.log("Contract address:", liquidityPoolAddress);
  console.log("Deployer:", deployer.address);

  console.log("\n📋 Contract Features:");
  console.log("✅ AMM Functions: createPair, addLiquidity, removeLiquidity, swap");
  console.log("✅ Staking Functions: createStakingPool, stakeLiquidity, unstakeLiquidity, claimRewards");
  console.log("✅ Buy Functions: buyWithETH, getBuyAmountOut");
  console.log("✅ Admin Functions: setTradingFee, setRewardRate, pause/unpause");
  console.log("✅ Emergency Functions: emergencyWithdraw, emergencyWithdrawETH");

  console.log("\n🔧 Configuration:");
  console.log("- Trading Fee: 30 (0.3%)");
  console.log("- Max Fee: 1000 (10%)");
  console.log("- Reward Precision: 1e18");
  console.log("- Min Stake Amount: 1 token");

  console.log("\n📝 Next Steps:");
  console.log("1. Deploy tokens (USDT, USDC, DAI, WETH)");
  console.log("2. Create trading pairs");
  console.log("3. Add initial liquidity");
  console.log("4. Create staking pools");
  console.log("5. Test all features");

  console.log("\n💡 Usage Examples:");
  console.log("- Create pair: createPair(tokenA, tokenB)");
  console.log("- Add liquidity: addLiquidity(tokenA, tokenB, amountA, amountB, minA, minB)");
  console.log("- Swap tokens: swap(tokenIn, tokenOut, amountIn, minAmountOut)");
  console.log("- Create staking pool: createStakingPool(tokenA, tokenB, rewardToken, rewardRate)");
  console.log("- Stake liquidity: stakeLiquidity(tokenA, tokenB)");
  console.log("- Buy with ETH: buyWithETH(tokenOut, minAmountOut) {value: ethAmount}");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

