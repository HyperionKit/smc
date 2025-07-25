const { ethers } = require("ethers");
require("dotenv").config();

// Updated contract addresses after redeployment
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

// Bridge ABI for checking roles and permissions
const BRIDGE_ABI = [
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)",
  "function BRIDGE_ROLE() external view returns (bytes32)",
  "function MINTER_ROLE() external view returns (bytes32)",
  "function BURNER_ROLE() external view returns (bytes32)",
  "function RELAYER_ROLE() external view returns (bytes32)",
  "function OPERATOR_ROLE() external view returns (bytes32)",
  "function VALIDATOR_ROLE() external view returns (bytes32)",
  "function getTokenConfig(address token) external view returns (bool isSupported, uint256 minAmount, uint256 maxAmount, uint256 dailyLimit, uint256 dailyUsed, uint256 lastResetTime)",
  "function withdraw(address token, address recipient, uint256 amount, bytes32 depositTxHash, bytes calldata proof) external"
];

async function checkBridgePermissions() {
  console.log("🔍 Checking Bridge Permissions");
  console.log("==============================");

  if (!process.env.PRIVATE_KEY) {
    console.log("❌ PRIVATE_KEY not found in environment variables");
    return;
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  console.log(`👤 Wallet: ${wallet.address}`);

  for (const [networkName, network] of Object.entries(NETWORKS)) {
    console.log(`\n🌐 ${network.name} (Chain ID: ${network.chainId})`);
    console.log("=".repeat(50));

    try {
      const provider = new ethers.JsonRpcProvider(network.rpc);
      const bridge = new ethers.Contract(network.bridge, BRIDGE_ABI, provider);

      // Check various roles
      const roles = [
        "DEFAULT_ADMIN_ROLE",
        "BRIDGE_ROLE", 
        "MINTER_ROLE",
        "BURNER_ROLE",
        "RELAYER_ROLE",
        "OPERATOR_ROLE",
        "VALIDATOR_ROLE"
      ];

      for (const roleName of roles) {
        try {
          const role = await bridge[roleName]();
          const hasRole = await bridge.hasRole(role, wallet.address);
          console.log(`   ${roleName}: ${hasRole ? '✅' : '❌'}`);
        } catch (error) {
          console.log(`   ${roleName}: ❌ (Error: ${error.message})`);
        }
      }

      // Check if USDT is supported on this network
      const usdtAddress = networkName === 'hyperion' 
        ? "0x3c099E287eC71b4AA61A7110287D715389329237"
        : networkName === 'lazchain'
        ? "0x2a674069ACe9DEeDCCde6643e010879Df93109D7"
        : "0xa9924388E4B07CC302746578e3D998acF876E007";

      try {
        const config = await bridge.getTokenConfig(usdtAddress);
        console.log(`   USDT Support: ${config.isSupported ? '✅ Supported' : '❌ Not Supported'}`);
        if (config.isSupported) {
          console.log(`   Min Amount: ${ethers.formatUnits(config.minAmount, 6)} USDT`);
          console.log(`   Max Amount: ${ethers.formatUnits(config.maxAmount, 6)} USDT`);
          console.log(`   Daily Limit: ${ethers.formatUnits(config.dailyLimit, 6)} USDT`);
        }
      } catch (error) {
        console.log(`   USDT Support: ❌ (Error: ${error.message})`);
      }

    } catch (error) {
      console.log(`   ❌ Error connecting to ${network.name}: ${error.message}`);
    }
  }
}

checkBridgePermissions().catch(console.error); 