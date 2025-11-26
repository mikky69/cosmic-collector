require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

// Pre-flight checks to ensure essential environment variables are set.
if (!process.env.HEDERA_TESTNET_URL) {
  throw new Error("Please set your HEDERA_TESTNET_URL in a .env file");
}
if (!process.env.OPERATOR_KEY) {
  throw new Error("Please set your OPERATOR_KEY in a .env file");
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Hedera Testnet
    hederaTestnet: {
      // Use the RPC URL from the .env file for consistency
      url: process.env.HEDERA_TESTNET_URL,
      // Use the correct OPERATOR_KEY and add the '0x' prefix for ethers.js
      accounts: [`0x${process.env.OPERATOR_KEY}`],
      chainId: 296,
      timeout: 120000 // 120 seconds
    },
    // Hedera Mainnet (for future)
    hederaMainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: process.env.MAINNET_PRIVATE_KEY
        ? [`0x${process.env.MAINNET_PRIVATE_KEY}`]
        : [],
      chainId: 295,
    },
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  etherscan: {
    apiKey: {
      // No real API key is needed for HashScan, but the property must exist
      hederaTestnet: "test",
      hederaMainnet: "main",
    },
    customChains: [
      {
        network: "hederaTestnet",
        chainId: 296, // Must match the chainId in the networks object
        urls: {
          apiURL: "https://testnet.hashscan.io/api", // API URL for verification
          browserURL: "https://hashscan.io/testnet/", // URL of the block explorer
        },
      },
      {
        network: "hederaMainnet",
        chainId: 295, // Must match the chainId in the networks object
        urls: {
          apiURL: "https://mainnet.hashscan.io/api",
          browserURL: "https://hashscan.io/mainnet/",
        },
      },
    ],
  },
  mocha: {
    timeout: 3600000 // 1 hour for long-running tasks
  }
};
