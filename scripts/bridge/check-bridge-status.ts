import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Network configurations
const NETWORKS = {
  HYPERION: {
    name: "Hyperion Testnet",
    chainId: 133717,
    rpcUrl: process.env.HYPERION_RPC_URL || "https://hyperion-testnet.metisdevops.link",
    bridgeAddress: "0xfF064Fd496256e84b68dAE2509eDA84a3c235550",
    tokens: {
      USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
      USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
      DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
      WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
    }
  },
  MANTLE: {
    name: "Mantle Testnet",
    chainId: 5003,
    rpcUrl: process.env.MANTLE_TESTNET_RPC_URL || "https://rpc.sepolia.mantle.xyz",
    bridgeAddress: "0xd6629696A52E914433b0924f1f49d42216708276",
    tokens: {
      USDT: "0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b",
      USDC: "0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE",
      DAI: "0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a",
      WETH: "0xCa7b49d1C243a9289aE2316051eb15146125914d"
    }
  },
  LAZCHAIN: {
    name: "Lazchain Testnet",
    chainId: 133718,
    rpcUrl: process.env.LAZCHAIN_RPC_URL || "https://testnet.lazai.network",
    bridgeAddress: "0xf2D33cF11d102F94148c38f943C99408f7C898cf",
    tokens: {
      USDT: "0x9D81C1a89bE608417B5Bb1C1cF5858594D01E8a3",
      USDC: "0x677B021cCBA318A93BACB1653fD7bE0882ceE9Fd",
      DAI: "0xeC53e4a54b3AB36fb684966c222Ff6f347C7e84c",
      WETH: "0xef63df9fa0E5f79127AaC0B2a0ec969CC30be532"
    }
  },
  METIS_SEPOLIA: {
    name: "Metis Sepolia Testnet",
    chainId: 59902,
    rpcUrl: process.env.METISSEPOLIA_RPC_URL || "https://metis-sepolia-rpc.publicnode.com",
    bridgeAddress: "0x1AC16E6C537438c82A61A106B876Ef69C7e247d2",
    tokens: {
      USDT: "0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898",
      USDC: "0x16d44fBBc8E1F3FBB6ac0674a44EECfa528604DD",
      DAI: "0x23E380def17aAA8554297069422039517B2997b9",
      WETH: "0x1A3d532875aD585776c814E7749a5e7a58b3E49b"
    }
  }
};

// Recommended minimum funding amounts
const MIN_FUNDING_AMOUNTS = {
  USDT: ethers.parseUnits("10000", 6),  // 10,000 USDT
  USDC: ethers.parseUnits("10000", 6),  // 10,000 USDC
  DAI: ethers.parseUnits("10000", 18),  // 10,000 DAI
  WETH: ethers.parseUnits("100", 18)    // 100 WETH
};

