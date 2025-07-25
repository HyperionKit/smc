const { ethers } = require("hardhat");
require("dotenv").config();

class BridgeRelayer {
    constructor() {
        this.providers = {};
        this.contracts = {};
        this.wallets = {};
        this.isRunning = false;
        this.pollingInterval = 15000; // 15 seconds
    }

    async initialize() {
        console.log("Initializing Bridge Relayer...");

        // Initialize providers for each network
        this.providers.hyperion = new ethers.JsonRpcProvider(process.env.HYPERION_RPC_URL);
        this.providers.metisSepolia = new ethers.JsonRpcProvider(process.env.METIS_SEPOLIA_RPC_URL);
        this.providers.lazchain = new ethers.JsonRpcProvider(process.env.LAZCHAIN_RPC_URL);

        // Initialize wallets
        this.wallets.hyperion = new ethers.Wallet(process.env.PRIVATE_KEY, this.providers.hyperion);
        this.wallets.metisSepolia = new ethers.Wallet(process.env.PRIVATE_KEY, this.providers.metisSepolia);
        this.wallets.lazchain = new ethers.Wallet(process.env.PRIVATE_KEY, this.providers.lazchain);

        // Initialize contracts
        await this.initializeContracts();

        console.log("Bridge Relayer initialized successfully");
    }

    async initializeContracts() {
        // Bridge contracts
        const Bridge = await ethers.getContractFactory("Bridge");
        this.contracts.bridge = {
            hyperion: Bridge.attach(process.env.HYPERION_BRIDGE_ADDRESS).connect(this.wallets.hyperion),
            metisSepolia: Bridge.attach(process.env.METIS_SEPOLIA_BRIDGE_ADDRESS).connect(this.wallets.metisSepolia),
            lazchain: Bridge.attach(process.env.LAZCHAIN_BRIDGE_ADDRESS).connect(this.wallets.lazchain)
        };

        // Relayer contracts
        const Relayer = await ethers.getContractFactory("Relayer");
        this.contracts.relayer = {
            hyperion: Relayer.attach(process.env.HYPERION_RELAYER_ADDRESS).connect(this.wallets.hyperion),
            metisSepolia: Relayer.attach(process.env.METIS_SEPOLIA_RELAYER_ADDRESS).connect(this.wallets.metisSepolia),
            lazchain: Relayer.attach(process.env.LAZCHAIN_RELAYER_ADDRESS).connect(this.wallets.lazchain)
        };

        // Token Factory contracts
        const WrappedTokenFactory = await ethers.getContractFactory("WrappedTokenFactory");
        this.contracts.tokenFactory = {
            hyperion: WrappedTokenFactory.attach(process.env.HYPERION_TOKEN_FACTORY_ADDRESS).connect(this.wallets.hyperion),
            metisSepolia: WrappedTokenFactory.attach(process.env.METIS_SEPOLIA_TOKEN_FACTORY_ADDRESS).connect(this.wallets.metisSepolia),
            lazchain: WrappedTokenFactory.attach(process.env.LAZCHAIN_TOKEN_FACTORY_ADDRESS).connect(this.wallets.lazchain)
        };
    }

    async start() {
        if (this.isRunning) {
            console.log("Relayer is already running");
            return;
        }

        this.isRunning = true;
        console.log("Starting Bridge Relayer...");

        // Start monitoring each network
        this.monitorNetwork("hyperion", 59903);
        this.monitorNetwork("metisSepolia", 59902);
        this.monitorNetwork("lazchain", 59904);
    }

    async stop() {
        this.isRunning = false;
        console.log("Stopping Bridge Relayer...");
    }

    async monitorNetwork(networkName, chainId) {
        console.log(`Starting monitoring for ${networkName} (Chain ID: ${chainId})`);

        const bridge = this.contracts.bridge[networkName];
        const relayer = this.contracts.relayer[networkName];

        // Listen for BridgeDeposit events
        bridge.on("BridgeDeposit", async (requestId, sender, recipient, token, amount, targetChainId, nonce, timestamp) => {
            console.log(`\n🔔 BridgeDeposit detected on ${networkName}:`);
            console.log(`  Request ID: ${requestId}`);
            console.log(`  From: ${sender} -> To: ${recipient}`);
            console.log(`  Token: ${token}, Amount: ${ethers.formatEther(amount)}`);
            console.log(`  Target Chain: ${targetChainId}`);

            try {
                await this.processBridgeDeposit(networkName, chainId, {
                    requestId,
                    sender,
                    recipient,
                    token,
                    amount,
                    targetChainId,
                    nonce,
                    timestamp
                });
            } catch (error) {
                console.error(`❌ Error processing bridge deposit on ${networkName}:`, error.message);
            }
        });

        // Poll for pending relay requests
        setInterval(async () => {
            if (!this.isRunning) return;

            try {
                await this.processPendingRelays(networkName, chainId);
            } catch (error) {
                console.error(`❌ Error processing pending relays on ${networkName}:`, error.message);
            }
        }, this.pollingInterval);
    }

