const { ethers } = require("hardhat");

/**
 * Deploy contract with proxy pattern
 */
async function deployProxy(contractName, args = []) {
    console.log(`\n📦 Deploying ${contractName}...`);
    
    const Contract = await ethers.getContractFactory(contractName);
    const contract = await upgrades.deployProxy(Contract, args, {
        initializer: "initialize",
        kind: "uups"
    });
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log(`✅ ${contractName} deployed to: ${address}`);
    return contract;
}

/**
 * Wait for transaction confirmation
 */
async function waitForTx(tx, confirmations = 1) {
    console.log(`⏳ Waiting for ${confirmations} confirmation(s)...`);
    const receipt = await tx.wait(confirmations);
    console.log(`✅ Transaction confirmed: ${receipt.hash}`);
    return receipt;
}

/**
 * Log deployment info
 */
function logDeployment(name, address, extras = {}) {
    console.log("\n" + "=".repeat(60));
    console.log(`📄 ${name}`);
    console.log("=".repeat(60));
    console.log(`Address: ${address}`);
    
    for (const [key, value] of Object.entries(extras)) {
        console.log(`${key}: ${value}`);
    }
    
    console.log("=".repeat(60) + "\n");
}

/**
 * Save deployment addresses
 */
async function saveDeployment(deployments) {
    const fs = require("fs");
    const path = require("path");
    
    const deploymentsPath = path.join(__dirname, "../../deployments");
    
    if (!fs.existsSync(deploymentsPath)) {
        fs.mkdirSync(deploymentsPath, { recursive: true });
    }
    
    const network = hre.network.name;
    const filename = path.join(deploymentsPath, `${network}.json`);
    
    const data = {
        network,
        timestamp: new Date().toISOString(),
        contracts: deployments
    };
    
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`\n📝 Deployment addresses saved to: ${filename}`);
}

module.exports = {
    deployProxy,
    waitForTx,
    logDeployment,
    saveDeployment
};