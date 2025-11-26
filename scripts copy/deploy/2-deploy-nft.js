const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("\n🚀 Deploying Spaceship NFT...\n");

    const accessControlAddress = process.env.ACCESS_CONTROL_ADDRESS;

    if (!accessControlAddress) {
        throw new Error("ACCESS_CONTROL_ADDRESS not set in .env");
    }

    const SpaceshipNFT = await ethers.getContractFactory("SpaceshipNFT");
    const spaceshipNFT = await upgrades.deployProxy(
        SpaceshipNFT,
        [accessControlAddress],
        { initializer: "initialize", kind: "uups" }
    );

    await spaceshipNFT.waitForDeployment();
    const address = await spaceshipNFT.getAddress();

    console.log(`✅ SpaceshipNFT deployed to: ${address}`);
    console.log(`   Name: Cosmic Spaceship`);
    console.log(`   Symbol: CSHIP\n`);

    console.log("⚠️  Add to .env:");
    console.log(`SPACESHIP_NFT_ADDRESS=${address}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });