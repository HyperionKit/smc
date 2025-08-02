import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Deploy USDT (6 decimals)
  const USDT = await ethers.getContractFactory("contracts/SimpleERC20.sol:SimpleERC20");
  const usdt = await USDT.deploy(
    "Tether USD",
    "USDT",
    6,
    ethers.parseUnits("40000000", 6) // 40M USDT
  );
  await usdt.waitForDeployment();
  console.log("USDT deployed to:", await usdt.getAddress());

  // Deploy USDC (6 decimals)
  const USDC = await ethers.getContractFactory("contracts/SimpleERC20.sol:SimpleERC20");
  const usdc = await USDC.deploy(
    "USD Coin",
    "USDC",
    6,
    ethers.parseUnits("40000000", 6) // 40M USDC
  );
  await usdc.waitForDeployment();
  console.log("USDC deployed to:", await usdc.getAddress());

  // Deploy DAI (18 decimals)
  const DAI = await ethers.getContractFactory("contracts/SimpleERC20.sol:SimpleERC20");
  const dai = await DAI.deploy(
    "Dai Stablecoin",
    "DAI",
    18,
    ethers.parseUnits("40000000", 18) // 40M DAI
  );
  await dai.waitForDeployment();
  console.log("DAI deployed to:", await dai.getAddress());

  // Deploy WETH (18 decimals)
  const WETH = await ethers.getContractFactory("contracts/SimpleERC20.sol:SimpleERC20");
  const weth = await WETH.deploy(
    "Wrapped Ether",
    "WETH",
    18,
    ethers.parseUnits("40000000", 18) // 40M WETH
  );
  await weth.waitForDeployment();
  console.log("WETH deployed to:", await weth.getAddress());

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("USDT:", await usdt.getAddress());
  console.log("USDC:", await usdc.getAddress());
  console.log("DAI:", await dai.getAddress());
  console.log("WETH:", await weth.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 