const {
    Client,
    PrivateKey,
    AccountId,
    TokenMintTransaction,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function mintNewNFT() {
    console.log("🚀 Minting a new NFT into the Spaceship collection...\n");

    let client; // Define client outside the try block for access in finally

    try {
        // STEP 1: Read the metadata file to get the IPFS CID.
        const metadataFilePath = path.join(__dirname, "..", "..", "metadata", "nft.json");
        if (!fs.existsSync(metadataFilePath)) {
            throw new Error(`Metadata file not found at: ${metadataFilePath}`);
        }
        const metadataFile = JSON.parse(fs.readFileSync(metadataFilePath, "utf8"));
        const cid = metadataFile.cid;

        // Check for all required environment variables and that a CID was found.
        if (!process.env.OPERATOR_ID || !process.env.OPERATOR_KEY || !process.env.SPACESHIP_NFT_TOKEN_ID || !cid) {
            throw new Error(
                "Please make sure OPERATOR_ID, OPERATOR_KEY, and SPACESHIP_NFT_TOKEN_ID are in your .env file, and that 'cid' is set in metadata/nft.json."
            );
        }

        console.log(`Using metadata from IPFS CID: ${cid}`);

        // 2. Configure client
        const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
        const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
        const tokenId = process.env.SPACESHIP_NFT_TOKEN_ID;

        client = Client.forTestnet();
        client.setOperator(operatorId, operatorKey);

        // STEP 2: Construct the full IPFS URL from the provided CID.
        // This is the pointer that will be stored on-chain.
        const ipfsUrl = `ipfs://${cid}`;

        // STEP 3: Mint the new NFT.
        const metadataBytes = Buffer.from(ipfsUrl);
        const mintTx = await new TokenMintTransaction()
            .setTokenId(tokenId)
            .setMetadata([metadataBytes])
            .freezeWith(client);

        // The transaction must be signed by the supply key
        const signedTx = await mintTx.sign(operatorKey);
        const txResponse = await signedTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const serialNumber = receipt.serials[0].toNumber();

        console.log(`✅ NFT Minted Successfully!`);
        console.log(`- Serial Number: ${serialNumber}`);
        console.log(`- On-chain Metadata (Pointer): ${ipfsUrl}`);
        console.log(`🔗 View on HashScan: https://hashscan.io/testnet/token/${tokenId}`);
    } catch (error) {
        console.error("❌ Error minting new NFT:", error);
        process.exit(1);
    } finally {
        if (client) {
            client.close();
        }
    }
}

mintNewNFT().catch((error) => {
    // The error is now logged inside mintNewNFT, so we just exit.
    process.exit(1);
});