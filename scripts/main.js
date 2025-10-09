// Main Game Controller
class CosmicCollector {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu';
        this.score = 0;
        this.level = 1;
        this.health = 100;
        this.gems = 0;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initializeScreens();
    }
    
    setupCanvas() {
        this.canvas.width = Math.min(window.innerWidth * 0.9, 1200);
        this.canvas.height = Math.min(window.innerHeight * 0.8, 800);
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('connect-wallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('instructions').addEventListener('click', () => this.showInstructions());
        document.getElementById('back-to-menu').addEventListener('click', () => this.showMainMenu());
        document.getElementById('main-menu-btn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('play-again').addEventListener('click', () => this.startGame());
        
        // Game controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Window resize
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    initializeScreens() {
        this.showMainMenu();
    }
    
    showMainMenu() {
        this.hideAllScreens();
        document.getElementById('main-menu').classList.add('active');
        this.gameState = 'menu';
    }
    
    showInstructions() {
        this.hideAllScreens();
        document.getElementById('instructions-screen').classList.add('active');
    }
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    startGame() {
        this.hideAllScreens();
        document.getElementById('game-ui').classList.add('active');
        this.gameState = 'playing';
        
        // Reset game state
        this.score = 0;
        this.level = 1;
        this.health = 100;
        this.gems = 0;
        
        this.updateUI();
        this.gameLoop();
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('gems').textContent = this.gems;
        
        const healthFill = document.getElementById('health-fill');
        healthFill.style.width = `${this.health}%`;
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Basic game update logic
        this.score += 1;
        
        if (this.score > 0 && this.score % 1000 === 0) {
            this.level++;
            this.gems += 10;
        }
        
        this.updateUI();
        
        // Demo: End game after reaching certain score
        if (this.score > 5000) {
            this.gameOver();
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars background
        this.drawStars();
        
        // Draw demo spaceship
        this.drawSpaceship();
        
        // Draw demo text
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '24px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🚀 DEMO MODE - Game in Development 🚀', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '16px Orbitron';
        this.ctx.fillText('Press ESC to return to menu', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
    
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 2;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    drawSpaceship() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + 100;
        
        // Draw simple triangle spaceship
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - 20);
        this.ctx.lineTo(centerX - 15, centerY + 15);
        this.ctx.lineTo(centerX + 15, centerY + 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw engine glow
        this.ctx.fillStyle = '#ff6600';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + 20, 5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameOver() {
        this.hideAllScreens();
        document.getElementById('game-over').classList.add('active');
        this.gameState = 'gameOver';
        
        // Update final stats
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-level').textContent = this.level;
        document.getElementById('final-gems').textContent = this.gems;
    }
    
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.gameState === 'playing') {
                this.showMainMenu();
            }
        }
    }
    
    handleKeyUp(e) {
        // Handle key releases
    }
    
    async connectWallet() {
        try {
            // Placeholder for Hedera wallet connection
            alert('🔗 Wallet connection feature coming soon!\n\nThis will connect to your Hedera testnet wallet for:\n• NFT ship purchases\n• Leaderboard submissions\n• Blockchain transactions');
        } catch (error) {
            console.error('Wallet connection failed:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.cosmicGame = new CosmicCollector();
});

// Expose game instance for debugging
window.cosmicApp = () => window.cosmicGame;