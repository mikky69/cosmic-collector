# 🚀 Cosmic Collector Smart Contracts

Complete smart contract suite for the Cosmic Collector multi-game blockchain gaming platform on Hedera Hashgraph.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contract Interactions](#contract-interactions)
- [Security](#security)

## 🎮 Overview

Cosmic Collector is a blockchain gaming platform featuring 4 different games, all powered by:
- **$COSM Token**: 1 billion capped fungible token with burn mechanics
- **Spaceship NFTs**: Unique ships with on-chain stats affecting gameplay
- **Marketplace**: P2P trading with platform fees
- **Leaderboards**: HCS-based score tracking for all 4 games
- **Treasury**: Multi-sig controlled reward distribution

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Access Control Layer                      │
│            (Multi-sig, Roles, Permissions)                   │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
    │   Token   │      │    NFT    │      │   Game    │
    │  Manager  │      │  Manager  │      │ Registry  │
    └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
    │Marketplace│      │ Treasury  │      │Leaderboard│
    └───────────┘      └───────────┘      └───────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              ┌─────▼─────┐      ┌─────▼─────┐
              │    HTS    │      │    HCS    │
              │  Tokens   │      │  Topics   │
              └───────────┘      └───────────┘
```

### Smart Contracts

1.  **`AccessControl.sol`**: The security core of the platform. Manages all roles (Owner, Admin, etc.) and permissions for other contracts. Implements a pausable functionality for emergencies.
2.  **`GameRegistry.sol`**: Acts as the anti-cheat engine. It manages the lifecycle of a game session, from `startSession` to `endSession`, and requires a backend service to call `verifySession` before a score is considered valid.
3.  **`LeaderboardManager.sol`**: Handles player score submissions. It cross-references with `GameRegistry` to ensure a session is verified before accepting a score and maintains the top-10 leaderboard for each game.
4.  **`COSMToken.sol`**: The ERC20 fungible token for the game's economy. It includes a transfer fee mechanism that sends a percentage of each transaction to the treasury.
5.  **`TokenManager.sol`**: Manages the distribution and swapping of `$COSM` tokens. It enforces daily claim limits for players and allows swapping HBAR for `$COSM`.
6.  **`SpaceshipNFT.sol`**: The main ERC721 contract for the spaceship NFTs. It handles minting, defines ship stats based on type and rarity, and stores the metadata URI for each token.
7.  **`NFTManager.sol`**: Manages advanced operations for NFTs, such as upgrading their level and crafting new NFTs by combining existing ones.
8.  **`Marketplace.sol`**: Enables peer-to-peer trading of NFTs for a fixed price in `$COSM`. It handles listings, purchases, and cancellations, while collecting a platform fee for the treasury.
9.  **`AuctionHouse.sol`**: An advanced marketplace contract that allows users to auction their NFTs. It includes features like bidding, an anti-snipe mechanism, and secure settlement.
10. **`Treasury.sol`**: The central vault for the project's funds. It securely holds `$COSM` tokens and implements a multi-signature withdrawal process requiring approval from two owners for any fund transfer.
11. **`RewardDistributor.sol`**: Manages the allocation and claiming of rewards for players. It works with the `Treasury` to distribute funds to players who have earned them.
12. **`GameTypes.sol`**: A central library that defines all the shared data structures (`structs`) and enumerations (`enums`) used across the entire project, ensuring data consistency and code readability.

### Hedera Integration

- **HTS (Hedera Token Service)**: $COSM token and NFT creation
- **HCS (Hedera Consensus Service)**: Leaderboard data storage (4 topics)
- **HSCS (Hedera Smart Contract Service)**: Smart contract deployment

## 📦 Prerequisites

- Node.js v18+ and Yarn
- Hedera testnet account ([create here](https://portal.hedera.com/))
- HashPack wallet or compatible Hedera wallet
- Basic Solidity knowledge
- ~100 HBAR for testnet deployment

## 🔧 Installation

```bash
# Clone repository
git clone https://github.com/mikky69/cosmic-collector
cd Cosmic-Collector-Smart-Contracts

# Install dependencies
yarn install

# Copy environment template
cp .env.example .env
```

## ⚙️ Configuration

### 1. Setup .env File

Fill in your `.env` file with your Hedera credentials:

```bash
# Hedera Testnet Credentials
OPERATOR_ID=0.0.xxxxx
OPERATOR_KEY=302e020100300506032b65700422042xxxxxxxxxxxxx
PRIVATE_KEY=0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Treasury Account (Shared between owners)
TREASURY_ACCOUNT_ID=0.0.xxxxx
TREASURY_PRIVATE_KEY=xxxxx

# Owner 2 Address (Client)
OWNER2_ADDRESS=0x...
```

### 2. Get Testnet HBAR

Visit the [Hedera Testnet Faucet](https://portal.hedera.com/) to get free testnet HBAR.

## 🚀 Deployment

### Full Deployment (Recommended)

Deploy all contracts at once:

```bash
yarn deploy:all
```

This will:
1. Deploy AccessControl with both owners
2. Deploy GameRegistry
3. Deploy COSMToken
4. Deploy SpaceshipNFT
5. Deploy Treasury & RewardDistributor
6. Deploy Marketplace
7. Deploy LeaderboardManager
8. Setup all roles and permissions
9. Transfer tokens to treasury

### Individual Contract Deployment

If you need to deploy contracts separately:

```bash
# Deploy token
yarn deploy:token

# Deploy NFT
yarn deploy:nft

# Deploy marketplace
yarn deploy:marketplace

# Deploy treasury
yarn deploy:treasury

# Deploy leaderboard
yarn deploy:leaderboard
```

### Hedera Native Services

After smart contracts are deployed, create native Hedera services:

```bash
# Create HTS token
yarn hedera:token

# Create HTS NFT collection
yarn hedera:nft

# Create HCS topics (4 topics for 4 games)
yarn hedera:topics
```

**Important**: Update your `.env` with the IDs returned from these commands!

## 🧪 Testing

### Run All Tests

```bash
yarn test
```

### Run Specific Tests

```bash
# Token tests
yarn hardhat test test/Token.test.js

# NFT tests
yarn hardhat test test/NFT.test.js

# Marketplace tests
yarn hardhat test test/Marketplace.test.js

# Integration tests
yarn hardhat test test/Integration.test.js
```

### Test Coverage

```bash
yarn hardhat coverage
```

## 🔗 Contract Interactions

### Minting Spaceships

```javascript
const { ethers } = require("ethers");
const SpaceshipNFT = require("./artifacts/contracts/nft/SpaceshipNFT.sol/SpaceshipNFT.json");

const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const wallet = new ethers.Wallet(privateKey, provider);
const nft = new ethers.Contract(nftAddress, SpaceshipNFT.abi, wallet);

// Mint a spaceship
const tx = await nft.mint(
    playerAddress,
    0, // ShipType: ClassicFighter
    "ipfs://metadata-uri",
    { value: ethers.parseEther("5") } // 5 HBAR
);

await tx.wait();
```

### Listing on Marketplace

```javascript
const marketplace = new ethers.Contract(marketplaceAddress, Marketplace.abi, wallet);

// Approve marketplace
await nft.approve(marketplaceAddress, tokenId);

// List for sale
await marketplace.listItem(
    tokenId,
    ethers.parseEther("100"), // Price in $COSM
    7 * 24 * 60 * 60 // Duration: 7 days
);
```

### Submitting Scores

```javascript
const gameRegistry = new ethers.Contract(registryAddress, GameRegistry.abi, wallet);
const leaderboard = new ethers.Contract(leaderboardAddress, LeaderboardManager.abi, wallet);

// Start session
const sessionId = await gameRegistry.startSession(0, tokenId); // GameId: 0

// ... play game ...

// End session
await gameRegistry.endSession(sessionId, score, proof);

// Submit to leaderboard (after backend verification)
await leaderboard.submitScore(
    sessionId,
    score,
    tokenId,
    0, // GameId
    { value: ethers.parseEther("1") } // 1 HBAR fee
);
```

## 🔐 Security

### Multi-Sig Treasury

All treasury withdrawals require approval from BOTH owners:

```javascript
// Owner 1 requests withdrawal
const requestId = await treasury.requestWithdrawal(recipient, amount);

// Owner 2 approves
await treasury.approveWithdrawal(requestId);

// Anyone can execute after approval
await treasury.executeWithdrawal(requestId);
```

### Admin Keys

**CRITICAL**: After deployment and testing:

1. Consider revoking admin keys for true decentralization
2. Or keep them for upgrades and emergency actions
3. Use multi-sig for all critical operations

```javascript
// If you want to revoke (PERMANENT - cannot undo!)
await accessControl.renounceRole(ADMIN_ROLE, yourAddress);
```

### Upgradability

Contracts use UUPS proxy pattern:

```bash
# Upgrade a contract (requires OWNER_ROLE)
yarn hardhat run scripts/upgrade/upgrade-token.js --network hederaTestnet
```

## 📊 Monitoring

### View on HashScan

All deployed contracts and transactions can be viewed on HashScan:

- Testnet: https://hashscan.io/testnet
- Mainnet: https://hashscan.io/mainnet

### Check Balances

```javascript
// Check $COSM balance
const balance = await cosmToken.balanceOf(address);

// Check NFT ownership
const owner = await spaceshipNFT.ownerOf(tokenId);

// Check treasury balance
const treasuryBalance = await treasury.getBalance();
```

## 🛠️ Troubleshooting

### Common Issues

**"Insufficient HBAR"**
- Get more testnet HBAR from faucet
- Check gas limit settings in hardhat.config.js

**"Contract not deployed"**
- Verify address in .env
- Check network (testnet vs mainnet)

**"Not authorized"**
- Ensure correct wallet is connected
- Verify roles are properly assigned

**"Session not verified"**
- Backend must verify session before leaderboard submission
- Check GameRegistry.verifySession() was called

### Gas Optimization

If running into gas issues:

```javascript
// Increase gas limit in hardhat.config.js
gas: 15000000,
gasPrice: 15000000000,
```

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

This is a private project for Cosmic Collector. For issues or questions, contact the development team.

## 🔗 Resources

- [Hedera Documentation](https://docs.hedera.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)

---

**Built with ❤️ for Cosmic Collector**