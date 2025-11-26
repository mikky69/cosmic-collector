const {
    Client,
    Hbar,
    Timestamp,
    TopicCreateTransaction,
    PrivateKey,
    AccountId,
    TransactionId,
    TopicMessageSubmitTransaction
} = require("@hashgraph/sdk");
require("dotenv").config();

async function createLeaderboardTopics() {
    console.log("🚀 Creating HCS Topics for Leaderboards...\n");

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    const gameNames = [
        "Game 1",
        "Game 2",
        "Game 3",
        "Game 4"
    ];

    const topicIds = [];

    try {
        for (let i = 0; i < 4; i++) {
            // Create a transaction ID with a start time 15 seconds in the past to overcome severe clock skew
            const createTxId = TransactionId.withValidStart(operatorId, Timestamp.fromDate(new Date(Date.now() - 15000)));

            const topicCreateTx = await new TopicCreateTransaction()
                .setTransactionId(createTxId)
                .setSubmitKey(operatorKey.publicKey)
                .setTopicMemo(`${gameNames[i]} Leaderboard`)
                .freezeWith(client);
            const topicCreateSubmit = await topicCreateTx.execute(client);

            const receipt = await topicCreateSubmit.getReceipt(client);
            const topicId = receipt.topicId;
            topicIds.push(topicId);

            console.log(`✅ ${gameNames[i]} Topic Created: ${topicId}`);

            // Submit initial message
            const initialMessage = JSON.stringify({
                type: "INIT",
                game: gameNames[i],
                timestamp: Date.now()
            });

            // Add a small delay to ensure the topic creation is fully propagated
            await new Promise((resolve) => setTimeout(resolve, 3000));

            const messageTxId = TransactionId.withValidStart(operatorId, Timestamp.fromDate(new Date(Date.now() - 15000)));
            const messageSubmitTx = await new TopicMessageSubmitTransaction()
                .setTransactionId(messageTxId)
                .setTopicId(topicId)
                .setMessage(initialMessage)
                 .freezeWith(client);
            await messageSubmitTx.execute(client);

            console.log(`   Initial message submitted to topic\n`);
        }

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("⚠️  IMPORTANT: Add these to your .env file:");
        topicIds.forEach((id, index) => {
            console.log(`GAME_${index + 1}_TOPIC_ID=${id}`);
        });
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        return topicIds;
    } catch (error) {
        console.error("❌ Error creating topics:", error);
        throw error;
    } finally {
        client.close();
    }
}

/**
 * Submit score to HCS topic
 */
async function submitScoreToHCS(topicId, scoreData) {
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    try {
        const message = JSON.stringify({
            type: "SCORE_SUBMIT",
            player: scoreData.player,
            score: scoreData.score,
            tokenId: scoreData.tokenId,
            timestamp: Date.now(),
            sessionId: scoreData.sessionId
        });

        const submitTx = await new TopicMessageSubmitTransaction()
            .setTopicId(topicId)
            .setMessage(message)
            .setMaxTransactionFee(new Hbar(2))
            .freezeWith(client) // Ensure transaction is frozen before execution
            .execute(client);

        const receipt = await submitTx.getReceipt(client);
        
        console.log(`✅ Score submitted to HCS topic ${topicId}`);
        return receipt;
    } catch (error) {
        console.error("❌ Error submitting to HCS:", error);
        throw error;
    } finally {
        client.close();
    }
}

if (require.main === module) {
    createLeaderboardTopics()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { createLeaderboardTopics, submitScoreToHCS };