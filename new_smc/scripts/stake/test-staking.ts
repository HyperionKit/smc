import { ethers } from "hardhat";

// Contract addresses (Hyperion deployment)
const TOKENS = {
  USDT: "0x9b52D326D4866055F6c23297656002992e4293FC",
  USDC: "0x31424DB0B7a929283C394b4DA412253Ab6D61682",
  DAI: "0xdE896235F5897EC6D13Aa5b43964F9d2d34D82Fb",
  WETH: "0xc8BB7DB0a07d2146437cc20e1f3a133474546dD4"
};

const STAKING_CONTRACT_ADDRESS = "0xB94d264074571A5099C458f74b526d1e4EE0314B";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("Testing staking functionality with account:", user.address);

  const balance = await ethers.provider.getBalance(user.address);
  console.log("Account balance:", ethers.formatEther(balance), "METIS");

  // Get StakingRewards contract
  const stakingContract = await ethers.getContractAt("StakingRewards", STAKING_CONTRACT_ADDRESS);
  console.log("Staking contract address:", STAKING_CONTRACT_ADDRESS);

  // Get token contracts
  const usdtToken = await ethers.getContractAt("SimpleERC20", TOKENS.USDT);
  const usdcToken = await ethers.getContractAt("SimpleERC20", TOKENS.USDC);

  console.log("\n📊 Contract Information:");
  console.log("Staking Token (USDT):", await stakingContract.stakingToken());
  console.log("Reward Token (USDC):", await stakingContract.rewardToken());
  console.log("AMM Address:", await stakingContract.ammAddress());
  console.log("Reward Rate:", ethers.formatEther(await stakingContract.rewardRate()), "tokens/second");
  console.log("Total Staked:", ethers.formatEther(await stakingContract.totalStaked()));

  // Check user's token balances
  const usdtBalance = await usdtToken.balanceOf(user.address);
  const usdcBalance = await usdcToken.balanceOf(user.address);
  
  console.log("\n💰 User Token Balances:");
  console.log("USDT Balance:", ethers.formatUnits(usdtBalance, 6));
  console.log("USDC Balance:", ethers.formatUnits(usdcBalance, 6));

  // Check staking info
  const stakedBalance = await stakingContract.getStakedBalance(user.address);
  const pendingReward = await stakingContract.getPendingReward(user.address);
  
  console.log("\n📈 Staking Info:");
  console.log("Staked Balance:", ethers.formatUnits(stakedBalance, 6));
  console.log("Pending Reward:", ethers.formatUnits(pendingReward, 6));

  // Test staking if user has USDT
  if (usdtBalance > 0) {
    const stakeAmount = ethers.parseUnits("100", 6); // 100 USDT
    
    if (usdtBalance >= stakeAmount) {
      console.log("\n🚀 Testing staking functionality...");
      
      try {
        // Approve USDT for staking contract
        const allowance = await usdtToken.allowance(user.address, STAKING_CONTRACT_ADDRESS);
        if (allowance < stakeAmount) {
          console.log("Approving USDT for staking contract...");
          const approveTx = await usdtToken.approve(STAKING_CONTRACT_ADDRESS, ethers.MaxUint256);
          await approveTx.wait();
          console.log("✅ USDT approved");
        }

        // Stake USDT
        console.log(`Staking ${ethers.formatUnits(stakeAmount, 6)} USDT...`);
        const stakeTx = await stakingContract.stake(stakeAmount);
        await stakeTx.wait();
        console.log("✅ Staking successful!");

        // Check updated balances
        const newStakedBalance = await stakingContract.getStakedBalance(user.address);
        console.log("New staked balance:", ethers.formatUnits(newStakedBalance, 6));

      } catch (error: any) {
        console.log("❌ Staking failed:", error.message);
      }
    } else {
      console.log("❌ Insufficient USDT balance for staking test");
    }
  } else {
    console.log("❌ No USDT balance to test staking");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 