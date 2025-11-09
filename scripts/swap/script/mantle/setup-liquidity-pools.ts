import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting up liquidity pools on Mantle Testnet with account:", deployer.address);

  // Contract addresses (Mantle Testnet - Deployed)
  const USDT_ADDRESS = "0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b";
  const USDC_ADDRESS = "0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE";
  const DAI_ADDRESS = "0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a";
  const WETH_ADDRESS = "0xCa7b49d1C243a9289aE2316051eb15146125914d";
  const LIQUIDITY_POOL_ADDRESS = "0x93c714601b8bc0C9A9d605CEc99786847654598e";

  // Get contract instances
  const usdt = await ethers.getContractAt("Token", USDT_ADDRESS);
  const usdc = await ethers.getContractAt("Token", USDC_ADDRESS);
  const dai = await ethers.getContractAt("Token", DAI_ADDRESS);
  const weth = await ethers.getContractAt("Token", WETH_ADDRESS);
  const liquidityPool = await ethers.getContractAt("LiquidityPool", LIQUIDITY_POOL_ADDRESS);

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
      const pairTx = await liquidityPool.createPair(pair.tokenA, pair.tokenB);
      await pairTx.wait();
      console.log(`✅ ${pair.name} pair created successfully`);
    } catch (error: any) {
      if (error.message.includes("Pair already exists")) {
        console.log(`${pair.name} pair already exists, skipping...`);
      } else {
        console.log(`Error creating ${pair.name} pair:`, error.message);
      }
    }
  }

  // Approve tokens for liquidity pool
  console.log("\nApproving tokens for liquidity pool...");
  const approveUsdt = await usdt.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);
  await approveUsdt.wait();
  console.log("✅ USDT approved");
  
  const approveUsdc = await usdc.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);
  await approveUsdc.wait();
  console.log("✅ USDC approved");
  
  const approveDai = await dai.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);
  await approveDai.wait();
  console.log("✅ DAI approved");
  
  const approveWeth = await weth.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);
  await approveWeth.wait();
  console.log("✅ WETH approved");

  // Add initial liquidity to pairs
  // Note: Token addresses are normalized in pairs (token0 < token1)
  // USDT: 0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b (lowest)
  // USDC: 0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE
  // DAI: 0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a
  // WETH: 0xCa7b49d1C243a9289aE2316051eb15146125914d (highest)
  // So pairs are stored as: USDT < USDC < DAI < WETH
  const liquidityPairs = [
    { name: "USDT-USDC", tokenA: USDT_ADDRESS, tokenB: USDC_ADDRESS, amountA: INITIAL_LIQUIDITY_USDT, amountB: INITIAL_LIQUIDITY_USDC },
    { name: "USDT-DAI", tokenA: USDT_ADDRESS, tokenB: DAI_ADDRESS, amountA: INITIAL_LIQUIDITY_USDT, amountB: INITIAL_LIQUIDITY_DAI },
    { name: "USDT-WETH", tokenA: USDT_ADDRESS, tokenB: WETH_ADDRESS, amountA: INITIAL_LIQUIDITY_USDT, amountB: INITIAL_LIQUIDITY_WETH },
    { name: "USDC-DAI", tokenA: USDC_ADDRESS, tokenB: DAI_ADDRESS, amountA: INITIAL_LIQUIDITY_USDC, amountB: INITIAL_LIQUIDITY_DAI },
    { name: "USDC-WETH", tokenA: USDC_ADDRESS, tokenB: WETH_ADDRESS, amountA: INITIAL_LIQUIDITY_USDC, amountB: INITIAL_LIQUIDITY_WETH },
    { name: "DAI-WETH", tokenA: DAI_ADDRESS, tokenB: WETH_ADDRESS, amountA: INITIAL_LIQUIDITY_DAI, amountB: INITIAL_LIQUIDITY_WETH }
  ];

  for (const pair of liquidityPairs) {
    try {
      console.log(`\nAdding initial liquidity to ${pair.name} pair...`);
      const liquidityTx = await liquidityPool.addLiquidity(
        pair.tokenA,
        pair.tokenB,
        pair.amountA,
        pair.amountB,
        0, // amountAMin
        0  // amountBMin
      );
      await liquidityTx.wait();
      console.log(`✅ ${pair.name} liquidity added successfully`);
    } catch (error: any) {
      console.log(`❌ Error adding liquidity to ${pair.name}:`, error.message);
    }
  }

  console.log("Liquidity pools setup completed on Mantle Testnet!");
  console.log("All pairs created and initial liquidity added.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

