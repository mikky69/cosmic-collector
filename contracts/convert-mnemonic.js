const { ethers } = require('ethers');

// Script to convert a 24-word mnemonic to hex private key
async function convertMnemonicToPrivateKey() {
    // Replace this with your 24-word seed phrase from HashPack
    const mnemonic = "YOUR_24_WORD_SEED_PHRASE_HERE";
    
    try {
        console.log('🔄 Converting mnemonic to private key...');
        
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
        console.log('💡 Copy the private key above to your .env file as PRIVATE_KEY=');
        
    } catch (error) {
        console.error('❌ Error converting mnemonic:', error.message);
        console.log('');
        console.log('💡 Make sure your mnemonic is exactly 24 words separated by spaces');
        console.log('💡 And that you replaced YOUR_24_WORD_SEED_PHRASE_HERE with your actual seed phrase');
    }
}

convertMnemonicToPrivateKey();