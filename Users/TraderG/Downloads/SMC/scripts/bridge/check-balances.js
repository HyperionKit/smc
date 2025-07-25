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
    "function decimals() external view returns (uint8)"
];

async function checkBalances() {
    console.log("💰 Checking Balances on All Networks");
    console.log("====================================");

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

        // Check if wrapped token exists on Metis Sepolia
        const metisSepoliaTokenFactory = new ethers.Contract(
            DEPLOYED_ADDRESSES.metisSepolia.tokenFactory,
            ["function getWrappedToken(address originalToken) external view returns (address)"],
            metisSepoliaWallet
        );

        try {
            const wrappedTokenAddress = await metisSepoliaTokenFactory.getWrappedToken(WMETIS_ADDRESS);
            if (wrappedTokenAddress !== ethers.ZeroAddress) {
                console.log(`  ✅ Wrapped token found: ${wrappedTokenAddress}`);
                
                const wrappedToken = new ethers.Contract(wrappedTokenAddress, ERC20_ABI, metisSepoliaWallet);
                const wrappedBalance = await wrappedToken.balanceOf(metisSepoliaWallet.address);
                const wrappedSymbol = await wrappedToken.symbol();
                const wrappedDecimals = await wrappedToken.decimals();
                
                console.log(`  ${wrappedSymbol} Balance: ${ethers.formatUnits(wrappedBalance, wrappedDecimals)} ${wrappedSymbol}`);
            } else {
                console.log(`  ⚠️  No wrapped token found for tMetis on Metis Sepolia`);
            }
        } catch (error) {
            console.log(`  ❌ Error checking wrapped token: ${error.message}`);
        }

        // Summary
        console.log("\n📋 Summary");
        console.log("----------");
        if (wMetisBalance > 0) {
            console.log(`✅ You have ${ethers.formatUnits(wMetisBalance, wMetisDecimals)} ${wMetisSymbol} on Hyperion`);
            console.log(`💡 You can bridge these tokens to Metis Sepolia`);
        } else {
            console.log(`❌ No ${wMetisSymbol} tokens found on Hyperion`);
            console.log(`💡 You need to get some ${wMetisSymbol} tokens first`);
        }

        if (hyperionBalance > ethers.parseEther("0.01")) {
            console.log(`✅ Sufficient ETH on Hyperion for gas fees`);
        } else {
            console.log(`❌ Low ETH balance on Hyperion for gas fees`);
        }

        if (metisSepoliaBalance > ethers.parseEther("0.01")) {
            console.log(`✅ Sufficient ETH on Metis Sepolia for gas fees`);
        } else {
            console.log(`❌ Low ETH balance on Metis Sepolia for gas fees`);
        }

    } catch (error) {
        console.error(`❌ Error checking balances: ${error.message}`);
    }
}

// Run the check
checkBalances().catch(console.error); 