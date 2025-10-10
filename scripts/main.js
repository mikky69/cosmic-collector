// Main application controller
class CosmicGamesApp {
    constructor() {
        this.currentModal = null;
        this.hederaService = new HederaService();
        
        this.setupModalSystem();
        this.setupGlobalEventListeners();
    }
    
    setupModalSystem() {
        // Close modal button
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideModal();
        });
        
        // Play again button
        document.getElementById('play-again').addEventListener('click', () => {
            this.hideModal();
            const currentGame = window.gameNavigation?.getCurrentGame();
            if (currentGame && currentGame.startGame) {
                currentGame.startGame();
            }
        });
        
        // Submit score button
        document.getElementById('submit-score').addEventListener('click', async () => {
            const playerName = document.getElementById('player-name').value.trim();
            if (!playerName) {
                alert('Please enter your name!');
                return;
            }
            
            // Get final score from the stats display
            const statsElement = document.getElementById('final-stats');
            const scoreText = statsElement.textContent.match(/(?:Score|Credits):\s*(\d+)/);
            const score = scoreText ? parseInt(scoreText[1]) : 0;
            
            await this.hederaService.submitScore(score, playerName);
        });
        
        // Close modal when clicking outside
        document.getElementById('game-over-modal').addEventListener('click', (e) => {
            if (e.target.id === 'game-over-modal') {
                this.hideModal();
            }
        });
    }
    
    setupGlobalEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC key to close modal
            if (e.key === 'Escape' && this.currentModal) {
                this.hideModal();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseCurrentGame();
            }
        });
    }
    
    showModal() {
        const modal = document.getElementById('game-over-modal');
        modal.classList.add('active');
        this.currentModal = modal;
        
        // Clear previous input
        document.getElementById('player-name').value = '';
    }
    
    hideModal() {
        const modal = document.getElementById('game-over-modal');
        modal.classList.remove('active');
        this.currentModal = null;
    }
    
    pauseCurrentGame() {
        const currentGame = window.gameNavigation?.getCurrentGame();
        if (currentGame && currentGame.pauseGame && currentGame.gameState === 'playing') {
            currentGame.pauseGame();
        }
    }
    
    handleResize() {
        // Trigger canvas resize for all games
        if (window.gameNavigation) {
            Object.values(window.gameNavigation.games).forEach(game => {
                if (game && game.setupCanvas) {
                    game.setupCanvas();
                }
            });
        }
    }
    
    // Utility method to show game over modal
    static showGameOver() {
        if (window.cosmicApp) {
            window.cosmicApp.showModal();
        }
    }
}

// Global app instance
window.cosmicApp = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the main app
    window.cosmicApp = new CosmicGamesApp();
    
    // Initialize Hedera service
    window.hederaService = new HederaService();
    
    console.log('🚀 Cosmic Games Platform Initialized!');
    console.log('Available games:', {
        'cosmic-collector': 'Space shooter with NFT ships',
        'token-battle': 'Crypto token knowledge battle',
        'space-defender': 'Defend base from asteroids',
        'asteroid-miner': 'Mine asteroids for crypto rewards'
    });
});

// Debug utilities
window.cosmicDebug = {
    switchGame: (gameId) => {
        if (window.gameNavigation) {
            window.gameNavigation.switchToGame(gameId);
        }
    },
    getCurrentGame: () => {
        return window.gameNavigation?.getCurrentGame();
    },
    stopAllGames: () => {
        if (window.gameNavigation) {
            window.gameNavigation.stopAllGames();
        }
    },
    getHederaService: () => {
        return window.hederaService;
    }
};

// Override the game over modal trigger for all games
cosmicApp = window.cosmicApp || {};
cosmicApp.showGameOver = () => {
    if (window.cosmicApp) {
        window.cosmicApp.showModal();
    }
};