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

// Available tokens on Hyperion
const HYPERION_TOKENS = [
    {
        name: "Metis",
        abbr: "METIS",
        address: "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301",
        decimals: 18
    },
    {
        name: "Tether USD",
        abbr: "USDT",
        address: "0x3c099E287eC71b4AA61A7110287D715389329237",
        decimals: 6
    },
    {
        name: "Dai",
        abbr: "DAI",
        address: "0xc4c33c42684ad16e84800c25d5dE7B650E9F95Ca",
        decimals: 18
    },
    {
        name: "Wrapped Ethereum",
        abbr: "WETH",
        address: "0x9AB236Ec38492099a4d35552e6dC7D9442607f9A",
        decimals: 18
    },
    {
        name: "Wrapped Bitcoin",
        abbr: "WBTC",
        address: "0x63d940F5b04235aba7E921a3b508aB1360D32706",
        decimals: 8
    }
];

// Bridge ABI (extended for admin functions)
const BRIDGE_ABI = [
    "event BridgeDeposit(bytes32 indexed requestId, address indexed sender, address indexed recipient, address token, uint256 amount, uint256 targetChainId, uint256 nonce, uint256 timestamp)",
    "event BridgeWithdraw(bytes32 indexed requestId, address indexed recipient, uint256 amount, bytes32 depositTxHash, uint256 timestamp)",
    "function deposit(address recipient, address token, uint256 amount, uint256 targetChainId) external",
    "function withdraw(address recipient, uint256 amount, bytes32 depositTxHash, bytes calldata proof) external",
    "function getSupportedToken(address token) external view returns (bool, uint256, uint256, uint256, uint256)",
    "function chainNonces(uint256) external view returns (uint256)",
    "function addSupportedToken(address token, uint256 minAmount, uint256 maxAmount, uint256 dailyLimit) external",
    "function updateSupportedToken(address token, uint256 minAmount, uint256 maxAmount, uint256 dailyLimit) external",
    "function removeSupportedToken(address token) external",
    "function hasRole(bytes32 role, address account) external view returns (bool)",
    "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)",
    "function OPERATOR_ROLE() external view returns (bytes32)"
];

// ERC20 ABI (simplified)
const ERC20_ABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function name() external view returns (string memory)",
    "function symbol() external view returns (string memory)",
    "function decimals() external view returns (uint8)"
];

async function checkBridgeConfiguration() {
    console.log("🔍 Checking Bridge Configuration");
    console.log("================================");

    const privateKey = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
    
    // Initialize provider and wallet
    const hyperionProvider = new ethers.JsonRpcProvider(DEPLOYED_ADDRESSES.hyperion.rpcUrl);
    const hyperionWallet = new ethers.Wallet(privateKey, hyperionProvider);

    console.log(`👤 Wallet Address: ${hyperionWallet.address}`);
    console.log(`🌐 Network: Hyperion (Chain ID: ${DEPLOYED_ADDRESSES.hyperion.chainId})`);
    console.log(`🌉 Bridge Contract: ${DEPLOYED_ADDRESSES.hyperion.bridge}`);

    try {
        const bridge = new ethers.Contract(DEPLOYED_ADDRESSES.hyperion.bridge, BRIDGE_ABI, hyperionWallet);

        // Check if wallet has admin/operator role
        console.log("\n🔐 Checking Wallet Permissions...");
        try {
            const hasAdminRole = await bridge.hasRole(await bridge.DEFAULT_ADMIN_ROLE(), hyperionWallet.address);
            const hasOperatorRole = await bridge.hasRole(await bridge.OPERATOR_ROLE(), hyperionWallet.address);
            
            console.log(`  Admin Role: ${hasAdminRole ? "✅ Yes" : "❌ No"}`);
            console.log(`  Operator Role: ${hasOperatorRole ? "✅ Yes" : "❌ No"}`);
            
            if (!hasAdminRole && !hasOperatorRole) {
                console.log("  ⚠️  Wallet doesn't have admin or operator permissions");
                console.log("  💡 You may need to contact the bridge administrator to add tokens");
            }
        } catch (error) {
            console.log(`  ❌ Error checking roles: ${error.message}`);
        }

        // Check each token's bridge support
        console.log("\n🎯 Checking Token Bridge Support");
        console.log("================================");

        for (const token of HYPERION_TOKENS) {
            try {
                console.log(`\n📋 ${token.name} (${token.abbr})`);
                console.log(`  Contract: ${token.address}`);
                
                const [isSupported, minAmount, maxAmount, dailyLimit, dailyUsed] = await bridge.getSupportedToken(token.address);
                
                console.log(`  Supported: ${isSupported ? "✅ Yes" : "❌ No"}`);
                
                if (isSupported) {
                    console.log(`  Min Amount: ${ethers.formatUnits(minAmount, token.decimals)} ${token.abbr}`);
                    console.log(`  Max Amount: ${ethers.formatUnits(maxAmount, token.decimals)} ${token.abbr}`);
                    console.log(`  Daily Limit: ${ethers.formatUnits(dailyLimit, token.decimals)} ${token.abbr}`);
                    console.log(`  Daily Used: ${ethers.formatUnits(dailyUsed, token.decimals)} ${token.abbr}`);
                } else {
                    console.log(`  ⚠️  Not supported - needs to be added to bridge`);
                }

                // Check token balance
                const tokenContract = new ethers.Contract(token.address, ERC20_ABI, hyperionWallet);
                const balance = await tokenContract.balanceOf(hyperionWallet.address);
                const symbol = await tokenContract.symbol();
                
                console.log(`  Your Balance: ${ethers.formatUnits(balance, token.decimals)} ${symbol}`);

            } catch (error) {
                console.log(`  ❌ Error checking ${token.abbr}: ${error.message}`);
            }
        }

        // Show summary
        console.log("\n📊 Summary");
        console.log("===========");
        
        const supportedTokens = [];
        const unsupportedTokens = [];
        
        for (const token of HYPERION_TOKENS) {
            try {
                const [isSupported] = await bridge.getSupportedToken(token.address);
                if (isSupported) {
                    supportedTokens.push(token.abbr);
                } else {
                    unsupportedTokens.push(token.abbr);
                }
            } catch (error) {
                unsupportedTokens.push(token.abbr);
            }
        }

        if (supportedTokens.length > 0) {
            console.log(`✅ Supported tokens: ${supportedTokens.join(", ")}`);
        }
        
        if (unsupportedTokens.length > 0) {
            console.log(`❌ Unsupported tokens: ${unsupportedTokens.join(", ")}`);
            console.log(`💡 These tokens need to be added to the bridge configuration`);
        }

        if (unsupportedTokens.includes("USDT")) {
            console.log(`\n🚨 USDT is not supported on the bridge!`);
            console.log(`💡 You need to add USDT as a supported token to bridge it`);
            console.log(`🔧 Contact the bridge administrator or use admin functions to add USDT`);
        }

    } catch (error) {
        console.error(`❌ Error checking bridge configuration: ${error.message}`);
    }
}

