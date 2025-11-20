import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Network configurations with bridge and token addresses
const NETWORKS = {
  HYPERION: {
    name: "Hyperion Testnet",
    chainId: 133717,
    rpcUrl: "https://hyperion-testnet.metisdevops.link",
    bridge: "0xfF064Fd496256e84b68dAE2509eDA84a3c235550",
    tokens: {
      USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
      USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682"
    }
  },
  MANTLE: {
    name: "Mantle Testnet",
    chainId: 5003,
    rpcUrl: "https://rpc.sepolia.mantle.xyz",
    bridge: "0xd6629696A52E914433b0924f1f49d42216708276",
    tokens: {
      USDT: "0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b",
      USDC: "0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE"
    }
  },
  LAZCHAIN: {
    name: "Lazchain Testnet",
    chainId: 133718,
    rpcUrl: "https://testnet.lazai.network",
    bridge: "0xf2D33cF11d102F94148c38f943C99408f7C898cf",
    tokens: {
      USDT: "0x9D81C1a89bE608417B5Bb1C1cF5858594D01E8a3",
      USDC: "0x677B021cCBA318A93BACB1653fD7bE0882ceE9Fd"
    }
  },
  METIS_SEPOLIA: {
    name: "Metis Sepolia Testnet",
    chainId: 59902,
    rpcUrl: "https://metis-sepolia-rpc.publicnode.com",
    bridge: "0x1AC16E6C537438c82A61A106B876Ef69C7e247d2",
    tokens: {
      USDT: "0x88b47706dF760cC4Cd5a13ae36A2809C8adD8898",
      USDC: "0x16d44fBBc8E1F3FBB6ac0674a44EECfa528604DD"
    }
  }
};

// Test amount
const TEST_AMOUNT = ethers.parseUnits("100", 6); // 100 USDT

// All network pairs for bidirectional testing
const NETWORK_PAIRS = [
  { from: "HYPERION", to: "MANTLE" },
  { from: "HYPERION", to: "LAZCHAIN" },
  { from: "HYPERION", to: "METIS_SEPOLIA" },
  { from: "MANTLE", to: "HYPERION" },
  { from: "MANTLE", to: "LAZCHAIN" },
  { from: "MANTLE", to: "METIS_SEPOLIA" },
  { from: "LAZCHAIN", to: "HYPERION" },
  { from: "LAZCHAIN", to: "MANTLE" },
  { from: "LAZCHAIN", to: "METIS_SEPOLIA" },
  { from: "METIS_SEPOLIA", to: "HYPERION" },
  { from: "METIS_SEPOLIA", to: "MANTLE" },
  { from: "METIS_SEPOLIA", to: "LAZCHAIN" }
];

async function checkBridgeReadiness(fromNetwork: any, toNetwork: any) {
  const results: any = {
    fromNetwork: fromNetwork.name,
    toNetwork: toNetwork.name,
    checks: {}
  };

  try {
    // Check from network bridge
    const fromProvider = new ethers.JsonRpcProvider(fromNetwork.rpcUrl);
    const fromBridge = await ethers.getContractAt("Bridge", fromNetwork.bridge, fromProvider);
    
    // Check if destination is supported
    const isSupported = await fromBridge.supportedChains(toNetwork.chainId);
    results.checks.destinationSupported = isSupported;

    // Check from network token balance
    const fromToken = await ethers.getContractAt("Token", fromNetwork.tokens.USDT, fromProvider);
    const fromBalance = await fromToken.balanceOf(fromNetwork.bridge);
    results.checks.fromBridgeBalance = {
      raw: fromBalance.toString(),
      formatted: ethers.formatUnits(fromBalance, 6),
      sufficient: fromBalance >= TEST_AMOUNT
    };

    // Check to network bridge balance
    const toProvider = new ethers.JsonRpcProvider(toNetwork.rpcUrl);
    const toToken = await ethers.getContractAt("Token", toNetwork.tokens.USDT, toProvider);
    const toBalance = await toToken.balanceOf(toNetwork.bridge);
    results.checks.toBridgeBalance = {
      raw: toBalance.toString(),
      formatted: ethers.formatUnits(toBalance, 6),
      sufficient: toBalance >= TEST_AMOUNT
    };

    // Check token mapping
    const tokenSymbol = "USDT";
    const tokenAddress = await fromBridge.tokenAddresses(tokenSymbol, toNetwork.chainId);
    results.checks.tokenMapping = {
      exists: tokenAddress !== ethers.ZeroAddress,
      address: tokenAddress
    };

    // Overall readiness
    results.ready = isSupported && 
                   results.checks.fromBridgeBalance.sufficient && 
                   results.checks.toBridgeBalance.sufficient &&
                   results.checks.tokenMapping.exists;

  } catch (error: any) {
    results.error = error.message;
    results.ready = false;
  }

  return results;
}

