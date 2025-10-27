/**
 * Deployment Script for Cosmic Collection Smart Contracts on Hedera
 * Author: Engr. Mikailu Nadro
 * 
 * INSTRUCTIONS:
 * 1. Install dependencies: npm install
 * 2. Create .env file with your Hedera credentials
 * 3. Run: node scripts/deploy-contracts.js
 */

console.log('========================================');
console.log('🌟 Cosmic Collection - Contract Deployment');
console.log('========================================\n');

console.log('⚠️  DEPLOYMENT INSTRUCTIONS:\n');
console.log('1. Install Hedera SDK:');
console.log('   npm install @hashgraph/sdk dotenv\n');
console.log('2. Create .env file with:');
console.log('   HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID');
console.log('   HEDERA_OPERATOR_KEY=your-private-key');
console.log('   HEDERA_NETWORK=testnet\n');
console.log('3. Compile contracts:');
console.log('   npm install -g solc');
console.log('   mkdir -p contracts/compiled');
console.log('   solc --bin --abi contracts/*.sol -o contracts/compiled/\n');
console.log('4. Run this script:');
console.log('   node scripts/deploy-contracts.js\n');
console.log('========================================\n');

// Check if @hashgraph/sdk is installed
try {
    require.resolve('@hashgraph/sdk');
    require.resolve('dotenv');
    console.log('✅ Dependencies installed\n');
} catch (e) {
    console.log('❌ Missing dependencies. Please run:');
    console.log('   npm install @hashgraph/sdk dotenv\n');
    process.exit(1);
}

// Load environment variables
require('dotenv').config();

if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
    console.log('❌ Missing environment variables!');
    console.log('Please create .env file with your Hedera credentials.\n');
    process.exit(1);
}

console.log('📋 Configuration:');
console.log('   Operator ID:', process.env.HEDERA_OPERATOR_ID);
console.log('   Network:', process.env.HEDERA_NETWORK || 'testnet');
console.log('');

console.log('🚀 To deploy contracts, you need to:');
console.log('   1. Compile Solidity files (see instructions above)');
console.log('   2. Have compiled .bin files in contracts/compiled/');
console.log('   3. Have sufficient HBAR in your account (minimum 50 HBAR)\n');

console.log('📝 After deployment:');
console.log('   1. Contract IDs will be saved to deployment-info.json');
console.log('   2. Update contract IDs in scripts/hedera-service.js');
console.log('   3. Test your deployment with: npm start\n');

console.log('========================================');
console.log('✨ Ready to deploy!');
console.log('========================================\n');

console.log('For full deployment guide, see the implementation docs.');
console.log('Need help? Check: https://docs.hedera.com\n');
