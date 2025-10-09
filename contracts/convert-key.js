const { ethers } = require('ethers');

console.log('🔄 Starting mnemonic conversion...');

// Your 24-word seed phrase from HashPack
const mnemonic = "climb floor collect oblige provide ice dish grief hair grain buddy ocean tuna divert sphere latin grunt kite evidence dilemma course act muffin rice";

async function convertMnemonicToPrivateKey() {
    try {
        console.log('📝 Processing mnemonic...');
        
        // Create wallet from mnemonic (using first account - index 0)
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        
        console.log('✅ Conversion successful!');
        console.log('');
        console.log('📋 Your hex private key for .env file:');
        console.log(wallet.privateKey);
        console.log('');
        console.log('📋 Your wallet address:');
        console.log(wallet.address);
        console.log('');
        console.log('💡 Copy the private key above to your .env file as:');
        console.log('PRIVATE_KEY=' + wallet.privateKey);
        console.log('');
        console.log('🔒 Remember to delete this script after use: rm convert-key.js');
        
    } catch (error) {
        console.error('❌ Error converting mnemonic:', error.message);
        console.log('');
        console.log('💡 Make sure your mnemonic is exactly 24 words separated by spaces');
    }
}

convertMnemonicToPrivateKey();