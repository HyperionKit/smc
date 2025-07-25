const { ethers } = require("hardhat");
require("dotenv").config();

// Token configurations
const TOKENS = {
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    initialSupply: ethers.parseUnits("1000000", 6) // 1M USDT
  },
  DAI: {
    name: "Dai Stablecoin",
    symbol: "DAI", 
    decimals: 18,
    initialSupply: ethers.parseUnits("1000000", 18) // 1M DAI
  },
  WETH: {
    name: "Wrapped Ethereum",
    symbol: "WETH",
    decimals: 18,
    initialSupply: ethers.parseUnits("1000", 18) // 1K WETH
  },
  WBTC: {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    initialSupply: ethers.parseUnits("100", 8) // 100 WBTC
  },
  WMETIS: {
    name: "Wrapped Metis",
    symbol: "WMETIS",
    decimals: 18,
    initialSupply: ethers.parseUnits("1000000", 18) // 1M WMETIS
  }
};

async function deployTokens() {
  console.log(`\n🚀 Deploying tokens to current network...`);
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`🌐 Network: Chain ID ${network.chainId}`);
  
  const deployedTokens = {};
  
  for (const [tokenName, tokenConfig] of Object.entries(TOKENS)) {
    try {
      console.log(`\n📝 Deploying ${tokenName}...`);
      
      const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
      const token = await SimpleERC20.deploy(
        tokenConfig.name,
        tokenConfig.symbol, 
        tokenConfig.decimals,
        tokenConfig.initialSupply
      );
      
      await token.waitForDeployment();
      const address = await token.getAddress();
      
      deployedTokens[tokenName] = address;
      
      console.log(`✅ ${tokenName} deployed: ${address}`);
      console.log(`   Name: ${tokenConfig.name}`);
      console.log(`   Symbol: ${tokenConfig.symbol}`);
      console.log(`   Decimals: ${tokenConfig.decimals}`);
      console.log(`   Initial Supply: ${ethers.formatUnits(tokenConfig.initialSupply, tokenConfig.decimals)} ${tokenConfig.symbol}`);
      
    } catch (error) {
      console.log(`❌ Error deploying ${tokenName}: ${error.message}`);
    }
  }
  
  return deployedTokens;
}

async function main() {
  console.log("🚀 Token Deployment Script");
  console.log("==========================");
  
  const tokens = await deployTokens();
  
  console.log("\n📋 Deployment Summary");
  console.log("=====================");
  
  for (const [tokenName, address] of Object.entries(tokens)) {
    console.log(`   ${tokenName}: ${address}`);
  }
  
  console.log("\n✅ Token deployment completed!");
  console.log("💡 Update your bridge configuration with these new addresses");
}

main().catch(console.error); 