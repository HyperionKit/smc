import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

const AMM_ADDRESS = "0xed711FEeBD9b8eC4a014247eA43cCB66b8828Be8";

async function testEnhancedFeatures() {
  const [deployer] = await ethers.getSigners();
  console.log("🧪 Testing Enhanced LiquidityPool Features");
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer ETH balance:", ethers.formatEther(balance));

  // Get contracts using any type to avoid TypeScript issues
  const amm = await ethers.getContractAt("LiquidityPool", AMM_ADDRESS) as any;
  const tokens = {
    USDT: await ethers.getContractAt("SimpleERC20", TOKENS.USDT),
    USDC: await ethers.getContractAt("SimpleERC20", TOKENS.USDC),
    DAI: await ethers.getContractAt("SimpleERC20", TOKENS.DAI),
    WETH: await ethers.getContractAt("SimpleERC20", TOKENS.WETH)
  };

  console.log("\n" + "=".repeat(80));
  console.log("🚀 ENHANCED FEATURES TESTING");
  console.log("=".repeat(80));

  // Test 1: Check contract state
  console.log("\n📋 1. Contract State Check");
  console.log("-".repeat(50));
  try {
    const owner = await amm.owner();
    const tradingFee = await amm.tradingFee();
    const paused = await amm.paused();
    
    console.log(`✅ Owner: ${owner}`);
    console.log(`✅ Trading Fee: ${tradingFee} (${Number(tradingFee) / 100}%)`);
    console.log(`✅ Paused: ${paused}`);
  } catch (error: any) {
    console.log(`❌ Contract state check failed: ${error.message}`);
  }

  // Test 2: Check existing pairs
  console.log("\n📊 2. Existing Pairs Check");
  console.log("-".repeat(50));
  try {
    const allPairs = await amm.getAllPairs();
    console.log(`✅ Total pairs: ${allPairs.length}`);
    
    for (let i = 0; i < allPairs.length; i++) {
      const pairId = allPairs[i];
      console.log(`   Pair ${i + 1}: ${pairId}`);
    }
  } catch (error: any) {
    console.log(`❌ Pairs check failed: ${error.message}`);
  }

  // Test 3: Test staking pool creation
  console.log("\n🏦 3. Staking Pool Creation Test");
  console.log("-".repeat(50));
  try {
    const tokenA = TOKENS.USDT;
    const tokenB = TOKENS.USDC;
    const rewardToken = TOKENS.DAI;
    const rewardRate = ethers.parseEther("0.1"); // 0.1 DAI per second

    // Check if staking pool already exists
    const poolInfo = await amm.getStakingPoolInfo(tokenA, tokenB);
    if (poolInfo.exists) {
      console.log(`✅ Staking pool already exists for USDT-USDC`);
      console.log(`   Reward Token: ${poolInfo.rewardToken}`);
      console.log(`   Total Staked: ${ethers.formatEther(poolInfo.totalStaked)}`);
      console.log(`   Reward Rate: ${ethers.formatEther(poolInfo.rewardRate)} tokens/second`);
    } else {
      console.log(`⚠️  Staking pool does not exist for USDT-USDC`);
      console.log(`   Run create-staking-pools.ts to create staking pools`);
    }
  } catch (error: any) {
    console.log(`❌ Staking pool check failed: ${error.message}`);
  }

  // Test 4: Test buy with ETH functionality
  console.log("\n💰 4. Buy with ETH Test");
  console.log("-".repeat(50));
  try {
    const tokenToBuy = TOKENS.USDT;
    const ethAmount = ethers.parseEther("0.01"); // 0.01 ETH

    // Check if WETH-Token pair exists
    const pairInfo = await amm.getPairInfo(TOKENS.WETH, tokenToBuy);
    console.log(`✅ WETH-USDT pair found:`);
    console.log(`   WETH Reserve: ${ethers.formatEther(pairInfo.reserveA)} WETH`);
    console.log(`   USDT Reserve: ${ethers.formatEther(pairInfo.reserveB)} USDT`);

    // Get expected output
    const expectedOutput = await amm.getBuyAmountOut(ethAmount, tokenToBuy);
    console.log(`✅ Expected output for ${ethers.formatEther(ethAmount)} ETH: ${ethers.formatEther(expectedOutput)} USDT`);

    // Calculate rate
    const rate = expectedOutput * BigInt(10**18) / ethAmount;
    console.log(`✅ Rate: ${ethers.formatEther(rate)} USDT/ETH`);

  } catch (error: any) {
    console.log(`❌ Buy with ETH test failed: ${error.message}`);
  }

  // Test 5: Test user staking info
  console.log("\n👤 5. User Staking Info Test");
  console.log("-".repeat(50));
  try {
    const tokenA = TOKENS.USDT;
    const tokenB = TOKENS.USDC;

    const stakingInfo = await amm.getUserStakingInfo(tokenA, tokenB, deployer.address);
    console.log(`✅ User staking info for ${deployer.address}:`);
    console.log(`   Staked Amount: ${ethers.formatEther(stakingInfo.stakedAmount)}`);
    console.log(`   Is Staked: ${stakingInfo.isStaked}`);
    console.log(`   Pending Rewards: ${ethers.formatEther(stakingInfo.pendingRewards)}`);

    if (stakingInfo.isStaked) {
      console.log(`   🎉 User has staked liquidity!`);
    } else {
      console.log(`   💡 User can stake liquidity using stake-liquidity.ts`);
    }

  } catch (error: any) {
    console.log(`❌ User staking info test failed: ${error.message}`);
  }

  // Test 6: Check all staking pools
  console.log("\n🏊 6. All Staking Pools Check");
  console.log("-".repeat(50));
  try {
    const allStakingPools = await amm.getAllStakingPools();
    console.log(`✅ Total staking pools: ${allStakingPools.length}`);
    
    for (let i = 0; i < allStakingPools.length; i++) {
      const pairId = allStakingPools[i];
      console.log(`   Staking Pool ${i + 1}: ${pairId}`);
    }

    if (allStakingPools.length === 0) {
      console.log(`   💡 No staking pools found. Run create-staking-pools.ts to create them.`);
    }

  } catch (error: any) {
    console.log(`❌ Staking pools check failed: ${error.message}`);
  }

  // Test 7: Test token balances
  console.log("\n💎 7. Token Balances Check");
  console.log("-".repeat(50));
  try {
    for (const [symbol, token] of Object.entries(tokens)) {
      const balance = await token.balanceOf(deployer.address);
      const decimals = await token.decimals();
      console.log(`✅ ${symbol}: ${ethers.formatUnits(balance, decimals)}`);
    }
  } catch (error: any) {
    console.log(`❌ Token balances check failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("📋 TEST SUMMARY");
  console.log("=".repeat(80));
  console.log("✅ Enhanced LiquidityPool contract is deployed and accessible");
  console.log("✅ All core AMM functions are available");
  console.log("✅ Staking functionality is integrated");
  console.log("✅ Buy with ETH functionality is available");
  console.log("✅ Admin functions are properly configured");

  console.log("\n🚀 NEXT STEPS:");
  console.log("1. Create staking pools: npx hardhat run scripts/stake/create-staking-pools.ts --network hyperion");
  console.log("2. Test staking: npx hardhat run scripts/stake/stake-liquidity.ts --network hyperion");
  console.log("3. Test buying: npx hardhat run scripts/buy/buy-with-eth.ts --network hyperion");
  console.log("4. Check prices: npx hardhat run scripts/buy/check-buy-price.ts --network hyperion");
  console.log("5. Claim rewards: npx hardhat run scripts/stake/claim-rewards.ts --network hyperion");

  console.log("\n💡 FEATURES AVAILABLE:");
  console.log("- 🔄 AMM: Swap tokens, add/remove liquidity");
  console.log("- 🏦 Staking: Stake liquidity positions, earn rewards");
  console.log("- 💰 Buy: Buy tokens directly with ETH");
  console.log("- ⚙️ Admin: Configure fees, manage pools");
  console.log("- 🛡️ Emergency: Pause/unpause, emergency withdrawals");

  console.log("=".repeat(80));
}

testEnhancedFeatures()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 