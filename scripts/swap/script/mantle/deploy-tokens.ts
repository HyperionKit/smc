import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts to Mantle Testnet with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Deploy USDT Token (Tether USD - 6 decimals)
  const USDTFactory = await ethers.getContractFactory("Token");
  const usdt = await USDTFactory.deploy(
    "Tether USD",
    "USDT",
    6,
    ethers.parseUnits("40000000", 6) // 40M USDT
  );
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("✅ USDT (Tether USD) deployed to:", usdtAddress);

  // Deploy USDC Token (USD Coin - 6 decimals)
  const USDCFactory = await ethers.getContractFactory("Token");
  const usdc = await USDCFactory.deploy(
    "USD Coin",
    "USDC",
    6,
    ethers.parseUnits("40000000", 6) // 40M USDC
  );
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ USDC (USD Coin) deployed to:", usdcAddress);

  // Deploy DAI Token (Dai Stablecoin - 18 decimals)
  const DAIFactory = await ethers.getContractFactory("Token");
  const dai = await DAIFactory.deploy(
    "Dai Stablecoin",
    "DAI",
    18,
    ethers.parseUnits("40000000", 18) // 40M DAI
  );
  await dai.waitForDeployment();
  const daiAddress = await dai.getAddress();
  console.log("✅ DAI (Dai Stablecoin) deployed to:", daiAddress);

  // Deploy WETH Token (Wrapped Ether - 18 decimals)
  const WETHFactory = await ethers.getContractFactory("Token");
  const weth = await WETHFactory.deploy(
    "Wrapped Ether",
    "WETH",
    18,
    ethers.parseUnits("40000000", 18) // 40M WETH
  );
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("✅ WETH (Wrapped Ether) deployed to:", wethAddress);

  console.log("\n📊 Deployment Summary (Mantle Testnet):");
  console.log("========================================");
  console.log("Token Name        | Symbol | Address");
  console.log("------------------|--------|----------------------------------------");
  console.log(`Tether USD        | USDT   | ${usdtAddress}`);
  console.log(`USD Coin          | USDC   | ${usdcAddress}`);
  console.log(`Dai Stablecoin    | DAI    | ${daiAddress}`);
  console.log(`Wrapped Ether     | WETH   | ${wethAddress}`);
  console.log("\n💡 Next Steps:");
  console.log("1. Verify tokens on Mantle block explorer");
  console.log("2. Deploy liquidity pool contract");
  console.log("3. Setup trading pairs and add initial liquidity");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

