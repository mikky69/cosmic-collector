const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const network = hre.network.name;
  const deploymentFile = path.join(__dirname, '..', 'deployments', `${network}-deployment.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ No deployment found for network: ${network}`);
    console.log(`Expected file: ${deploymentFile}`);
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  
  console.log(`🔍 Verifying contracts on ${network}...`);
  
  try {
    // Verify CosmicShipNFT
    console.log("\nVerifying CosmicShipNFT...");
    await hre.run("verify:verify", {
      address: deployment.contracts.CosmicShipNFT.address,
      constructorArguments: [deployment.deployer],
    });
    
    // Verify CosmicShipMarketplace
    console.log("\nVerifying CosmicShipMarketplace...");
    await hre.run("verify:verify", {
      address: deployment.contracts.CosmicShipMarketplace.address,
      constructorArguments: [
        deployment.contracts.CosmicShipNFT.address,
        deployment.deployer
      ],
    });
    
    // Verify CosmicLeaderboard
    console.log("\nVerifying CosmicLeaderboard...");
    await hre.run("verify:verify", {
      address: deployment.contracts.CosmicLeaderboard.address,
      constructorArguments: [deployment.deployer],
    });
    
    console.log("\n✅ All contracts verified successfully!");
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    
    if (error.message.includes("already verified")) {
      console.log("📝 Note: Contracts may already be verified.");
    }
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