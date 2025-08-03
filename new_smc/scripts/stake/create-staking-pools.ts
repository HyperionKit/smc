import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

const AMM_ADDRESS = "0x91C39DAA7617C5188d0427Fc82e4006803772B74";
const STAKING_REWARDS_ADDRESS = "0x19D5806CE132788b2a97Eca276a6270B7A61fD66";

// Staking pool configurations with realistic reward rates
const STAKING_POOLS = [
  {
    tokenA: "USDT",
    tokenB: "USDC",
    rewardToken: "DAI",
    rewardRate: ethers.parseEther("0.3") // 0.3 DAI per second
  }
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Creating staking pools with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Get LiquidityPool contract
  const amm = await ethers.getContractAt("LiquidityPool", AMM_ADDRESS) as any;
  console.log("LiquidityPool address:", AMM_ADDRESS);
  
  // Check if deployer is the owner
  const owner = await amm.owner();
  console.log("Contract owner:", owner);
  console.log("Deployer address:", deployer.address);
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("❌ Deployer is not the contract owner. Cannot create staking pools.");
    return;
  }
  
  // Check if contract is paused
  const isPaused = await amm.paused();
  if (isPaused) {
    console.log("❌ Contract is paused. Cannot create staking pools.");
    return;
  }
  console.log("✅ Contract is not paused");

  // Get token contracts for reward transfers - using simple reference now
  const tokens = {
    USDT: await ethers.getContractAt("SimpleERC20", TOKENS.USDT),
    USDC: await ethers.getContractAt("SimpleERC20", TOKENS.USDC),
    DAI: await ethers.getContractAt("SimpleERC20", TOKENS.DAI),
    WETH: await ethers.getContractAt("SimpleERC20", TOKENS.WETH)
  };

  console.log("\n🚀 Creating staking pools...\n");

  for (let i = 0; i < STAKING_POOLS.length; i++) {
    const pool = STAKING_POOLS[i];
    const tokenAAddress = TOKENS[pool.tokenA as keyof typeof TOKENS];
    const tokenBAddress = TOKENS[pool.tokenB as keyof typeof TOKENS];
    const rewardTokenAddress = TOKENS[pool.rewardToken as keyof typeof TOKENS];

    console.log(`📊 Creating staking pool ${i + 1}/${STAKING_POOLS.length}:`);
    console.log(`   Pair: ${pool.tokenA}-${pool.tokenB}`);
    console.log(`   Reward Token: ${pool.rewardToken}`);
    console.log(`   Reward Rate: ${ethers.formatEther(pool.rewardRate)} ${pool.rewardToken}/second`);

    try {
      // Check if pair exists first
      const pairId = await amm.getPairId(tokenAAddress, tokenBAddress);
      const pairInfo = await amm.pairs(pairId);
      
      if (!pairInfo.exists) {
        console.log(`   ❌ Pair ${pool.tokenA}-${pool.tokenB} does not exist. Create the pair first.`);
        continue;
      }

      // Check if staking pool already exists
      const poolInfo = await amm.getStakingPoolInfo(tokenAAddress, tokenBAddress);
      if (poolInfo.exists) {
        console.log(`   ⚠️  Staking pool already exists for ${pool.tokenA}-${pool.tokenB}`);
        continue;
      }

      // Transfer reward tokens to contract (1 day worth of rewards)
      const dailyRewards = pool.rewardRate * 86400n; // 24 hours * 60 minutes * 60 seconds
      const rewardToken = tokens[pool.rewardToken as keyof typeof tokens];
      
      console.log(`   💰 Transferring ${ethers.formatEther(dailyRewards)} ${pool.rewardToken} to contract...`);
      
      const allowance = await rewardToken.allowance(deployer.address, AMM_ADDRESS);
      if (allowance < dailyRewards) {
        const approveTx = await rewardToken.approve(AMM_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
        console.log(`   ✅ Approved ${pool.rewardToken} for contract`);
      }

      // Create staking pool
      const tx = await amm.createStakingPool(
        tokenAAddress,
        tokenBAddress,
        rewardTokenAddress,
        pool.rewardRate
      );

      console.log(`   🔗 Transaction hash: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ Staking pool created successfully!`);

    } catch (error: any) {
      console.log(`   ❌ Failed to create staking pool: ${error.message}`);
      if (error.data) {
        console.log(`   Error data: ${error.data}`);
      }
      if (error.reason) {
        console.log(`   Error reason: ${error.reason}`);
      }
    }

    console.log(""); // Empty line for readability
  }

  console.log("🎉 Staking pool creation completed!");
  
  // Display all staking pools
  console.log("\n📋 All Staking Pools:");
  const allPools = await amm.getAllStakingPools();
  console.log(`Total staking pools: ${allPools.length}`);
  
  for (let i = 0; i < allPools.length; i++) {
    const pairId = allPools[i];
    console.log(`Pool ${i + 1}: ${pairId}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 