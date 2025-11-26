const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

/**
 * Deploys a contract with retry logic for network errors.
 * @param {string} contractName The name of the contract.
 * @param {ethers.ContractFactory} ContractFactory The contract factory.
 * @param {Array} args The arguments for the proxy deployment.
 * @param {object} opts The options for the proxy deployment.
 * @returns {Promise<ethers.Contract>} The deployed contract instance.
 */
async function deployWithRetries(contractName, ContractFactory, args, opts) {
    const maxRetries = 5;
    let delay = 5000; // 5 seconds
    for (let i = 0; i < maxRetries; i++) {
        try {
            const contract = await upgrades.deployProxy(ContractFactory, args, opts);
            await contract.waitForDeployment();
            return contract;
        } catch (error) {
            if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.code === 'UND_ERR_HEADERS_TIMEOUT' || error.code === 'ECONNRESET') {
                console.warn(`   ⚠️  Attempt ${i + 1}/${maxRetries} for ${contractName} failed due to network error. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw error; // Re-throw other errors immediately
            }
        }
    }
    throw new Error(`❌ Failed to deploy ${contractName} after ${maxRetries} attempts.`);
}

async function main() {
    console.log("\n🚀 COSMIC COLLECTOR - FULL DEPLOYMENT");
    console.log("=".repeat(70));
    console.log(`Network: ${hre.network.name}`);

    // Pre-flight check for configuration and connection
    if (!process.env.HEDERA_TESTNET_URL) {
        throw new Error("❌ HEDERA_TESTNET_URL is not set in your .env file. Please add it.");
    }
    if (!process.env.OPERATOR_KEY) {
        throw new Error("❌ OPERATOR_KEY is not set in your .env file. Please add your private key.");
    }

    let signers;
    const maxRetries = 5;
    let delay = 5000; // 5 seconds
    for (let i = 0; i < maxRetries; i++) {
        try {
            signers = await ethers.getSigners();
            break; // If successful, exit the loop
        } catch (error) {
            if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.code === 'UND_ERR_HEADERS_TIMEOUT' || error.code === 'ECONNRESET') {
                console.warn(`   ⚠️  Initial connection failed (Attempt ${i + 1}/${maxRetries}). Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw error; // Re-throw other errors immediately
            }
        }
    }

    if (!signers || signers.length === 0) {
        throw new Error(`❌ Could not connect to the network and get a signer after ${maxRetries} attempts. Please check your HEDERA_TESTNET_URL and internet connection.`);
    }
    console.log(`Deployer: ${signers[0].address}`);
    console.log("=".repeat(70) + "\n");

    const [deployer, localOwner2, localTreasury] = signers;

    // Owners addresses
    const owner1Address = deployer.address;
    let owner2EvmAddress = process.env.OWNER2_ADDRESS;
    let treasuryEvmAddress = process.env.TREASURY_ACCOUNT_ADDRESS;

    // For local testing, use Hardhat's signers if env variables are not set.
    if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
        console.log("🔎 Local network detected. Using local signers for Owner 2 and Treasury.");
        owner2EvmAddress = owner2EvmAddress || localOwner2.address;
        treasuryEvmAddress = treasuryEvmAddress || localTreasury.address;
    }
    
    if (!owner2EvmAddress || !treasuryEvmAddress || !ethers.isAddress(owner2EvmAddress) || !ethers.isAddress(treasuryEvmAddress)) {
        throw new Error("Invalid or missing addresses. Please ensure OWNER2_ADDRESS and TREASURY_ADDRESS in your .env file are valid 0x... EVM addresses.");
    }

    console.log("👥 Owners:");
    console.log(`   Owner 1: ${owner1Address}`);
    console.log(`   Owner 2: ${owner2EvmAddress}`);
    console.log(`   Treasury: ${treasuryEvmAddress}\n`);

    // ============================================
    // 1. Deploy Access Control
    // ============================================
    console.log("📋 Step 1/7: Deploying Access Control...");
    const AccessControl = await ethers.getContractFactory("CosmicAccessControl");
    const accessControl = await deployWithRetries("AccessControl", AccessControl, [owner1Address, owner2EvmAddress], { initializer: "initialize", kind: "uups" });
    const accessControlEvmAddress = await accessControl.getAddress();
    console.log(`✅ AccessControl: ${accessControlEvmAddress}\n`);

    // ============================================
    // 2. Deploy Game Registry
    // ============================================
    console.log("📋 Step 2/7: Deploying Game Registry...");
    const GameRegistry = await ethers.getContractFactory("GameRegistry");
    const gameRegistry = await deployWithRetries("GameRegistry", GameRegistry, [accessControlEvmAddress], { initializer: "initialize", kind: "uups" });
    const gameRegistryEvmAddress = await gameRegistry.getAddress();
    console.log(`✅ GameRegistry: ${gameRegistryEvmAddress}\n`);

    // ============================================
    // 3. Deploy COSM Token
    // ============================================
    console.log("📋 Step 3/7: Deploying $COSM Token...");
    const COSMToken = await ethers.getContractFactory("COSMToken");
    const cosmToken = await deployWithRetries("COSMToken", COSMToken, [accessControlEvmAddress, treasuryEvmAddress, 200], { initializer: "initialize", kind: "uups" });
    const cosmTokenEvmAddress = await cosmToken.getAddress();
    console.log(`✅ COSMToken: ${cosmTokenEvmAddress}\n`);

    // ============================================
    // 4. Deploy Spaceship NFT
    // ============================================
    console.log("📋 Step 4/7: Deploying Spaceship NFT...");
    const SpaceshipNFT = await ethers.getContractFactory("SpaceshipNFT");
    const spaceshipNFT = await deployWithRetries("SpaceshipNFT", SpaceshipNFT, [accessControlEvmAddress], { initializer: "initialize", kind: "uups" });
    const spaceshipNFTEvmAddress = await spaceshipNFT.getAddress();
    console.log(`✅ SpaceshipNFT: ${spaceshipNFTEvmAddress}\n`);

    // ============================================
    // 5. Deploy Treasury & Reward Distributor
    // ============================================
    console.log("📋 Step 5/7: Deploying Treasury...");
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await deployWithRetries("Treasury", Treasury, [accessControlEvmAddress, cosmTokenEvmAddress, 10000n * (10n ** 18n)], { initializer: "initialize", kind: "uups" });
    const treasuryContractEvmAddress = await treasury.getAddress();
    console.log(`✅ Treasury: ${treasuryContractEvmAddress}`);

    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const rewardDistributor = await deployWithRetries("RewardDistributor", RewardDistributor, [accessControlEvmAddress, treasuryContractEvmAddress, 7 * 24 * 60 * 60], { initializer: "initialize", kind: "uups" });
    const rewardDistributorEvmAddress = await rewardDistributor.getAddress();
    console.log(`✅ RewardDistributor: ${rewardDistributorEvmAddress}\n`);

    // ============================================
    // 6. Deploy Marketplace
    // ============================================
    console.log("📋 Step 6/8: Deploying Marketplace & Auction House...");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplaceArgs = [accessControlEvmAddress, spaceshipNFTEvmAddress, cosmTokenEvmAddress, treasuryEvmAddress, 500];
    const marketplace = await deployWithRetries("Marketplace", Marketplace, marketplaceArgs, { initializer: "initialize", kind: "uups" });
    const marketplaceEvmAddress = await marketplace.getAddress();
    console.log(`✅ Marketplace: ${marketplaceEvmAddress}`);

    const AuctionHouse = await ethers.getContractFactory("AuctionHouse");
    const auctionHouseArgs = [accessControlEvmAddress, spaceshipNFTEvmAddress, cosmTokenEvmAddress, treasuryEvmAddress, 500];
    const auctionHouse = await deployWithRetries("AuctionHouse", AuctionHouse, auctionHouseArgs, { initializer: "initialize", kind: "uups" });
    const auctionHouseEvmAddress = await auctionHouse.getAddress();
    console.log(`✅ AuctionHouse: ${auctionHouseEvmAddress}\n`);

    // ============================================
    // 7. Deploy Leaderboard Manager
    // ============================================
    console.log("📋 Step 7/7: Deploying Leaderboard Manager...");
    const LeaderboardManager = await ethers.getContractFactory("LeaderboardManager");
    const leaderboardManager = await deployWithRetries("LeaderboardManager", LeaderboardManager, [accessControlEvmAddress, gameRegistryEvmAddress, 100_000_000], { initializer: "initialize", kind: "uups" });
    const leaderboardManagerEvmAddress = await leaderboardManager.getAddress();
    console.log(`✅ LeaderboardManager: ${leaderboardManagerEvmAddress}\n`);

    // ============================================
    // Setup Roles and Permissions
    // ============================================
    console.log("🔐 Setting up roles and permissions...");
    
    // Grant treasury role to treasury contract
    await accessControl.grantTreasuryRole(treasuryContractEvmAddress);
    await accessControl.grantTreasuryRole(rewardDistributorEvmAddress);
    await accessControl.grantTreasuryRole(marketplaceEvmAddress);
    await accessControl.grantTreasuryRole(auctionHouseEvmAddress);
    
    // Grant game manager role to leaderboard
    await accessControl.grantGameManager(leaderboardManagerEvmAddress);

    // Grant FEE_EXEMPT_ROLE to the marketplace to ensure clean fee logic
    const FEE_EXEMPT_ROLE = ethers.id("FEE_EXEMPT_ROLE");
    await accessControl.grantRole(FEE_EXEMPT_ROLE, marketplaceEvmAddress);
    
    console.log("✅ Roles configured\n");

    // ============================================
    // Transfer Initial Tokens to Treasury
    // ============================================
    console.log("💰 Transferring tokens to treasury...");
    const totalSupply = await cosmToken.totalSupply();
    const deployerBalance = await cosmToken.balanceOf(deployer.address);
    
    // Transfer 80% to treasury, keep 20% for initial liquidity/rewards
    const treasuryAmount = (deployerBalance * 80n) / 100n;
    await cosmToken.transfer(treasuryContractEvmAddress, treasuryAmount);
    console.log(`✅ Transferred ${ethers.formatEther(treasuryAmount)} $COSM to treasury\n`);

    // ============================================
    // Summary
    // ============================================
    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(70));
    console.log("\n📝 CONTRACT ADDRESSES:\n");

    const deployments = {
        ACCESS_CONTROL_ADDRESS: accessControlEvmAddress,
        GAME_REGISTRY_ADDRESS: gameRegistryEvmAddress,
        COSM_TOKEN_ADDRESS: cosmTokenEvmAddress,
        SPACESHIP_NFT_ADDRESS: spaceshipNFTEvmAddress,
        TREASURY_ADDRESS: treasuryContractEvmAddress,
        REWARD_DISTRIBUTOR_ADDRESS: rewardDistributorEvmAddress,
        MARKETPLACE_ADDRESS: marketplaceEvmAddress,
        AUCTION_HOUSE_ADDRESS: auctionHouseEvmAddress,
        LEADERBOARD_MANAGER_ADDRESS: leaderboardManagerEvmAddress
    };

    for (const [name, address] of Object.entries(deployments)) {
        console.log(`${name.padEnd(30)} ${address}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("\n⚠️  NEXT STEPS:\n");
    console.log("1. Update your .env file with these new contract addresses.");
    console.log("2. Manually look up the Hedera IDs (0.0.xxxx) on HashScan for these addresses.");
    console.log("3. Run the `check-balance.js` script to verify the deployment.");
    console.log("4. Verify contracts on HashScan using the Hedera IDs.");
    console.log("\n" + "=".repeat(70) + "\n");

    // Save to file
    const fs = require("fs");
    const path = require("path");
    const deploymentsDir = path.join(__dirname, "../../deployments");
    
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentData = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        deployer: owner1Address,
        owner2: owner2EvmAddress,
        treasury: treasuryEvmAddress,
        contracts: deployments
    };
    
    const filename = path.join(deploymentsDir, `${hre.network.name}.json`);
    fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
    console.log(`💾 Deployment data saved to: ${filename}\n`);

    return deployments;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });