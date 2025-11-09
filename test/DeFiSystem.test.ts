import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleERC20, LiquidityPool } from "../typechain-types";

describe("DeFi System", function () {
  let usdt: SimpleERC20;
  let usdc: SimpleERC20;
  let dai: SimpleERC20;
  let weth: SimpleERC20;
  let liquidityPool: LiquidityPool;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  const INITIAL_SUPPLY = ethers.parseUnits("40000000", 18); // 40M tokens
  const INITIAL_LIQUIDITY = ethers.parseUnits("1000000", 18); // 1M tokens

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy tokens
    const TokenFactory = await ethers.getContractFactory("Token");
    
    usdt = await TokenFactory.deploy("Tether USD", "USDT", 6, ethers.parseUnits("40000000", 6));
    usdc = await TokenFactory.deploy("USD Coin", "USDC", 6, ethers.parseUnits("40000000", 6));
    dai = await TokenFactory.deploy("Dai Stablecoin", "DAI", 18, ethers.parseUnits("40000000", 18));
    weth = await TokenFactory.deploy("Wrapped Ether", "WETH", 18, ethers.parseUnits("40000000", 18));

    // Deploy liquidity pool
    const LiquidityPool = await ethers.getContractFactory("contracts/Swap.sol:LiquidityPool");
    liquidityPool = await LiquidityPool.deploy();

    // Transfer some tokens to users for testing
    await usdt.transfer(user1.address, ethers.parseUnits("1000000", 6));
    await usdc.transfer(user1.address, ethers.parseUnits("1000000", 6));
    await dai.transfer(user1.address, ethers.parseUnits("1000000", 18));
    await weth.transfer(user1.address, ethers.parseUnits("1000000", 18));

    await usdt.transfer(user2.address, ethers.parseUnits("1000000", 6));
    await usdc.transfer(user2.address, ethers.parseUnits("1000000", 6));
    await dai.transfer(user2.address, ethers.parseUnits("1000000", 18));
    await weth.transfer(user2.address, ethers.parseUnits("1000000", 18));
  });

  describe("Token Deployment", function () {
    it("Should deploy tokens with correct parameters", async function () {
      expect(await usdt.name()).to.equal("Tether USD");
      expect(await usdt.symbol()).to.equal("USDT");
      expect(await usdt.decimals()).to.equal(6);
      expect(await usdt.totalSupply()).to.equal(ethers.parseUnits("40000000", 6));

      expect(await usdc.name()).to.equal("USD Coin");
      expect(await usdc.symbol()).to.equal("USDC");
      expect(await usdc.decimals()).to.equal(6);
      expect(await usdc.totalSupply()).to.equal(ethers.parseUnits("40000000", 6));

      expect(await dai.name()).to.equal("Dai Stablecoin");
      expect(await dai.symbol()).to.equal("DAI");
      expect(await dai.decimals()).to.equal(18);
      expect(await dai.totalSupply()).to.equal(ethers.parseUnits("40000000", 18));

      expect(await weth.name()).to.equal("Wrapped Ether");
      expect(await weth.symbol()).to.equal("WETH");
      expect(await weth.decimals()).to.equal(18);
      expect(await weth.totalSupply()).to.equal(ethers.parseUnits("40000000", 18));
    });

    it("Should allow token transfers", async function () {
      const transferAmount = ethers.parseUnits("1000", 6);
      const initialBalance = await usdt.balanceOf(user1.address);
      await usdt.transfer(user1.address, transferAmount);
      const finalBalance = await usdt.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance + transferAmount);
    });
  });

  describe("Liquidity Pool", function () {
    it("Should create pairs correctly", async function () {
      const pairId = await liquidityPool.createPair(await usdt.getAddress(), await usdc.getAddress());
      expect(pairId).to.not.equal(ethers.ZeroHash);
    });

    it("Should not allow creating duplicate pairs", async function () {
      await liquidityPool.createPair(await usdt.getAddress(), await usdc.getAddress());
      await expect(
        liquidityPool.createPair(await usdt.getAddress(), await usdc.getAddress())
      ).to.be.revertedWith("Pair already exists");
    });

    it("Should not allow creating pairs with identical tokens", async function () {
      await expect(
        liquidityPool.createPair(await usdt.getAddress(), await usdt.getAddress())
      ).to.be.revertedWith("Identical tokens");
    });

    it("Should not allow creating pairs with zero addresses", async function () {
      await expect(
        liquidityPool.createPair(ethers.ZeroAddress, await usdt.getAddress())
      ).to.be.revertedWith("Zero address");
    });
  });

  describe("Liquidity Provision", function () {
    beforeEach(async function () {
      await liquidityPool.createPair(await usdt.getAddress(), await usdc.getAddress());
    });

    it("Should add initial liquidity correctly", async function () {
      const usdtAddress = await usdt.getAddress();
      const usdcAddress = await usdc.getAddress();
      
      await usdt.approve(await liquidityPool.getAddress(), ethers.MaxUint256);
      await usdc.approve(await liquidityPool.getAddress(), ethers.MaxUint256);

      const liquidityAmount = ethers.parseUnits("1000000", 6);
      
      await liquidityPool.addLiquidity(
        usdtAddress,
        usdcAddress,
        liquidityAmount,
        liquidityAmount,
        0,
        0
      );

      const pairInfo = await liquidityPool.getPairInfo(usdtAddress, usdcAddress);
      expect(pairInfo.reserveA).to.equal(liquidityAmount);
      expect(pairInfo.reserveB).to.equal(liquidityAmount);
      expect(pairInfo.totalLiquidity).to.be.gt(0);
    });

    it("Should track user liquidity positions", async function () {
      const usdtAddress = await usdt.getAddress();
      const usdcAddress = await usdc.getAddress();
      
      await usdt.approve(await liquidityPool.getAddress(), ethers.MaxUint256);
      await usdc.approve(await liquidityPool.getAddress(), ethers.MaxUint256);

      const liquidityAmount = ethers.parseUnits("1000000", 6);
      
      await liquidityPool.addLiquidity(
        usdtAddress,
        usdcAddress,
        liquidityAmount,
        liquidityAmount,
        0,
        0
      );

      const userLiquidity = await liquidityPool.getUserLiquidity(usdtAddress, usdcAddress, owner.address);
      expect(userLiquidity).to.be.gt(0);
    });
  });

  describe("Token Swapping", function () {
    beforeEach(async function () {
      await liquidityPool.createPair(await usdt.getAddress(), await usdc.getAddress());
      
      // Add initial liquidity
      const usdtAddress = await usdt.getAddress();
      const usdcAddress = await usdc.getAddress();
      
      await usdt.approve(await liquidityPool.getAddress(), ethers.MaxUint256);
      await usdc.approve(await liquidityPool.getAddress(), ethers.MaxUint256);

      const liquidityAmount = ethers.parseUnits("1000000", 6);
      
      await liquidityPool.addLiquidity(
        usdtAddress,
        usdcAddress,
        liquidityAmount,
        liquidityAmount,
        0,
        0
      );
    });

    it("Should calculate correct output amounts", async function () {
      const usdtAddress = await usdt.getAddress();
      const usdcAddress = await usdc.getAddress();
      
      const swapAmount = ethers.parseUnits("1000", 6);
      const amountOut = await liquidityPool.getAmountOut(swapAmount, usdtAddress, usdcAddress);
      
      expect(amountOut).to.be.gt(0);
      expect(amountOut).to.be.lt(swapAmount); // Due to fees
    });

    it("Should execute swaps correctly", async function () {
      const usdtAddress = await usdt.getAddress();
      const usdcAddress = await usdc.getAddress();
      
      const initialUsdtBalance = await usdt.balanceOf(user1.address);
      const initialUsdcBalance = await usdc.balanceOf(user1.address);
      
      const swapAmount = ethers.parseUnits("1000", 6);
      
      await usdt.connect(user1).approve(await liquidityPool.getAddress(), swapAmount);
      
      const tx = await liquidityPool.connect(user1).swap(
        usdtAddress,
        usdcAddress,
        swapAmount,
        0
      );
      
      await tx.wait();
      
      const finalUsdtBalance = await usdt.balanceOf(user1.address);
      const finalUsdcBalance = await usdc.balanceOf(user1.address);
      
      expect(finalUsdtBalance).to.be.lt(initialUsdtBalance);
      expect(finalUsdcBalance).to.be.gt(initialUsdcBalance);
    });

    it("Should revert swap with insufficient balance", async function () {
      const usdtAddress = await usdt.getAddress();
      const usdcAddress = await usdc.getAddress();
      
      const swapAmount = ethers.parseUnits("10000000", 6); // More than user has
      
      await usdt.connect(user1).approve(await liquidityPool.getAddress(), swapAmount);
      
      await expect(
        liquidityPool.connect(user1).swap(
          usdtAddress,
          usdcAddress,
          swapAmount,
          0
        )
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Liquidity Removal", function () {
    beforeEach(async function () {
      await liquidityPool.createPair(await usdt.getAddress(), await usdc.getAddress());
      
      // Add initial liquidity
      const usdtAddress = await usdt.getAddress();
      const usdcAddress = await usdc.getAddress();
      
      await usdt.approve(await liquidityPool.getAddress(), ethers.MaxUint256);
      await usdc.approve(await liquidityPool.getAddress(), ethers.MaxUint256);

      const liquidityAmount = ethers.parseUnits("1000000", 6);
      
      await liquidityPool.addLiquidity(
        usdtAddress,
        usdcAddress,
        liquidityAmount,
        liquidityAmount,
        0,
        0
      );
    });

    it("Should remove liquidity correctly", async function () {
      const usdtAddress = await usdt.getAddress();
      const usdcAddress = await usdc.getAddress();
      
      const userLiquidity = await liquidityPool.getUserLiquidity(usdtAddress, usdcAddress, owner.address);
      const removeAmount = userLiquidity / 2n; // Remove half
      
      const initialUsdtBalance = await usdt.balanceOf(owner.address);
      const initialUsdcBalance = await usdc.balanceOf(owner.address);
      
      await liquidityPool.removeLiquidity(
        usdtAddress,
        usdcAddress,
        removeAmount,
        0,
        0
      );
      
      const finalUsdtBalance = await usdt.balanceOf(owner.address);
      const finalUsdcBalance = await usdc.balanceOf(owner.address);
      
      expect(finalUsdtBalance).to.be.gt(initialUsdtBalance);
      expect(finalUsdcBalance).to.be.gt(initialUsdcBalance);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause and unpause", async function () {
      await liquidityPool.pause();
      expect(await liquidityPool.paused()).to.be.true;
      
      await liquidityPool.unpause();
      expect(await liquidityPool.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        liquidityPool.connect(user1).pause()
      ).to.be.revertedWithCustomError(liquidityPool, "OwnableUnauthorizedAccount");
    });

    it("Should not allow operations when paused", async function () {
      await liquidityPool.pause();
      
      await expect(
        liquidityPool.createPair(await usdt.getAddress(), await usdc.getAddress())
      ).to.be.revertedWith("Contract is paused");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update trading fee", async function () {
      const newFee = 50; // 0.5%
      await liquidityPool.setTradingFee(newFee);
      expect(await liquidityPool.tradingFee()).to.equal(newFee);
    });

    it("Should not allow setting fee too high", async function () {
      const highFee = 2000; // 20%
      await expect(
        liquidityPool.setTradingFee(highFee)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should not allow non-owner to update fee", async function () {
      await expect(
        liquidityPool.connect(user1).setTradingFee(50)
      ).to.be.revertedWithCustomError(liquidityPool, "OwnableUnauthorizedAccount");
    });
  });
}); 