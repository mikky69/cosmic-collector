// Enhanced Navigation system for multi-game platform with sections
class GameNavigation {
    constructor() {
        this.currentView = 'cosmic-collector';
        this.viewType = 'game'; // 'game' or 'section'
        this.games = {
            'cosmic-collector': null,
            'token-battle': null,
            'space-defender': null,
            'asteroid-miner': null
        };
        
        this.setupNavigation();
    }
    
    setupNavigation() {
        // Add click listeners to navigation links for games
        document.querySelectorAll('.nav-link[data-game]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const gameId = link.getAttribute('data-game');
                this.switchToGame(gameId);
            });
        });

        // Add click listeners to navigation links for sections
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                this.switchToSection(sectionId);
            });
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state) {
                if (e.state.game) {
                    this.switchToGame(e.state.game, false);
                } else if (e.state.section) {
                    this.switchToSection(e.state.section, false);
                }
            }
        });
        
        // Set initial view
        this.switchToGame(this.currentView);
    }
    
    switchToGame(gameId, updateHistory = true) {
        // Stop current game if running
        this.stopCurrentView();
        
        // Hide all containers
        this.hideAllContainers();
        
        // Remove active class from all nav links
        this.clearActiveNavLinks();
        
        // Show selected game container
        const gameContainer = document.getElementById(gameId);
        const navLink = document.querySelector(`[data-game="${gameId}"]`);
        
        if (gameContainer && navLink) {
            gameContainer.classList.add('active');
            navLink.classList.add('active');
            this.currentView = gameId;
            this.viewType = 'game';
            
            // Update URL
            if (updateHistory) {
                history.pushState({ game: gameId }, '', `#${gameId}`);
            }
            
            // Initialize game if needed
            this.initializeGame(gameId);

            // Show mobile controls for games
            this.showMobileControls();
        }
    }

    switchToSection(sectionId, updateHistory = true) {
        // Stop current game if running
        this.stopCurrentView();
        
        // Hide all containers
        this.hideAllContainers();
        
        // Remove active class from all nav links
        this.clearActiveNavLinks();
        
        // Show selected section container
        const sectionContainer = document.getElementById(sectionId);
        const navLink = document.querySelector(`[data-section="${sectionId}"]`);
        
        if (sectionContainer && navLink) {
            sectionContainer.classList.add('active');
            navLink.classList.add('active');
            this.currentView = sectionId;
            this.viewType = 'section';
            
            // Update URL
            if (updateHistory) {
                history.pushState({ section: sectionId }, '', `#${sectionId}`);
            }
            
            // Initialize section if needed
            this.initializeSection(sectionId);

            // Hide mobile controls for sections
            this.hideMobileControls();
        }
    }

    hideAllContainers() {
        document.querySelectorAll('.game-container, .section-container').forEach(container => {
            container.classList.remove('active');
        });
    }

    clearActiveNavLinks() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
    }

    stopCurrentView() {
        if (this.viewType === 'game' && this.games[this.currentView] && this.games[this.currentView].stop) {
            this.games[this.currentView].stop();
        }
    }

    showMobileControls() {
        if (window.mobileControls && window.mobileControls.isEnabled) {
            window.mobileControls.showControls();
        }
    }

    hideMobileControls() {
        if (window.mobileControls) {
            window.mobileControls.hideControls();
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

    initializeSection(sectionId) {
        // Initialize sections if needed
        switch (sectionId) {
            case 'marketplace':
                // Marketplace is already initialized globally
                if (window.marketplace) {
                    // Refresh display
                    const activeCategory = document.querySelector('.category-btn.active');
                    if (activeCategory) {
                        const category = activeCategory.getAttribute('data-category');
                        window.marketplace.displayItems(category);
                    }
                }
                break;
            case 'leaderboard':
                // Leaderboard is already initialized globally
                if (window.leaderboard) {
                    // Refresh current leaderboard view
                    const activeTab = document.querySelector('.tab-btn.active');
                    if (activeTab) {
                        const game = activeTab.getAttribute('data-game');
                        window.leaderboard.displayLeaderboard(game);
                    }
                }
                break;
        }
    }
    
    getCurrentGame() {
        if (this.viewType === 'game') {
            return this.games[this.currentView];
        }
        return null;
    }

    getCurrentView() {
        return {
            id: this.currentView,
            type: this.viewType
        };
    }
    
    stopAllGames() {
        Object.values(this.games).forEach(game => {
            if (game && game.stop) {
                game.stop();
            }
        });
    }

    // Method to switch views programmatically
    showGame(gameId) {
        this.switchToGame(gameId);
    }

    showSection(sectionId) {
        this.switchToSection(sectionId);
    }

    // Method to update player stats display
    updatePlayerStats(tokens, level) {
        const tokenDisplay = document.getElementById('playerTokens');
        const levelDisplay = document.getElementById('playerLevel');
        
        if (tokenDisplay) {
            tokenDisplay.textContent = tokens.toLocaleString();
        }
        
        if (levelDisplay) {
            levelDisplay.textContent = level;
        }
    }

    // Method to check if current view is a game
    isCurrentViewGame() {
        return this.viewType === 'game';
    }

    // Method to check if current view is a section
    isCurrentViewSection() {
        return this.viewType === 'section';
    }
}

// Global functions for backward compatibility and external use
window.showGame = function(gameId) {
    if (window.gameNavigation) {
        window.gameNavigation.showGame(gameId);
    }
};

window.showSection = function(sectionId) {
    if (window.gameNavigation) {
        window.gameNavigation.showSection(sectionId);
    }
};

// Global navigation instance
window.gameNavigation = null;

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameNavigation = new GameNavigation();
    
    // Initialize all systems after navigation is ready
    setTimeout(() => {
        // Ensure all systems are properly connected
        if (window.earningSystem) {
            window.earningSystem.updateDisplay();
        }
        
        // Setup any additional event listeners
        setupGlobalEventListeners();
    }, 100);
});

// Setup global event listeners
function setupGlobalEventListeners() {
    // Handle wallet connection button
    const connectWalletBtn = document.getElementById('connect-wallet');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
            // This will be handled by the smart contract integration
            console.log('Wallet connection will be implemented by smart contract developer');
        });
    }

    // Handle escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                }
            });
        }
    });

    // Handle window resize for mobile controls
    window.addEventListener('resize', () => {
        if (window.mobileControls) {
            const isMobile = window.mobileControls.isMobileDevice();
            if (isMobile !== window.mobileControls.isEnabled) {
                window.mobileControls.isEnabled = isMobile;
                if (isMobile && window.gameNavigation && window.gameNavigation.isCurrentViewGame()) {
                    window.mobileControls.showControls();
                } else {
                    window.mobileControls.hideControls();
                }
            }
        }
    });
}