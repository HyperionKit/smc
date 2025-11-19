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

// Token configuration for faucet
const TOKEN_CONFIG = {
  USDT: {
    symbol: "USDT",
    decimals: 6,
    dripAmount: ethers.parseUnits("1000", 6),
    maxBalance: ethers.parseUnits("10000", 6)
  },
  USDC: {
    symbol: "USDC",
    decimals: 6,
    dripAmount: ethers.parseUnits("1000", 6),
    maxBalance: ethers.parseUnits("10000", 6)
  },
  DAI: {
    symbol: "DAI",
    decimals: 18,
    dripAmount: ethers.parseUnits("1000", 18),
    maxBalance: ethers.parseUnits("10000", 18)
  },
  WETH: {
    symbol: "WETH",
    decimals: 18,
    dripAmount: ethers.parseUnits("1", 18),
    maxBalance: ethers.parseUnits("10", 18)
  }
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Faucet contract on Metis Sepolia Testnet");
  console.log("Deploying with account:", deployer.address);

  // Deploy Faucet contract
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(deployer.address);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();

  console.log("✅ Faucet contract deployed to:", faucetAddress);

  // Configure supported tokens
  console.log("\n💰 Configuring supported tokens...");

  const tokenSymbols = ["USDT", "USDC", "DAI", "WETH"];

  for (const symbol of tokenSymbols) {
    const tokenAddress = TOKENS[symbol as keyof typeof TOKENS];
    const config = TOKEN_CONFIG[symbol as keyof typeof TOKEN_CONFIG];

    console.log(`\n🔧 Adding ${symbol} to faucet...`);
    const tx = await faucet.addToken(
      tokenAddress,
      config.symbol,
      config.decimals,
      config.dripAmount,
      config.maxBalance
    );
    await tx.wait();
    console.log(`   ✅ ${symbol} added successfully`);
  }

  // Configure faucet settings
  const dripInterval = 24 * 60 * 60; // 24 hours
  const setIntervalTx = await faucet.setDripInterval(dripInterval);
  await setIntervalTx.wait();
  console.log(`\n✅ Drip interval set to ${dripInterval} seconds (24 hours)`);

  const maxDripsPerUser = 100;
  const setMaxDripsTx = await faucet.setMaxDripPerUser(maxDripsPerUser);
  await setMaxDripsTx.wait();
  console.log(`✅ Max drips per user set to ${maxDripsPerUser}`);

  // Save deployment info
  const deploymentInfo = {
    network: "Metis Sepolia Testnet",
    chainId: 59902,
    faucetAddress: faucetAddress,
    deployer: deployer.address,
    dripInterval: dripInterval.toString(),
    maxDripsPerUser: maxDripsPerUser.toString(),
    supportedTokens: tokenSymbols.map(symbol => ({
      symbol,
      address: TOKENS[symbol as keyof typeof TOKENS],
      config: {
        symbol: TOKEN_CONFIG[symbol as keyof typeof TOKEN_CONFIG].symbol,
        decimals: TOKEN_CONFIG[symbol as keyof typeof TOKEN_CONFIG].decimals,
        dripAmount: TOKEN_CONFIG[symbol as keyof typeof TOKEN_CONFIG].dripAmount.toString(),
        maxBalance: TOKEN_CONFIG[symbol as keyof typeof TOKEN_CONFIG].maxBalance.toString()
      }
    })),
    deploymentTime: new Date().toISOString()
  };

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "metis_testnet", "faucet");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentDir, `faucet-deployment-${Date.now()}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