    async processBridgeDeposit(sourceNetwork, sourceChainId, depositData) {
        const { requestId, sender, recipient, token, amount, targetChainId, nonce } = depositData;

        // Determine target network
        const targetNetwork = this.getNetworkByChainId(targetChainId);
        if (!targetNetwork) {
            console.log(`⚠️ Unknown target chain ID: ${targetChainId}`);
            return;
        }

        console.log(`🔄 Processing bridge deposit from ${sourceNetwork} to ${targetNetwork}`);

        // Create relay request on target network
        const targetRelayer = this.contracts.relayer[targetNetwork];
        
        // Generate proof (simplified for MVP)
        const proof = this.generateProof(depositData);

        try {
            const tx = await targetRelayer.createRelayRequest(
                requestId,
                sender,
                recipient,
                token,
                amount,
                sourceChainId,
                targetChainId,
                proof
            );

            console.log(`✅ Relay request created on ${targetNetwork}: ${tx.hash}`);
            await tx.wait();
            console.log(`✅ Relay request confirmed on ${targetNetwork}`);

        } catch (error) {
            console.error(`❌ Failed to create relay request on ${targetNetwork}:`, error.message);
        }
    }

    async processPendingRelays(networkName, chainId) {
        const relayer = this.contracts.relayer[networkName];
        
        // Get recent relay requests (this is a simplified approach)
        // In production, you'd want to maintain a database of pending relays
        try {
            // For MVP, we'll just log that we're checking
            console.log(`🔍 Checking for pending relays on ${networkName}...`);
            
            // Here you would implement logic to:
            // 1. Query for unprocessed relay requests
            // 2. Verify proofs
            // 3. Process valid relays
            // 4. Update status

        } catch (error) {
            console.error(`❌ Error checking pending relays on ${networkName}:`, error.message);
        }
    }

    generateProof(depositData) {
        // Simplified proof generation for MVP
        // In production, this would involve:
        // 1. Merkle proof generation
        // 2. Signature verification
        // 3. Block header verification
        
        const proofData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
            [
                depositData.requestId,
                depositData.sender,
                depositData.recipient,
                depositData.amount,
                depositData.targetChainId,
                depositData.nonce
            ]
        );

        return ethers.keccak256(proofData);
    }

    getNetworkByChainId(chainId) {
        const networkMap = {
            59903: "hyperion",
            59902: "metisSepolia",
            59904: "lazchain"
        };
        return networkMap[chainId];
    }

    async getNetworkStatus() {
        const status = {};
        
        for (const [networkName, provider] of Object.entries(this.providers)) {
            try {
                const blockNumber = await provider.getBlockNumber();
                const gasPrice = await provider.getFeeData();
                
                status[networkName] = {
                    connected: true,
                    blockNumber,
                    gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, "gwei") : "N/A"
                };
            } catch (error) {
                status[networkName] = {
                    connected: false,
                    error: error.message
                };
            }
        }

        return status;
    }

    async logStatus() {
        const status = await this.getNetworkStatus();
        console.log("\n📊 Network Status:");
        for (const [network, info] of Object.entries(status)) {
            if (info.connected) {
                console.log(`  ${network}: ✅ Connected (Block: ${info.blockNumber}, Gas: ${info.gasPrice} gwei)`);
            } else {
                console.log(`  ${network}: ❌ Disconnected (${info.error})`);
            }
        }
    }
}

// Main execution
async function main() {
    const relayer = new BridgeRelayer();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await relayer.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await relayer.stop();
        process.exit(0);
    });

    try {
        await relayer.initialize();
        await relayer.logStatus();
        await relayer.start();

        // Log status every 5 minutes
        setInterval(async () => {
            await relayer.logStatus();
        }, 5 * 60 * 1000);

    } catch (error) {
        console.error('❌ Failed to start relayer:', error);
        process.exit(1);
    }
}

// Run the relayer
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = BridgeRelayer; 