const {
    Client,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    PrivateKey,
    AccountId,
    CustomFee,
    CustomFixedFee,
    Hbar
} = require("@hashgraph/sdk");
require("dotenv").config();

async function createCOSMToken() {
    console.log("🚀 Creating $COSM Token on Hedera...\n");

    if (!process.env.OPERATOR_ID || !process.env.OPERATOR_KEY || !process.env.TREASURY_ACCOUNT_ID || !process.env.TREASURY_PRIVATE_KEY) {
        throw new Error("Please make sure OPERATOR_ID, OPERATOR_KEY, TREASURY_ACCOUNT_ID, and TREASURY_PRIVATE_KEY are set in your .env file.");
    }

    // Configure client
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const treasuryKey = PrivateKey.fromStringECDSA(process.env.TREASURY_PRIVATE_KEY);
    
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    try {
        // Create custom fee (2-8% can be set later)
        const customFee = new CustomFixedFee()
            .setAmount(2) // Will be percentage-based in practice
            .setFeeCollectorAccountId(treasuryId);

        // Create token
        const tokenCreateTx = await new TokenCreateTransaction()
            .setTokenName("Cosmic Token")
            .setTokenSymbol("$COSM")
            // Hedera's max supply for a token is 2^63 - 1 atomic units.
            // To have 1 billion whole tokens, we must use fewer than 10 decimals. Let's use 8.
            .setDecimals(8)
            // Supply must be in atomic units. For 1 billion tokens with 8 decimals,
            // the value is 1,000,000,000 * 10^8.
            .setInitialSupply(1_000_000_000n * 10n**8n)
            .setTokenType(TokenType.FungibleCommon)
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(1_000_000_000n * 10n**8n)
            .setTreasuryAccountId(treasuryId)
            .setAdminKey(operatorKey.publicKey)
            .setSupplyKey(operatorKey.publicKey) // For burning
            .setFreezeKey(operatorKey.publicKey)
            .setPauseKey(operatorKey.publicKey)
            .setFeeScheduleKey(operatorKey.publicKey)
            .freezeWith(client);

        // The treasury account must sign the transaction to receive the initial supply
        const signedTx = await (await tokenCreateTx.sign(operatorKey)).sign(treasuryKey);

        const txResponse = await signedTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const tokenId = receipt.tokenId;

        console.log("✅ Token Created Successfully!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`Token ID: ${tokenId}`);
        console.log(`Token Name: Cosmic Token`);
        console.log(`Symbol: $COSM`);
        console.log(`Total Supply: 1,000,000,000`);
        console.log(`Treasury: ${treasuryId}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        console.log("⚠️  IMPORTANT: Add this to your .env file:");
        console.log(`COSM_TOKEN_ID=${tokenId}\n`);
        console.log(`🔗 View on HashScan: https://hashscan.io/testnet/token/${tokenId}`);

        return tokenId;
    } catch (error) {
        console.error("❌ Error creating token:", error);
        throw error;
    } finally {
        client.close();
    }
}

// Run if called directly
if (require.main === module) {
    createCOSMToken()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { createCOSMToken };