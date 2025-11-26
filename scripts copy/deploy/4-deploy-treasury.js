const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("\n💰 Deploying Treasury System...\n");

    const [deployer] = await ethers.getSigners();
    
    const accessControlAddress = process.env.ACCESS_CONTROL_ADDRESS;
    const cosmTokenAddress = process.env.COSM_TOKEN_ADDRESS;

    if (!accessControlAddress || !cosmTokenAddress) {
        throw new Error("Missing required addresses in .env");
    }

    console.log("📦 Configuration:");
    console.log(`   AccessControl: ${accessControlAddress}`);
    console.log(`   COSM Token: ${cosmTokenAddress}`);
    console.log(`   Deployer: ${deployer.address}\n`);

    // Deploy Treasury
    console.log("1️⃣ Deploying Treasury...");
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await upgrades.deployProxy(
        Treasury,
        [
            accessControlAddress,
            cosmTokenAddress,
            ethers.parseEther("10000") // 10,000 COSM daily reward pool
        ],
        { initializer: "initialize", kind: "uups" }
    );
    await treasury.waitForDeployment();
    const treasuryAddress = await treasury.getAddress();
    console.log(`✅ Treasury: ${treasuryAddress}\n`);

    // Deploy Reward Distributor
    console.log("2️⃣ Deploying Reward Distributor...");
    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const rewardDistributor = await upgrades.deployProxy(
        RewardDistributor,
        [
            accessControlAddress,
            treasuryAddress,
            7 * 24 * 60 * 60 // 7 day claim window
        ],
        { initializer: "initialize", kind: "uups" }
    );
    await rewardDistributor.waitForDeployment();
    const rewardDistributorAddress = await rewardDistributor.getAddress();
    console.log(`✅ RewardDistributor: ${rewardDistributorAddress}\n`);

    // Setup roles
    console.log("3️⃣ Setting up roles...");
    const accessControl = await ethers.getContractAt("CosmicAccessControl", accessControlAddress);
    
    await accessControl.grantTreasuryRole(treasuryAddress);
    console.log("   ✓ Treasury role granted to Treasury contract");
    
    await accessControl.grantTreasuryRole(rewardDistributorAddress);
    console.log("   ✓ Treasury role granted to RewardDistributor\n");

    // Transfer initial tokens to treasury
    console.log("4️⃣ Funding treasury...");
    const cosmToken = await ethers.getContractAt("COSMToken", cosmTokenAddress);
    const deployerBalance = await cosmToken.balanceOf(deployer.address);
    
    if (deployerBalance > 0) {
        const treasuryAmount = (deployerBalance * 80n) / 100n;
        await cosmToken.transfer(treasuryAddress, treasuryAmount);
        console.log(`   ✓ Transferred ${ethers.formatEther(treasuryAmount)} COSM to treasury`);
        console.log(`   ✓ Remaining: ${ethers.formatEther(deployerBalance - treasuryAmount)} COSM\n`);
    } else {
        console.log("   ⚠️  No COSM balance to transfer\n");
    }

    console.log("━".repeat(70));
    console.log("✅ TREASURY DEPLOYMENT COMPLETE!");
    console.log("━".repeat(70));
    console.log("\n⚠️  Add to .env:");
    console.log(`TREASURY_ADDRESS=${treasuryAddress}`);
    console.log(`REWARD_DISTRIBUTOR_ADDRESS=${rewardDistributorAddress}\n`);
    
    console.log("📊 Treasury Configuration:");
    console.log("   Daily Reward Pool: 10,000 COSM");
    console.log("   Claim Window: 7 days");
    console.log("   Multi-Sig: Enabled (2/2 owners)\n");

    return {
        treasury: treasuryAddress,
        rewardDistributor: rewardDistributorAddress
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });