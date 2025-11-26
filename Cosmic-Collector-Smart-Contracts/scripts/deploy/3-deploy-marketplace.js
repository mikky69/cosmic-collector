const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("\n🛒 Deploying Marketplace Contracts...\n");

    const [deployer] = await ethers.getSigners();
    
    const accessControlAddress = process.env.ACCESS_CONTROL_ADDRESS;
    const nftAddress = process.env.SPACESHIP_NFT_ADDRESS;
    const cosmTokenAddress = process.env.COSM_TOKEN_ADDRESS;
    const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;

    if (!accessControlAddress || !nftAddress || !cosmTokenAddress) {
        throw new Error("Missing required addresses in .env");
    }

    console.log("📦 Configuration:");
    console.log(`   AccessControl: ${accessControlAddress}`);
    console.log(`   NFT Contract: ${nftAddress}`);
    console.log(`   COSM Token: ${cosmTokenAddress}`);
    console.log(`   Treasury: ${treasuryAddress}\n`);

    // Deploy Marketplace
    console.log("1️⃣ Deploying Marketplace...");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await upgrades.deployProxy(
        Marketplace,
        [
            accessControlAddress,
            nftAddress,
            cosmTokenAddress,
            treasuryAddress,
            500 // 5% platform fee
        ],
        { initializer: "initialize", kind: "uups" }
    );
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log(`✅ Marketplace: ${marketplaceAddress}\n`);

    // Deploy Auction House
    console.log("2️⃣ Deploying Auction House...");
    const AuctionHouse = await ethers.getContractFactory("AuctionHouse");
    const auctionHouse = await upgrades.deployProxy(
        AuctionHouse,
        [
            accessControlAddress,
            nftAddress,
            cosmTokenAddress,
            treasuryAddress,
            500 // 5% platform fee
        ],
        { initializer: "initialize", kind: "uups" }
    );
    await auctionHouse.waitForDeployment();
    const auctionHouseAddress = await auctionHouse.getAddress();
    console.log(`✅ AuctionHouse: ${auctionHouseAddress}\n`);

    console.log("━".repeat(70));
    console.log("✅ MARKETPLACE DEPLOYMENT COMPLETE!");
    console.log("━".repeat(70));
    console.log("\n⚠️  Add to .env:");
    console.log(`MARKETPLACE_ADDRESS=${marketplaceAddress}`);
    console.log(`AUCTION_HOUSE_ADDRESS=${auctionHouseAddress}\n`);
    
    console.log("📝 Platform Fees: 5%");
    console.log("💰 All fees go to treasury\n");

    return {
        marketplace: marketplaceAddress,
        auctionHouse: auctionHouseAddress
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });