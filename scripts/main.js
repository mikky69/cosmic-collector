// Main Application Controller for Cosmic Collector
// Mikky Studio - 2025

class CosmicCollectorApp {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentGame = null;
        this.currentGameType = 'cosmic';
        this.currentScreen = 'mainMenu';
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        console.log('Initializing Mikky Studio Games...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup responsive canvas
        this.setupCanvas();
        
        // Initialize UI
        this.showScreen('mainMenu');
        this.loadLeaderboard();
        this.loadNFTCollection();
        
        this.isInitialized = true;
        console.log('Mikky Studio Games initialized successfully');
    }

    setupEventListeners() {
        // Main Menu buttons - Game selection
        document.getElementById('playBtn').addEventListener('click', () => {
            this.startGame('cosmic');
        });

        document.getElementById('snakeBtn').addEventListener('click', () => {
            this.startGame('snake');
        });

        document.getElementById('nftBtn').addEventListener('click', () => {
            this.showScreen('nftScreen');
        });

        document.getElementById('shopBtn').addEventListener('click', () => {
            this.showScreen('shopScreen');
        });

        document.getElementById('leaderboardBtn').addEventListener('click', () => {
            this.showScreen('leaderboardScreen');
            this.loadLeaderboard();
        });

        // Wallet connection
        document.getElementById('connectWalletBtn').addEventListener('click', async () => {
            await this.connectWallet();
        });

        // NFT screen buttons
        document.getElementById('mintNftBtn').addEventListener('click', async () => {
            await this.mintNFT();
        });

        document.getElementById('backFromNftBtn').addEventListener('click', () => {
            this.showScreen('mainMenu');
        });

        // Shop screen buttons
        document.querySelectorAll('.shop-item .btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const shipType = e.target.dataset.ship;
                const price = parseInt(e.target.textContent.match(/\\d+/)[0]);
                await this.purchaseShip(shipType, price);
            });
        });

        document.getElementById('backFromShopBtn').addEventListener('click', () => {
            this.showScreen('mainMenu');
        });

        // Leaderboard back button
        document.getElementById('backFromLeaderboardBtn').addEventListener('click', () => {
            this.showScreen('mainMenu');
        });

        // Game over screen buttons
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.startGame(this.currentGameType);
        });

        document.getElementById('submitScoreBtn').addEventListener('click', async () => {
            await this.submitScore();
        });

        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.showScreen('mainMenu');
        });

        // Pause button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (this.currentGame) {
                this.currentGame.togglePause();
            }
        });

        // Back button from game
        document.getElementById('backToMenuFromGame').addEventListener('click', () => {
            if (this.currentGame) {
                this.currentGame.stop();
                this.currentGame = null;
            }
            this.showScreen('mainMenu');
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });

        // Global keyboard handling
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.currentScreen === 'gameScreen') {
                if (this.currentGame) {
                    this.currentGame.togglePause();
                }
            }
        });
    }

    setupCanvas() {
        // Make canvas responsive while maintaining aspect ratio
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const aspectRatio = 4 / 3; // 800x600 aspect ratio
        
        let canvasWidth = containerWidth;
        let canvasHeight = containerWidth / aspectRatio;
        
        if (canvasHeight > containerHeight) {
            canvasHeight = containerHeight;
            canvasWidth = containerHeight * aspectRatio;
        }
        
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        
        // Update physics world bounds if game is initialized
        if (this.currentGame && this.currentGame.physics) {
            this.currentGame.physics.setBounds(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show selected screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        }
    }

    showLoadingScreen(message = 'Loading...') {
        document.getElementById('loadingText').textContent = message;
        this.showScreen('loadingScreen');
    }

    async startGame(gameType = 'cosmic') {
        this.showScreen('gameScreen');
        this.currentGameType = gameType;
        
        // Create the appropriate game instance
        switch(gameType) {
            case 'cosmic':
                this.currentGame = new CosmicCollectorGame(this.canvas, this.ctx);
                break;
            case 'snake':
                this.currentGame = new SpaceSnakeGame(this.canvas, this.ctx);
                break;
            default:
                this.currentGame = new CosmicCollectorGame(this.canvas, this.ctx);
        }
        
        // Start the game
        if (this.currentGame) {
            this.currentGame.start();
        }
    }

    async connectWallet() {
        try {
            this.showLoadingScreen('Connecting to Hedera wallet...');
            
            const result = await window.hederaService.connectWallet();
            
            if (result.success) {
                console.log('Wallet connected:', result.accountId);
                
                // Update wallet display
                const connectBtn = document.getElementById('connectWalletBtn');
                const walletInfo = document.getElementById('walletInfo');
                const walletAddress = document.getElementById('walletAddress');
                const walletBalance = document.getElementById('walletBalance');
                
                connectBtn.style.display = 'none';
                walletInfo.classList.remove('hidden');
                
                // Format address for display
                const shortAddress = result.accountId.length > 12 ? 
                    result.accountId.substring(0, 8) + '...' + result.accountId.substring(result.accountId.length - 4) :
                    result.accountId;
                    
                walletAddress.textContent = `${result.walletType.toUpperCase()}: ${shortAddress}`;
                walletBalance.textContent = `${result.balance.toFixed(2)} HBAR`;
                
                this.showScreen('mainMenu');
            } else {
                alert('Failed to connect wallet: ' + (result.error || 'Unknown error'));
                this.showScreen('mainMenu');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            alert('Error connecting wallet: ' + error.message);
            this.showScreen('mainMenu');
        }
    }

    async mintNFT() {
        try {
            if (!window.hederaService.walletConnected) {
                alert('Please connect your wallet first');
                return;
            }

            this.showLoadingScreen('Minting NFT on Hedera testnet...');

            // Generate random ship type for minting
            const shipTypes = ['classic', 'speed', 'tank', 'stealth'];
            const randomShip = shipTypes[Math.floor(Math.random() * shipTypes.length)];
            
            const result = await window.hederaService.mintNFT(randomShip);

            if (result.success) {
                alert(result.message);
                this.loadNFTCollection();
            } else {
                alert('Failed to mint NFT: ' + result.error);
            }

            this.showScreen('nftScreen');
        } catch (error) {
            console.error('NFT minting error:', error);
            alert('Error minting NFT: ' + error.message);
            this.showScreen('nftScreen');
        }
    }

    async purchaseShip(shipType, price) {
        try {
            if (!window.hederaService.walletConnected) {
                alert('Please connect your wallet first');
                return;
            }

            this.showLoadingScreen(`Purchasing ${shipType} ship...`);

            const result = await window.hederaService.purchaseShip(shipType);

            if (result.success) {
                alert(result.message);
                this.loadNFTCollection();
            } else {
                alert('Failed to purchase ship: ' + result.error);
            }

            this.showScreen('shopScreen');
        } catch (error) {
            console.error('Ship purchase error:', error);
            alert('Error purchasing ship: ' + error.message);
            this.showScreen('shopScreen');
        }
    }

    async submitScore() {
        try {
            if (!window.hederaService.walletConnected) {
                alert('Please connect your wallet first');
                return;
            }

            if (!this.currentGame) {
                alert('No game data to submit');
                return;
            }

            this.showLoadingScreen('Submitting score to blockchain...');

            const result = await window.hederaService.submitScore(this.currentGame.score, this.currentGameType);

            if (result.success) {
                alert(result.message);
                this.loadLeaderboard();
            } else {
                alert('Failed to submit score: ' + result.error);
            }

            this.showScreen('gameOverScreen');
        } catch (error) {
            console.error('Score submission error:', error);
            alert('Error submitting score: ' + error.message);
            this.showScreen('gameOverScreen');
        }
    }

    async loadNFTCollection() {
        const nftGrid = document.getElementById('nftGrid');
        nftGrid.innerHTML = '';

        if (!window.hederaService.walletConnected) {
            nftGrid.innerHTML = '<p class="no-nfts">Connect wallet to view your NFT collection</p>';
            return;
        }

        try {
            const nfts = await window.hederaService.getUserNFTs();

            if (nfts.length === 0) {
                nftGrid.innerHTML = '<p class="no-nfts">No NFTs found. Mint your first spaceship!</p>';
                return;
            }

            nfts.forEach((nft, index) => {
                const nftItem = document.createElement('div');
                nftItem.className = 'nft-item';
                
                // Create mock metadata if not present
                const mockMetadata = {
                    name: `Cosmic Ship #${nft.serialNumber || index + 1}`,
                    type: 'classic',
                    rarity: 'Common',
                    stats: { speed: 5, armor: 5, firepower: 5 }
                };

                const metadata = nft.metadata || mockMetadata;
                const shipEmoji = this.getShipEmoji(metadata.type);
                
                nftItem.innerHTML = `
                    <div class="nft-preview" style="background: ${this.getShipGradient(metadata.type)}">
                        ${shipEmoji}
                    </div>
                    <h3>${metadata.name}</h3>
                    <p>Type: ${metadata.type}</p>
                    <p>Rarity: ${metadata.rarity}</p>
                    <div class="nft-stats">
                        <small>Speed: ${metadata.stats.speed}/10</small><br>
                        <small>Armor: ${metadata.stats.armor}/10</small><br>
                        <small>Power: ${metadata.stats.firepower}/10</small>
                    </div>
                    <p class="nft-serial">Serial #${nft.serialNumber || index + 1}</p>
                `;
                
                nftGrid.appendChild(nftItem);
            });
        } catch (error) {
            console.error('Error loading NFTs:', error);
            nftGrid.innerHTML = '<p class="no-nfts">Error loading NFT collection</p>';
        }
    }

    async loadLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';

        try {
            const scores = await window.hederaService.getLeaderboard(this.currentGameType);

            if (scores.length === 0) {
                leaderboardList.innerHTML = '<p class="no-scores">No scores submitted yet. Be the first!</p>';
                return;
            }

            scores.forEach((score, index) => {
                const entry = document.createElement('div');
                entry.className = 'leaderboard-entry';
                
                const rank = index + 1;
                let rankEmoji = '🏆';
                if (rank === 2) rankEmoji = '🥈';
                else if (rank === 3) rankEmoji = '🥉';
                else if (rank > 3) rankEmoji = `#${rank}`;
                
                const playerName = score.accountId ? 
                    `${score.accountId.substring(0, 8)}...` : 
                    'Anonymous';
                
                entry.innerHTML = `
                    <div class="rank">${rankEmoji}</div>
                    <div class="player">${playerName}</div>
                    <div class="score-value">${score.score.toLocaleString()}</div>
                    <div class="wallet-type">${score.walletType || 'N/A'}</div>
                `;
                
                leaderboardList.appendChild(entry);
            });
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            leaderboardList.innerHTML = '<p class="no-scores">Error loading leaderboard</p>';
        }
    }

    getShipEmoji(shipType) {
        const emojis = {
            classic: '🚀',
            speed: '⚡',
            tank: '🛡️',
            stealth: '👻'
        };
        return emojis[shipType] || '🚀';
    }

    getShipGradient(shipType) {
        const gradients = {
            classic: 'linear-gradient(45deg, #ff6b6b, #ff8e8e)',
            speed: 'linear-gradient(45deg, #4ecdc4, #6ee5de)',
            tank: 'linear-gradient(45deg, #45b7d1, #7fb7d4)',
            stealth: 'linear-gradient(45deg, #96ceb4, #b8d4c7)'
        };
        return gradients[shipType] || gradients.classic;
    }

    // Utility methods
    formatHbar(amount) {
        return `${amount.toFixed(2)} HBAR`;
    }

    formatScore(score) {
        return score.toLocaleString();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Error handling
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // Show user-friendly error message
        const userMessage = this.getUserFriendlyError(error);
        alert(`${context} Error: ${userMessage}`);
    }

    getUserFriendlyError(error) {
        if (error.message.includes('wallet')) {
            return 'Please check your wallet connection and try again.';
        } else if (error.message.includes('network')) {
            return 'Network error. Please check your internet connection.';
        } else if (error.message.includes('transaction')) {
            return 'Transaction failed. Please try again.';
        } else if (error.message.includes('insufficient')) {
            return 'Insufficient funds. Please add more HBAR to your wallet.';
        } else {
            return error.message || 'An unexpected error occurred.';
        }
    }

    // Debug methods
    enableDebugMode() {
        window.DEBUG_PHYSICS = true;
        console.log('Debug mode enabled');
    }

    disableDebugMode() {
        window.DEBUG_PHYSICS = false;
        console.log('Debug mode disabled');
    }

    getGameStats() {
        if (!this.game) return null;
        
        return {
            score: this.game.score,
            level: this.game.level,
            lives: this.game.lives,
            gems: this.game.gems,
            gameTime: this.game.gameTime,
            enemiesDestroyed: this.game.enemies.length,
            bulletsActive: this.game.bullets.length,
            pickupsActive: this.game.pickups.length
        };
    }
}

