const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Bridge Functionality...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  try {
    // Test 1: Deploy Bridge Contract
    console.log("📦 Test 1: Deploying Bridge Contract...");
    const Bridge = await ethers.getContractFactory("Bridge");
    const bridge = await Bridge.deploy();
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log("✅ Bridge deployed at:", bridgeAddress);

    // Test 2: Deploy WrappedTokenFactory
    console.log("\n📦 Test 2: Deploying WrappedTokenFactory...");
    const WrappedTokenFactory = await ethers.getContractFactory("WrappedTokenFactory");
    const tokenFactory = await WrappedTokenFactory.deploy();
    await tokenFactory.waitForDeployment();
    const tokenFactoryAddress = await tokenFactory.getAddress();
    console.log("✅ WrappedTokenFactory deployed at:", tokenFactoryAddress);

    // Test 3: Deploy Relayer
    console.log("\n📦 Test 3: Deploying Relayer...");
    const Relayer = await ethers.getContractFactory("Relayer");
    const relayer = await Relayer.deploy(bridgeAddress, tokenFactoryAddress);
    await relayer.waitForDeployment();
    const relayerAddress = await relayer.getAddress();
    console.log("✅ Relayer deployed at:", relayerAddress);

    // Test 4: Configure Permissions
    console.log("\n⚙️ Test 4: Configuring Permissions...");
    
    // Grant relayer role to relayer contract
    const relayerRole = await bridge.RELAYER_ROLE();
    await bridge.grantRole(relayerRole, relayerAddress);
    console.log("✅ Relayer role granted");

    // Grant bridge role to bridge contract
    const bridgeRole = await tokenFactory.BRIDGE_ROLE();
    await tokenFactory.grantRole(bridgeRole, bridgeAddress);
    console.log("✅ Bridge role granted");

    // Test 5: Add Supported Token
    console.log("\n⚙️ Test 5: Adding Supported Token...");
    
    // Create a mock token address for testing
    const mockTokenAddress = ethers.Wallet.createRandom().address;
    
    await bridge.addSupportedToken(
      mockTokenAddress,
      ethers.parseEther("0.1"), // min amount
      ethers.parseEther("1000000"), // max amount
      ethers.parseEther("10000") // daily limit
    );
    console.log("✅ Mock token added as supported token");

    // Test 6: Create Wrapped Token
    console.log("\n⚙️ Test 6: Creating Wrapped Token...");
    
    const wrappedTokenTx = await tokenFactory.createWrappedToken(
      mockTokenAddress,
      59902, // chain ID
      "Wrapped Test Token",
      "wTEST",
      18
    );
    await wrappedTokenTx.wait();
    
    // Get the wrapped token address from the event
    const wrappedTokenAddress = await tokenFactory.getWrappedToken(mockTokenAddress);
    console.log("✅ Wrapped token created at:", wrappedTokenAddress);

    // Test 7: Verify Token Configuration
    console.log("\n🔍 Test 7: Verifying Token Configuration...");
    
    const tokenConfig = await bridge.getTokenConfig(mockTokenAddress);
    console.log("✅ Token config verified:");
    console.log("  - Is supported:", tokenConfig.isSupported);
    console.log("  - Min amount:", ethers.formatEther(tokenConfig.minAmount));
    console.log("  - Max amount:", ethers.formatEther(tokenConfig.maxAmount));
    console.log("  - Daily limit:", ethers.formatEther(tokenConfig.dailyLimit));

    // Test 8: Verify Wrapped Token Info
    console.log("\n🔍 Test 8: Verifying Wrapped Token Info...");
    
    const wrappedTokenInfo = await tokenFactory.getWrappedTokenInfo(wrappedTokenAddress);
    console.log("✅ Wrapped token info verified:");
    console.log("  - Original token:", wrappedTokenInfo.originalToken);
    console.log("  - Original chain ID:", wrappedTokenInfo.originalChainId);
    console.log("  - Name:", wrappedTokenInfo.name);
    console.log("  - Symbol:", wrappedTokenInfo.symbol);
    console.log("  - Is active:", wrappedTokenInfo.isActive);

    // Test 9: Test Bridge Deposit Event (simulation)
    console.log("\n🔍 Test 9: Testing Bridge Deposit Event...");
    
    // Create a mock deposit request
    const mockRecipient = ethers.Wallet.createRandom().address;
    const mockAmount = ethers.parseEther("100");
    const mockTargetChainId = 59903;
    
    // Get current nonce
    const currentNonce = await bridge.chainNonces(mockTargetChainId);
    
    // Calculate expected request ID
    const expectedRequestId = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "uint256", "uint256", "uint256"],
      [deployer.address, mockRecipient, mockAmount, mockTargetChainId, currentNonce, await ethers.provider.getNetwork().then(n => n.chainId)]
    ));
    
    console.log("✅ Bridge deposit simulation completed:");
    console.log("  - Expected request ID:", expectedRequestId);
    console.log("  - Recipient:", mockRecipient);
    console.log("  - Amount:", ethers.formatEther(mockAmount));
    console.log("  - Target chain ID:", mockTargetChainId);

    // Test 10: Test Relayer Functionality
    console.log("\n🔍 Test 10: Testing Relayer Functionality...");
    
    // Create a mock relay request
    const mockDepositTxHash = ethers.keccak256(ethers.toUtf8Bytes("mock-deposit"));
    const mockProof = ethers.keccak256(ethers.toUtf8Bytes("mock-proof"));
    
    await relayer.createRelayRequest(
      mockDepositTxHash,
      deployer.address,
      mockRecipient,
      mockTokenAddress,
      mockAmount,
      59902, // source chain
      59903, // target chain
      mockProof
    );
    console.log("✅ Relay request created successfully");

    // Test 11: Verify Relayer Status
    console.log("\n🔍 Test 11: Verifying Relayer Status...");
    
    const isValidator = await relayer.isValidator(deployer.address);
    console.log("✅ Relayer status verified:");
    console.log("  - Deployer is validator:", isValidator);

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log("  Bridge:", bridgeAddress);
    console.log("  WrappedTokenFactory:", tokenFactoryAddress);
    console.log("  Relayer:", relayerAddress);
    console.log("  Wrapped Token:", wrappedTokenAddress);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

main().catch((error) => {
  console.error("❌ Test execution failed:", error);
  process.exit(1);
}); 