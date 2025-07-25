const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Swap System", function () {
    let factory, router, tokenSwap, weth, tokenA, tokenB, pair;
    let owner, user1, user2;
    
    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        
        // Deploy WETH
        const WETH = await ethers.getContractFactory("WETH");
        weth = await WETH.deploy();
        
        // Deploy Factory
        const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
        factory = await UniswapV2Factory.deploy();
        
        // Deploy Router
        const UniswapV2Router02 = await ethers.getContractFactory("UniswapV2Router02");
        router = await UniswapV2Router02.deploy(await factory.getAddress(), await weth.getAddress());
        
        // Deploy TokenSwap
        const TokenSwap = await ethers.getContractFactory("TokenSwap");
        tokenSwap = await TokenSwap.deploy(await router.getAddress());
        
        // Deploy test tokens
        const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
        tokenA = await SimpleERC20.deploy("Token A", "TKA", ethers.parseEther("1000000"));
        tokenB = await SimpleERC20.deploy("Token B", "TKB", ethers.parseEther("1000000"));
        
        // Create pair
        await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
        const pairAddress = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
        pair = await ethers.getContractAt("UniswapV2Pair", pairAddress);
        
        // Add initial liquidity
        await tokenA.approve(await router.getAddress(), ethers.parseEther("1000"));
        await tokenB.approve(await router.getAddress(), ethers.parseEther("1000"));
        
        await router.addLiquidity(
            await tokenA.getAddress(),
            await tokenB.getAddress(),
            ethers.parseEther("1000"),
            ethers.parseEther("1000"),
            0,
            0,
            owner.address,
            Math.floor(Date.now() / 1000) + 60 * 20
        );
    });
    
    describe("Deployment", function () {
        it("Should deploy all contracts correctly", async function () {
            expect(await factory.getAddress()).to.not.equal(ethers.ZeroAddress);
            expect(await router.getAddress()).to.not.equal(ethers.ZeroAddress);
            expect(await tokenSwap.getAddress()).to.not.equal(ethers.ZeroAddress);
            expect(await weth.getAddress()).to.not.equal(ethers.ZeroAddress);
        });
        
        it("Should create pair correctly", async function () {
            const pairAddress = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
            expect(pairAddress).to.not.equal(ethers.ZeroAddress);
        });
        
        it("Should have initial liquidity", async function () {
            const reserves = await pair.getReserves();
            expect(reserves[0]).to.be.gt(0);
            expect(reserves[1]).to.be.gt(0);
        });
    });
    
    describe("TokenSwap", function () {
        beforeEach(async function () {
            // Transfer tokens to user1
            await tokenA.transfer(user1.address, ethers.parseEther("100"));
            await tokenB.transfer(user1.address, ethers.parseEther("100"));
        });
        
        it("Should get correct amount out", async function () {
            const amountIn = ethers.parseEther("10");
            const amountOut = await tokenSwap.getAmountOut(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                amountIn
            );
            expect(amountOut).to.be.gt(0);
        });
        
        it("Should get correct amount in", async function () {
            const amountOut = ethers.parseEther("5");
            const amountIn = await tokenSwap.getAmountIn(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                amountOut
            );
            expect(amountIn).to.be.gt(0);
        });
        
        it("Should calculate minimum amount out with slippage", async function () {
            const amountOut = ethers.parseEther("10");
            const minAmountOut = await tokenSwap.calculateMinAmountOut(amountOut);
            expect(minAmountOut).to.be.lt(amountOut);
        });
        
        it("Should execute swap correctly", async function () {
            const swapAmount = ethers.parseEther("10");
            const expectedOutput = await tokenSwap.getAmountOut(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                swapAmount
            );
            const minOutput = await tokenSwap.calculateMinAmountOut(expectedOutput);
            
            // Approve tokens
            await tokenA.connect(user1).approve(await tokenSwap.getAddress(), swapAmount);
            
            // Get initial balances
            const initialTokenA = await tokenA.balanceOf(user1.address);
            const initialTokenB = await tokenB.balanceOf(user1.address);
            
            // Execute swap
            const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
            await tokenSwap.connect(user1).swapExactTokensForTokens(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                swapAmount,
                minOutput,
                deadline
            );
            
            // Check final balances
            const finalTokenA = await tokenA.balanceOf(user1.address);
            const finalTokenB = await tokenB.balanceOf(user1.address);
            
            expect(finalTokenA).to.be.lt(initialTokenA);
            expect(finalTokenB).to.be.gt(initialTokenB);
        });
        
        it("Should check pair existence", async function () {
            const exists = await tokenSwap.pairExists(await tokenA.getAddress(), await tokenB.getAddress());
            expect(exists).to.be.true;
        });
        
        it("Should update slippage tolerance", async function () {
            const newSlippage = 100; // 1%
            await tokenSwap.updateSlippageTolerance(newSlippage);
            expect(await tokenSwap.slippageTolerance()).to.equal(newSlippage);
        });
    });
    
    describe("WETH", function () {
        it("Should wrap ETH correctly", async function () {
            const wrapAmount = ethers.parseEther("1");
            await weth.deposit({ value: wrapAmount });
            expect(await weth.balanceOf(owner.address)).to.equal(wrapAmount);
        });
        
        it("Should unwrap ETH correctly", async function () {
            const wrapAmount = ethers.parseEther("1");
            await weth.deposit({ value: wrapAmount });
            
            const initialBalance = await ethers.provider.getBalance(owner.address);
            await weth.withdraw(wrapAmount);
            const finalBalance = await ethers.provider.getBalance(owner.address);
            
            expect(finalBalance).to.be.gt(initialBalance);
        });
    });
    
    describe("Router", function () {
        beforeEach(async function () {
            await tokenA.transfer(user1.address, ethers.parseEther("100"));
            await tokenB.transfer(user1.address, ethers.parseEther("100"));
        });
        
        it("Should get amounts out", async function () {
            const amountIn = ethers.parseEther("10");
            const path = [await tokenA.getAddress(), await tokenB.getAddress()];
            const amounts = await router.getAmountsOut(amountIn, path);
            expect(amounts[1]).to.be.gt(0);
        });
        
        it("Should get amounts in", async function () {
            const amountOut = ethers.parseEther("5");
            const path = [await tokenA.getAddress(), await tokenB.getAddress()];
            const amounts = await router.getAmountsIn(amountOut, path);
            expect(amounts[0]).to.be.gt(0);
        });
    });
}); 