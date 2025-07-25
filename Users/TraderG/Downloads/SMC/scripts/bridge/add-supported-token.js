const { ethers } = require("ethers");
require("dotenv").config();

// New contract addresses after redeployment
const NETWORKS = {
  hyperion: {
    name: "Hyperion",
    rpc: "https://hyperion-testnet.metisdevops.link",
    bridge: "0xde1a73D5B10fA76bD34d0A5Cbe32B98f71aBf3c5",
    chainId: 133717
  },
  lazchain: {
    name: "Lazchain", 
    rpc: "https://lazai-testnet.metisdevops.link",
    bridge: "0xBeD930CdDA3C055543B94C5705cAaf515676e7d0",
    chainId: 133718
  },
  metisSepolia: {
    name: "Metis Sepolia",
    rpc: "https://metis-sepolia-rpc.publicnode.com", 
    bridge: "0xB12e09416f59B4b2D55C9b6f02DFe904D787ed30",
    chainId: 59902
  }
};

// Token addresses for each network
const TOKENS = {
  hyperion: {
    USDT: "0x3c099E287eC71b4AA61A7110287D715389329237",
    DAI: "0xc4c33c42684ad16e84800c25d5dE7B650E9F95Ca", 
    WETH: "0x9AB236Ec38492099a4d35552e6dC7D9442607f9A",
    WBTC: "0x63d940F5b04235aba7E921a3b508aB1360D32706",
    WMETIS: "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301"
  },
  lazchain: {
    // Use same addresses for now - adjust if different on Lazchain
    USDT: "0x3c099E287eC71b4AA61A7110287D715389329237",
    DAI: "0xc4c33c42684ad16e84800c25d5dE7B650E9F95Ca",
    WETH: "0x9AB236Ec38492099a4d35552e6dC7D9442607f9A", 
    WBTC: "0x63d940F5b04235aba7E921a3b508aB1360D32706",
    WMETIS: "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301"
  },
  metisSepolia: {
    // Use same addresses for now - adjust if different on Metis Sepolia
    USDT: "0x3c099E287eC71b4AA61A7110287D715389329237",
    DAI: "0xc4c33c42684ad16e84800c25d5dE7B650E9F95Ca",
    WETH: "0x9AB236Ec38492099a4d35552e6dC7D9442607f9A",
    WBTC: "0x63d940F5b04235aba7E921a3b508aB1360D32706", 
    WMETIS: "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301"
  }
};

const BRIDGE_ABI = [
  "function addSupportedToken(address token, uint256 minAmount, uint256 maxAmount, uint256 dailyLimit) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)",
  "function OPERATOR_ROLE() external view returns (bytes32)",
  "function getTokenConfig(address token) external view returns (bool isSupported, uint256 minAmount, uint256 maxAmount, uint256 dailyLimit, uint256 dailyUsed, uint256 lastResetTime)"
];

async function addSupportedTokens(networkName) {
  const network = NETWORKS[networkName];
  const tokens = TOKENS[networkName];
  
  console.log(`\n🌐 Adding tokens to ${network.name} (Chain ID: ${network.chainId})...`);
  
  const provider = new ethers.JsonRpcProvider(network.rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const bridge = new ethers.Contract(network.bridge, BRIDGE_ABI, wallet);
  
  // Check if wallet has OPERATOR role
  const opRole = await bridge.OPERATOR_ROLE();
  const isOp = await bridge.hasRole(opRole, wallet.address);
  if (!isOp) {
    console.log(`❌ Wallet ${wallet.address} is not an OPERATOR on ${network.name}`);
    return;
  }
  
  console.log(`✅ Wallet has OPERATOR role on ${network.name}`);
  
  // Token configurations with appropriate limits
  const tokenConfigs = {
    USDT: {
      min: ethers.parseUnits("0.001", 6),      // 0.001 USDT (6 decimals)
      max: ethers.parseUnits("100000", 6),     // 100,000 USDT
      daily: ethers.parseUnits("1000000", 6)   // 1,000,000 USDT
    },
    DAI: {
      min: ethers.parseUnits("0.001", 18),     // 0.001 DAI (18 decimals)
      max: ethers.parseUnits("100000", 18),    // 100,000 DAI
      daily: ethers.parseUnits("1000000", 18)  // 1,000,000 DAI
    },
    WETH: {
      min: ethers.parseUnits("0.001", 18),     // 0.001 WETH (18 decimals)
      max: ethers.parseUnits("1000", 18),      // 1,000 WETH
      daily: ethers.parseUnits("10000", 18)    // 10,000 WETH
    },
    WBTC: {
      min: ethers.parseUnits("0.0001", 8),     // 0.0001 WBTC (8 decimals)
      max: ethers.parseUnits("100", 8),        // 100 WBTC
      daily: ethers.parseUnits("1000", 8)      // 1,000 WBTC
    },
    WMETIS: {
      min: ethers.parseUnits("0.001", 18),     // 0.001 WMETIS (18 decimals)
      max: ethers.parseUnits("100000", 18),    // 100,000 WMETIS
      daily: ethers.parseUnits("1000000", 18)  // 1,000,000 WMETIS
    }
  };
  
  // Add each token
  for (const [tokenName, tokenAddress] of Object.entries(tokens)) {
    try {
      console.log(`\n📝 Adding ${tokenName} (${tokenAddress})...`);
      
      // Check if already supported
      const tokenInfo = await bridge.getTokenConfig(tokenAddress);
      if (tokenInfo[0]) { // isSupported
        console.log(`✅ ${tokenName} is already supported`);
        continue;
      }
      
      const config = tokenConfigs[tokenName];
      const tx = await bridge.addSupportedToken(
        tokenAddress, 
        config.min, 
        config.max, 
        config.daily
      );
      
      console.log(`⏳ Waiting for tx: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ ${tokenName} added as supported token!`);
      
    } catch (error) {
      console.log(`❌ Failed to add ${tokenName}: ${error.message}`);
    }
  }
}

async function main() {
  console.log("🚀 Adding supported tokens to all networks...");
  
  for (const networkName of Object.keys(NETWORKS)) {
    try {
      await addSupportedTokens(networkName);
    } catch (error) {
      console.log(`❌ Error with ${networkName}: ${error.message}`);
    }
  }
  
  console.log("\n✅ Token addition process completed!");
}

main().catch(console.error); 