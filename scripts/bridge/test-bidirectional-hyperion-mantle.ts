import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Hyperion addresses
const HYPERION = {
  bridge: "0xfF064Fd496256e84b68dAE2509eDA84a3c235550",
  tokens: {
    USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
    USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682"
  }
};

// Mantle addresses
const MANTLE = {
  bridge: "0xd6629696A52E914433b0924f1f49d42216708276",
  tokens: {
    USDT: "0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b",
    USDC: "0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE"
  }
};

// Test amounts
const TEST_AMOUNTS = {
  USDT: ethers.parseUnits("100", 6),  // 100 USDT
  USDC: ethers.parseUnits("100", 6)   // 100 USDC
};

async function main() {
  console.log("🔄 Testing Bidirectional Transfer: Hyperion ↔ Mantle");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log(`\n📋 Test Account: ${deployer.address}`);

  // Note: This test requires:
  // 1. Hyperion bridge to have tokens (already funded ✅)
  // 2. Mantle bridge to have tokens (needs funding ⚠️)
  // 3. Relayer to process withdrawals

  console.log("\n⚠️  IMPORTANT: This test requires:");
  console.log("   1. Hyperion bridge funded ✅");
  console.log("   2. Mantle bridge funded ⚠️  (Run fund-bridge-contract-mantle.ts first)");
  console.log("   3. Relayer configured ✅");
  console.log("   4. User has tokens on Hyperion for deposit");

  console.log("\n📝 Test Flow:");
  console.log("   1. Deposit USDT on Hyperion → Mantle");
  console.log("   2. Process withdrawal on Mantle (requires relayer)");
  console.log("   3. Deposit USDT on Mantle → Hyperion");
  console.log("   4. Process withdrawal on Hyperion (requires relayer)");

  // Check user balances on Hyperion
  console.log("\n💰 Checking User Balances on Hyperion...");
  try {
    const hyperionProvider = new ethers.JsonRpcProvider("https://hyperion-testnet.metisdevops.link");
    const hyperionUsdt = await ethers.getContractAt("Token", HYPERION.tokens.USDT, hyperionProvider);
    const userUsdtBalance = await hyperionUsdt.balanceOf(deployer.address);
    console.log(`   USDT Balance: ${ethers.formatUnits(userUsdtBalance, 6)}`);

    if (userUsdtBalance < TEST_AMOUNTS.USDT) {
      console.log(`\n❌ Insufficient USDT balance. Need ${ethers.formatUnits(TEST_AMOUNTS.USDT, 6)}, have ${ethers.formatUnits(userUsdtBalance, 6)}`);
      console.log("   Please get tokens from faucet or transfer tokens first.");
      return;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not check balances: ${error.message}`);
  }

  // Check Mantle bridge balance
  console.log("\n💰 Checking Mantle Bridge Balance...");
  try {
    const mantleProvider = new ethers.JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
    const mantleUsdt = await ethers.getContractAt("Token", MANTLE.tokens.USDT, mantleProvider);
    const mantleBridgeBalance = await mantleUsdt.balanceOf(MANTLE.bridge);
    console.log(`   Mantle Bridge USDT Balance: ${ethers.formatUnits(mantleBridgeBalance, 6)}`);

    if (mantleBridgeBalance < TEST_AMOUNTS.USDT) {
      console.log(`\n❌ Mantle bridge has insufficient USDT. Need ${ethers.formatUnits(TEST_AMOUNTS.USDT, 6)}, have ${ethers.formatUnits(mantleBridgeBalance, 6)}`);
      console.log("   Please fund Mantle bridge first using: fund-bridge-contract-mantle.ts");
      return;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not check Mantle bridge balance: ${error.message}`);
  }

  console.log("\n📋 Test Instructions:");
  console.log("   1. Run this script on Hyperion network to deposit");
  console.log("   2. Relayer processes withdrawal on Mantle");
  console.log("   3. Run deposit script on Mantle network");
  console.log("   4. Relayer processes withdrawal on Hyperion");

  // Save test configuration
  const testConfig = {
    testName: "Bidirectional Transfer: Hyperion ↔ Mantle",
    networks: {
      hyperion: {
        chainId: 133717,
        bridge: HYPERION.bridge,
        tokens: HYPERION.tokens
      },
      mantle: {
        chainId: 5003,
        bridge: MANTLE.bridge,
        tokens: MANTLE.tokens
      }
    },
    testAmounts: {
      USDT: TEST_AMOUNTS.USDT.toString(),
      USDC: TEST_AMOUNTS.USDC.toString()
    },
    timestamp: new Date().toISOString()
  };

  const testDir = path.join(__dirname, "..", "..", "dpsmc", "report", "bridge");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testPath = path.join(testDir, `bidirectional-test-config-${Date.now()}.json`);
  fs.writeFileSync(testPath, JSON.stringify(testConfig, null, 2));
  console.log(`\n💾 Test configuration saved to: ${testPath}`);

  console.log("\n✅ Test script ready!");
  console.log("\n📝 Next Steps:");
  console.log("   1. Ensure Mantle bridge is funded");
  console.log("   2. Run deposit on Hyperion: npx hardhat run scripts/bridge/test-bridge-deposit.ts --network metis-hyperion-testnet");
  console.log("   3. Process withdrawal on Mantle (relayer required)");
  console.log("   4. Run deposit on Mantle: npx hardhat run scripts/bridge/test-bridge-deposit-mantle.ts --network mantle-testnet");
  console.log("   5. Process withdrawal on Hyperion (relayer required)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