async function main() {
  console.log("🧪 Comprehensive Bridge Network Pair Testing");
  console.log("=".repeat(60));
  console.log("\nThis script checks readiness for bidirectional transfers");
  console.log("between all network pairs.\n");

  const testResults: any[] = [];

  for (const pair of NETWORK_PAIRS) {
    const fromNetwork = NETWORKS[pair.from as keyof typeof NETWORKS];
    const toNetwork = NETWORKS[pair.to as keyof typeof NETWORKS];

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Testing: ${fromNetwork.name} → ${toNetwork.name}`);
    console.log(`${"=".repeat(60)}`);

    const result = await checkBridgeReadiness(fromNetwork, toNetwork);
    testResults.push(result);

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      continue;
    }

    // Display results
    console.log(`\n📊 Readiness Check:`);
    console.log(`   Destination Supported: ${result.checks.destinationSupported ? "✅ Yes" : "❌ No"}`);
    
    if (result.checks.fromBridgeBalance) {
      const status = result.checks.fromBridgeBalance.sufficient ? "✅" : "⚠️";
      console.log(`   ${status} From Bridge Balance: ${result.checks.fromBridgeBalance.formatted} USDT`);
    }

    if (result.checks.toBridgeBalance) {
      const status = result.checks.toBridgeBalance.sufficient ? "✅" : "⚠️";
      console.log(`   ${status} To Bridge Balance: ${result.checks.toBridgeBalance.formatted} USDT`);
    }

    if (result.checks.tokenMapping) {
      const status = result.checks.tokenMapping.exists ? "✅" : "❌";
      console.log(`   ${status} Token Mapping: ${result.checks.tokenMapping.exists ? "Configured" : "Missing"}`);
    }

    console.log(`\n   Overall Status: ${result.ready ? "✅ Ready" : "⚠️  Not Ready"}`);

    if (!result.ready) {
      console.log(`\n   Issues:`);
      if (!result.checks.destinationSupported) {
        console.log(`     - Destination network not supported`);
      }
      if (result.checks.fromBridgeBalance && !result.checks.fromBridgeBalance.sufficient) {
        console.log(`     - From bridge needs funding (has ${result.checks.fromBridgeBalance.formatted}, need ${ethers.formatUnits(TEST_AMOUNT, 6)})`);
      }
      if (result.checks.toBridgeBalance && !result.checks.toBridgeBalance.sufficient) {
        console.log(`     - To bridge needs funding (has ${result.checks.toBridgeBalance.formatted}, need ${ethers.formatUnits(TEST_AMOUNT, 6)})`);
      }
      if (result.checks.tokenMapping && !result.checks.tokenMapping.exists) {
        console.log(`     - Token mapping not configured`);
      }
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Test Summary");
  console.log(`${"=".repeat(60)}`);

  const readyPairs = testResults.filter(r => r.ready).length;
  const totalPairs = testResults.length;

  console.log(`\n✅ Ready: ${readyPairs}/${totalPairs} network pairs`);
  console.log(`⚠️  Not Ready: ${totalPairs - readyPairs}/${totalPairs} network pairs`);

  // Ready pairs
  if (readyPairs > 0) {
    console.log(`\n✅ Ready Pairs:`);
    for (const result of testResults) {
      if (result.ready) {
        console.log(`   ${result.fromNetwork} → ${result.toNetwork}`);
      }
    }
  }

  // Not ready pairs
  if (readyPairs < totalPairs) {
    console.log(`\n⚠️  Not Ready Pairs:`);
    for (const result of testResults) {
      if (!result.ready) {
        console.log(`   ${result.fromNetwork} → ${result.toNetwork}`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        } else {
          const issues: string[] = [];
          if (!result.checks.destinationSupported) issues.push("Network not supported");
          if (result.checks.fromBridgeBalance && !result.checks.fromBridgeBalance.sufficient) issues.push("From bridge needs funding");
          if (result.checks.toBridgeBalance && !result.checks.toBridgeBalance.sufficient) issues.push("To bridge needs funding");
          if (result.checks.tokenMapping && !result.checks.tokenMapping.exists) issues.push("Token mapping missing");
          console.log(`     Issues: ${issues.join(", ")}`);
        }
      }
    }
  }

  // Save test results
  const testData = {
    timestamp: new Date().toISOString(),
    testAmount: TEST_AMOUNT.toString(),
    results: testResults,
    summary: {
      totalPairs,
      readyPairs,
      notReadyPairs: totalPairs - readyPairs
    }
  };

  const testDir = path.join(__dirname, "..", "..", "dpsmc", "report", "bridge");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testPath = path.join(testDir, `network-pairs-test-${Date.now()}.json`);
  fs.writeFileSync(testPath, JSON.stringify(testData, null, 2));
  console.log(`\n💾 Test results saved to: ${testPath}`);

  console.log(`\n✅ Testing completed!`);
  console.log(`\n📝 Next Steps:`);
  console.log(`   1. Fund bridges that need funding`);
  console.log(`   2. Configure token mappings if missing`);
  console.log(`   3. Re-run this test to verify readiness`);
  console.log(`   4. Execute bidirectional transfer tests`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

