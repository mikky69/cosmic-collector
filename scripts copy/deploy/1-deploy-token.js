const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("\n🪙 Deploying $COSM Token...\n");

    const [deployer] = await ethers.getSigners();
    const accessControlAddress = process.env.ACCESS_CONTROL_ADDRESS;
    const treasuryAddress = process.env.TREASURY_ACCOUNT_ID || deployer.address;

    if (!accessControlAddress) {
        throw new Error("ACCESS_CONTROL_ADDRESS not set in .env");
    }

    const COSMToken = await ethers.getContractFactory("COSMToken");
    const cosmToken = await upgrades.deployProxy(
        COSMToken,
        [accessControlAddress, treasuryAddress, 200], // 2% fee
        { initializer: "initialize", kind: "uups" }
    );

    await cosmToken.waitForDeployment();
    const address = await cosmToken.getAddress();

    console.log(`✅ COSMToken deployed to: ${address}`);
    console.log(`   Total Supply: ${ethers.formatEther(await cosmToken.totalSupply())} COSM`);
    console.log(`   Treasury: ${treasuryAddress}`);
    console.log(`   Transfer Fee: 2%\n`);

    console.log("⚠️  Add to .env:");
    console.log(`COSM_TOKEN_ADDRESS=${address}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });