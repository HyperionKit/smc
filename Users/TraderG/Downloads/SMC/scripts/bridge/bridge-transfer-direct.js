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
    USDT: "0x3c099E287eC71b4AA61A7110287D715389329237",
    DAI: "0xc4c33c42684ad16e84800c25d5dE7B650E9F95Ca",
    WETH: "0x9AB236Ec38492099a4d35552e6dC7D9442607f9A", 
    WBTC: "0x63d940F5b04235aba7E921a3b508aB1360D32706",
    WMETIS: "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301"
  },
  metisSepolia: {
    USDT: "0x3c099E287eC71b4AA61A7110287D715389329237",
    DAI: "0xc4c33c42684ad16e84800c25d5dE7B650E9F95Ca",
    WETH: "0x9AB236Ec38492099a4d35552e6dC7D9442607f9A",
    WBTC: "0x63d940F5b04235aba7E921a3b508aB1360D32706", 
    WMETIS: "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301"
  }
};

const BRIDGE_ABI = [
  "function deposit(address token, address recipient, uint256 amount, uint256 targetChainId) external",
  "function getTokenConfig(address token) external view returns (bool isSupported, uint256 minAmount, uint256 maxAmount, uint256 dailyLimit, uint256 dailyUsed, uint256 lastResetTime)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

async function findTokenWithBalance(provider, wallet, tokens) {
  console.log("🔍 Checking token balances...");
  
  for (const [tokenName, tokenAddress] of Object.entries(tokens)) {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
      const balance = await token.balanceOf(wallet.address);
      const decimals = await token.decimals();
      const symbol = await token.symbol();
      const balanceFormatted = ethers.formatUnits(balance, decimals);
      
      console.log(`  ${tokenName}: ${balanceFormatted} ${symbol}`);
      
      if (balance > 0n) {
        return { tokenName, tokenAddress, token, balance, decimals, symbol };
      }
    } catch (error) {
      console.log(`  ${tokenName}: Error checking balance - ${error.message}`);
    }
  }
  
  return null;
}

async function bridgeTransfer() {
  console.log("🌉 Bridge Transfer Script");
  console.log("========================\n");
  
  // Select source network
  console.log("Available source networks:");
  Object.entries(NETWORKS).forEach(([key, network], index) => {
    console.log(`${index + 1}. ${network.name} (Chain ID: ${network.chainId})`);
  });
  
  const sourceNetworkKey = Object.keys(NETWORKS)[0]; // Default to Hyperion
  const sourceNetwork = NETWORKS[sourceNetworkKey];
  console.log(`\n📍 Using source network: ${sourceNetwork.name} (Chain ID: ${sourceNetwork.chainId})`);
  
  // Select destination network
  console.log("\nAvailable destination networks:");
  Object.entries(NETWORKS).forEach(([key, network], index) => {
    if (key !== sourceNetworkKey) {
      console.log(`${index + 1}. ${network.name} (Chain ID: ${network.chainId})`);
    }
  });
  
  const destNetworkKey = Object.keys(NETWORKS)[1]; // Default to Lazchain
  const destNetwork = NETWORKS[destNetworkKey];
  console.log(`\n🎯 Using destination network: ${destNetwork.name} (Chain ID: ${destNetwork.chainId})`);
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(sourceNetwork.rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`\n👤 Wallet: ${wallet.address}`);
  
  // Find a token with balance
  const tokenWithBalance = await findTokenWithBalance(provider, wallet, TOKENS[sourceNetworkKey]);
  
  if (!tokenWithBalance) {
    console.log("\n❌ No tokens with balance found. Please get some test tokens first.");
    console.log("💡 You can:");
    console.log("   1. Visit the Hyperion faucet: https://hyperion-testnet.metisdevops.link/");
    console.log("   2. Ask for test tokens in the Metis Discord/Telegram");
    console.log("   3. Transfer tokens from another wallet");
    return;
  }
  
  const { tokenName, tokenAddress, token, balance, decimals, symbol } = tokenWithBalance;
  console.log(`\n💰 Selected token: ${tokenName} (${tokenAddress})`);
  console.log(`💳 Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
  
  // Setup bridge contract
  const bridge = new ethers.Contract(sourceNetwork.bridge, BRIDGE_ABI, wallet);
  
  // Check bridge configuration
  console.log("\n🔍 Checking bridge configuration...");
  const tokenConfig = await bridge.getTokenConfig(tokenAddress);
  
  if (!tokenConfig[0]) { // isSupported
    console.log("❌ Token is not supported on the bridge");
    return;
  }
  
  const minAmount = tokenConfig[1];
  const maxAmount = tokenConfig[2];
  const dailyLimit = tokenConfig[3];
  
  console.log(`✅ Token is supported`);
  console.log(`   Min amount: ${ethers.formatUnits(minAmount, decimals)} ${symbol}`);
  console.log(`   Max amount: ${ethers.formatUnits(maxAmount, decimals)} ${symbol}`);
  console.log(`   Daily limit: ${ethers.formatUnits(dailyLimit, decimals)} ${symbol}`);
  
  // Calculate transfer amount (use 10% of balance or min amount, whichever is higher)
  const tenPercent = balance * 10n / 100n;
  const transferAmount = tenPercent > minAmount ? tenPercent : minAmount;
  
  // Ensure we don't exceed max amount
  const finalAmount = transferAmount > maxAmount ? maxAmount : transferAmount;
  const finalAmountFormatted = ethers.formatUnits(finalAmount, decimals);
  
  console.log(`\n📤 Transfer amount: ${finalAmountFormatted} ${symbol}`);
  
  // Check allowance
  const allowance = await token.allowance(wallet.address, sourceNetwork.bridge);
  console.log(`\n🔐 Current allowance: ${ethers.formatUnits(allowance, decimals)} ${symbol}`);
  
  if (allowance < finalAmount) {
    console.log("⏳ Approving tokens...");
    const approveTx = await token.approve(sourceNetwork.bridge, finalAmount);
    console.log(`   Approval tx: ${approveTx.hash}`);
    await approveTx.wait();
    console.log("✅ Approval confirmed");
  } else {
    console.log("✅ Sufficient allowance already exists");
  }
  
  // Execute bridge transfer
  console.log("\n🌉 Executing bridge transfer...");
  try {
    const bridgeTx = await bridge.deposit(
      tokenAddress,
      wallet.address, // recipient (same as sender for testing)
      finalAmount,
      destNetwork.chainId
    );
    
    console.log(`   Bridge tx: ${bridgeTx.hash}`);
    const receipt = await bridgeTx.wait();
    console.log("✅ Bridge transfer successful!");
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    
    // Get the request ID from the event
    const bridgeDepositEvent = receipt.logs.find(log => {
      try {
        const parsed = bridge.interface.parseLog(log);
        return parsed.name === "BridgeDeposit";
      } catch {
        return false;
      }
    });
    
    if (bridgeDepositEvent) {
      const parsed = bridge.interface.parseLog(bridgeDepositEvent);
      const requestId = parsed.args[0];
      console.log(`   Request ID: ${requestId}`);
    }
    
  } catch (error) {
    console.log(`❌ Bridge transfer failed: ${error.message}`);
  }
}

bridgeTransfer().catch(console.error); 