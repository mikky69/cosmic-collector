# 🚀 Cosmic Collector - Hedera Blockchain Game

*A thrilling arcade space game with NFT integration powered by Hedera Hashgraph*

**Developed by Mikky Studio**

## 🎮 Game Overview

Cosmic Collector is an addictive arcade-style space shooter that combines classic gameplay with modern blockchain technology. Players control a spaceship, collect cosmic gems, battle enemies, and can own unique NFT spaceships on the Hedera testnet.

### Key Features

- **🛸 Addictive Gameplay**: Classic arcade-style space shooter with realistic physics
- **🏆 NFT Integration**: Collect and trade unique spaceship NFTs
- **💎 Hedera Integration**: Payments and NFTs powered by Hedera Hashgraph testnet
- **⚡ Realistic Physics**: Advanced physics engine with particle effects
- **🎯 Progressive Difficulty**: Dynamic difficulty scaling with level progression
- **🏅 Leaderboards**: Blockchain-based score submission system
- **🛡️ Multiple Ship Types**: Different ships with unique stats and abilities

## 🎯 Gameplay

### Objective
- Survive waves of enemies while collecting cosmic gems
- Upgrade your weapons and unlock new abilities
- Compete for high scores on the global leaderboard
- Collect NFT spaceships with unique properties

### Controls
- **Movement**: Arrow Keys or WASD
- **Shoot**: Spacebar
- **Pause**: ESC

### Game Elements

#### Enemies
- **Basic Fighter**: Standard enemy with balanced stats
- **Speed Racer**: Fast but fragile
- **Heavy Tank**: Slow but heavily armored

#### Power-ups
- **💎 Gems**: Increase score and currency
- **❤️ Health**: Restore player health
- **⚡ Weapon Upgrade**: Improve firepower
- **🛡️ Shield**: Temporary invulnerability

#### Ship Types (NFTs)
- **Classic Fighter**: Balanced stats (5 HBAR)
- **Speed Racer**: High speed, low armor (8 HBAR)
- **Heavy Tank**: High armor, low speed (12 HBAR)
- **Stealth Ninja**: Special invisibility ability (15 HBAR)

## 🔗 Blockchain Integration

### Hedera Testnet Features

#### NFT System
- **Ship Collection**: Each ship is a unique NFT with metadata
- **Rarity Levels**: Common, Uncommon, Rare, Epic
- **Trading**: Buy and sell ships in the marketplace
- **Minting**: Create new ship NFTs (10 HBAR)

#### Payment System
- **HBAR Transactions**: All purchases use Hedera's native currency
- **Smart Contracts**: Automated game logic on Hedera
- **Leaderboard Submission**: 1 HBAR to submit scores
- **Transparent Pricing**: Clear costs for all transactions

#### Wallet Integration
- **HashPack Compatible**: Connect with popular Hedera wallets
- **Testnet Safe**: All transactions on Hedera testnet
- **Account Management**: View balance and transaction history

## 🛠️ Technical Architecture

### Frontend Stack
- **HTML5 Canvas**: High-performance 2D rendering
- **JavaScript ES6+**: Modern JavaScript features
- **CSS3**: Advanced styling and animations
- **Responsive Design**: Works on desktop and mobile

### Physics Engine
- **Custom Vector2D**: Advanced 2D vector mathematics
- **Realistic Movement**: Physics-based acceleration and momentum
- **Collision Detection**: Circle-to-circle and shape-based collisions
- **Particle System**: Explosive effects and trails
- **Boundary Physics**: Realistic wall bouncing

### Game Systems
- **Entity Component System**: Modular game object architecture
- **State Management**: Clean separation of game states
- **Input System**: Responsive keyboard controls
- **Audio Ready**: Framework for sound effects integration
- **Save System**: Local storage for game progress

### Blockchain Layer
- **Hedera SDK**: Official Hedera JavaScript SDK
- **Token Service**: HTS for NFT management
- **Consensus Service**: For leaderboards and game events
- **Smart Contracts**: Game logic verification

## 🚀 Setup and Installation

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Hedera testnet account
- HashPack wallet (recommended) or compatible Hedera wallet

### Quick Start

1. **Clone or Download**
   ```bash
   # If using Git
   git clone <repository-url>
   cd cosmic-collector
   
   # Or download and extract the ZIP file
   ```

