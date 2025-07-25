const { ethers } = require("ethers");
require("dotenv").config();

// Deployed contract addresses
const DEPLOYED_ADDRESSES = {
    hyperion: {
        chainId: 133717,
        rpcUrl: "https://hyperion-testnet.metisdevops.link",
        bridge: "0x46763b48BaF9Ee38C668Bb5a6B1705C70f527B85",
        tokenFactory: "0x49e05033c3E2d1E349c7b6aD1041415D4a89C05E"
    },
    metisSepolia: {
        chainId: 59902,
        rpcUrl: "https://metis-sepolia-rpc.publicnode.com",
        bridge: "0xBA0A3a630A4acCa6500BA4e21aF37F7EE4b45e19",
        tokenFactory: "0x02539fE138dFf6267521738f7654b0191De61c63"
    }
};

// WMETIS token address on Hyperion
const WMETIS_ADDRESS = "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301";

// ERC20 ABI (simplified)
const ERC20_ABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function name() external view returns (string memory)",
    "function symbol() external view returns (string memory)",
    "function decimals() external view returns (uint8)",
    "function faucet() external",
    "function mint(address to, uint256 amount) external"
];

async function checkBalances() {
    console.log("💰 Checking Current Balances");
    console.log("============================");

    const privateKey = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
    
    // Initialize providers and wallets
    const hyperionProvider = new ethers.JsonRpcProvider(DEPLOYED_ADDRESSES.hyperion.rpcUrl);
    const metisSepoliaProvider = new ethers.JsonRpcProvider(DEPLOYED_ADDRESSES.metisSepolia.rpcUrl);
    
    const hyperionWallet = new ethers.Wallet(privateKey, hyperionProvider);
    const metisSepoliaWallet = new ethers.Wallet(privateKey, metisSepoliaProvider);

    console.log(`👤 Wallet Address: ${hyperionWallet.address}`);

    try {
        // Check Hyperion balances
        console.log("\n🌐 Hyperion Network (Chain ID: 133717)");
        console.log("----------------------------------------");
        
        const hyperionBalance = await hyperionProvider.getBalance(hyperionWallet.address);
        console.log(`  ETH Balance: ${ethers.formatEther(hyperionBalance)} ETH`);

        const wMetisContract = new ethers.Contract(WMETIS_ADDRESS, ERC20_ABI, hyperionWallet);
        const wMetisBalance = await wMetisContract.balanceOf(hyperionWallet.address);
        const wMetisName = await wMetisContract.name();
        const wMetisSymbol = await wMetisContract.symbol();
        const wMetisDecimals = await wMetisContract.decimals();
        
        console.log(`  ${wMetisSymbol} Balance: ${ethers.formatUnits(wMetisBalance, wMetisDecimals)} ${wMetisSymbol}`);

        // Check Metis Sepolia balances
        console.log("\n🌐 Metis Sepolia Network (Chain ID: 59902)");
        console.log("--------------------------------------------");
        
        const metisSepoliaBalance = await metisSepoliaProvider.getBalance(metisSepoliaWallet.address);
        console.log(`  ETH Balance: ${ethers.formatEther(metisSepoliaBalance)} ETH`);

        return {
            hyperionWallet,
            wMetisContract,
            wMetisBalance,
            wMetisSymbol,
            wMetisDecimals,
            hyperionBalance,
            metisSepoliaBalance
        };

    } catch (error) {
        console.error(`❌ Error checking balances: ${error.message}`);
        return null;
    }
}

async function tryFaucet(wMetisContract, wMetisSymbol) {
    console.log(`\n🚰 Trying to get ${wMetisSymbol} from faucet...`);
    
    try {
        // Check if faucet function exists
        const faucetTx = await wMetisContract.faucet();
        console.log(`  ⏳ Waiting for faucet transaction...`);
        await faucetTx.wait();
        console.log(`  ✅ Faucet transaction confirmed: ${faucetTx.hash}`);
        return true;
    } catch (error) {
        console.log(`  ❌ Faucet not available or failed: ${error.message}`);
        return false;
    }
}

async function showInstructions() {
    console.log("\n📋 How to Get Test Tokens for Bridge Testing");
    console.log("=============================================");
    
    console.log("\n🌐 Hyperion Network:");
    console.log("  1. Visit Hyperion Testnet Faucet:");
    console.log("     🔗 https://hyperion-testnet.metisdevops.link/");
    console.log("  2. Connect your wallet");
    console.log("  3. Request test ETH and WMETIS tokens");
    console.log("  4. Wait for tokens to arrive in your wallet");
    
    console.log("\n🌐 Metis Sepolia Network:");
    console.log("  1. Visit Metis Sepolia Faucet:");
    console.log("     🔗 https://sepoliafaucet.com/");
    console.log("  2. Enter your wallet address");
    console.log("  3. Request test ETH");
    console.log("  4. Wait for tokens to arrive");
    
    console.log("\n💡 Alternative Methods:");
    console.log("  • Check if the WMETIS contract has a faucet function");
    console.log("  • Ask in the Metis Discord/Telegram for test tokens");
    console.log("  • Use a testnet faucet aggregator");
    
    console.log("\n🔧 Manual Token Transfer:");
    console.log("  If you have tokens on another wallet, you can transfer them manually");
    console.log("  to your current wallet address for testing.");
}

async function main() {
    try {
        // Check current balances
        const balanceData = await checkBalances();
        if (!balanceData) {
            console.log("❌ Failed to check balances");
            return;
        }

        const { wMetisContract, wMetisBalance, wMetisSymbol } = balanceData;

        // If no WMETIS tokens, try faucet first
        if (wMetisBalance === 0n) {
            console.log(`\n❌ No ${wMetisSymbol} tokens found on Hyperion`);
            
            // Try faucet
            const faucetSuccess = await tryFaucet(wMetisContract, wMetisSymbol);
            
            if (!faucetSuccess) {
                // Show instructions if faucet fails
                await showInstructions();
            } else {
                // Check balance again after faucet
                console.log(`\n📊 Checking balance after faucet...`);
                const newBalance = await wMetisContract.balanceOf(balanceData.hyperionWallet.address);
                console.log(`  New ${wMetisSymbol} Balance: ${ethers.formatUnits(newBalance, balanceData.wMetisDecimals)} ${wMetisSymbol}`);
                
                if (newBalance > 0n) {
                    console.log(`\n✅ Successfully received ${wMetisSymbol} tokens!`);
                    console.log(`💡 You can now run the bridge transfer: node scripts/bridge-transfer-interactive.js`);
                }
            }
        } else {
            console.log(`\n✅ You already have ${ethers.formatUnits(wMetisBalance, balanceData.wMetisDecimals)} ${wMetisSymbol} tokens!`);
            console.log(`💡 You can now run the bridge transfer: node scripts/bridge-transfer-interactive.js`);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

// Run the script
main().catch(console.error); 