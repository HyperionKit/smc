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

// Alert thresholds (percentage of minimum recommended)
const ALERT_THRESHOLDS = {
  CRITICAL: 0.2,  // 20% of minimum
  WARNING: 0.5    // 50% of minimum
};

const MIN_FUNDING_AMOUNTS = {
  USDT: ethers.parseUnits("10000", 6),
  USDC: ethers.parseUnits("10000", 6),
  DAI: ethers.parseUnits("10000", 18),
  WETH: ethers.parseUnits("100", 18)
};

async function monitorBridge(networkKey: string, networkConfig: any) {
  const balances: any = {};

  try {
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

    for (const [symbol, address] of Object.entries(networkConfig.tokens)) {
      try {
        const token = await ethers.getContractAt("Token", address as string, provider);
        const balance = await token.balanceOf(networkConfig.bridgeAddress);
        const decimals = symbol === "USDT" || symbol === "USDC" ? 6 : 18;
        const minAmount = MIN_FUNDING_AMOUNTS[symbol as keyof typeof MIN_FUNDING_AMOUNTS];
        const percentage = Number(balance) / Number(minAmount);

        balances[symbol] = {
          balance: balance.toString(),
          formattedBalance: ethers.formatUnits(balance, decimals),
          minAmount: minAmount.toString(),
          minFormatted: ethers.formatUnits(minAmount, decimals),
          percentage: percentage,
          status: percentage >= 1 ? "OK" : percentage >= ALERT_THRESHOLDS.WARNING ? "WARNING" : "CRITICAL"
        };
      } catch (error: any) {
        balances[symbol] = { error: error.message };
      }
    }
  } catch (error: any) {
    return { error: error.message };
  }

  return balances;
}

async function main() {
  const args = process.argv.slice(2);
  const continuous = args.includes("--continuous");
  const interval = args.includes("--interval") ? parseInt(args[args.indexOf("--interval") + 1]) || 300 : 300; // Default 5 minutes

  console.log("📊 Bridge Balance Monitor");
  console.log("=".repeat(60));
  if (continuous) {
    console.log(`🔄 Continuous monitoring (interval: ${interval} seconds)`);
  }

  const monitor = async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n⏰ ${timestamp}`);
    console.log("=".repeat(60));

    const allBalances: any = {};
    const alerts: any[] = [];

    for (const [key, config] of Object.entries(NETWORKS)) {
      console.log(`\n🌐 ${config.name}`);
      const balances = await monitorBridge(key, config);

      if (balances.error) {
        console.log(`   ❌ Error: ${balances.error}`);
        continue;
      }

      allBalances[key] = balances;

      for (const [symbol, data] of Object.entries(balances)) {
        if ((data as any).error) {
          console.log(`   ${symbol}: ❌ Error`);
          continue;
        }

        const status = (data as any).status;
        const icon = status === "OK" ? "✅" : status === "WARNING" ? "⚠️" : "🔴";
        console.log(`   ${icon} ${symbol}: ${(data as any).formattedBalance} (${((data as any).percentage * 100).toFixed(1)}% of minimum)`);

        if (status !== "OK") {
          alerts.push({
            network: config.name,
            token: symbol,
            balance: (data as any).formattedBalance,
            minRequired: (data as any).minFormatted,
            status: status
          });
        }
      }
    }

    // Display alerts
    if (alerts.length > 0) {
      console.log(`\n${"=".repeat(60)}`);
      console.log("🚨 ALERTS");
      console.log("=".repeat(60));
      for (const alert of alerts) {
        const icon = alert.status === "WARNING" ? "⚠️" : "🔴";
        console.log(`${icon} ${alert.network} - ${alert.token}: ${alert.balance} (Min: ${alert.minRequired})`);
      }
    }

    // Save monitoring data
    const monitorData = {
      timestamp,
      balances: allBalances,
      alerts
    };

    const monitorDir = path.join(__dirname, "..", "..", "dpsmc", "report", "bridge");
    if (!fs.existsSync(monitorDir)) {
      fs.mkdirSync(monitorDir, { recursive: true });
    }

    const monitorPath = path.join(monitorDir, `bridge-monitor-${Date.now()}.json`);
    fs.writeFileSync(monitorPath, JSON.stringify(monitorData, null, 2));
  };

  if (continuous) {
    console.log("\n🔄 Starting continuous monitoring...");
    console.log("Press Ctrl+C to stop\n");
    
    // Run immediately
    await monitor();

    // Then run at intervals
    setInterval(async () => {
      await monitor();
    }, interval * 1000);
  } else {
    await monitor();
    console.log("\n✅ Monitoring completed!");
  }
}

main()
  .then(() => {
    if (!process.argv.includes("--continuous")) {
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

