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

// ERC20 ABI for balance checking
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

async function checkBridgeBalances() {
  console.log("💰 Checking Bridge Contract Balances");
  console.log("====================================");

  for (const [networkName, network] of Object.entries(NETWORKS)) {
    console.log(`\n🌐 ${network.name} (Chain ID: ${network.chainId})`);
    console.log("=".repeat(50));
    console.log(`Bridge Address: ${network.bridge}`);

    try {
      const provider = new ethers.JsonRpcProvider(network.rpc);
      const tokens = TOKENS[networkName];

      // Check ETH balance
      const ethBalance = await provider.getBalance(network.bridge);
      console.log(`\n💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

      // Check token balances
      for (const [tokenName, tokenAddress] of Object.entries(tokens)) {
        try {
          const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const balance = await token.balanceOf(network.bridge);
          const name = await token.name();
          const symbol = await token.symbol();
          const decimals = await token.decimals();
          
          const formattedBalance = ethers.formatUnits(balance, decimals);
          console.log(`   ${tokenName} (${symbol}): ${formattedBalance} ${symbol}`);
          
        } catch (error) {
          console.log(`   ${tokenName}: ❌ Error - ${error.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ Error connecting to ${network.name}: ${error.message}`);
    }
  }
}

checkBridgeBalances().catch(console.error); 