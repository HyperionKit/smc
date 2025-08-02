import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting up liquidity pools with account:", deployer.address);

  // Contract addresses (replace with actual deployed addresses)
  const USDT_ADDRESS = "0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898"; // Replace with actual USDT address
  const USDC_ADDRESS = "0x16d44fBBc8E1F3FBB6ac0674a44EECfa528604DD"; // Replace with actual USDC address
  const DAI_ADDRESS = "0x23E380def17aAA8554297069422039517B2997b9";  // Replace with actual DAI address
  const WETH_ADDRESS = "0x1A3d532875aD585776c814E7749a5e7a58b3E49b"; // Replace with actual WETH address
  const LIQUIDITY_POOL_ADDRESS = "0x5AC81bC04fc19871E103667ee4b3f0B77b960D7d"; // Replace with actual LiquidityPool address

  // Get contract instances
  const usdt = await ethers.getContractAt("contracts/SimpleERC20.sol:SimpleERC20", USDT_ADDRESS);
  const usdc = await ethers.getContractAt("contracts/SimpleERC20.sol:SimpleERC20", USDC_ADDRESS);
  const dai = await ethers.getContractAt("contracts/SimpleERC20.sol:SimpleERC20", DAI_ADDRESS);
  const weth = await ethers.getContractAt("contracts/SimpleERC20.sol:SimpleERC20", WETH_ADDRESS);
  const liquidityPool = await ethers.getContractAt("contracts/Swap.sol:LiquidityPool", LIQUIDITY_POOL_ADDRESS);

  // Initial liquidity amounts (1M tokens each)
  const INITIAL_LIQUIDITY_USDT = ethers.parseUnits("1000000", 6); // 1M USDT
  const INITIAL_LIQUIDITY_USDC = ethers.parseUnits("1000000", 6); // 1M USDC
  const INITIAL_LIQUIDITY_DAI = ethers.parseUnits("1000000", 18); // 1M DAI
  const INITIAL_LIQUIDITY_WETH = ethers.parseUnits("1000000", 18); // 1M WETH

  console.log("Creating pairs and adding initial liquidity...");

  // Create pairs (skip if already exist)
  const pairs = [
    { name: "USDT-USDC", tokenA: USDT_ADDRESS, tokenB: USDC_ADDRESS },
    { name: "USDT-DAI", tokenA: USDT_ADDRESS, tokenB: DAI_ADDRESS },
    { name: "USDT-WETH", tokenA: USDT_ADDRESS, tokenB: WETH_ADDRESS },
    { name: "USDC-DAI", tokenA: USDC_ADDRESS, tokenB: DAI_ADDRESS },
    { name: "USDC-WETH", tokenA: USDC_ADDRESS, tokenB: WETH_ADDRESS },
    { name: "DAI-WETH", tokenA: DAI_ADDRESS, tokenB: WETH_ADDRESS }
  ];

  for (const pair of pairs) {
    try {
      console.log(`Creating ${pair.name} pair...`);
      const pairId = await liquidityPool.createPair(pair.tokenA, pair.tokenB);
      console.log(`${pair.name} pair created with ID:`, pairId);
    } catch (error: any) {
      if (error.message.includes("Pair already exists")) {
        console.log(`${pair.name} pair already exists, skipping...`);
      } else {
        console.log(`Error creating ${pair.name} pair:`, error.message);
      }
    }
  }

  // Approve tokens for liquidity pool
  console.log("Approving tokens for liquidity pool...");
  await usdt.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);
  await usdc.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);
  await dai.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);
  await weth.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);

  // Add initial liquidity to pairs (with correct token ordering)
  const liquidityPairs = [
    { name: "USDT-USDC", tokenA: USDT_ADDRESS, tokenB: USDC_ADDRESS, amountA: INITIAL_LIQUIDITY_USDT, amountB: INITIAL_LIQUIDITY_USDC },
    { name: "USDT-DAI", tokenA: DAI_ADDRESS, tokenB: USDT_ADDRESS, amountA: INITIAL_LIQUIDITY_DAI, amountB: INITIAL_LIQUIDITY_USDT },
    { name: "USDT-WETH", tokenA: WETH_ADDRESS, tokenB: USDT_ADDRESS, amountA: INITIAL_LIQUIDITY_WETH, amountB: INITIAL_LIQUIDITY_USDT },
    { name: "USDC-DAI", tokenA: DAI_ADDRESS, tokenB: USDC_ADDRESS, amountA: INITIAL_LIQUIDITY_DAI, amountB: INITIAL_LIQUIDITY_USDC },
    { name: "USDC-WETH", tokenA: WETH_ADDRESS, tokenB: USDC_ADDRESS, amountA: INITIAL_LIQUIDITY_WETH, amountB: INITIAL_LIQUIDITY_USDC },
    { name: "DAI-WETH", tokenA: DAI_ADDRESS, tokenB: WETH_ADDRESS, amountA: INITIAL_LIQUIDITY_DAI, amountB: INITIAL_LIQUIDITY_WETH }
  ];

  for (const pair of liquidityPairs) {
    try {
      console.log(`Adding initial liquidity to ${pair.name} pair...`);
      await liquidityPool.addLiquidity(
        pair.tokenA,
        pair.tokenB,
        pair.amountA,
        pair.amountB,
        0, // amountAMin
        0  // amountBMin
      );
      console.log(`✅ ${pair.name} liquidity added successfully`);
    } catch (error: any) {
      console.log(`❌ Error adding liquidity to ${pair.name}:`, error.message);
    }
  }

  console.log("Liquidity pools setup completed!");
  console.log("All pairs created and initial liquidity added.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 