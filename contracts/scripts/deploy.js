const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Cosmic Collector Smart Contracts to Hedera...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    // Deploy NFT Contract
    console.log("\n📝 Deploying CosmicShipNFT...");
    const CosmicShipNFT = await ethers.getContractFactory("CosmicShipNFT");
    const nftContract = await CosmicShipNFT.deploy();
    await nftContract.deployed();
    console.log("✅ CosmicShipNFT deployed to:", nftContract.address);
    
    // Deploy Marketplace Contract
    console.log("\n🏪 Deploying CosmicShipMarketplace...");
    const CosmicShipMarketplace = await ethers.getContractFactory("CosmicShipMarketplace");
    const marketplaceContract = await CosmicShipMarketplace.deploy();
    await marketplaceContract.deployed();
    console.log("✅ CosmicShipMarketplace deployed to:", marketplaceContract.address);
    
    // Deploy Leaderboard Contract
    console.log("\n🏆 Deploying CosmicLeaderboard...");
    const CosmicLeaderboard = await ethers.getContractFactory("CosmicLeaderboard");
    const leaderboardContract = await CosmicLeaderboard.deploy();
    await leaderboardContract.deployed();
    console.log("✅ CosmicLeaderboard deployed to:", leaderboardContract.address);
    
    // Save deployment addresses
    const deploymentInfo = {
        network: "hedera-testnet",
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            CosmicShipNFT: nftContract.address,
            CosmicShipMarketplace: marketplaceContract.address,
            CosmicLeaderboard: leaderboardContract.address
        },
        transactionHashes: {
            CosmicShipNFT: nftContract.deployTransaction.hash,
            CosmicShipMarketplace: marketplaceContract.deployTransaction.hash,
            CosmicLeaderboard: leaderboardContract.deployTransaction.hash
        }
    };
    
    console.log("\n📄 Deployment Summary:");
    console.log("═".repeat(60));
    console.log("🏷️  NFT Contract:", deploymentInfo.contracts.CosmicShipNFT);
    console.log("🏪 Marketplace:", deploymentInfo.contracts.CosmicShipMarketplace);
    console.log("🏆 Leaderboard:", deploymentInfo.contracts.CosmicLeaderboard);
    console.log("═".repeat(60));
    
    // Write deployment info to file
    const fs = require('fs');
    fs.writeFileSync(
        './deployments.json', 
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n💾 Deployment info saved to deployments.json");
    
    // Update hedera.js with real addresses
    const hederaJsUpdate = `
// DEPLOYED CONTRACT ADDRESSES - UPDATE THESE IN YOUR hedera.js FILE
const CONTRACT_ADDRESSES = {
    NFT_CONTRACT: "${deploymentInfo.contracts.CosmicShipNFT}",
    MARKETPLACE_CONTRACT: "${deploymentInfo.contracts.CosmicShipMarketplace}",
    LEADERBOARD_CONTRACT: "${deploymentInfo.contracts.CosmicLeaderboard}",
    CREATOR_ACCOUNT: "${deployer.address}"
};

// Copy these addresses to your scripts/hedera.js file:
// this.NFT_CONTRACT_ID = "${deploymentInfo.contracts.CosmicShipNFT}";
// this.MARKETPLACE_CONTRACT_ID = "${deploymentInfo.contracts.CosmicShipMarketplace}";
// this.LEADERBOARD_CONTRACT_ID = "${deploymentInfo.contracts.CosmicLeaderboard}";
// this.CREATOR_ACCOUNT_ID = "${deployer.address}";
`;
    
    fs.writeFileSync('./CONTRACT_ADDRESSES.txt', hederaJsUpdate);
    console.log("📋 Contract addresses saved to CONTRACT_ADDRESSES.txt");
    
    console.log("\n🎉 All contracts deployed successfully!");
    console.log("📖 Next steps:");
    console.log("1. Copy the contract addresses to your hedera.js file");
    console.log("2. Update your frontend to use these real contract addresses");
    console.log("3. Test all functionality on Hedera testnet");
    
    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });