import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying LiquidityPool with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Deploy LiquidityPool
  const LiquidityPool = await ethers.getContractFactory("contracts/Swap.sol:LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy();
  await liquidityPool.waitForDeployment();
  
  console.log("LiquidityPool deployed to:", await liquidityPool.getAddress());
  console.log("Owner:", await liquidityPool.owner());
  console.log("Trading Fee:", await liquidityPool.tradingFee());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 