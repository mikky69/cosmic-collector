#!/bin/bash

# 🚀 ONE-COMMAND DEPLOYMENT SCRIPT FOR COSMIC COLLECTOR
# This script handles everything: dependency installation, key conversion, and deployment

echo "🌟 Cosmic Collector - One-Command Deployment"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the 'contracts' directory"
    echo "💡 Run: cd contracts && ./deploy-easy.sh"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Step 2: Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo ""
    echo "🔑 PLEASE UPDATE YOUR .env FILE:"
    echo "   1. Add your Hedera Account ID (0.0.123456)"
    echo "   2. Add your hex private key (0x1234...)"
    echo ""
    echo "💡 To convert your 24-word seed phrase to hex:"
    echo "   Run: node quick-convert.js"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Create quick conversion script
cat > quick-convert.js << 'EOF'
const { ethers } = require('ethers');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔐 Quick Mnemonic to Hex Converter');
console.log('===================================');
console.log('');

rl.question('Enter your 24-word seed phrase: ', (mnemonic) => {
    try {
        if (mnemonic.trim().split(' ').length !== 24) {
            console.log('❌ Error: Please enter exactly 24 words separated by spaces');
        } else {
            const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());
            console.log('');
            console.log('✅ Conversion successful!');
            console.log('');
            console.log('📋 Your hex private key:');
            console.log(wallet.privateKey);
            console.log('');
            console.log('📋 Your wallet address:');
            console.log(wallet.address);
            console.log('');
            console.log('💡 Add this to your .env file as:');
            console.log(`PRIVATE_KEY=${wallet.privateKey}`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    rl.close();
});
EOF

# Step 3: Deploy contracts
echo "🚀 Deploying contracts to Hedera Testnet..."
npm run deploy:testnet

# Check deployment result
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Copy the contract addresses from above"
    echo "   2. Update your React app with these addresses"
    echo "   3. Start playing your game!"
    echo ""
    echo "🧹 Cleaning up..."
    rm -f quick-convert.js
else
    echo ""
    echo "❌ DEPLOYMENT FAILED"
    echo "==================="
    echo ""
    echo "💡 Common solutions:"
    echo "   1. Check your .env file has correct PRIVATE_KEY and ACCOUNT_ID"
    echo "   2. Make sure your account has HBAR for gas fees"
    echo "   3. Verify your private key is in hex format (0x1234...)"
    echo ""
    echo "🔧 To convert seed phrase to hex, run: node quick-convert.js"
fi