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

const ALL_CHAIN_IDS = [133717, 5003, 133718, 59902, 5000];
const TOKEN_SYMBOLS = ["USDT", "USDC", "DAI", "WETH"];

async function verifyBridgeConfig(networkKey: string, networkConfig: any) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔍 Verifying ${networkConfig.name} Bridge Configuration`);
  console.log(`${"=".repeat(60)}`);

  const verification: any = {
    network: networkConfig.name,
    chainId: networkConfig.chainId,
    bridgeAddress: networkConfig.bridgeAddress,
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const bridge = await ethers.getContractAt("Bridge", networkConfig.bridgeAddress, provider);

    // Check basic configuration
    console.log(`\n📊 Basic Configuration:`);
    const owner = await bridge.owner();
    console.log(`   Owner: ${owner}`);
    verification.checks.owner = owner;

    const bridgeFee = await bridge.bridgeFee();
    console.log(`   Bridge Fee: ${ethers.formatEther(bridgeFee)} ETH`);
    verification.checks.bridgeFee = bridgeFee.toString();

    const paused = await bridge.paused();
    console.log(`   Paused: ${paused ? "❌ Yes" : "✅ No"}`);
    verification.checks.paused = paused;

    // Check supported networks
    console.log(`\n🌉 Supported Networks:`);
    const supportedNetworks: number[] = [];
    for (const chainId of ALL_CHAIN_IDS) {
      try {
        const isSupported = await bridge.supportedChains(chainId);
        const networkName = Object.values(NETWORKS).find(n => n.chainId === chainId)?.name || `Chain ${chainId}`;
        console.log(`   ${networkName} (${chainId}): ${isSupported ? "✅ Supported" : "❌ Not Supported"}`);
        if (isSupported) {
          supportedNetworks.push(chainId);
        }
      } catch (error) {
        // Skip if error
      }
    }
    verification.checks.supportedNetworks = supportedNetworks;

    // Check token mappings
    console.log(`\n💰 Token Mappings:`);
    const tokenMappings: any = {};

    for (const symbol of TOKEN_SYMBOLS) {
      tokenMappings[symbol] = {};
      console.log(`\n   ${symbol}:`);
      
      // Check local token
      const localToken = networkConfig.tokens[symbol as keyof typeof networkConfig.tokens];
      const isLocalSupported = await bridge.supportedTokens(localToken);
      console.log(`     Local (${networkConfig.name}): ${isLocalSupported ? "✅ Supported" : "❌ Not Supported"}`);
      tokenMappings[symbol].local = {
        address: localToken,
        supported: isLocalSupported
      };

      // Check mappings to other networks
      for (const chainId of ALL_CHAIN_IDS) {
        if (chainId === networkConfig.chainId) continue;
        
        try {
          const mappedAddress = await bridge.tokenAddresses(symbol, chainId);
          const networkName = Object.values(NETWORKS).find(n => n.chainId === chainId)?.name || `Chain ${chainId}`;
          
          if (mappedAddress !== ethers.ZeroAddress) {
            const isActive = await bridge.activeTokens(chainId, symbol);
            const status = isActive ? "✅ Active" : "⚠️  Inactive";
            console.log(`     ${networkName} (${chainId}): ${status} - ${mappedAddress}`);
            tokenMappings[symbol][chainId] = {
              address: mappedAddress,
              active: isActive
            };
          } else {
            console.log(`     ${networkName} (${chainId}): ❌ Not Mapped`);
            tokenMappings[symbol][chainId] = {
              address: ethers.ZeroAddress,
              active: false
            };
          }
        } catch (error) {
          // Skip if error
        }
      }
    }
    verification.checks.tokenMappings = tokenMappings;

    // Check relayers
    console.log(`\n🔐 Relayers:`);
    const deployerAddress = "0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff";
    try {
      const isRelayer = await bridge.relayers(deployerAddress);
      console.log(`   Deployer: ${isRelayer ? "✅ Relayer" : "❌ Not Relayer"}`);
      verification.checks.relayers = {
        deployer: {
          address: deployerAddress,
          isRelayer: isRelayer
        }
      };
    } catch (error) {
      console.log(`   ⚠️  Could not check relayers`);
    }

    // Summary
    console.log(`\n📋 Verification Summary:`);
    const issues: string[] = [];
    
    if (paused) {
      issues.push("Bridge is paused");
    }
    
    if (supportedNetworks.length < 3) {
      issues.push(`Only ${supportedNetworks.length} networks supported (expected at least 3)`);
    }

    let missingMappings = 0;
    for (const symbol of TOKEN_SYMBOLS) {
      for (const chainId of ALL_CHAIN_IDS) {
        if (chainId === networkConfig.chainId) continue;
        if (!tokenMappings[symbol][chainId] || tokenMappings[symbol][chainId].address === ethers.ZeroAddress) {
          missingMappings++;
        }
      }
    }
    
    if (missingMappings > 0) {
      issues.push(`${missingMappings} token mappings missing`);
    }

    if (issues.length === 0) {
      console.log(`   ✅ All checks passed`);
      verification.status = "PASSED";
    } else {
      console.log(`   ⚠️  Issues found:`);
      for (const issue of issues) {
        console.log(`     - ${issue}`);
      }
      verification.status = "ISSUES_FOUND";
      verification.issues = issues;
    }

  } catch (error: any) {
    console.log(`\n❌ Error: ${error.message}`);
    verification.status = "ERROR";
    verification.error = error.message;
  }

  return verification;
}

async function main() {
  console.log("🔍 Bridge Configuration Verification");
  console.log("=".repeat(60));

  const allVerifications: any[] = [];

  for (const [key, config] of Object.entries(NETWORKS)) {
    const verification = await verifyBridgeConfig(key, config);
    allVerifications.push(verification);
  }

  // Overall summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Overall Verification Summary");
  console.log(`${"=".repeat(60)}`);

  for (const verification of allVerifications) {
    const statusIcon = verification.status === "PASSED" ? "✅" : verification.status === "ERROR" ? "❌" : "⚠️";
    console.log(`\n${statusIcon} ${verification.network}: ${verification.status}`);
    
    if (verification.issues) {
      for (const issue of verification.issues) {
        console.log(`     - ${issue}`);
      }
    }
  }

  // Save verification results
  const verificationData = {
    timestamp: new Date().toISOString(),
    verifications: allVerifications
  };

  const verificationDir = path.join(__dirname, "..", "..", "dpsmc", "report", "bridge");
  if (!fs.existsSync(verificationDir)) {
    fs.mkdirSync(verificationDir, { recursive: true });
  }

  const verificationPath = path.join(verificationDir, `bridge-verification-${Date.now()}.json`);
  fs.writeFileSync(verificationPath, JSON.stringify(verificationData, null, 2));
  console.log(`\n💾 Verification results saved to: ${verificationPath}`);

  console.log(`\n✅ Verification completed!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

