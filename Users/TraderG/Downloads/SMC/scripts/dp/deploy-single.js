const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log(`\n🚀 Deploying to network (Chain ID: ${network.chainId})...`);

  try {
    // 1. Deploy Bridge Contract
    console.log(`  📦 Deploying Bridge contract...`);
    const Bridge = await ethers.getContractFactory("Bridge");
    const bridge = await Bridge.deploy();
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`    ✅ Bridge deployed: ${bridgeAddress}`);

    // 2. Deploy WrappedTokenFactory
    console.log(`  📦 Deploying WrappedTokenFactory...`);
    const WrappedTokenFactory = await ethers.getContractFactory("WrappedTokenFactory");
    const tokenFactory = await WrappedTokenFactory.deploy();
    await tokenFactory.waitForDeployment();
    const tokenFactoryAddress = await tokenFactory.getAddress();
    console.log(`    ✅ WrappedTokenFactory deployed: ${tokenFactoryAddress}`);

    // 3. Deploy Relayer
    console.log(`  📦 Deploying Relayer...`);
    const Relayer = await ethers.getContractFactory("Relayer");
    const relayer = await Relayer.deploy(bridgeAddress, tokenFactoryAddress);
    await relayer.waitForDeployment();
    const relayerAddress = await relayer.getAddress();
    console.log(`    ✅ Relayer deployed: ${relayerAddress}`);

    // 4. Deploy MessageSender
    console.log(`  📦 Deploying MessageSender...`);
    const MessageSender = await ethers.getContractFactory("MessageSender");
    const messageSender = await MessageSender.deploy(
      ethers.ZeroAddress, // Metis bridge address placeholder
      bridgeAddress
    );
    await messageSender.waitForDeployment();
    const messageSenderAddress = await messageSender.getAddress();
    console.log(`    ✅ MessageSender deployed: ${messageSenderAddress}`);

    // 5. Deploy MessageReceiver
    console.log(`  📦 Deploying MessageReceiver...`);
    const MessageReceiver = await ethers.getContractFactory("MessageReceiver");
    const messageReceiver = await MessageReceiver.deploy(
      ethers.ZeroAddress, // Metis bridge address placeholder
      tokenFactoryAddress,
      messageSenderAddress,
      network.chainId
    );
    await messageReceiver.waitForDeployment();
    const messageReceiverAddress = await messageReceiver.getAddress();
    console.log(`    ✅ MessageReceiver deployed: ${messageReceiverAddress}`);

    // 6. Configure Bridge with Relayer role
    console.log(`  ⚙️  Configuring Bridge permissions...`);
    const relayerRole = await bridge.RELAYER_ROLE();
    await bridge.grantRole(relayerRole, relayerAddress);
    console.log(`    ✅ Relayer role granted to: ${relayerAddress}`);

    // 7. Configure TokenFactory with Bridge role
    console.log(`  ⚙️  Configuring TokenFactory permissions...`);
    const bridgeRole = await tokenFactory.BRIDGE_ROLE();
    await tokenFactory.grantRole(bridgeRole, bridgeAddress);
    console.log(`    ✅ Bridge role granted to: ${bridgeAddress}`);

    // 8. Add some supported tokens to the bridge (example with tMetis)
    console.log(`  ⚙️  Adding supported tokens...`);
    const tMetisAddress = "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301"; // tMetis address
    await bridge.addSupportedToken(
      tMetisAddress,
      ethers.parseEther("0.1"), // min amount
      ethers.parseEther("1000000"), // max amount
      ethers.parseEther("10000") // daily limit
    );
    console.log(`    ✅ tMetis added as supported token: ${tMetisAddress}`);

    // 9. Create a wrapped token example
    console.log(`  ⚙️  Creating example wrapped token...`);
    const wrappedTokenTx = await tokenFactory.createWrappedToken(
      tMetisAddress,
      network.chainId,
      `Wrapped tMetis on Chain ${network.chainId}`,
      `wtMetis-${network.chainId}`,
      18
    );
    await wrappedTokenTx.wait();
    const wrappedTokenAddress = await tokenFactory.getWrappedToken(tMetisAddress);
    console.log(`    ✅ Example wrapped token created: ${wrappedTokenAddress}`);

    // Log deployment summary
    console.log(`\n📋 DEPLOYMENT SUMMARY (Chain ID: ${network.chainId}):`);
    console.log(`  Bridge: ${bridgeAddress}`);
    console.log(`  WrappedTokenFactory: ${tokenFactoryAddress}`);
    console.log(`  Relayer: ${relayerAddress}`);
    console.log(`  MessageSender: ${messageSenderAddress}`);
    console.log(`  MessageReceiver: ${messageReceiverAddress}`);
    console.log(`  Wrapped Token: ${wrappedTokenAddress}`);

    // Save deployment addresses to environment variables format
    console.log(`\n🔧 Environment variables for this network:`);
    console.log(`BRIDGE_ADDRESS=${bridgeAddress}`);
    console.log(`TOKEN_FACTORY_ADDRESS=${tokenFactoryAddress}`);
    console.log(`RELAYER_ADDRESS=${relayerAddress}`);
    console.log(`MESSAGE_SENDER_ADDRESS=${messageSenderAddress}`);
    console.log(`MESSAGE_RECEIVER_ADDRESS=${messageReceiverAddress}`);
    console.log(`WRAPPED_TOKEN_ADDRESS=${wrappedTokenAddress}`);

    console.log("\n✅ All contracts deployed successfully!");

  } catch (error) {
    console.error(`❌ Failed to deploy:`, error.message);
    throw error;
  }
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
}); 