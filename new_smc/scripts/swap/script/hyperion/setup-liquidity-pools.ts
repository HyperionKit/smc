import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting up liquidity pools with account:", deployer.address);

  // Contract addresses (replace with actual deployed addresses)
  const USDT_ADDRESS = "0x9b52D326D4866055F6c23297656002992e4293FC"; // Replace with actual USDT address
  const USDC_ADDRESS = "0x31424DB0B7a929283C394b4DA412253Ab6D61682"; // Replace with actual USDC address
  const DAI_ADDRESS = "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb";  // Replace with actual DAI address
  const WETH_ADDRESS = "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"; // Replace with actual WETH address
  const LIQUIDITY_POOL_ADDRESS = "0x91C39DAA7617C5188d0427Fc82e4006803772B74"; // Replace with actual LiquidityPool address

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

  // Create USDT-USDC pair
  console.log("Creating USDT-USDC pair...");
  const usdtUsdcPairId = await liquidityPool.createPair(USDT_ADDRESS, USDC_ADDRESS);
  console.log("USDT-USDC pair created with ID:", usdtUsdcPairId);

  // Create USDT-DAI pair
  console.log("Creating USDT-DAI pair...");
  const usdtDaiPairId = await liquidityPool.createPair(USDT_ADDRESS, DAI_ADDRESS);
  console.log("USDT-DAI pair created with ID:", usdtDaiPairId);

  // Create USDT-WETH pair
  console.log("Creating USDT-WETH pair...");
  const usdtWethPairId = await liquidityPool.createPair(USDT_ADDRESS, WETH_ADDRESS);
  console.log("USDT-WETH pair created with ID:", usdtWethPairId);

  // Create USDC-DAI pair
  console.log("Creating USDC-DAI pair...");
  const usdcDaiPairId = await liquidityPool.createPair(USDC_ADDRESS, DAI_ADDRESS);
  console.log("USDC-DAI pair created with ID:", usdcDaiPairId);

  // Create USDC-WETH pair
  console.log("Creating USDC-WETH pair...");
  const usdcWethPairId = await liquidityPool.createPair(USDC_ADDRESS, WETH_ADDRESS);
  console.log("USDC-WETH pair created with ID:", usdcWethPairId);

  // Create DAI-WETH pair
  console.log("Creating DAI-WETH pair...");
  const daiWethPairId = await liquidityPool.createPair(DAI_ADDRESS, WETH_ADDRESS);
  console.log("DAI-WETH pair created with ID:", daiWethPairId);

  // Approve tokens for liquidity pool
  console.log("Approving tokens for liquidity pool...");
  await usdt.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);
  await usdc.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);
  await dai.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);
  await weth.approve(LIQUIDITY_POOL_ADDRESS, ethers.MaxUint256);

  // Add initial liquidity to USDT-USDC pair
  console.log("Adding initial liquidity to USDT-USDC pair...");
  await liquidityPool.addLiquidity(
    USDT_ADDRESS,
    USDC_ADDRESS,
    INITIAL_LIQUIDITY_USDT,
    INITIAL_LIQUIDITY_USDC,
    0, // amountAMin
    0  // amountBMin
  );

  // Add initial liquidity to USDT-DAI pair
  console.log("Adding initial liquidity to USDT-DAI pair...");
  await liquidityPool.addLiquidity(
    USDT_ADDRESS,
    DAI_ADDRESS,
    INITIAL_LIQUIDITY_USDT,
    INITIAL_LIQUIDITY_DAI,
    0, // amountAMin
    0  // amountBMin
  );

  // Add initial liquidity to USDT-WETH pair
  console.log("Adding initial liquidity to USDT-WETH pair...");
  await liquidityPool.addLiquidity(
    USDT_ADDRESS,
    WETH_ADDRESS,
    INITIAL_LIQUIDITY_USDT,
    INITIAL_LIQUIDITY_WETH,
    0, // amountAMin
    0  // amountBMin
  );

  // Add initial liquidity to USDC-DAI pair
  console.log("Adding initial liquidity to USDC-DAI pair...");
  await liquidityPool.addLiquidity(
    USDC_ADDRESS,
    DAI_ADDRESS,
    INITIAL_LIQUIDITY_USDC,
    INITIAL_LIQUIDITY_DAI,
    0, // amountAMin
    0  // amountBMin
  );

  // Add initial liquidity to USDC-WETH pair
  console.log("Adding initial liquidity to USDC-WETH pair...");
  await liquidityPool.addLiquidity(
    USDC_ADDRESS,
    WETH_ADDRESS,
    INITIAL_LIQUIDITY_USDC,
    INITIAL_LIQUIDITY_WETH,
    0, // amountAMin
    0  // amountBMin
  );

  // Add initial liquidity to DAI-WETH pair
  console.log("Adding initial liquidity to DAI-WETH pair...");
  await liquidityPool.addLiquidity(
    DAI_ADDRESS,
    WETH_ADDRESS,
    INITIAL_LIQUIDITY_DAI,
    INITIAL_LIQUIDITY_WETH,
    0, // amountAMin
    0  // amountBMin
  );

  console.log("Liquidity pools setup completed!");
  console.log("All pairs created and initial liquidity added.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 