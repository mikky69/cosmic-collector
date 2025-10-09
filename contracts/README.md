# Cosmic Collector Smart Contracts

🚀 **Professional smart contract suite for the Cosmic Collector game on Hedera Hashgraph**

This directory contains three main smart contracts that power the Cosmic Collector game's blockchain features:

## 📋 Contract Overview

### 1. CosmicShipNFT.sol
**Purpose**: NFT management for game ships
- ✅ Mint unique ship NFTs with different rarities (Basic, Advanced, Legendary)
- ✅ Level progression system with experience points
- ✅ Custom ship naming
- ✅ Owner-only experience adding
- ✅ Automatic royalty collection to creator account

### 2. CosmicShipMarketplace.sol
**Purpose**: Trading platform for NFTs and in-game items
- ✅ Purchase in-game power-ups (weapons, shields, speed boosts, lives)
- ✅ List and trade ship NFTs between players
- ✅ Automatic 5% marketplace fee collection
- ✅ Inventory management for purchased items
- ✅ Secure escrow for all transactions

### 3. CosmicLeaderboard.sol
**Purpose**: On-chain scoring and achievements
- ✅ Submit scores for both game modes (Cosmic Collector & Space Snake)
- ✅ Maintain top 100 leaderboards per game
- ✅ Track player statistics and achievements
- ✅ Anti-cheat score verification
- ✅ Achievement system with 5 unlockable badges

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd contracts
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Hedera credentials:
# - PRIVATE_KEY: Your Hedera account private key (DER encoded hex)
# - ACCOUNT_ID: Your Hedera account ID (format: 0.0.XXXXXX)
```

**🔑 Finding Your Private Key:**
1. Open HashPack or your Hedera wallet
2. Go to Account Settings → Export Private Key  
3. Copy the DER encoded hex string (starts with `302e020100...`)
4. Convert to standard hex format:
   - Use online converter: https://der-to-hex.web.app/
   - Or manually: Remove the DER prefix and add `0x` prefix
   - Format should be: `0x1234567890abcdef...` (64 characters after 0x)

### 3. Deploy to Hedera Testnet
```bash
npm run deploy:testnet
```

### 4. Update Game Integration
After successful deployment, update your `scripts/hedera.js` file with the contract addresses:
```javascript
this.CREATOR_ACCOUNT_ID = "0.0.YOUR_ACCOUNT_ID";
this.NFT_CONTRACT_ID = "0x[deployed_nft_address]";
this.MARKETPLACE_CONTRACT_ID = "0x[deployed_marketplace_address]";
this.LEADERBOARD_CONTRACT_ID = "0x[deployed_leaderboard_address]";
```

## 💰 Revenue Model

All transactions generate revenue for the game creator:

- **NFT Minting**: 10 HBAR (Basic), 25 HBAR (Advanced), 50 HBAR (Legendary)
- **In-Game Items**: 1-5 HBAR per item
- **Score Submissions**: 0.1 HBAR per submission
- **NFT Trading**: 5% marketplace fee

## 🎮 Game Integration

### Ship Purchasing Flow
```javascript
// Purchase a legendary ship
const result = await hederaService.purchaseShip('LEGENDARY', 'My Epic Ship');
console.log('Ship NFT minted:', result.tokenId);
```

### Score Submission Flow
```javascript
// Submit high score
const result = await hederaService.submitScore('COSMIC_COLLECTOR', 15420, 'ProGamer');
console.log('Score submitted, rank:', result.rank);
```

### Item Purchase Flow
```javascript
// Buy power-ups
const result = await hederaService.purchaseItem('WEAPON_UPGRADE', 2);
console.log('Items purchased:', result.quantity);
```

## 📁 Directory Structure

```
contracts/
├── contracts/                 # Solidity smart contracts
│   ├── CosmicShipNFT.sol     # NFT contract
│   ├── CosmicShipMarketplace.sol # Marketplace contract
│   └── CosmicLeaderboard.sol  # Leaderboard contract
├── scripts/                   # Deployment scripts
│   ├── deploy.js             # Main deployment script
│   └── verify.js             # Contract verification
├── test/                      # Contract tests
│   └── CosmicCollector.test.js # Comprehensive test suite
├── deployments/               # Deployment artifacts (created after deploy)
├── hardhat.config.js          # Hardhat configuration
├── package.json              # Dependencies and scripts
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test
```

Tests cover:
- ✅ NFT minting and experience system
- ✅ Marketplace item purchases and NFT trading
- ✅ Leaderboard score submission and achievements
- ✅ Access controls and security features
- ✅ Edge cases and error conditions

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Access Control**: Owner-only administrative functions
- **Input Validation**: Comprehensive parameter checking
- **Overflow Protection**: SafeMath for all calculations
- **Gas Optimization**: Efficient contract design
- **Upgrade Safety**: Immutable contract logic

## 🌐 Network Configuration

**Testnet (Recommended for Testing)**
- Network: Hedera Testnet
- Chain ID: 296
- RPC URL: https://testnet.hashio.io/api
- Explorer: https://hashscan.io/testnet

**Mainnet (Production)**
- Network: Hedera Mainnet
- Chain ID: 295
- RPC URL: https://mainnet.hashio.io/api
- Explorer: https://hashscan.io/mainnet

## 📊 Gas Costs (Approximate)

| Operation | Gas Cost | HBAR Cost* |
|-----------|----------|------------|
| Deploy NFT Contract | ~2,500,000 | ~25 HBAR |
| Deploy Marketplace | ~3,000,000 | ~30 HBAR |
| Deploy Leaderboard | ~2,000,000 | ~20 HBAR |
| Mint NFT | ~150,000 | ~1.5 HBAR |
| Purchase Item | ~80,000 | ~0.8 HBAR |
| Submit Score | ~100,000 | ~1.0 HBAR |

*Gas costs at 100 gwei, actual costs may vary

## 🚨 Troubleshooting

### Common Issues:

**"Insufficient funds" Error**
- Ensure your account has enough HBAR for deployment (~100 HBAR recommended)
- Check your account balance in HashPack

**"Invalid private key" Error**
- Verify your private key is in hex format: `0x1234567890abcdef...`
- Convert DER format to hex using online converter
- Ensure it's exactly 64 characters after the `0x` prefix
- Check there are no extra spaces in your .env file

**"Contract verification failed"**
- Wait a few minutes after deployment
- Try running `npm run verify` again
- Verification is optional for functionality

## 🔧 Advanced Configuration

### Custom Gas Settings
Edit `hardhat.config.js` to adjust gas limits:
```javascript
gas: 3000000,        // Increase if deployment fails
gasPrice: 100000000000, // 100 gwei, adjust for network conditions
```

### Custom Item Prices
Update marketplace items after deployment:
```javascript
// Only contract owner can call this
await marketplace.updateGameItem(
  ItemType.WEAPON_UPGRADE,
  ethers.utils.parseEther("3"), // New price: 3 HBAR
  1000, // Quantity
  true, // Is active
  "Super Weapon", // Name
  "Enhanced damage boost" // Description
);
```

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify your environment configuration
3. Ensure sufficient HBAR balance
4. Review the deployment logs for specific error messages

## 🎯 What's Next?

After successful deployment:
1. ✅ Update `scripts/hedera.js` with contract addresses
2. ✅ Test NFT minting in your game
3. ✅ Test item purchases
4. ✅ Test score submissions
5. ✅ Deploy to mainnet when ready for production

---

**⚡ Ready to launch your blockchain-powered game! ⚡**