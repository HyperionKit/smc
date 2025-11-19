import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Metis Sepolia token addresses
const TOKENS = {
  USDT: "0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898",
  USDC: "0x16d44fBBc8E1F3FBB6ac0674a44EECfa528604DD",
  DAI: "0x23E380def17aAA8554297069422039517B2997b9",
  WETH: "0x1A3d532875aD585776c814E7749a5e7a58b3E49b"
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying BuyVault for Metis Sepolia Testnet");
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
    network: "Metis Sepolia Testnet",
    chainId: 59902,
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

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "metis_testnet", "buy");
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

