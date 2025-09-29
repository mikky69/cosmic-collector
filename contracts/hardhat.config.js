require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    "hedera-testnet": {
      url: "https://testnet.hashio.io/api",
      chainId: 296,
      accounts: [
        // Add your private key here for deployment
        // process.env.DEPLOYER_PRIVATE_KEY
        "0x0000000000000000000000000000000000000000000000000000000000000000" // REPLACE WITH REAL KEY
      ],
      gas: 3000000,
      gasPrice: 20000000000 // 20 gwei
    },
    "hedera-mainnet": {
      url: "https://mainnet.hashio.io/api",
      chainId: 295,
      accounts: [
        // Add your private key here for deployment
        // process.env.DEPLOYER_PRIVATE_KEY
        "0x0000000000000000000000000000000000000000000000000000000000000000" // REPLACE WITH REAL KEY
      ],
      gas: 3000000,
      gasPrice: 20000000000 // 20 gwei
    },
    hardhat: {
      chainId: 1337
    }
  },
  etherscan: {
    apiKey: {
      hedera: "HEDERA" // Placeholder for Hedera network verification
    },
    customChains: [
      {
        network: "hedera",
        chainId: 296,
        urls: {
          apiURL: "https://testnet.hashio.io/api",
          browserURL: "https://hashscan.io/testnet"
        }
      }
    ]
  }
};