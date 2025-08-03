import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  sourcify: {
    enabled: false
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    hyperion: {
      url: process.env.HYPERION_RPC_URL || "https://hyperion-testnet.metisdevops.link",
      chainId: 133717,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
    "metis-hyperion-testnet": {
      url: process.env.HYPERION_RPC_URL || "https://hyperion-testnet.metisdevops.link",
      chainId: 133717,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
    lazchain: {
      url: process.env.LAZCHAIN_RPC_URL || "https://lazai-testnet.metisdevops.link",
      chainId: 133718,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
    "lazchain-testnet": {
      url: process.env.LAZCHAIN_RPC_URL || "https://lazai-testnet.metisdevops.link",
      chainId: 133718,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
    metisSepolia: {
      url: process.env.METISSEPOLIA_RPC_URL || "https://metis-sepolia-rpc.publicnode.com",
      chainId: 59902,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
  },
  etherscan: {
    apiKey: {
      hyperion: process.env.ETHERSCAN_API_KEY || "dummy-key",
      "metis-hyperion-testnet": "empty",
      lazchain: process.env.ETHERSCAN_API_KEY || "dummy-key",
      "lazchain-testnet": process.env.ETHERSCAN_API_KEY || "dummy-key",
      metisSepolia: process.env.ETHERSCAN_API_KEY || "dummy-key",
      "metisSepolia-testnet": process.env.ETHERSCAN_API_KEY || "dummy-key",
    },
    customChains: [
      {
        network: "hyperion",
        chainId: 133717,
        urls: {
          apiURL: "https://hyperion-testnet.metisdevops.link/api",
          browserURL: "https://hyperion-testnet.metisdevops.link"
        }
      },
      {
        network: "metis-hyperion-testnet",
        chainId: 133717,
        urls: {
          apiURL: "https://hyperion-testnet-explorer-api.metisdevops.link/api",
          browserURL: "https://hyperion-testnet-explorer.metisdevops.link"
        }
      },
      {
        network: "lazchain",
        chainId: 133718,
        urls: {
          apiURL: "https://explorer.lazai-testnet.metisdevops.link/api",
          browserURL: "https://explorer.lazai-testnet.metisdevops.link"
        }
      },
      {
        network: "lazchain-testnet",
        chainId: 133718,
        urls: {
          apiURL: "https://lazai-testnet-explorer.metisdevops.link/api",
          browserURL: "https://lazai-testnet-explorer.metisdevops.link"
        }
      },
      {
        network: "metisSepolia",
        chainId: 59902,
        urls: {
          apiURL: "https://sepolia.explorer.metis.io/api",
          browserURL: "https://sepolia.explorer.metis.io"
        }
      },
      {
        network: "metisSepolia-testnet",
        chainId: 59902,
        urls: {
          apiURL: "https://sepolia.explorer.metis.io/api",
          browserURL: "https://sepolia.explorer.metis.io"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  mocha: {
    timeout: 40000,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;