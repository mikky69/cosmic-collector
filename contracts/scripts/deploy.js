const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying Cosmic Collector Smart Contracts to Hedera...");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("💼 Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "HBAR");
  
  if (balance < hre.ethers.parseEther("100")) {
    console.warn("⚠️  Warning: Low balance. Ensure you have enough HBAR for deployment.");
  }
  
  console.log("\n🔄 Starting deployment process...");
  
  try {
    // Deploy CosmicShipNFT
    console.log("\n1️⃣ Deploying CosmicShipNFT...");
    const CosmicShipNFT = await hre.ethers.getContractFactory("CosmicShipNFT");
    const cosmicShipNFT = await CosmicShipNFT.deploy(deployer.address);
    await cosmicShipNFT.waitForDeployment();
    const nftAddress = await cosmicShipNFT.getAddress();
    console.log("✅ CosmicShipNFT deployed to:", nftAddress);
    
    // Deploy CosmicShipMarketplace
    console.log("\n2️⃣ Deploying CosmicShipMarketplace...");
    const CosmicShipMarketplace = await hre.ethers.getContractFactory("CosmicShipMarketplace");
    const cosmicShipMarketplace = await CosmicShipMarketplace.deploy(
      nftAddress,
      deployer.address
    );
    await cosmicShipMarketplace.waitForDeployment();
    const marketplaceAddress = await cosmicShipMarketplace.getAddress();
    console.log("✅ CosmicShipMarketplace deployed to:", marketplaceAddress);
    
    // Deploy CosmicLeaderboard
    console.log("\n3️⃣ Deploying CosmicLeaderboard...");
    const CosmicLeaderboard = await hre.ethers.getContractFactory("CosmicLeaderboard");
    const cosmicLeaderboard = await CosmicLeaderboard.deploy(deployer.address);
    await cosmicLeaderboard.waitForDeployment();
    const leaderboardAddress = await cosmicLeaderboard.getAddress();
    console.log("✅ CosmicLeaderboard deployed to:", leaderboardAddress);
    
    // Get deployment transaction hashes
    const nftTxHash = cosmicShipNFT.deploymentTransaction().hash;
    const marketplaceTxHash = cosmicShipMarketplace.deploymentTransaction().hash;
    const leaderboardTxHash = cosmicLeaderboard.deploymentTransaction().hash;
    
    console.log("\n⏳ Waiting for block confirmations...");
    await cosmicShipNFT.deploymentTransaction().wait(3);
    await cosmicShipMarketplace.deploymentTransaction().wait(3);
    await cosmicLeaderboard.deploymentTransaction().wait(3);
    
    // Save deployment addresses
    const deploymentInfo = {
      network: hre.network.name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        CosmicShipNFT: {
          address: nftAddress,
          transactionHash: nftTxHash
        },
        CosmicShipMarketplace: {
          address: marketplaceAddress,
          transactionHash: marketplaceTxHash
        },
        CosmicLeaderboard: {
          address: leaderboardAddress,
          transactionHash: leaderboardTxHash
        }
      }
    };
    
    // Save to deployments folder
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📄 Contract Addresses:");
    console.log("   CosmicShipNFT:        ", nftAddress);
    console.log("   CosmicShipMarketplace:", marketplaceAddress);
    console.log("   CosmicLeaderboard:    ", leaderboardAddress);
    
    console.log("\n💾 Deployment info saved to:", deploymentFile);
    
    console.log("\n🔧 Next Steps:");
    console.log("   1. Update scripts/hedera.js with these contract addresses");
    console.log("   2. Update CREATOR_ACCOUNT_ID in scripts/hedera.js with your account ID");
    console.log("   3. Test the contracts in your game!");
    
    // Generate the hedera.js configuration snippet
    const configSnippet = `
// Add these addresses to your scripts/hedera.js file:
this.CREATOR_ACCOUNT_ID = "${process.env.ACCOUNT_ID || 'YOUR_HEDERA_ACCOUNT_ID'}"; // Your account ID
this.NFT_CONTRACT_ID = "${nftAddress}";
this.MARKETPLACE_CONTRACT_ID = "${marketplaceAddress}";
this.LEADERBOARD_CONTRACT_ID = "${leaderboardAddress}";
`;
    
    const configFile = path.join(deploymentsDir, 'hedera-config.js');
    fs.writeFileSync(configFile, configSnippet);
    console.log("\n📁 Configuration snippet saved to:", configFile);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💵 Insufficient funds. Please add more HBAR to your account.");
    } else if (error.message.includes("nonce")) {
      console.log("\n🔄 Nonce issue. Try again in a few moments.");
    } else if (error.message.includes("gas")) {
      console.log("\n⛽ Gas issue. The transaction might be too complex or gas price too low.");
    } else if (error.code === "NETWORK_ERROR") {
      console.log("\n🌐 Network error. Check your internet connection and try again.");
    }
    
    console.log("\n🔍 Full error details:");
    console.log(error);
    
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;