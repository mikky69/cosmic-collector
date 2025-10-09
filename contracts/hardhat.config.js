require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Validate environment variables only when deploying
const validateEnv = () => {
  const requiredVars = ['PRIVATE_KEY', 'ACCOUNT_ID'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please copy .env.example to .env and fill in your values\n');
    process.exit(1);
  }
};

// Only validate when running deployment
if (process.argv.includes('deploy.js') || process.argv.includes('verify.js')) {
  validateEnv();
}

// Get environment variables with safe defaults
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
const ACCOUNT_ID = process.env.ACCOUNT_ID || '0.0.123456';

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "london"
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: [PRIVATE_KEY],
      chainId: 296,
      gas: 3000000,
      gasPrice: 100000000000, // 100 gwei
      timeout: 120000,
    },
    hedera_mainnet: {
      url: "https://mainnet.hashio.io/api", 
      accounts: [PRIVATE_KEY],
      chainId: 295,
      gas: 3000000,
      gasPrice: 100000000000, // 100 gwei
      timeout: 120000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 60000,
  },
};