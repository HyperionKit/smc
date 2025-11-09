import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

// Bridge contract address (Hyperion deployment)
const BRIDGE_ADDRESS = "0xfF064Fd496256e84b68dAE2509eDA84a3c235550";

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

// Test deposit amounts
const TEST_AMOUNTS = {
  USDT: ethers.parseUnits("100", 6),   // 100 USDT
  USDC: ethers.parseUnits("100", 6),   // 100 USDC
  DAI: ethers.parseUnits("100", 18),   // 100 DAI
  WETH: ethers.parseUnits("1", 18)     // 1 WETH
};

async function main() {
  const [user] = await ethers.getSigners();
  console.log("Testing Bridge deposit with account:", user.address);

  const balance = await ethers.provider.getBalance(user.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Get Bridge contract
  const bridge = await ethers.getContractAt("Bridge", BRIDGE_ADDRESS);
  console.log("Bridge contract address:", BRIDGE_ADDRESS);

  // Check bridge configuration
  console.log("\n📊 Bridge Configuration:");
  console.log(`   Owner: ${await bridge.owner()}`);
  console.log(`   Bridge Fee: ${ethers.formatEther(await bridge.bridgeFee())} ETH`);
  console.log(`   Paused: ${await bridge.paused()}`);

  // Test deposit for each token
  const tokenConfigs = [
    { symbol: "USDT", address: TOKENS.USDT, amount: TEST_AMOUNTS.USDT, decimals: 6 },
    { symbol: "USDC", address: TOKENS.USDC, amount: TEST_AMOUNTS.USDC, decimals: 6 },
    { symbol: "DAI", address: TOKENS.DAI, amount: TEST_AMOUNTS.DAI, decimals: 18 },
    { symbol: "WETH", address: TOKENS.WETH, amount: TEST_AMOUNTS.WETH, decimals: 18 }
  ];

  for (const config of tokenConfigs) {
    console.log(`\n🌉 Testing ${config.symbol} deposit...`);
    
    // Get token contract
    const token = await ethers.getContractAt("Token", config.address);
    
    // Check if token is supported by bridge
    const isSupported = await bridge.supportedTokens(config.address);
    if (!isSupported) {
      console.log(`❌ ${config.symbol} is not supported by bridge. Skipping...`);
      continue;
    }

    // Check user's token balance
    const userBalance = await token.balanceOf(user.address);
    console.log(`   User ${config.symbol} balance: ${ethers.formatUnits(userBalance, config.decimals)}`);

    if (userBalance < config.amount) {
      console.log(`❌ Insufficient ${config.symbol} balance. Need ${ethers.formatUnits(config.amount, config.decimals)}, have ${ethers.formatUnits(userBalance, config.decimals)}`);
      continue;
    }

    // Check user's allowance
    const allowance = await token.allowance(user.address, BRIDGE_ADDRESS);
    console.log(`   Current allowance: ${ethers.formatUnits(allowance, config.decimals)} ${config.symbol}`);

    // Approve tokens if needed
    if (allowance < config.amount) {
      console.log(`   Approving ${ethers.formatUnits(config.amount, config.decimals)} ${config.symbol}...`);
      const approveTx = await token.approve(BRIDGE_ADDRESS, config.amount);
      await approveTx.wait();
      console.log(`✅ Approved ${ethers.formatUnits(config.amount, config.decimals)} ${config.symbol}`);
    }

    // Get bridge fee
    const bridgeFee = await bridge.bridgeFee();
    console.log(`   Bridge fee: ${ethers.formatEther(bridgeFee)} ETH`);

    // Check if user has enough ETH for bridge fee
    if (balance < bridgeFee) {
      console.log(`❌ Insufficient ETH for bridge fee. Need ${ethers.formatEther(bridgeFee)}, have ${ethers.formatEther(balance)}`);
      continue;
    }

    // Test deposit to Mantle Testnet
    const destinationChainId = NETWORKS.MANTLE_TESTNET;
    const destinationAddress = user.address; // Same address on destination chain

    console.log(`   Depositing ${ethers.formatUnits(config.amount, config.decimals)} ${config.symbol} to Mantle Testnet (Chain ID: ${destinationChainId})...`);
    
    try {
      const depositTx = await bridge.deposit(
        config.address,
        config.amount,
        destinationChainId,
        destinationAddress,
        { value: bridgeFee }
      );
      
      const receipt = await depositTx.wait();
      console.log(`✅ Deposit successful!`);
      console.log(`   Transaction hash: ${receipt?.hash}`);
      console.log(`   Gas used: ${receipt?.gasUsed?.toString()}`);

      // Get deposit ID from event
      const depositEvent = receipt?.logs?.find(log => {
        try {
          const parsed = bridge.interface.parseLog(log);
          return parsed?.name === "TokenDeposited";
        } catch {
          return false;
        }
      });

      if (depositEvent) {
        const parsed = bridge.interface.parseLog(depositEvent);
        const depositId = parsed?.args?.depositId;
        console.log(`   Deposit ID: ${depositId}`);
      }

    } catch (error: any) {
      console.log(`❌ Deposit failed: ${error.message}`);
    }
  }

  // Get bridge statistics
  const stats = await bridge.getBridgeStats();
  console.log("\n📈 Bridge Statistics:");
  console.log(`   Total Deposits: ${stats.totalDeposits}`);
  console.log(`   Total Withdrawals: ${stats.totalWithdrawals}`);
  console.log(`   Current Fee: ${ethers.formatEther(stats.currentFee)} ETH`);

  console.log("\n🎉 Bridge deposit testing completed!");
  console.log("\n📋 Next Steps:");
  console.log("   1. Deploy bridge on destination networks");
  console.log("   2. Test bridge withdrawal functionality");
  console.log("   3. Configure relayers for cross-chain communication");
  console.log("   4. Monitor deposit events for processing");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 