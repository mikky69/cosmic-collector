const { ethers } = require('ethers');

console.log('🔄 Starting mnemonic conversion...');

// Replace this with your 24-word seed phrase from HashPack
const mnemonic = "YOUR_24_WORD_SEED_PHRASE_HERE";

async function convertMnemonicToPrivateKey() {
    try {
        console.log('📝 Validating mnemonic...');
        
        if (mnemonic === "YOUR_24_WORD_SEED_PHRASE_HERE") {
            console.log('❌ Error: You need to replace YOUR_24_WORD_SEED_PHRASE_HERE with your actual seed phrase');
            console.log('💡 Edit this file with: nano mnemonic-converter.js');
            return;
        }
        
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
        console.log('💡 Copy the private key above to your .env file as PRIVATE_KEY=' + wallet.privateKey);
        console.log('');
        console.log('🔒 Remember to delete this script after use: rm mnemonic-converter.js');
        
    } catch (error) {
        console.error('❌ Error converting mnemonic:', error.message);
        console.log('');
        console.log('💡 Make sure your mnemonic is exactly 24 words separated by spaces');
        console.log('💡 Example: "word1 word2 word3 ... word24"');
    }
}

convertMnemonicToPrivateKey();