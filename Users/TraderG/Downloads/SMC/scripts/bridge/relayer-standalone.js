const { ethers } = require("ethers");
require("dotenv").config();

// Updated contract addresses after redeployment
const NETWORKS = {
  hyperion: {
    name: "Hyperion",
    rpc: "https://hyperion-testnet.metisdevops.link",
    bridge: "0xde1a73D5B10fA76bD34d0A5Cbe32B98f71aBf3c5",
    relayer: "0x21a3C78C9f1EA96A9d9237923Fe6aa5f6dE70E50",
    chainId: 133717
  },
  lazchain: {
    name: "Lazchain", 
    rpc: "https://lazai-testnet.metisdevops.link",
    bridge: "0xBeD930CdDA3C055543B94C5705cAaf515676e7d0",
    relayer: "0x39425b0c9fC5652939652a647fB9d3F9556A8fb5",
    chainId: 133718
  },
  metisSepolia: {
    name: "Metis Sepolia",
    rpc: "https://metis-sepolia-rpc.publicnode.com", 
    bridge: "0xB12e09416f59B4b2D55C9b6f02DFe904D787ed30",
    relayer: "0x43d8de17246A99286AEF50766B3767eC99D9D77D",
    chainId: 59902
  }
};

// Bridge ABI for events and functions
const BRIDGE_ABI = [
  "event BridgeDeposit(bytes32 indexed requestId, address indexed sender, address indexed recipient, address token, uint256 amount, uint256 targetChainId, uint256 nonce, uint256 timestamp)",
  "function withdraw(address token, address recipient, uint256 amount, bytes32 depositTxHash, bytes calldata proof) external",
  "function getBridgeRequest(bytes32 requestId) external view returns (address sender, address recipient, uint256 amount, uint256 targetChainId, uint256 nonce, bool processed, uint256 timestamp)"
];

class BridgeRelayer {
  constructor() {
    this.providers = {};
    this.wallets = {};
    this.bridges = {};
    this.relayers = {};
    this.isRunning = false;
    
    this.setupNetworks();
  }
  
  setupNetworks() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY not found in environment variables");
    }
    
    // Setup providers and wallets for each network
    Object.entries(NETWORKS).forEach(([networkName, network]) => {
      this.providers[networkName] = new ethers.JsonRpcProvider(network.rpc);
      this.wallets[networkName] = new ethers.Wallet(privateKey, this.providers[networkName]);
      this.bridges[networkName] = new ethers.Contract(network.bridge, BRIDGE_ABI, this.wallets[networkName]);
      this.relayers[networkName] = new ethers.Contract(network.relayer, BRIDGE_ABI, this.wallets[networkName]);
    });
  }
  
  async start() {
    if (this.isRunning) {
      console.log("❌ Relayer is already running");
      return;
    }
    
    this.isRunning = true;
    console.log("🚀 Starting Bridge Relayer...");
    console.log("=============================");
    
    // Display network info
    Object.entries(NETWORKS).forEach(([networkName, network]) => {
      console.log(`🌐 ${network.name}: ${network.rpc}`);
      console.log(`   Bridge: ${network.bridge}`);
      console.log(`   Relayer: ${network.relayer}`);
      console.log(`   Chain ID: ${network.chainId}`);
    });
    
    console.log(`\n👤 Relayer Wallet: ${this.wallets.hyperion.address}`);
    
    // Check balances
    await this.checkBalances();
    
    // Start listening for events
    await this.startEventListeners();
  }
  
  async checkBalances() {
    console.log("\n💰 Checking Relayer Balances");
    console.log("============================");
    
    for (const [networkName, network] of Object.entries(NETWORKS)) {
      try {
        const balance = await this.providers[networkName].getBalance(this.wallets[networkName].address);
        const balanceEth = ethers.formatEther(balance);
        console.log(`🌐 ${network.name}: ${balanceEth} ETH`);
        
        if (balance < ethers.parseEther("0.01")) {
          console.log(`   ⚠️  Low balance on ${network.name}! Consider adding more ETH for gas fees.`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${network.name} balance: ${error.message}`);
      }
    }
  }
  
  async startEventListeners() {
    console.log("\n👂 Starting Event Listeners");
    console.log("============================");
    
    // Listen for BridgeDeposit events on each network
    for (const [networkName, network] of Object.entries(NETWORKS)) {
      console.log(`\n🔍 Listening for BridgeDeposit events on ${network.name}...`);
      
      this.bridges[networkName].on("BridgeDeposit", async (requestId, sender, recipient, token, amount, targetChainId, nonce, timestamp) => {
        console.log(`\n📥 New BridgeDeposit event on ${network.name}!`);
        console.log(`   Request ID: ${requestId}`);
        console.log(`   From: ${sender}`);
        console.log(`   To: ${recipient}`);
        console.log(`   Token: ${token}`);
        console.log(`   Amount: ${amount.toString()}`);
        console.log(`   Target Chain ID: ${targetChainId}`);
        console.log(`   Nonce: ${nonce}`);
        
        // Process the bridge request
        await this.processBridgeRequest(networkName, requestId, sender, recipient, token, amount, targetChainId, nonce);
      });
    }
    
    console.log("\n✅ All event listeners started successfully!");
    console.log("⏳ Waiting for bridge deposit events...");
    console.log("💡 Press Ctrl+C to stop the relayer");
  }
  
  async processBridgeRequest(sourceNetworkName, requestId, sender, recipient, token, amount, targetChainId, nonce) {
    console.log(`\n🔄 Processing bridge request from ${sourceNetworkName} to chain ${targetChainId}...`);
    
    try {
      // Find the target network
      const targetNetworkName = Object.keys(NETWORKS).find(name => 
        NETWORKS[name].chainId === Number(targetChainId)
      );
      
      if (!targetNetworkName) {
        console.log(`❌ Target network with chain ID ${targetChainId} not found`);
        console.log(`Available networks:`, Object.entries(NETWORKS).map(([name, net]) => `${name}: ${net.chainId}`));
        return;
      }
      
      console.log(`🎯 Target network: ${targetNetworkName}`);
      
      // Get bridge request details
      const request = await this.bridges[sourceNetworkName].getBridgeRequest(requestId);
      console.log(`📋 Request details:`, request);
      
      // Check if already processed
      if (request.processed) {
        console.log(`✅ Request ${requestId} already processed`);
        return;
      }
      
      // Create proof (simplified for MVP)
      const proof = ethers.toUtf8Bytes("proof"); // In production, this would be a merkle proof
      
      // Execute withdrawal on target network
      console.log(`🌉 Executing withdrawal on ${targetNetworkName}...`);
      
      const withdrawTx = await this.bridges[targetNetworkName].withdraw(
        token,
        recipient,
        amount,
        requestId,
        proof
      );
      
      console.log(`⏳ Waiting for withdrawal transaction...`);
      const receipt = await withdrawTx.wait();
      
      console.log(`✅ Withdrawal successful on ${targetNetworkName}!`);
      console.log(`   Transaction: ${withdrawTx.hash}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.log(`❌ Error processing bridge request: ${error.message}`);
    }
  }
  
  async stop() {
    this.isRunning = false;
    console.log("\n🛑 Stopping Bridge Relayer...");
    
    // Remove event listeners
    Object.values(this.bridges).forEach(bridge => {
      bridge.removeAllListeners();
    });
    
    console.log("✅ Relayer stopped");
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (relayer) {
    await relayer.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (relayer) {
    await relayer.stop();
  }
  process.exit(0);
});

// Start the relayer
const relayer = new BridgeRelayer();
relayer.start().catch(console.error); 