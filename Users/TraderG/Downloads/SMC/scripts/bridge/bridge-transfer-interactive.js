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

// WMETIS token address on Hyperion
const WMETIS_ADDRESS = "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301";

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
                const wrappedBalance = await wrappedToken.balanceOf(hyperionWallet.address);
                const wrappedSymbol = await wrappedToken.symbol();
                const wrappedDecimals = await wrappedToken.decimals();
                
                console.log(`  ${wrappedSymbol} Balance: ${ethers.formatUnits(wrappedBalance, wrappedDecimals)} ${wrappedSymbol}`);
            } else {
                console.log(`  ⚠️  No wrapped token found for WMETIS on Metis Sepolia`);
            }
        } catch (error) {
            console.log(`  ❌ Error checking wrapped token: ${error.message}`);
        }

        return {
            hyperionWallet,
            metisSepoliaWallet,
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

async function getTransferAmount(wMetisBalance, wMetisSymbol, wMetisDecimals) {
    console.log("\n📋 Summary");
    console.log("----------");
    
    const availableBalance = ethers.formatUnits(wMetisBalance, wMetisDecimals);
    console.log(`✅ Available ${wMetisSymbol} on Hyperion: ${availableBalance} ${wMetisSymbol}`);
    
    if (wMetisBalance === 0n) {
        console.log(`❌ No ${wMetisSymbol} tokens found on Hyperion`);
        console.log(`💡 You need to get some ${wMetisSymbol} tokens first`);
        return null;
    }

    // Ask user for transfer amount
    const amountInput = await askQuestion(`\n🌉 Enter amount of ${wMetisSymbol} to bridge (min 0.001): `);
    
    // Validate input
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount < 0.001) {
        console.log(`❌ Invalid amount. Minimum is 0.001 ${wMetisSymbol}`);
        return null;
    }

    const amountWei = ethers.parseUnits(amountInput, wMetisDecimals);
    if (amountWei > wMetisBalance) {
        console.log(`❌ Insufficient balance. You have ${availableBalance} ${wMetisSymbol}, trying to transfer ${amountInput} ${wMetisSymbol}`);
        return null;
    }

    return amountWei;
}

async function executeBridgeTransfer(hyperionWallet, wMetisContract, wMetisSymbol, transferAmount) {
    console.log(`\n🌉 Initiating Bridge Transfer: Hyperion → Metis Sepolia`);
    console.log("==================================================");
    console.log(`  From: Hyperion (${DEPLOYED_ADDRESSES.hyperion.chainId})`);
    console.log(`  To: Metis Sepolia (${DEPLOYED_ADDRESSES.metisSepolia.chainId})`);
    console.log(`  Amount: ${ethers.formatEther(transferAmount)} ${wMetisSymbol}`);
    console.log(`  Recipient: ${hyperionWallet.address}`);

    try {
        // 1. Check if WMETIS is supported on the bridge
        console.log("\n🔍 Checking bridge configuration...");
        const hyperionBridge = new ethers.Contract(DEPLOYED_ADDRESSES.hyperion.bridge, BRIDGE_ABI, hyperionWallet);
        
        const [isSupported, minAmount, maxAmount, dailyLimit, dailyUsed] = await hyperionBridge.getSupportedToken(WMETIS_ADDRESS);
        console.log(`  WMETIS supported: ${isSupported}`);
        
        if (!isSupported) {
            console.log(`❌ WMETIS is not supported on the bridge`);
            return false;
        }

        if (isSupported) {
            console.log(`  Min amount: ${ethers.formatEther(minAmount)} ${wMetisSymbol}`);
            console.log(`  Max amount: ${ethers.formatEther(maxAmount)} ${wMetisSymbol}`);
            console.log(`  Daily limit: ${ethers.formatEther(dailyLimit)} ${wMetisSymbol}`);
            console.log(`  Daily used: ${ethers.formatEther(dailyUsed)} ${wMetisSymbol}`);
        }

        // 2. Check allowance
        console.log("\n🔐 Checking token allowance...");
        const allowance = await wMetisContract.allowance(hyperionWallet.address, DEPLOYED_ADDRESSES.hyperion.bridge);
        console.log(`  Current allowance: ${ethers.formatEther(allowance)} ${wMetisSymbol}`);

        // 3. Set allowance if needed
        if (allowance < transferAmount) {
            console.log(`\n✅ Setting allowance for ${ethers.formatEther(transferAmount)} ${wMetisSymbol}...`);
            const approveTx = await wMetisContract.approve(DEPLOYED_ADDRESSES.hyperion.bridge, transferAmount);
            console.log(`  ⏳ Waiting for approval transaction...`);
            await approveTx.wait();
            console.log(`  ✅ Approval confirmed: ${approveTx.hash}`);
        }

        // 4. Execute bridge deposit
        console.log(`\n🌉 Executing bridge deposit...`);
        const depositTx = await hyperionBridge.deposit(
            hyperionWallet.address, // recipient
            WMETIS_ADDRESS,         // token
            transferAmount,         // amount
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
            console.log(`  Amount: ${ethers.formatEther(amount)} ${wMetisSymbol}`);
            console.log(`  Target Chain ID: ${targetChainId}`);
            console.log(`  Nonce: ${nonce}`);
            console.log(`  Timestamp: ${timestamp}`);
        }

        // 6. Check updated balances
        console.log(`\n📊 Updated balances on Hyperion:`);
        const newWMetisBalance = await wMetisContract.balanceOf(hyperionWallet.address);
        console.log(`  ${wMetisSymbol} Balance: ${ethers.formatUnits(newWMetisBalance, 18)} ${wMetisSymbol}`);

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
        // Check balances first
        const balanceData = await checkBalances();
        if (!balanceData) {
            console.log("❌ Failed to check balances");
            rl.close();
            return;
        }

        const { hyperionWallet, wMetisContract, wMetisBalance, wMetisSymbol, wMetisDecimals } = balanceData;

        // Get transfer amount from user
        const transferAmount = await getTransferAmount(wMetisBalance, wMetisSymbol, wMetisDecimals);
        if (!transferAmount) {
            console.log("❌ Invalid transfer amount or insufficient balance");
            rl.close();
            return;
        }

        // Confirm transfer
        const confirm = await askQuestion(`\n🤔 Confirm bridge transfer of ${ethers.formatEther(transferAmount)} ${wMetisSymbol}? (y/N): `);
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            console.log("❌ Transfer cancelled by user");
            rl.close();
            return;
        }

        // Execute the transfer
        const success = await executeBridgeTransfer(hyperionWallet, wMetisContract, wMetisSymbol, transferAmount);
        
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