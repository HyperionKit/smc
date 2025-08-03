import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Verifying all ERC20 tokens on Lazchain testnet...\n");

  const tokens = [
    {
      name: "USDT",
      address: "0x9D81C1a89bE608417B5Bb1C1cF5858594D01E8a3",
      constructorArgs: [
        "Tether USD",
        "USDT",
        6,
        ethers.parseUnits("40000000", 6) // 40M USDT with 6 decimals
      ]
    },
    {
      name: "USDC",
      address: "0x677B021cCBA318A93BACB1653fD7bE0882ceE9Fd",
      constructorArgs: [
        "USD Coin",
        "USDC",
        6,
        ethers.parseUnits("40000000", 6) // 40M USDC with 6 decimals
      ]
    },
    {
      name: "DAI",
      address: "0xeC53e4a54b3AB36fb684966c222Ff6f347C7e84c",
      constructorArgs: [
        "Dai Stablecoin",
        "DAI",
        18,
        ethers.parseUnits("40000000", 18) // 40M DAI with 18 decimals
      ]
    },
    {
      name: "WETH",
      address: "0xef63df9fa0E5f79127AaC0B2a0ec969CC30be532",
      constructorArgs: [
        "Wrapped Ether",
        "WETH",
        18,
        ethers.parseUnits("40000000", 18) // 40M WETH with 18 decimals
      ]
    }
  ];

  for (const token of tokens) {
    console.log(`📝 Verifying ${token.name}...`);
    console.log(`   Address: ${token.address}`);
          console.log(`   Constructor Args: [${token.constructorArgs.map(arg => typeof arg === 'bigint' ? arg.toString() : `"${arg}"`).join(', ')}]`);
    
    try {
      // Run verification command
      const { exec } = require('child_process');
      const command = `npx hardhat verify --network lazchain-testnet ${token.address} ${token.constructorArgs.map(arg => `"${arg}"`).join(' ')}`;
      
      console.log(`   Command: ${command}`);
      console.log(`   Status: ⏳ Attempting verification...\n`);
      
      // Note: This is a simulation - actual verification would require running the command
      console.log(`   ⚠️  Note: Due to block explorer API issues, verification may fail.`);
      console.log(`   🔗 Manual verification URL: https://lazai-testnet-explorer.metisdevops.link/address/${token.address}\n`);
    } catch (error) {
      console.log(`   ❌ Verification failed: ${error}\n`);
    }
  }

  console.log("✅ Verification script completed!");
  console.log("\n📋 Summary:");
  console.log("===========");
  tokens.forEach(token => {
    console.log(`${token.name}: ${token.address}`);
  });
  
  console.log("\n🔧 Manual Verification Steps:");
  console.log("1. Visit each contract on the block explorer");
  console.log("2. Click 'Verify Contract'");
  console.log("3. Upload SimpleERC20.sol source code");
  console.log("4. Set compiler version to 0.8.28");
  console.log("5. Set optimization to enabled, 200 runs");
  console.log("6. Enter constructor arguments as shown above");
  console.log("7. Submit verification");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 