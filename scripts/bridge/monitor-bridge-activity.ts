import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Network configurations
const NETWORKS = {
  HYPERION: {
    name: "Hyperion Testnet",
    chainId: 133717,
    rpcUrl: process.env.HYPERION_RPC_URL || "https://hyperion-testnet.metisdevops.link",
    bridgeAddress: "0xfF064Fd496256e84b68dAE2509eDA84a3c235550"
  },
  MANTLE: {
    name: "Mantle Testnet",
    chainId: 5003,
    rpcUrl: process.env.MANTLE_TESTNET_RPC_URL || "https://rpc.sepolia.mantle.xyz",
    bridgeAddress: "0xd6629696A52E914433b0924f1f49d42216708276"
  },
  LAZCHAIN: {
    name: "Lazchain Testnet",
    chainId: 133718,
    rpcUrl: process.env.LAZCHAIN_RPC_URL || "https://testnet.lazai.network",
    bridgeAddress: "0xf2D33cF11d102F94148c38f943C99408f7C898cf"
  },
  METIS_SEPOLIA: {
    name: "Metis Sepolia Testnet",
    chainId: 59902,
    rpcUrl: process.env.METISSEPOLIA_RPC_URL || "https://metis-sepolia-rpc.publicnode.com",
    bridgeAddress: "0x1AC16E6C537438c82A61A106B876Ef69C7e247d2"
  }
};

async function monitorActivity(networkKey: string, networkConfig: any, fromBlock?: number) {
  try {
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const bridge = await ethers.getContractAt("Bridge", networkConfig.bridgeAddress, provider);

    const currentBlock = await provider.getBlockNumber();
    const startBlock = fromBlock || currentBlock - 1000; // Default: last 1000 blocks

    console.log(`\n🌐 ${networkConfig.name}`);
    console.log(`   Scanning blocks ${startBlock} to ${currentBlock}`);

    // Get deposit events
    const depositFilter = bridge.filters.TokenDeposited();
    const deposits = await bridge.queryFilter(depositFilter, startBlock, currentBlock);

    // Get withdrawal events
    const withdrawalFilter = bridge.filters.TokenWithdrawn();
    const withdrawals = await bridge.queryFilter(withdrawalFilter, startBlock, currentBlock);

    // Get bridge stats
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    try {
      const stats = await bridge.getBridgeStats();
      totalDeposits = Number(stats.totalDeposits);
      totalWithdrawals = Number(stats.totalWithdrawals);
    } catch (error) {
      // Stats function might not exist
    }

    console.log(`   📥 Deposits: ${deposits.length} (Total: ${totalDeposits})`);
    console.log(`   📤 Withdrawals: ${withdrawals.length} (Total: ${totalWithdrawals})`);

    // Process recent deposits
    if (deposits.length > 0) {
      console.log(`\n   Recent Deposits:`);
      const recentDeposits = deposits.slice(-5).reverse(); // Last 5
      for (const deposit of recentDeposits) {
        const args = deposit.args;
        console.log(`     - User: ${args.user}`);
        console.log(`       Token: ${args.token}`);
        console.log(`       Amount: ${ethers.formatEther(args.amount)}`);
        console.log(`       Destination: Chain ${args.destinationChainId}`);
        console.log(`       Deposit ID: ${args.depositId}`);
        console.log(`       Block: ${deposit.blockNumber}`);
      }
    }

    // Process recent withdrawals
    if (withdrawals.length > 0) {
      console.log(`\n   Recent Withdrawals:`);
      const recentWithdrawals = withdrawals.slice(-5).reverse(); // Last 5
      for (const withdrawal of recentWithdrawals) {
        const args = withdrawal.args;
        console.log(`     - User: ${args.user}`);
        console.log(`       Token: ${args.token}`);
        console.log(`       Amount: ${ethers.formatEther(args.amount)}`);
        console.log(`       Deposit ID: ${args.depositId}`);
        console.log(`       Withdrawal ID: ${args.withdrawalId}`);
        console.log(`       Block: ${withdrawal.blockNumber}`);
      }
    }

    return {
      network: networkConfig.name,
      chainId: networkConfig.chainId,
      currentBlock,
      scannedBlocks: currentBlock - startBlock,
      deposits: deposits.length,
      withdrawals: withdrawals.length,
      totalDeposits,
      totalWithdrawals,
      recentDeposits: deposits.slice(-10).map(d => ({
        user: d.args.user,
        token: d.args.token,
        amount: d.args.amount.toString(),
        destinationChainId: Number(d.args.destinationChainId),
        depositId: d.args.depositId,
        blockNumber: d.blockNumber,
        timestamp: d.blockNumber // Will need to fetch block timestamp
      })),
      recentWithdrawals: withdrawals.slice(-10).map(w => ({
        user: w.args.user,
        token: w.args.token,
        amount: w.args.amount.toString(),
        depositId: w.args.depositId,
        withdrawalId: w.args.withdrawalId,
        blockNumber: w.blockNumber
      }))
    };
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { network: networkConfig.name, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const continuous = args.includes("--continuous");
  const interval = args.includes("--interval") ? parseInt(args[args.indexOf("--interval") + 1]) || 300 : 300;
  const fromBlock = args.includes("--from-block") ? parseInt(args[args.indexOf("--from-block") + 1]) : undefined;

  console.log("📊 Bridge Activity Monitor");
  console.log("=".repeat(60));
  if (continuous) {
    console.log(`🔄 Continuous monitoring (interval: ${interval} seconds)`);
  }

  const monitor = async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n⏰ ${timestamp}`);
    console.log("=".repeat(60));

    const allActivity: any[] = [];

    for (const [key, config] of Object.entries(NETWORKS)) {
      const activity = await monitorActivity(key, config, fromBlock);
      allActivity.push(activity);
    }

    // Summary
    console.log(`\n${"=".repeat(60)}`);
    console.log("📊 Activity Summary");
    console.log("=".repeat(60));
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    for (const activity of allActivity) {
      if (activity.error) continue;
      totalDeposits += activity.deposits;
      totalWithdrawals += activity.withdrawals;
      console.log(`${activity.network}: ${activity.deposits} deposits, ${activity.withdrawals} withdrawals`);
    }

    console.log(`\nTotal: ${totalDeposits} deposits, ${totalWithdrawals} withdrawals`);

    // Save activity data
    const activityData = {
      timestamp,
      activity: allActivity,
      summary: {
        totalDeposits,
        totalWithdrawals
      }
    };

    const activityDir = path.join(__dirname, "..", "..", "dpsmc", "report", "bridge");
    if (!fs.existsSync(activityDir)) {
      fs.mkdirSync(activityDir, { recursive: true });
    }

    const activityPath = path.join(activityDir, `bridge-activity-${Date.now()}.json`);
    fs.writeFileSync(activityPath, JSON.stringify(activityData, null, 2));
    console.log(`\n💾 Activity data saved to: ${activityPath}`);
  };

  if (continuous) {
    console.log("\n🔄 Starting continuous monitoring...");
    console.log("Press Ctrl+C to stop\n");
    
    await monitor();
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

