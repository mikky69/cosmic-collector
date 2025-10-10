// Navigation system for multi-game platform
class GameNavigation {
    constructor() {
        this.currentGame = 'cosmic-collector';
        this.games = {
            'cosmic-collector': null,
            'token-battle': null,
            'space-defender': null,
            'asteroid-miner': null
        };
        
        this.setupNavigation();
    }
    
    setupNavigation() {
        // Add click listeners to navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const gameId = link.getAttribute('data-game');
                this.switchToGame(gameId);
            });
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.game) {
                this.switchToGame(e.state.game, false);
            }
        });
        
        // Set initial game
        this.switchToGame(this.currentGame);
    }
    
    switchToGame(gameId, updateHistory = true) {
        // Stop current game if running
        if (this.games[this.currentGame] && this.games[this.currentGame].stop) {
            this.games[this.currentGame].stop();
        }
        
        // Hide all game containers
        document.querySelectorAll('.game-container').forEach(container => {
            container.classList.remove('active');
        });
        
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show selected game container
        const gameContainer = document.getElementById(gameId);
        const navLink = document.querySelector(`[data-game="${gameId}"]`);
        
        if (gameContainer && navLink) {
            gameContainer.classList.add('active');
            navLink.classList.add('active');
            this.currentGame = gameId;
            
            // Update URL
            if (updateHistory) {
                history.pushState({ game: gameId }, '', `#${gameId}`);
            }
            
            // Initialize game if needed
            this.initializeGame(gameId);
        }
    }
    
    initializeGame(gameId) {
        // Initialize game instances if they don't exist
        switch (gameId) {
            case 'cosmic-collector':
                if (!this.games[gameId]) {
                    this.games[gameId] = new CosmicCollectorGame();
                }
                break;
            case 'token-battle':
                if (!this.games[gameId]) {
                    this.games[gameId] = new TokenBattleGame();
                }
                break;
            case 'space-defender':
                if (!this.games[gameId]) {
                    this.games[gameId] = new SpaceDefenderGame();
                }
                break;
            case 'asteroid-miner':
                if (!this.games[gameId]) {
                    this.games[gameId] = new AsteroidMinerGame();
                }
                break;
        }
    }
    
    getCurrentGame() {
        return this.games[this.currentGame];
    }
    
    stopAllGames() {
        Object.values(this.games).forEach(game => {
            if (game && game.stop) {
                game.stop();
            }
        });
    }
}

// Global navigation instance
window.gameNavigation = null;

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameNavigation = new GameNavigation();
});