2. **Serve the Files**
   
   **Option A: Python Server**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   **Option B: Node.js Server**
   ```bash
   npx http-server
   ```
   
   **Option C: PHP Server**
   ```bash
   php -S localhost:8000
   ```

3. **Open in Browser**
   ```
   http://localhost:8000
   ```

4. **Connect Wallet**
   - Click "Connect Hedera Wallet"
   - Approve connection in your wallet
   - Start playing!

### Development Setup

For development and testing:

```bash
# Install development server (optional)
npm install -g live-server

# Start with live reload
live-server --port=8000
```

## 🎨 Game Assets

### Visual Style
- **Color Scheme**: Space-themed with neon accents
- **Typography**: Orbitron font for futuristic feel
- **Effects**: Particle systems and screen shake
- **UI**: Glass-morphism design with blur effects

### Ship Designs
- **Classic**: Red gradient, balanced triangle design
- **Speed**: Cyan gradient, sleek arrow shape
- **Tank**: Blue gradient, robust pentagon
- **Stealth**: Green gradient, angular design

## 🧪 Testing

### Manual Testing
1. Load the game in browser
2. Test all menu navigation
3. Connect wallet functionality
4. Play full game session
5. Test NFT minting and purchasing
6. Verify leaderboard submission

### Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Mobile Compatibility
- ✅ iOS Safari 13+
- ✅ Android Chrome 80+
- ⚠️ Limited touch controls (keyboard required)

## 🔧 Configuration

### Hedera Testnet Settings
```javascript
// In scripts/hedera.js
testnetNodes: {
    '0.testnet.hedera.com:50211': '0.0.3',
    '1.testnet.hedera.com:50211': '0.0.4',
    '2.testnet.hedera.com:50211': '0.0.5',
    '3.testnet.hedera.com:50211': '0.0.6'
}
```

### Game Balance
```javascript
// In scripts/game.js
playerSpeed: 300,
bulletSpeed: 500,
enemySpawnRate: 2.0,
pickupSpawnRate: 1.0,
shotCooldown: 0.2
```

## 📚 API Reference

### HederaService Methods
- `connectWallet()`: Connect to user's Hedera wallet
- `createGameToken()`: Initialize game token
- `createNFTCollection()`: Set up NFT collection
- `mintShipNFT(type, metadata)`: Mint new ship NFT
- `purchaseShip(type, price)`: Buy ship with HBAR
- `submitScore(score, name)`: Submit to leaderboard

### Game Events
- `gameStart`: Game begins
- `gameOver`: Game ends
- `levelUp`: Player advances level
- `enemyDestroyed`: Enemy defeated
- `powerUpCollected`: Power-up obtained

## 🐛 Troubleshooting

### Common Issues

**Game won't load**
- Ensure files are served from HTTP server
- Check browser console for errors
- Verify all script files are present

**Wallet won't connect**
- Install HashPack or compatible wallet
- Ensure wallet is on Hedera testnet
- Check popup blockers

**NFT functions not working**
- Verify wallet connection
- Check testnet HBAR balance
- Confirm network connectivity

**Performance issues**
- Try different browser
- Close other tabs/applications
- Check hardware acceleration is enabled

### Debug Mode
```javascript
// Enable debug mode in console
cosmicApp().enableDebugMode();

// View game stats
cosmicApp().getGameStats();
```

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Additional ship types and abilities
- Sound effects and music
- Multiplayer functionality
- Advanced NFT features
- Mobile touch controls
- Performance optimizations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core gameplay mechanics
- ✅ Physics engine
- ✅ NFT integration
- ✅ Hedera testnet support

### Phase 2
- 🔄 Audio system
- 🔄 Advanced NFT traits
- 🔄 Tournament system
- 🔄 Mobile optimization

### Phase 3
- 📋 Multiplayer battles
- 📋 Guild system
- 📋 Mainnet deployment
- 📋 Cross-chain bridge

## 👥 Credits

**Mikky Studio Development Team**
- Game Design & Development
- Physics Engine Implementation
- Blockchain Integration
- UI/UX Design

**Special Thanks**
- Hedera team for excellent documentation
- Web3 community for inspiration
- Beta testers and early adopters

## 📞 Support

For support and inquiries:
- **Studio**: Mikky Studio
- **Game**: Cosmic Collector
- **Platform**: Hedera Hashgraph
- **Environment**: Testnet

---

**🚀 Ready to explore the cosmos? Connect your wallet and start your space adventure!**

*Built with ❤️ by Mikky Studio using Hedera Hashgraph*