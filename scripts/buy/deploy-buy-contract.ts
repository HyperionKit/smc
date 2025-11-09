import { ethers } from "hardhat";

// Contract addresses (Update based on network)
// Mantle Testnet addresses
const TOKENS = {
  USDT: "0x6aE086fB835D53D7fae1B57Cc8A55FEEaEC6ba5b",
  USDC: "0x76837E513b3e6E6eFc828757764Ed5d0Fd24f2dE",
  DAI: "0xd6Ff774460085767e2c6b3DabcA5AE3D5a57e27a",
  WETH: "0xCa7b49d1C243a9289aE2316051eb15146125914d"
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying BuyVault for METIS to USDT/USDC");
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Set initial prices (0.1 METIS = 10 USDC/USDT for testing)
  // In production, these would be set to actual market prices
  const usdcPrice = ethers.parseEther("0.01"); // 0.01 METIS = 1 USDC (so 0.1 METIS = 10 USDC)
  const usdtPrice = ethers.parseEther("0.01"); // 0.01 METIS = 1 USDT (so 0.1 METIS = 10 USDT)

  console.log("\n📊 Initial Prices:");
  console.log(`USDC Price: ${ethers.formatEther(usdcPrice)} METIS per USDC`);
  console.log(`USDT Price: ${ethers.formatEther(usdtPrice)} METIS per USDT`);
  console.log(`💡 This means: 0.1 METIS = 10 USDC/USDT`);

  // Deploy BuyVault using the correct path
  const BuyVault = await ethers.getContractFactory("contracts/buy/BuyContract.sol:BuyVault");
  const buyContract = await BuyVault.deploy(
    TOKENS.USDC,
    TOKENS.USDT,
    usdcPrice,
    usdtPrice
  );
  await buyContract.waitForDeployment();
  
  const buyContractAddress = await buyContract.getAddress();
  
  console.log("\n🎉 BuyVault deployed successfully!");
  console.log("Contract address:", buyContractAddress);
  console.log("Deployer:", deployer.address);

  console.log("\n📋 Contract Features:");
  console.log("✅ Buy USDC with METIS: buyUSDC(minTokenAmount)");
  console.log("✅ Buy USDT with METIS: buyUSDT(minTokenAmount)");
  console.log("✅ Price calculation: getUSDCAmount(metisAmount), getUSDTAmount(metisAmount)");
  console.log("✅ Contract info: getContractInfo()");
  console.log("✅ Admin functions: setUSDCPrice(), setUSDTPrice(), withdrawTokens(), withdrawMETIS()");
  console.log("✅ Emergency functions: pause(), unpause(), emergencyWithdrawMETIS()");

  console.log("\n🔧 Configuration:");
  console.log("- Minimum purchase: 0.001 METIS");
  console.log("- Price precision: 1e18");
  console.log("- Slippage protection: minTokenAmount parameter");
  console.log("- Reentrancy protection: enabled");
  console.log("- Pausable: enabled");

  console.log("\n📝 Next Steps:");
  console.log("1. Fund the contract with USDC and USDT tokens");
  console.log("2. Set appropriate prices based on market conditions");
  console.log("3. Test buying functionality");
  console.log("4. Monitor contract balances");

  console.log("\n💡 Usage Examples:");
  console.log("- Buy USDC: buyUSDC(minUSDCAmount) {value: metisAmount}");
  console.log("- Buy USDT: buyUSDT(minUSDTAmount) {value: metisAmount}");
  console.log("- Check USDC amount: getUSDCAmount(metisAmount)");
  console.log("- Check USDT amount: getUSDTAmount(metisAmount)");
  console.log("- Get contract info: getContractInfo()");

  console.log("\n🔗 Contract Addresses:");
  console.log(`BuyVault: ${buyContractAddress}`);
  console.log(`USDC: ${TOKENS.USDC}`);
  console.log(`USDT: ${TOKENS.USDT}`);

  // Verify contract info
  try {
    const contractInfo = await (buyContract as any).getContractInfo();
    console.log("\n📊 Contract Info:");
    console.log(`USDC Price: ${ethers.formatEther(contractInfo[0])} METIS`);
    console.log(`USDT Price: ${ethers.formatEther(contractInfo[1])} METIS`);
    console.log(`USDC Balance: ${ethers.formatEther(contractInfo[2])} USDC`);
    console.log(`USDT Balance: ${ethers.formatEther(contractInfo[3])} USDT`);
    console.log(`METIS Balance: ${ethers.formatEther(contractInfo[4])} METIS`);
  } catch (error) {
    console.log("❌ Failed to get contract info:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 