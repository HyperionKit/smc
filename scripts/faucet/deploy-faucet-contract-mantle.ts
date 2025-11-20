import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Mantle Testnet token addresses
const TOKENS = {
  USDT: "0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b",
  USDC: "0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE",
  DAI: "0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a",
  WETH: "0xCa7b49d1C243a9289aE2316051eb15146125914d"
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
  console.log("Deploying Faucet contract on Mantle Testnet");
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
    network: "Mantle Testnet",
    chainId: 5003,
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

  const deploymentDir = path.join(__dirname, "..", "..", "dpsmc", "mantle", "faucet");
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