async function addTokenToBridge(tokenAddress, tokenName) {
    console.log(`\n🔧 Adding ${tokenName} to Bridge Support`);
    console.log("=====================================");

    const privateKey = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
    const hyperionProvider = new ethers.JsonRpcProvider(DEPLOYED_ADDRESSES.hyperion.rpcUrl);
    const hyperionWallet = new ethers.Wallet(privateKey, hyperionProvider);

    try {
        const bridge = new ethers.Contract(DEPLOYED_ADDRESSES.hyperion.bridge, BRIDGE_ABI, hyperionWallet);

        // Check permissions
        const hasAdminRole = await bridge.hasRole(await bridge.DEFAULT_ADMIN_ROLE(), hyperionWallet.address);
        const hasOperatorRole = await bridge.hasRole(await bridge.OPERATOR_ROLE(), hyperionWallet.address);

        if (!hasAdminRole && !hasOperatorRole) {
            console.log("❌ You don't have permission to add tokens to the bridge");
            console.log("💡 Contact the bridge administrator");
            return false;
        }

        // Get token info
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, hyperionWallet);
        const decimals = await tokenContract.decimals();
        const symbol = await tokenContract.symbol();

        // Set reasonable limits based on token decimals
        const minAmount = ethers.parseUnits("0.001", decimals);
        const maxAmount = ethers.parseUnits("1000000", decimals); // 1M tokens
        const dailyLimit = ethers.parseUnits("10000000", decimals); // 10M tokens

        console.log(`  Token: ${symbol} (${tokenName})`);
        console.log(`  Address: ${tokenAddress}`);
        console.log(`  Min Amount: ${ethers.formatUnits(minAmount, decimals)} ${symbol}`);
        console.log(`  Max Amount: ${ethers.formatUnits(maxAmount, decimals)} ${symbol}`);
        console.log(`  Daily Limit: ${ethers.formatUnits(dailyLimit, decimals)} ${symbol}`);

        // Add token to bridge
        console.log(`\n⏳ Adding ${symbol} to bridge support...`);
        const tx = await bridge.addSupportedToken(tokenAddress, minAmount, maxAmount, dailyLimit);
        
        console.log(`  ⏳ Waiting for transaction...`);
        await tx.wait();
        
        console.log(`  ✅ ${symbol} added to bridge support!`);
        console.log(`  📋 Transaction: ${tx.hash}`);
        
        return true;

    } catch (error) {
        console.error(`❌ Error adding token to bridge: ${error.message}`);
        return false;
    }
}

async function main() {
    try {
        // Check current bridge configuration
        await checkBridgeConfiguration();

        // Ask if user wants to add USDT
        console.log(`\n🤔 Would you like to add USDT to the bridge? (y/N): `);
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise((resolve) => {
            rl.question("", (answer) => {
                resolve(answer);
            });
        });

        rl.close();

        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            const usdtAddress = "0x3c099E287eC71b4AA61A7110287D715389329237";
            await addTokenToBridge(usdtAddress, "Tether USD");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

// Run the script
main().catch(console.error); 