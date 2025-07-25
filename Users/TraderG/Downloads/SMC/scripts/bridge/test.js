const { ethers } = require("hardhat");

async function main() {
  const [user] = await ethers.getSigners();

  // Hyperion: Lock tokens
  const tokenLock = await ethers.getContractAt("TokenLock", "TOKEN_LOCK_ADDRESS", user);
  const tMetis = await ethers.getContractAt("IERC20", "0x94765A5Ad79aE18c6913449Bf008A0B5f247D301", user);
  await tMetis.approve(tokenLock.address, ethers.utils.parseEther("100"));
  await tokenLock.lockTokens(ethers.utils.parseEther("100"), 59902); // To Metis Sepolia

  // Simulate message sending (in practice, a relayer would call this)
  const messageSender = await ethers.getContractAt("MessageSender", "MESSAGE_SENDER_ADDRESS", user);
  await messageSender.sendLockMessage(user.address, ethers.utils.parseEther("100"), 59902, { value: ethers.utils.parseEther("0.01") });

  // Metis Sepolia: Receive message (simulated by relayer)
  const metisProvider = new ethers.providers.JsonRpcProvider(process.env.METIS_SEPOLIA_RPC_URL);
  const metisUser = new ethers.Wallet(process.env.PRIVATE_KEY, metisProvider);
  const messageReceiver = await ethers.getContractAt("MessageReceiver", "MESSAGE_RECEIVER_ADDRESS", metisUser);
  const message = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256"],
    [user.address, ethers.utils.parseEther("100"), 0]
  );
  await messageReceiver.receiveMessage(message);

  // Reverse: Burn on Metis Sepolia
  const tokenMint = await ethers.getContractAt("TokenMint", "TOKEN_MINT_ADDRESS", metisUser);
  await tokenMint.burnTokens(ethers.utils.parseEther("100"), 59903);

  // Simulate burn message
  await messageReceiver.sendBurnMessage(user.address, ethers.utils.parseEther("100"), 59903, { value: ethers.utils.parseEther("0.01") });

  // Hyperion: Release tokens
  const hyperionProvider = new ethers.providers.JsonRpcProvider(process.env.HYPERION_RPC_URL);
  const hyperionUser = new ethers.Wallet(process.env.PRIVATE_KEY, hyperionProvider);
  const tokenLockHyperion = await ethers.getContractAt("TokenLock", "TOKEN_LOCK_ADDRESS", hyperionUser);
  await tokenLockHyperion.releaseTokens(user.address, ethers.utils.parseEther("100"), 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});