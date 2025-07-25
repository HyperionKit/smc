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
    USDT: "0x2a674069ACe9DEeDCCde6643e010879Df93109D7",
    DAI: "0xABA4D433F08441E27aCD0A52503b9e4Ffb339145",
    WETH: "0x95526419b7c0d0A89De72C72b0fde0BBBd2075a0",
    WBTC: "0xa9924388E4B07CC302746578e3D998acF876E007",
    WMETIS: "0xaD519266FeC8D387d716d4605968E3028346b3f7"
  },
  metisSepolia: {
    USDT: "0xa9924388E4B07CC302746578e3D998acF876E007",
    DAI: "0xaD519266FeC8D387d716d4605968E3028346b3f7",
    WETH: "0x51d4D1E96999D1000F3074b194a9590fbf2892fC",
    WBTC: "0x5b97A5DECF36Acf95b0Aff9b02b792B9Cf0b6576",
    WMETIS: "0x805facACF938e5F31C33D11C906f18A26ee82a1A"
  }
};

// ERC20 ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

async function fundBridge() {
  console.log("💰 Funding Bridge Contracts");
  console.log("===========================");

  if (!process.env.PRIVATE_KEY) {
    console.log("❌ PRIVATE_KEY not found in environment variables");
    return;
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  console.log(`👤 Wallet: ${wallet.address}`);

  // Fund Lazchain and Metis Sepolia bridges with USDT
  const networksToFund = ['lazchain', 'metisSepolia'];
  const amountToTransfer = ethers.parseUnits("1000", 6); // 1000 USDT

  for (const networkName of networksToFund) {
    const network = NETWORKS[networkName];
    const usdtAddress = TOKENS[networkName].USDT;

    console.log(`\n🌐 Funding ${network.name} Bridge...`);
    console.log(`   Bridge: ${network.bridge}`);
    console.log(`   USDT: ${usdtAddress}`);
    console.log(`   Amount: ${ethers.formatUnits(amountToTransfer, 6)} USDT`);

    try {
      const provider = new ethers.JsonRpcProvider(network.rpc);
      const walletWithProvider = wallet.connect(provider);
      const usdt = new ethers.Contract(usdtAddress, ERC20_ABI, walletWithProvider);

      // Check wallet balance
      const walletBalance = await usdt.balanceOf(wallet.address);
      console.log(`   Wallet Balance: ${ethers.formatUnits(walletBalance, 6)} USDT`);

      if (walletBalance < amountToTransfer) {
        console.log(`   ❌ Insufficient balance. Need ${ethers.formatUnits(amountToTransfer, 6)} USDT`);
        continue;
      }

      // Transfer USDT to bridge
      console.log(`   ⏳ Transferring USDT to bridge...`);
      const tx = await usdt.transfer(network.bridge, amountToTransfer);
      await tx.wait();

      console.log(`   ✅ Transfer successful!`);
      console.log(`   Transaction: ${tx.hash}`);

      // Check bridge balance after transfer
      const bridgeBalance = await usdt.balanceOf(network.bridge);
      console.log(`   Bridge Balance: ${ethers.formatUnits(bridgeBalance, 6)} USDT`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log(`\n🎉 Bridge funding completed!`);
  console.log(`💡 Bridges now have USDT to process withdrawals`);
}

fundBridge().catch(console.error); 