const { ethers } = require("ethers");
const readline = require('readline');
require("dotenv").config();

// Deployed contract addresses
const DEPLOYED_ADDRESSES = {
    hyperion: {
        chainId: 133717,
        rpcUrl: "https://hyperion-testnet.metisdevops.link",
        bridge: "0x46763b48BaF9Ee38C668Bb5a6B1705C70f527B85",
        relayer: "0xE871c1249164e3B33464a2d3aB0c2A50c8c2e345",
        tokenFactory: "0x49e05033c3E2d1E349c7b6aD1041415D4a89C05E",
        messageSender: "0xEc8A58a973ce189434A055d8FCdF07c7720B3ACe",
        messageReceiver: "0x93cD4820d296aD81e87cB4c53Cf0B33E62b26Fa3"
    },
    metisSepolia: {
        chainId: 59902,
        rpcUrl: "https://metis-sepolia-rpc.publicnode.com",
        bridge: "0xBA0A3a630A4acCa6500BA4e21aF37F7EE4b45e19",
        relayer: "0x49311953523c494015007BAE2883C84e120f0007",
        tokenFactory: "0x02539fE138dFf6267521738f7654b0191De61c63",
        messageSender: "0x09eACBBE9D6a0EEeC459b743F8DF4B9350136B26",
        messageReceiver: "0x3395FBA7A74590d9B385a276e2E4Ec2cBF2946D1"
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

// Bridge ABI
const BRIDGE_ABI = [
    "event BridgeDeposit(bytes32 indexed requestId, address indexed sender, address indexed recipient, address token, uint256 amount, uint256 targetChainId, uint256 nonce, uint256 timestamp)",
    "event BridgeWithdraw(bytes32 indexed requestId, address indexed recipient, uint256 amount, bytes32 depositTxHash, uint256 timestamp)",
    "function deposit(address recipient, address token, uint256 amount, uint256 targetChainId) external",
    "function withdraw(address recipient, uint256 amount, bytes32 depositTxHash, bytes calldata proof) external",
    "function getSupportedToken(address token) external view returns (bool, uint256, uint256, uint256, uint256)",
    "function chainNonces(uint256) external view returns (uint256)"
];

// ERC20 ABI (simplified)
const ERC20_ABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function name() external view returns (string memory)",
    "function symbol() external view returns (string memory)",
    "function decimals() external view returns (uint8)"
];

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to ask user for input
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function checkAllBalances() {
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

        // Check all token balances
        const tokenBalances = [];
        for (const token of HYPERION_TOKENS) {
            try {
                const tokenContract = new ethers.Contract(token.address, ERC20_ABI, hyperionWallet);
                const balance = await tokenContract.balanceOf(hyperionWallet.address);
                const name = await tokenContract.name();
                const symbol = await tokenContract.symbol();
                const decimals = await tokenContract.decimals();
                
                console.log(`  ${symbol} Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
                
                tokenBalances.push({
                    ...token,
                    contract: tokenContract,
                    balance,
                    name,
                    symbol,
                    decimals
                });
            } catch (error) {
                console.log(`  ❌ Error checking ${token.abbr}: ${error.message}`);
            }
        }

        // Check Metis Sepolia balances
        console.log("\n🌐 Metis Sepolia Network (Chain ID: 59902)");
        console.log("--------------------------------------------");
        
        const metisSepoliaBalance = await metisSepoliaProvider.getBalance(metisSepoliaWallet.address);
        console.log(`  ETH Balance: ${ethers.formatEther(metisSepoliaBalance)} ETH`);

        return {
            hyperionWallet,
            metisSepoliaWallet,
            tokenBalances,
            hyperionBalance,
            metisSepoliaBalance
        };

    } catch (error) {
        console.error(`❌ Error checking balances: ${error.message}`);
        return null;
    }
}

async function selectToken(tokenBalances) {
    console.log("\n🎯 Select Token to Bridge");
    console.log("=========================");
    
    // Filter tokens with non-zero balance
    const availableTokens = tokenBalances.filter(t => t.balance > 0n);
    
    if (availableTokens.length === 0) {
        console.log("❌ No tokens with balance found on Hyperion");
        console.log("💡 You need to get some tokens first");
        return null;
    }

    console.log("Available tokens with balance:");
    availableTokens.forEach((token, index) => {
        const balance = ethers.formatUnits(token.balance, token.decimals);
        console.log(`  ${index + 1}. ${token.symbol} (${token.name}) - ${balance} ${token.symbol}`);
    });

    const selection = await askQuestion(`\nSelect token (1-${availableTokens.length}): `);
    const tokenIndex = parseInt(selection) - 1;
    
    if (tokenIndex < 0 || tokenIndex >= availableTokens.length) {
        console.log("❌ Invalid selection");
        return null;
    }

    return availableTokens[tokenIndex];
}

async function getTransferAmount(selectedToken) {
    const availableBalance = ethers.formatUnits(selectedToken.balance, selectedToken.decimals);
    console.log(`\n📋 Token Details`);
    console.log("----------------");
    console.log(`  Token: ${selectedToken.symbol} (${selectedToken.name})`);
    console.log(`  Available Balance: ${availableBalance} ${selectedToken.symbol}`);
    console.log(`  Contract Address: ${selectedToken.address}`);

    // Ask user for transfer amount
    const amountInput = await askQuestion(`\n🌉 Enter amount of ${selectedToken.symbol} to bridge (min 0.001): `);
    
    // Validate input
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount < 0.001) {
        console.log(`❌ Invalid amount. Minimum is 0.001 ${selectedToken.symbol}`);
        return null;
    }

    const amountWei = ethers.parseUnits(amountInput, selectedToken.decimals);
    if (amountWei > selectedToken.balance) {
        console.log(`❌ Insufficient balance. You have ${availableBalance} ${selectedToken.symbol}, trying to transfer ${amountInput} ${selectedToken.symbol}`);
        return null;
    }

    return amountWei;
}

async function executeBridgeTransfer(hyperionWallet, selectedToken, transferAmount) {
    console.log(`\n🌉 Initiating Bridge Transfer: Hyperion → Metis Sepolia`);
    console.log("==================================================");
    console.log(`  From: Hyperion (${DEPLOYED_ADDRESSES.hyperion.chainId})`);
    console.log(`  To: Metis Sepolia (${DEPLOYED_ADDRESSES.metisSepolia.chainId})`);
    console.log(`  Token: ${selectedToken.symbol} (${selectedToken.name})`);
    console.log(`  Amount: ${ethers.formatUnits(transferAmount, selectedToken.decimals)} ${selectedToken.symbol}`);
    console.log(`  Recipient: ${hyperionWallet.address}`);

    try {
        // 1. Check if token is supported on the bridge
        console.log("\n🔍 Checking bridge configuration...");
        const hyperionBridge = new ethers.Contract(DEPLOYED_ADDRESSES.hyperion.bridge, BRIDGE_ABI, hyperionWallet);
        
        const [isSupported, minAmount, maxAmount, dailyLimit, dailyUsed] = await hyperionBridge.getSupportedToken(selectedToken.address);
        console.log(`  ${selectedToken.symbol} supported: ${isSupported}`);
        
        if (!isSupported) {
            console.log(`❌ ${selectedToken.symbol} is not supported on the bridge`);
            return false;
        }

        if (isSupported) {
            console.log(`  Min amount: ${ethers.formatUnits(minAmount, selectedToken.decimals)} ${selectedToken.symbol}`);
            console.log(`  Max amount: ${ethers.formatUnits(maxAmount, selectedToken.decimals)} ${selectedToken.symbol}`);
            console.log(`  Daily limit: ${ethers.formatUnits(dailyLimit, selectedToken.decimals)} ${selectedToken.symbol}`);
            console.log(`  Daily used: ${ethers.formatUnits(dailyUsed, selectedToken.decimals)} ${selectedToken.symbol}`);
        }

        // 2. Check allowance
        console.log("\n🔐 Checking token allowance...");
        const allowance = await selectedToken.contract.allowance(hyperionWallet.address, DEPLOYED_ADDRESSES.hyperion.bridge);
        console.log(`  Current allowance: ${ethers.formatUnits(allowance, selectedToken.decimals)} ${selectedToken.symbol}`);

        // 3. Set allowance if needed
        if (allowance < transferAmount) {
            console.log(`\n✅ Setting allowance for ${ethers.formatUnits(transferAmount, selectedToken.decimals)} ${selectedToken.symbol}...`);
            const approveTx = await selectedToken.contract.approve(DEPLOYED_ADDRESSES.hyperion.bridge, transferAmount);
            console.log(`  ⏳ Waiting for approval transaction...`);
            await approveTx.wait();
            console.log(`  ✅ Approval confirmed: ${approveTx.hash}`);
        }

        // 4. Execute bridge deposit
        console.log(`\n🌉 Executing bridge deposit...`);
        const depositTx = await hyperionBridge.deposit(
            hyperionWallet.address, // recipient
            selectedToken.address,   // token
            transferAmount,          // amount
            DEPLOYED_ADDRESSES.metisSepolia.chainId // target chain
        );

        console.log(`  ⏳ Waiting for deposit transaction...`);
        const depositReceipt = await depositTx.wait();
        console.log(`  ✅ Deposit confirmed: ${depositTx.hash}`);

        // 5. Find the BridgeDeposit event
        const bridgeDepositEvent = depositReceipt.logs.find(log => {
            try {
                const parsed = hyperionBridge.interface.parseLog(log);
                return parsed.name === "BridgeDeposit";
            } catch {
                return false;
            }
        });

        if (bridgeDepositEvent) {
            const parsedEvent = hyperionBridge.interface.parseLog(bridgeDepositEvent);
            const [requestId, sender, recipient, token, amount, targetChainId, nonce, timestamp] = parsedEvent.args;
            
            console.log(`\n📋 Bridge Deposit Event Details:`);
            console.log(`  Request ID: ${requestId}`);
            console.log(`  Sender: ${sender}`);
            console.log(`  Recipient: ${recipient}`);
            console.log(`  Token: ${token}`);
            console.log(`  Amount: ${ethers.formatUnits(amount, selectedToken.decimals)} ${selectedToken.symbol}`);
            console.log(`  Target Chain ID: ${targetChainId}`);
            console.log(`  Nonce: ${nonce}`);
            console.log(`  Timestamp: ${timestamp}`);
        }

        // 6. Check updated balances
        console.log(`\n📊 Updated balances on Hyperion:`);
        const newBalance = await selectedToken.contract.balanceOf(hyperionWallet.address);
        console.log(`  ${selectedToken.symbol} Balance: ${ethers.formatUnits(newBalance, selectedToken.decimals)} ${selectedToken.symbol}`);

        console.log(`\n🎉 Bridge transfer initiated successfully!`);
        console.log(`📋 Transaction Hash: ${depositTx.hash}`);
        console.log(`\n⏳ The relayer will now process this transfer and mint wrapped tokens on Metis Sepolia.`);
        console.log(`💡 Run the relayer script to process the transfer: node scripts/relayer-standalone.js`);

        return true;

    } catch (error) {
        console.error(`❌ Bridge transfer failed: ${error.message}`);
        if (error.transaction) {
            console.error(`Transaction hash: ${error.transaction.hash}`);
        }
        return false;
    }
}

async function main() {
    try {
        // Check all balances first
        const balanceData = await checkAllBalances();
        if (!balanceData) {
            console.log("❌ Failed to check balances");
            rl.close();
            return;
        }

        const { hyperionWallet, tokenBalances } = balanceData;

        // Select token to bridge
        const selectedToken = await selectToken(tokenBalances);
        if (!selectedToken) {
            console.log("❌ No token selected or no tokens available");
            rl.close();
            return;
        }

        // Get transfer amount from user
        const transferAmount = await getTransferAmount(selectedToken);
        if (!transferAmount) {
            console.log("❌ Invalid transfer amount or insufficient balance");
            rl.close();
            return;
        }

        // Confirm transfer
        const confirm = await askQuestion(`\n🤔 Confirm bridge transfer of ${ethers.formatUnits(transferAmount, selectedToken.decimals)} ${selectedToken.symbol}? (y/N): `);
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            console.log("❌ Transfer cancelled by user");
            rl.close();
            return;
        }

        // Execute the transfer
        const success = await executeBridgeTransfer(hyperionWallet, selectedToken, transferAmount);
        
        if (success) {
            console.log("\n✅ Bridge transfer completed successfully!");
        } else {
            console.log("\n❌ Bridge transfer failed!");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        rl.close();
    }
}

// Run the interactive bridge transfer
main().catch(console.error); 