// CSS for dynamic elements
const dynamicStyles = `
    .no-nfts, .no-scores {
        text-align: center;
        color: #a0a0ff;
        font-style: italic;
        margin: 40px 0;
    }

    .nft-stats {
        margin: 10px 0;
        font-size: 0.8rem;
        color: #ccc;
    }

    .nft-serial {
        font-size: 0.7rem;
        color: #888;
        margin-top: 5px;
    }

    .leaderboard-entry {
        animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .loading-spinner {
        border-color: #4ecdc4;
        border-top-color: #ff6b6b;
    }

    /* Game UI enhancements */
    .game-ui {
        backdrop-filter: blur(10px);
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.3);
        padding: 10px;
        margin: 10px;
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
        .nft-grid {
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .shop-grid {
            grid-template-columns: 1fr;
        }

        .leaderboard-list {
            min-width: 100%;
            margin: 10px;
            padding: 20px;
        }

        .game-over-buttons {
            flex-direction: column;
            align-items: stretch;
            padding: 0 20px;
        }

        .btn {
            margin: 5px 0;
        }
    }
`;

// Add dynamic styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);

// Initialize app when ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CosmicCollectorApp();
});

// Global app access for debugging
window.cosmicApp = () => app;

// Export app class
window.CosmicCollectorApp = CosmicCollectorApp;