async function checkBridgeStatus(networkKey: string, networkConfig: any) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🌐 Checking ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);
  console.log(`${"=".repeat(60)}`);

  try {
    // Create provider for this network
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const bridge = await ethers.getContractAt("Bridge", networkConfig.bridgeAddress, provider);

    // Check bridge configuration
    console.log(`\n📊 Bridge Configuration:`);
    console.log(`   Address: ${networkConfig.bridgeAddress}`);
    const owner = await bridge.owner();
    console.log(`   Owner: ${owner}`);
    const bridgeFee = await bridge.bridgeFee();
    console.log(`   Bridge Fee: ${ethers.formatEther(bridgeFee)} ETH`);
    const paused = await bridge.paused();
    console.log(`   Paused: ${paused ? "❌ Yes" : "✅ No"}`);

    // Check token balances
    console.log(`\n💰 Bridge Token Balances:`);
    const tokenStatus: any[] = [];

    for (const [symbol, address] of Object.entries(networkConfig.tokens)) {
      try {
        const token = await ethers.getContractAt("Token", address as string, provider);
        const balance = await token.balanceOf(networkConfig.bridgeAddress);
        const decimals = symbol === "USDT" || symbol === "USDC" ? 6 : 18;
        const formattedBalance = ethers.formatUnits(balance, decimals);
        const minAmount = MIN_FUNDING_AMOUNTS[symbol as keyof typeof MIN_FUNDING_AMOUNTS];
        const minFormatted = ethers.formatUnits(minAmount, decimals);
        const isSufficient = balance >= minAmount;

        console.log(`   ${symbol}:`);
        console.log(`     Balance: ${formattedBalance}`);
        console.log(`     Minimum Recommended: ${minFormatted}`);
        console.log(`     Status: ${isSufficient ? "✅ Sufficient" : "⚠️  Needs Funding"}`);

        tokenStatus.push({
          symbol,
          address,
          balance: balance.toString(),
          formattedBalance,
          minAmount: minAmount.toString(),
          minFormatted,
          isSufficient,
          decimals
        });
      } catch (error: any) {
        console.log(`   ${symbol}: ❌ Error - ${error.message}`);
        tokenStatus.push({
          symbol,
          address,
          error: error.message
        });
      }
    }

    // Check supported networks
    console.log(`\n🌉 Supported Networks:`);
    const supportedNetworks = [133717, 5003, 133718, 59902, 5000];
    for (const chainId of supportedNetworks) {
      try {
        const isSupported = await bridge.supportedChains(chainId);
        const networkName = Object.values(NETWORKS).find(n => n.chainId === chainId)?.name || `Chain ${chainId}`;
        console.log(`   ${networkName} (${chainId}): ${isSupported ? "✅ Supported" : "❌ Not Supported"}`);
      } catch (error) {
        // Skip if error
      }
    }

    // Check relayers
    console.log(`\n🔐 Relayers:`);
    try {
      const deployerAddress = "0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff";
      const isRelayer = await bridge.relayers(deployerAddress);
      console.log(`   Deployer (${deployerAddress}): ${isRelayer ? "✅ Relayer" : "❌ Not Relayer"}`);
    } catch (error) {
      console.log(`   ⚠️  Could not check relayers`);
    }

    // Save status to file
    const statusData = {
      network: networkConfig.name,
      chainId: networkConfig.chainId,
      bridgeAddress: networkConfig.bridgeAddress,
      owner,
      bridgeFee: bridgeFee.toString(),
      paused,
      tokenStatus,
      timestamp: new Date().toISOString()
    };

    const networkDir = networkKey.toLowerCase();
    const statusDir = path.join(__dirname, "..", "..", "dpsmc", networkDir === "hyperion" ? "hyperion" : networkDir === "mantle" ? "mantle" : networkDir === "lazchain" ? "lazai" : "metis_testnet", "bridge");
    if (!fs.existsSync(statusDir)) {
      fs.mkdirSync(statusDir, { recursive: true });
    }

    const statusPath = path.join(statusDir, `bridge-status-${Date.now()}.json`);
    fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));
    console.log(`\n💾 Status saved to: ${statusPath}`);

    return statusData;
  } catch (error: any) {
    console.log(`\n❌ Error checking ${networkConfig.name}: ${error.message}`);
    return { network: networkConfig.name, error: error.message };
  }
}

async function main() {
  console.log("🔍 Bridge Status Check - All Networks");
  console.log("=" .repeat(60));

  const allStatuses: any[] = [];

  // Check all networks
  for (const [key, config] of Object.entries(NETWORKS)) {
    const status = await checkBridgeStatus(key, config);
    allStatuses.push(status);
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Summary");
  console.log(`${"=".repeat(60)}`);

  for (const status of allStatuses) {
    if (status.error) {
      console.log(`\n${status.network}: ❌ Error - ${status.error}`);
      continue;
    }

    console.log(`\n${status.network}:`);
    if (status.tokenStatus) {
      for (const token of status.tokenStatus) {
        if (token.error) {
          console.log(`  ${token.symbol}: ❌ Error`);
        } else {
          const statusIcon = token.isSufficient ? "✅" : "⚠️";
          console.log(`  ${statusIcon} ${token.symbol}: ${token.formattedBalance} (Min: ${token.minFormatted})`);
        }
      }
    }
  }

  // Funding recommendations
  console.log(`\n${"=".repeat(60)}`);
  console.log("💡 Funding Recommendations");
  console.log(`${"=".repeat(60)}`);

  for (const status of allStatuses) {
    if (status.error || !status.tokenStatus) continue;

    const needsFunding = status.tokenStatus.some((t: any) => !t.isSufficient && !t.error);
    if (needsFunding) {
      console.log(`\n${status.network} needs funding:`);
      for (const token of status.tokenStatus) {
        if (!token.isSufficient && !token.error) {
          const needed = (BigInt(token.minAmount) - BigInt(token.balance)).toString();
          const neededFormatted = ethers.formatUnits(needed, token.decimals);
          console.log(`  - ${token.symbol}: Need ${neededFormatted} more`);
        }
      }
    }
  }

  console.log(`\n✅ Status check completed!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

