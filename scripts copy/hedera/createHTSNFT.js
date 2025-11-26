const {
    Client,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    PrivateKey,
    AccountId,
    Hbar
} = require("@hashgraph/sdk");
require("dotenv").config();

async function createSpaceshipNFT() {
    console.log("🚀 Creating Spaceship NFT Collection on Hedera...\n");

    if (!process.env.OPERATOR_ID || !process.env.OPERATOR_KEY || !process.env.TREASURY_ACCOUNT_ID || !process.env.TREASURY_PRIVATE_KEY) {
        throw new Error("Please make sure OPERATOR_ID, OPERATOR_KEY, TREASURY_ACCOUNT_ID, and TREASURY_PRIVATE_KEY are set in your .env file.");
    }

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const treasuryKey = PrivateKey.fromStringECDSA(process.env.TREASURY_PRIVATE_KEY);

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);
        // Create NFT collection
    try {
        const nftCreateTx = await new TokenCreateTransaction()
            .setTokenName("Cosmic Spaceship")
            .setTokenSymbol("CSHIP")
            .setTokenType(TokenType.NonFungibleUnique)
            .setSupplyType(TokenSupplyType.Infinite)
            .setTreasuryAccountId(treasuryId)
            .setAdminKey(operatorKey.publicKey)
            .setSupplyKey(operatorKey.publicKey)
            .setFreezeKey(operatorKey.publicKey)
            .setPauseKey(operatorKey.publicKey)
            .setMaxTransactionFee(new Hbar(30))
            .freezeWith(client);
        
        // The treasury account must always sign a TokenCreateTransaction to consent to receiving the tokens.
        const signedTx = await (await nftCreateTx.sign(operatorKey)).sign(treasuryKey);

        const txResponse = await signedTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const tokenId = receipt.tokenId;

        console.log("✅ NFT Collection Created Successfully!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`Token ID: ${tokenId}`);
        console.log(`Collection Name: Cosmic Spaceship`);
        console.log(`Symbol: CSHIP`);
        console.log(`Type: Non-Fungible Token (NFT)`);
        console.log(`Treasury: ${treasuryId}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        console.log("⚠️  IMPORTANT: Add this to your .env file:");
        console.log(`SPACESHIP_NFT_TOKEN_ID=${tokenId}\n`);
        console.log(`🔗 View on HashScan: https://hashscan.io/testnet/token/${tokenId}`);

        return tokenId;
    } catch (error) {
        console.error("❌ Error creating NFT collection:", error);
        throw error;
    } finally {
        client.close();
    }
}

if (require.main === module) {
    createSpaceshipNFT().catch((error) => {
        console.error("Process failed:", error);
        process.exit(1);
    });
}

module.exports = { createSpaceshipNFT };