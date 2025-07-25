import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hyperion: {
      url: "https://hyperion-testnet.metisdevops.link",
      chainId: 133717,
      accounts: [process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000"],
    },
    metisSepolia: {
      url: "https://metis-sepolia-rpc.publicnode.com",
      chainId: 59902,
      accounts: [process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000"],
    },
    lazchain: {
      url: "https://lazai-testnet.metisdevops.link",
      chainId: 133718,
      accounts: [process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000"],
    },
  },
};

export default config;