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
    // Lazchain Network
    lazchain: {
      url: process.env.LAZCHAIN_RPC_URL || "https://testnet.lazai.network",
      chainId: 133718,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
    "lazchain-testnet": {
      url: process.env.LAZCHAIN_RPC_URL || "https://testnet.lazai.network",
      chainId: 133718,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
    // Metis Sepolia Network
    metisSepolia: {
      url: process.env.METISSEPOLIA_RPC_URL || "https://metis-sepolia-rpc.publicnode.com",
      chainId: 59902,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
    "metis-sepolia-testnet": {
      url: process.env.METISSEPOLIA_RPC_URL || "https://metis-sepolia-rpc.publicnode.com",
      chainId: 59902,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
    // Mantle Networks
    mantleTestnet: {
      url: process.env.MANTLE_TESTNET_RPC_URL || "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
    "mantle-testnet": {
      url: process.env.MANTLE_TESTNET_RPC_URL || "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000, // Higher gas limit
      timeout: 120000, // 2 minutes timeout
    },
    mantleMainnet: {
      url: process.env.MANTLE_MAINNET_RPC_URL || "https://rpc.mantle.xyz",
      chainId: 5000,
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
      // Lazchain and Metis Sepolia networks
      lazchain: process.env.ETHERSCAN_API_KEY || "dummy-key",
      "lazchain-testnet": process.env.ETHERSCAN_API_KEY || "dummy-key",
      metisSepolia: process.env.ETHERSCAN_API_KEY || "dummy-key",
      "metis-sepolia-testnet": process.env.ETHERSCAN_API_KEY || "dummy-key",
      // Mantle networks
      mantleTestnet: process.env.ETHERSCAN_API_KEY || "dummy-key",
      "mantle-testnet": process.env.ETHERSCAN_API_KEY || "dummy-key",
      mantleMainnet: process.env.ETHERSCAN_API_KEY || "dummy-key",
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
      // Lazchain networks
      {
        network: "lazchain",
        chainId: 133718,
        urls: {
          apiURL: "https://testnet-explorer.lazai.network/api",
          browserURL: "https://testnet-explorer.lazai.network"
        }
      },
      {
        network: "lazchain-testnet",
        chainId: 133718,
        urls: {
          apiURL: "https://testnet-explorer.lazai.network/api",
          browserURL: "https://testnet-explorer.lazai.network"
        }
      },
      // Metis Sepolia networks
      {
        network: "metisSepolia",
        chainId: 59902,
        urls: {
          apiURL: "https://sepolia.explorer.metis.io/api",
          browserURL: "https://sepolia.explorer.metis.io"
        }
      },
      {
        network: "metis-sepolia-testnet",
        chainId: 59902,
        urls: {
          apiURL: "https://sepolia.explorer.metis.io/api",
          browserURL: "https://sepolia.explorer.metis.io"
        }
      },
      // Mantle networks
      {
        network: "mantleTestnet",
        chainId: 5003,
        urls: {
          apiURL: "https://sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz"
        }
      },
      {
        network: "mantle-testnet",
        chainId: 5003,
        urls: {
          apiURL: "https://sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz"
        }
      },
      {
        network: "mantleMainnet",
        chainId: 5000,
        urls: {
          apiURL: "https://explorer.mantle.xyz/api",
          browserURL: "https://explorer.mantle.xyz"
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