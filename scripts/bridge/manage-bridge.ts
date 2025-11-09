import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

// Bridge contract address (update after deployment)
const BRIDGE_ADDRESS = "0xfF064Fd496256e84b68dAE2509eDA84a3c235550"; // TODO: Update with actual bridge address

// Network Chain IDs
const NETWORKS = {
  HYPERION: 133717,
  // Temporarily disabled networks
  // LAZCHAIN: 133713,
  // METIS_SEPOLIA: 59902,
  // Mantle Networks
  MANTLE_TESTNET: 5003,
  MANTLE_MAINNET: 5000
};

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Managing Bridge contract with owner account:", owner.address);

  const balance = await ethers.provider.getBalance(owner.address);
  console.log("Owner balance:", ethers.formatEther(balance), "METIS");

  // Get Bridge contract
  const bridge = await ethers.getContractAt("Bridge", BRIDGE_ADDRESS);
  console.log("Bridge contract address:", BRIDGE_ADDRESS);

  // Check if caller is the owner
  const bridgeOwner = await bridge.owner();
  const isOwner = bridgeOwner.toLowerCase() === owner.address.toLowerCase();
  console.log(`\n🔐 Owner Status: ${isOwner ? "✅ Is Owner" : "❌ Not Owner"}`);

  if (!isOwner) {
    console.log("❌ Caller is not the bridge owner. Cannot manage bridge.");
    console.log(`📋 Bridge owner: ${bridgeOwner}`);
    return;
  }

  // Display current bridge status
  console.log("\n📊 Current Bridge Status:");
  console.log(`   Owner: ${await bridge.owner()}`);
  console.log(`   Bridge Fee: ${ethers.formatEther(await bridge.bridgeFee())} ETH`);
  console.log(`   Withdrawal Timeout: ${await bridge.withdrawalTimeout()} seconds`);
  console.log(`   Paused: ${await bridge.paused()}`);

  // Get bridge statistics
  const stats = await bridge.getBridgeStats();
  console.log(`   Total Deposits: ${stats.totalDeposits}`);
  console.log(`   Total Withdrawals: ${stats.totalWithdrawals}`);

  // Display supported tokens
  console.log("\n💰 Supported Tokens:");
  const tokenConfigs = [
    { symbol: "USDT", address: TOKENS.USDT },
    { symbol: "USDC", address: TOKENS.USDC },
    { symbol: "DAI", address: TOKENS.DAI },
    { symbol: "WETH", address: TOKENS.WETH }
  ];

  for (const config of tokenConfigs) {
    const isSupported = await bridge.supportedTokens(config.address);
    const symbol = await bridge.tokenSymbols(config.address);
    console.log(`   ${symbol}: ${config.address} (${isSupported ? "✅ Supported" : "❌ Not Supported"})`);
  }

  // Display supported networks
  console.log("\n🌐 Supported Networks:");
  const networkConfigs = [
    // Temporarily disabled
    // { name: "Lazchain", chainId: NETWORKS.LAZCHAIN },
    // { name: "Metis Sepolia", chainId: NETWORKS.METIS_SEPOLIA },
    // Mantle Networks
    { name: "Mantle Testnet", chainId: NETWORKS.MANTLE_TESTNET },
    { name: "Mantle Mainnet", chainId: NETWORKS.MANTLE_MAINNET }
  ];

  for (const config of networkConfigs) {
    const isSupported = await bridge.supportedChains(config.chainId);
    console.log(`   ${config.name} (${config.chainId}): ${isSupported ? "✅ Supported" : "❌ Not Supported"}`);
  }

  // Display relayers
  console.log("\n🔐 Current Relayers:");
  const knownRelayers = [owner.address]; // Add known relayer addresses here
  for (const relayer of knownRelayers) {
    const isRelayer = await bridge.relayers(relayer);
    console.log(`   ${relayer}: ${isRelayer ? "✅ Relayer" : "❌ Not Relayer"}`);
  }

  // Display bridge token balances
  console.log("\n💰 Bridge Token Balances:");
  for (const config of tokenConfigs) {
    const token = await ethers.getContractAt("Token", config.address);
    const bridgeBalance = await token.balanceOf(BRIDGE_ADDRESS);
    const decimals = config.symbol === "USDT" || config.symbol === "USDC" ? 6 : 18;
    console.log(`   ${config.symbol}: ${ethers.formatUnits(bridgeBalance, decimals)}`);
  }

  // Management functions (commented out for safety - uncomment to use)
  console.log("\n🔧 Bridge Management Functions:");
  console.log("📋 Available management operations:");
  console.log("   1. Add/Remove relayers");
  console.log("   2. Add/Remove supported tokens");
  console.log("   3. Add/Remove supported networks");
  console.log("   4. Update bridge fee");
  console.log("   5. Update withdrawal timeout");
  console.log("   6. Emergency pause/unpause");
  console.log("   7. Emergency withdraw tokens/ETH");

  // Example management operations (uncomment to use):
  /*
  // Add a new relayer
  console.log("\n➕ Adding new relayer...");
  const newRelayer = "0x..."; // Add relayer address
  const addRelayerTx = await bridge.addRelayer(newRelayer);
  await addRelayerTx.wait();
  console.log(`✅ Added relayer: ${newRelayer}`);

  // Update bridge fee
  console.log("\n💰 Updating bridge fee...");
  const newFee = ethers.parseEther("0.002"); // 0.002 ETH
  const updateFeeTx = await bridge.updateFee(newFee);
  await updateFeeTx.wait();
  console.log(`✅ Updated bridge fee to ${ethers.formatEther(newFee)} ETH`);

  // Add new supported network
  console.log("\n🌐 Adding new supported network...");
  const newChainId = 12345; // Add new chain ID
  const addNetworkTx = await bridge.setChainSupport(newChainId, true);
  await addNetworkTx.wait();
  console.log(`✅ Added network support for Chain ID: ${newChainId}`);

  // Emergency pause
  console.log("\n⏸️ Emergency pausing bridge...");
  const pauseTx = await bridge.emergencyPause();
  await pauseTx.wait();
  console.log("✅ Bridge paused");

  // Emergency unpause
  console.log("\n▶️ Emergency unpausing bridge...");
  const unpauseTx = await bridge.emergencyUnpause();
  await unpauseTx.wait();
  console.log("✅ Bridge unpaused");
  */

  console.log("\n🎉 Bridge management overview completed!");
  console.log("\n📋 Next Steps:");
  console.log("   1. Uncomment management operations as needed");
  console.log("   2. Deploy bridge on destination networks");
  console.log("   3. Set up relayer infrastructure");
  console.log("   4. Monitor bridge activity");
  console.log("   5. Implement proper signature verification");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 