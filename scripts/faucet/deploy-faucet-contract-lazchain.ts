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
  console.log("Deploying Faucet contract on Lazchain Testnet");
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
    network: "Lazchain Testnet",
    chainId: 133718,
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

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "lazai", "faucet");
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

