const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("\n🏆 Deploying Leaderboard System...\n");

    const [deployer] = await ethers.getSigners();
    
    const accessControlAddress = process.env.ACCESS_CONTROL_ADDRESS;
    const gameRegistryAddress = process.env.GAME_REGISTRY_ADDRESS;

    if (!accessControlAddress || !gameRegistryAddress) {
        throw new Error("Missing required addresses in .env");
    }

    console.log("📦 Configuration:");
    console.log(`   AccessControl: ${accessControlAddress}`);
    console.log(`   GameRegistry: ${gameRegistryAddress}`);
    console.log(`   Deployer: ${deployer.address}\n`);

    // Deploy Leaderboard Manager
    console.log("1️⃣ Deploying Leaderboard Manager...");
    const LeaderboardManager = await ethers.getContractFactory("LeaderboardManager");
    const leaderboardManager = await upgrades.deployProxy(
        LeaderboardManager,
        [
            accessControlAddress,
            gameRegistryAddress,
            ethers.parseEther("1") // 1 HBAR submission fee
        ],
        { initializer: "initialize", kind: "uups" }
    );
    await leaderboardManager.waitForDeployment();
    const leaderboardAddress = await leaderboardManager.getAddress();
    console.log(`✅ LeaderboardManager: ${leaderboardAddress}\n`);

    // Setup roles
    console.log("2️⃣ Setting up roles...");
    const accessControl = await ethers.getContractAt("CosmicAccessControl", accessControlAddress);
    
    await accessControl.grantGameManager(leaderboardAddress);
    console.log("   ✓ Game Manager role granted to LeaderboardManager\n");

    // Display HCS topic setup instructions
    console.log("3️⃣ HCS Topics Setup:");
    console.log("   Run the following command to create HCS topics:");
    console.log("   npm run hedera:topics\n");
    console.log("   Then set topic IDs using LeaderboardManager.setHCSTopic(gameId, topicId)\n");

    console.log("━".repeat(70));
    console.log("✅ LEADERBOARD DEPLOYMENT COMPLETE!");
    console.log("━".repeat(70));
    console.log("\n⚠️  Add to .env:");
    console.log(`LEADERBOARD_MANAGER_ADDRESS=${leaderboardAddress}\n`);
    
    console.log("📊 Leaderboard Configuration:");
    console.log("   Submission Fee: 1 HBAR");
    console.log("   Games Supported: 4");
    console.log("   Top Players Tracked: 10 per game");
    console.log("   Storage: HCS (Hedera Consensus Service)\n");

    console.log("🎮 Supported Games:");
    console.log("   0: Cosmic Collector");
    console.log("   1: Game 2");
    console.log("   2: Game 3");
    console.log("   3: Game 4\n");

    return {
        leaderboardManager: leaderboardAddress
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });