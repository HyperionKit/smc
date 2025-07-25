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

async function processPendingRequest() {
  console.log("🔄 Processing Pending Bridge Request");
  console.log("====================================");

  if (!process.env.PRIVATE_KEY) {
    console.log("❌ PRIVATE_KEY not found in environment variables");
    return;
  }

  // The request details from the event we saw earlier
  const requestId = "0xc29842090949dac6758e0537d23233556a9ce79be88e7db3b1c077c05df72a9b";
  const sender = "0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff";
  const recipient = "0xa43B752B6E941263eb5A7E3b96e2e0DEA1a586Ff";
  const sourceToken = "0x3c099E287eC71b4AA61A7110287D715389329237"; // USDT on Hyperion
  const targetToken = "0x2a674069ACe9DEeDCCde6643e010879Df93109D7"; // USDT on Lazchain
  const amount = "134729988"; // 134.729988 USDT (6 decimals)
  const targetChainId = 133718; // Lazchain
  const nonce = 1;

  console.log(`📋 Request Details:`);
  console.log(`   Request ID: ${requestId}`);
  console.log(`   From: ${sender}`);
  console.log(`   To: ${recipient}`);
  console.log(`   Source Token: ${sourceToken}`);
  console.log(`   Target Token: ${targetToken}`);
  console.log(`   Amount: ${amount}`);
  console.log(`   Target Chain ID: ${targetChainId}`);
  console.log(`   Nonce: ${nonce}`);

  try {
    // Setup providers and wallets
    const sourceNetwork = NETWORKS.hyperion;
    const targetNetwork = NETWORKS.lazchain;

    const sourceProvider = new ethers.JsonRpcProvider(sourceNetwork.rpc);
    const targetProvider = new ethers.JsonRpcProvider(targetNetwork.rpc);
    
    const sourceWallet = new ethers.Wallet(process.env.PRIVATE_KEY, sourceProvider);
    const targetWallet = new ethers.Wallet(process.env.PRIVATE_KEY, targetProvider);
    
    const sourceBridge = new ethers.Contract(sourceNetwork.bridge, BRIDGE_ABI, sourceWallet);
    const targetBridge = new ethers.Contract(targetNetwork.bridge, BRIDGE_ABI, targetWallet);

    console.log(`\n🔍 Checking request status on ${sourceNetwork.name}...`);
    
    // Get bridge request details
    const request = await sourceBridge.getBridgeRequest(requestId);
    console.log(`📋 Request details:`, request);
    
    // Check if already processed
    if (request.processed) {
      console.log(`✅ Request ${requestId} already processed`);
      return;
    }

    console.log(`\n🎯 Target network: ${targetNetwork.name} (Chain ID: ${targetNetwork.chainId})`);
    
    // Create proof (simplified for MVP)
    const proof = ethers.toUtf8Bytes("proof"); // In production, this would be a merkle proof
    
    // Execute withdrawal on target network
    console.log(`🌉 Executing withdrawal on ${targetNetwork.name}...`);
    console.log(`   Using target token: ${targetToken}`);
    
    const withdrawTx = await targetBridge.withdraw(
      targetToken,
      recipient,
      amount,
      requestId,
      proof
    );
    
    console.log(`⏳ Waiting for withdrawal transaction...`);
    const receipt = await withdrawTx.wait();
    
    console.log(`✅ Withdrawal successful on ${targetNetwork.name}!`);
    console.log(`   Transaction: ${withdrawTx.hash}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    
    console.log(`\n🎉 Bridge transfer completed successfully!`);
    console.log(`   From: ${sourceNetwork.name} → To: ${targetNetwork.name}`);
    console.log(`   Amount: 134.729988 USDT`);
    console.log(`   Recipient: ${recipient}`);

  } catch (error) {
    console.log(`❌ Error processing bridge request: ${error.message}`);
    console.log(`\n🔍 Error details:`, error);
  }
}

processPendingRequest().catch(console.error); 