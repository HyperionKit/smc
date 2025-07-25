const { ethers, hre } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy contracts on each network
  await deployToNetwork("hyperion", 59903);
  await deployToNetwork("metisSepolia", 59902);
  await deployToNetwork("lazchain", 59904);

  console.log("✅ All contracts deployed successfully!");
}

async function deployToNetwork(networkName, chainId) {
  console.log(`\n🚀 Deploying to ${networkName} (Chain ID: ${chainId})...`);

  // Get provider and wallet for the network using hardhat config
  const networkConfig = hre.config.networks[networkName];
  const provider = new ethers.JsonRpcProvider(networkConfig.url);
  const wallet = new ethers.Wallet(networkConfig.accounts[0], provider);

  try {
    // 1. Deploy Bridge Contract
    console.log(`  📦 Deploying Bridge contract...`);
    const Bridge = await ethers.getContractFactory("Bridge", wallet);
    const bridge = await Bridge.deploy();
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`    ✅ Bridge deployed: ${bridgeAddress}`);

    // 2. Deploy WrappedTokenFactory
    console.log(`  📦 Deploying WrappedTokenFactory...`);
    const WrappedTokenFactory = await ethers.getContractFactory("WrappedTokenFactory", wallet);
    const tokenFactory = await WrappedTokenFactory.deploy();
    await tokenFactory.waitForDeployment();
    const tokenFactoryAddress = await tokenFactory.getAddress();
    console.log(`    ✅ WrappedTokenFactory deployed: ${tokenFactoryAddress}`);

    // 3. Deploy Relayer
    console.log(`  📦 Deploying Relayer...`);
    const Relayer = await ethers.getContractFactory("Relayer", wallet);
    const relayer = await Relayer.deploy(bridgeAddress, tokenFactoryAddress);
    await relayer.waitForDeployment();
    const relayerAddress = await relayer.getAddress();
    console.log(`    ✅ Relayer deployed: ${relayerAddress}`);

    // 4. Deploy MessageSender
    console.log(`  📦 Deploying MessageSender...`);
    const MessageSender = await ethers.getContractFactory("MessageSender", wallet);
    const messageSender = await MessageSender.deploy(
      process.env[`${networkName.toUpperCase()}_BRIDGE_ADDRESS`] || ethers.ZeroAddress, // Metis bridge address
      bridgeAddress
    );
    await messageSender.waitForDeployment();
    const messageSenderAddress = await messageSender.getAddress();
    console.log(`    ✅ MessageSender deployed: ${messageSenderAddress}`);

    // 5. Deploy MessageReceiver
    console.log(`  📦 Deploying MessageReceiver...`);
    const MessageReceiver = await ethers.getContractFactory("MessageReceiver", wallet);
    const messageReceiver = await MessageReceiver.deploy(
      process.env[`${networkName.toUpperCase()}_BRIDGE_ADDRESS`] || ethers.ZeroAddress,
      tokenFactoryAddress,
      messageSenderAddress,
      chainId
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
    if (networkName === "hyperion") {
      console.log(`  ⚙️  Adding supported tokens...`);
      const tMetisAddress = "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301"; // tMetis on Hyperion
      await bridge.addSupportedToken(
        tMetisAddress,
        ethers.parseEther("0.1"), // min amount
        ethers.parseEther("1000000"), // max amount
        ethers.parseEther("10000") // daily limit
      );
      console.log(`    ✅ tMetis added as supported token: ${tMetisAddress}`);
    }

    // 9. Set up cross-chain destinations
    console.log(`  ⚙️  Setting up cross-chain destinations...`);
    const otherNetworks = {
      hyperion: { chainId: 59903, messageSender: "" },
      metisSepolia: { chainId: 59902, messageSender: "" },
      lazchain: { chainId: 59904, messageSender: "" }
    };

    // This would be updated with actual deployed addresses
    // For now, we'll set placeholder addresses
    for (const [netName, netInfo] of Object.entries(otherNetworks)) {
      if (netName !== networkName) {
        await messageSender.setDestination(netInfo.chainId, messageReceiverAddress);
        console.log(`    ✅ Destination set for ${netName} (${netInfo.chainId}): ${messageReceiverAddress}`);
      }
    }

    // 10. Create a wrapped token example
    console.log(`  ⚙️  Creating example wrapped token...`);
    const wrappedTokenAddress = await tokenFactory.createWrappedToken(
      ethers.ZeroAddress, // Will be set to actual token address
      chainId,
      `Wrapped tMetis on ${networkName}`,
      `wtMetis-${networkName}`,
      18
    );
    console.log(`    ✅ Example wrapped token created: ${wrappedTokenAddress}`);

    // Log deployment summary
    console.log(`\n📋 ${networkName.toUpperCase()} Deployment Summary:`);
    console.log(`  Bridge: ${bridgeAddress}`);
    console.log(`  WrappedTokenFactory: ${tokenFactoryAddress}`);
    console.log(`  Relayer: ${relayerAddress}`);
    console.log(`  MessageSender: ${messageSenderAddress}`);
    console.log(`  MessageReceiver: ${messageReceiverAddress}`);

    // Save deployment addresses to environment variables format
    console.log(`\n🔧 Environment variables for ${networkName}:`);
    console.log(`${networkName.toUpperCase()}_BRIDGE_ADDRESS=${bridgeAddress}`);
    console.log(`${networkName.toUpperCase()}_TOKEN_FACTORY_ADDRESS=${tokenFactoryAddress}`);
    console.log(`${networkName.toUpperCase()}_RELAYER_ADDRESS=${relayerAddress}`);
    console.log(`${networkName.toUpperCase()}_MESSAGE_SENDER_ADDRESS=${messageSenderAddress}`);
    console.log(`${networkName.toUpperCase()}_MESSAGE_RECEIVER_ADDRESS=${messageReceiverAddress}`);

  } catch (error) {
    console.error(`❌ Failed to deploy to ${networkName}:`, error.message);
    throw error;
  }
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});