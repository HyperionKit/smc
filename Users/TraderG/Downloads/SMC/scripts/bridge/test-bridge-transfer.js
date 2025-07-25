const { ethers } = require("ethers");
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

// tMetis token address on Hyperion
const TMETIS_ADDRESS = "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301";

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

async function testBridgeTransfer() {
    console.log("🌉 Testing Bridge Transfer: Hyperion → Metis Sepolia");
    console.log("==================================================");

    const privateKey = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
    
    // Initialize providers and wallets
    const hyperionProvider = new ethers.JsonRpcProvider(DEPLOYED_ADDRESSES.hyperion.rpcUrl);
    const metisSepoliaProvider = new ethers.JsonRpcProvider(DEPLOYED_ADDRESSES.metisSepolia.rpcUrl);
    
    const hyperionWallet = new ethers.Wallet(privateKey, hyperionProvider);
    const metisSepoliaWallet = new ethers.Wallet(privateKey, metisSepoliaProvider);

    console.log(`👤 Wallet Address: ${hyperionWallet.address}`);

    try {
        // 1. Check balances on Hyperion
        console.log("\n📊 Checking balances on Hyperion...");
        const hyperionBalance = await hyperionProvider.getBalance(hyperionWallet.address);
        console.log(`  ETH Balance: ${ethers.formatEther(hyperionBalance)} ETH`);

        const tMetisContract = new ethers.Contract(TMETIS_ADDRESS, ERC20_ABI, hyperionWallet);
        const tMetisBalance = await tMetisContract.balanceOf(hyperionWallet.address);
        const tMetisName = await tMetisContract.name();
        const tMetisSymbol = await tMetisContract.symbol();
        const tMetisDecimals = await tMetisContract.decimals();
        
        console.log(`  ${tMetisSymbol} Balance: ${ethers.formatUnits(tMetisBalance, tMetisDecimals)} ${tMetisSymbol}`);

        // 2. Check if tMetis is supported on the bridge
        console.log("\n🔍 Checking bridge configuration...");
        const hyperionBridge = new ethers.Contract(DEPLOYED_ADDRESSES.hyperion.bridge, BRIDGE_ABI, hyperionWallet);
        
        const [isSupported, minAmount, maxAmount, dailyLimit, dailyUsed] = await hyperionBridge.getSupportedToken(TMETIS_ADDRESS);
        console.log(`  tMetis supported: ${isSupported}`);
        if (isSupported) {
            console.log(`  Min amount: ${ethers.formatEther(minAmount)} ${tMetisSymbol}`);
            console.log(`  Max amount: ${ethers.formatEther(maxAmount)} ${tMetisSymbol}`);
            console.log(`  Daily limit: ${ethers.formatEther(dailyLimit)} ${tMetisSymbol}`);
            console.log(`  Daily used: ${ethers.formatEther(dailyUsed)} ${tMetisSymbol}`);
        }

        // 3. Check allowance
        console.log("\n🔐 Checking token allowance...");
        const allowance = await tMetisContract.allowance(hyperionWallet.address, DEPLOYED_ADDRESSES.hyperion.bridge);
        console.log(`  Current allowance: ${ethers.formatEther(allowance)} ${tMetisSymbol}`);

        // 4. Set allowance if needed
        const transferAmount = ethers.parseEther("0.1"); // 0.1 tMetis
        if (allowance < transferAmount) {
            console.log(`\n✅ Setting allowance for ${ethers.formatEther(transferAmount)} ${tMetisSymbol}...`);
            const approveTx = await tMetisContract.approve(DEPLOYED_ADDRESSES.hyperion.bridge, transferAmount);
            console.log(`  ⏳ Waiting for approval transaction...`);
            await approveTx.wait();
            console.log(`  ✅ Approval confirmed: ${approveTx.hash}`);
        }

        // 5. Execute bridge deposit
        console.log(`\n🌉 Initiating bridge transfer...`);
        console.log(`  From: Hyperion (${DEPLOYED_ADDRESSES.hyperion.chainId})`);
        console.log(`  To: Metis Sepolia (${DEPLOYED_ADDRESSES.metisSepolia.chainId})`);
        console.log(`  Amount: ${ethers.formatEther(transferAmount)} ${tMetisSymbol}`);
        console.log(`  Recipient: ${hyperionWallet.address}`);

        const depositTx = await hyperionBridge.deposit(
            hyperionWallet.address, // recipient
            TMETIS_ADDRESS,         // token
            transferAmount,         // amount
            DEPLOYED_ADDRESSES.metisSepolia.chainId // target chain
        );

        console.log(`  ⏳ Waiting for deposit transaction...`);
        const depositReceipt = await depositTx.wait();
        console.log(`  ✅ Deposit confirmed: ${depositTx.hash}`);

        // 6. Find the BridgeDeposit event
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
            console.log(`  Amount: ${ethers.formatEther(amount)} ${tMetisSymbol}`);
            console.log(`  Target Chain ID: ${targetChainId}`);
            console.log(`  Nonce: ${nonce}`);
            console.log(`  Timestamp: ${timestamp}`);
        }

        // 7. Check updated balances
        console.log(`\n📊 Updated balances on Hyperion:`);
        const newTMetisBalance = await tMetisContract.balanceOf(hyperionWallet.address);
        console.log(`  ${tMetisSymbol} Balance: ${ethers.formatUnits(newTMetisBalance, tMetisDecimals)} ${tMetisSymbol}`);

        // 8. Check if wrapped token exists on Metis Sepolia
        console.log(`\n🔍 Checking Metis Sepolia for wrapped token...`);
        const metisSepoliaTokenFactory = new ethers.Contract(
            DEPLOYED_ADDRESSES.metisSepolia.tokenFactory,
            ["function getWrappedToken(address originalToken) external view returns (address)"],
            metisSepoliaWallet
        );

        try {
            const wrappedTokenAddress = await metisSepoliaTokenFactory.getWrappedToken(TMETIS_ADDRESS);
            if (wrappedTokenAddress !== ethers.ZeroAddress) {
                console.log(`  ✅ Wrapped token found: ${wrappedTokenAddress}`);
                
                const wrappedToken = new ethers.Contract(wrappedTokenAddress, ERC20_ABI, metisSepoliaWallet);
                const wrappedBalance = await wrappedToken.balanceOf(hyperionWallet.address);
                const wrappedSymbol = await wrappedToken.symbol();
                const wrappedDecimals = await wrappedToken.decimals();
                
                console.log(`  ${wrappedSymbol} Balance: ${ethers.formatUnits(wrappedBalance, wrappedDecimals)} ${wrappedSymbol}`);
            } else {
                console.log(`  ⚠️  No wrapped token found for tMetis on Metis Sepolia`);
            }
        } catch (error) {
            console.log(`  ❌ Error checking wrapped token: ${error.message}`);
        }

        console.log(`\n🎉 Bridge transfer initiated successfully!`);
        console.log(`📋 Transaction Hash: ${depositTx.hash}`);
        console.log(`\n⏳ The relayer will now process this transfer and mint wrapped tokens on Metis Sepolia.`);
        console.log(`💡 Run the relayer script to process the transfer: node scripts/relayer-standalone.js`);

    } catch (error) {
        console.error(`❌ Bridge transfer failed: ${error.message}`);
        if (error.transaction) {
            console.error(`Transaction hash: ${error.transaction.hash}`);
        }
    }
}

// Run the test
testBridgeTransfer().catch(console.error); 