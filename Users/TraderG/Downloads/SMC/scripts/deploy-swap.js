const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy WETH first
    console.log("\n1. Deploying WETH...");
    const WETH = await ethers.getContractFactory("WETH");
    const weth = await WETH.deploy();
    await weth.waitForDeployment();
    console.log("WETH deployed to:", await weth.getAddress());

    // Deploy Factory
    console.log("\n2. Deploying UniswapV2Factory...");
    const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
    const factory = await UniswapV2Factory.deploy();
    await factory.waitForDeployment();
    console.log("Factory deployed to:", await factory.getAddress());

    // Deploy Router
    console.log("\n3. Deploying UniswapV2Router02...");
    const UniswapV2Router02 = await ethers.getContractFactory("UniswapV2Router02");
    const router = await UniswapV2Router02.deploy(await factory.getAddress(), await weth.getAddress());
    await router.waitForDeployment();
    console.log("Router deployed to:", await router.getAddress());

    // Deploy TokenSwap contract
    console.log("\n4. Deploying TokenSwap...");
    const TokenSwap = await ethers.getContractFactory("TokenSwap");
    const tokenSwap = await TokenSwap.deploy(await router.getAddress());
    await tokenSwap.waitForDeployment();
    console.log("TokenSwap deployed to:", await tokenSwap.getAddress());

    // Deploy some test tokens
    console.log("\n5. Deploying test tokens...");
    const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
    
    const tokenA = await SimpleERC20.deploy("Token A", "TKA", ethers.parseEther("1000000"));
    await tokenA.waitForDeployment();
    console.log("Token A deployed to:", await tokenA.getAddress());

    const tokenB = await SimpleERC20.deploy("Token B", "TKB", ethers.parseEther("1000000"));
    await tokenB.waitForDeployment();
    console.log("Token B deployed to:", await tokenB.getAddress());

    // Create a pair
    console.log("\n6. Creating token pair...");
    const tx = await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
    await tx.wait();
    const pairAddress = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
    console.log("Pair created at:", pairAddress);

    // Add initial liquidity
    console.log("\n7. Adding initial liquidity...");
    const pair = await ethers.getContractAt("UniswapV2Pair", pairAddress);
    
    // Approve tokens for router
    await tokenA.approve(await router.getAddress(), ethers.parseEther("1000"));
    await tokenB.approve(await router.getAddress(), ethers.parseEther("1000"));
    
    // Add liquidity
    const addLiquidityTx = await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0,
        deployer.address,
        Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now
    );
    await addLiquidityTx.wait();
    console.log("Initial liquidity added successfully");

    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log("WETH:", await weth.getAddress());
    console.log("Factory:", await factory.getAddress());
    console.log("Router:", await router.getAddress());
    console.log("TokenSwap:", await tokenSwap.getAddress());
    console.log("Token A:", await tokenA.getAddress());
    console.log("Token B:", await tokenB.getAddress());
    console.log("Pair:", pairAddress);
    console.log("========================\n");

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        deployer: deployer.address,
        contracts: {
            weth: await weth.getAddress(),
            factory: await factory.getAddress(),
            router: await router.getAddress(),
            tokenSwap: await tokenSwap.getAddress(),
            tokenA: await tokenA.getAddress(),
            tokenB: await tokenB.getAddress(),
            pair: pairAddress
        },
        timestamp: new Date().toISOString()
    };

    const fs = require('fs');
    fs.writeFileSync(
        `deployment-${hre.network.name}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`Deployment info saved to deployment-${hre.network.name}.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 