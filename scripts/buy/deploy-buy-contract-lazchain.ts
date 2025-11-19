import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Lazchain token addresses
const TOKENS = {
  USDT: "0x9D81C1a89bE608417B5Bb1C1cF5858594D01E8a3",
  USDC: "0x677B021cCBA318A93BACB1653fD7bE0882ceE9Fd",
  DAI: "0xeC53e4a54b3AB36fb684966c222Ff6f347C7e84c",
  WETH: "0xef63df9fa0E5f79127AaC0B2a0ec969CC30be532"
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying BuyVault for Lazchain Testnet");
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Set initial prices (0.01 native currency = 1 USDC/USDT)
  const usdcPrice = ethers.parseEther("0.01");
  const usdtPrice = ethers.parseEther("0.01");

  console.log("\n📊 Initial Prices:");
  console.log(`USDC Price: ${ethers.formatEther(usdcPrice)} METIS per USDC`);
  console.log(`USDT Price: ${ethers.formatEther(usdtPrice)} METIS per USDT`);

  // Deploy BuyVault
  const BuyVault = await ethers.getContractFactory("contracts/buy/BuyContract.sol:BuyVault");
  const buyContract = await BuyVault.deploy(
    TOKENS.USDC,
    TOKENS.USDT,
    usdcPrice,
    usdtPrice
  );
  await buyContract.waitForDeployment();
  
  const buyContractAddress = await buyContract.getAddress();
  
  console.log("\n🎉 BuyVault deployed successfully!");
  console.log("Contract address:", buyContractAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "Lazchain Testnet",
    chainId: 133718,
    buyVaultAddress: buyContractAddress,
    deployer: deployer.address,
    tokens: {
      USDC: TOKENS.USDC,
      USDT: TOKENS.USDT
    },
    prices: {
      USDC: ethers.formatEther(usdcPrice),
      USDT: ethers.formatEther(usdtPrice)
    },
    deploymentTime: new Date().toISOString()
  };

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "lazai", "buy");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentDir, `buyvault-deployment-${Date.now()}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

