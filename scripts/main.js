// Enhanced Main application controller
class CosmicGamesApp {
    constructor() {
        this.currentModal = null;
        this.hederaService = new HederaService();
        this.lastGameResult = null; // Store last game result for modal display
        
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
            const currentView = window.gameNavigation?.getCurrentView();
            if (currentView && currentView.type === 'game') {
                const currentGame = window.gameNavigation.getCurrentGame();
                if (currentGame && currentGame.startGame) {
                    currentGame.startGame();
                }
            }
        });
        
        // Submit score button (enhanced)
        document.getElementById('submit-score').addEventListener('click', async () => {
            const playerName = document.getElementById('player-name').value.trim();
            if (!playerName) {
                this.showNotification('Please enter your name!', 'error');
                return;
            }
            
            if (!this.lastGameResult) {
                this.showNotification('No game result to submit!', 'error');
                return;
            }
            
            try {
                // Submit score to blockchain (when contract is ready)
                await this.hederaService.submitScore(this.lastGameResult.score, playerName);
                
                // Add to local leaderboard
                if (window.leaderboard) {
                    const rank = window.leaderboard.addScore(
                        this.lastGameResult.gameId,
                        playerName,
                        this.lastGameResult.score,
                        this.lastGameResult.tokensEarned
                    );
                    
                    this.showNotification(`Score submitted! Your rank: #${rank}`, 'success');
                }
                
                // Disable submit button to prevent double submission
                const submitBtn = document.getElementById('submit-score');
                submitBtn.disabled = true;
                submitBtn.textContent = '✓ Submitted';
                
            } catch (error) {
                console.error('Error submitting score:', error);
                this.showNotification('Failed to submit score. Please try again.', 'error');
            }
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
            // ESC key to close any modal
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Number keys for quick game switching (1-4)
            if (e.key >= '1' && e.key <= '4' && !e.ctrlKey && !e.altKey) {
                const games = ['cosmic-collector', 'token-battle', 'space-defender', 'asteroid-miner'];
                const gameIndex = parseInt(e.key) - 1;
                if (games[gameIndex] && window.gameNavigation) {
                    window.gameNavigation.showGame(games[gameIndex]);
                }
            }
            
            // M key for marketplace
            if (e.key === 'm' || e.key === 'M') {
                if (window.gameNavigation) {
                    window.gameNavigation.showSection('marketplace');
                }
            }
            
            // L key for leaderboard
            if (e.key === 'l' || e.key === 'L') {
                if (window.gameNavigation) {
                    window.gameNavigation.showSection('leaderboard');
                }
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

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored!', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Connection lost. Playing offline...', 'info');
        });
    }
    
    showModal() {
        const modal = document.getElementById('game-over-modal');
        modal.style.display = 'flex';
        this.currentModal = modal;
        
        // Clear and reset form
        const playerNameInput = document.getElementById('player-name');
        const submitBtn = document.getElementById('submit-score');
        
        playerNameInput.value = '';
        submitBtn.disabled = false;
        submitBtn.textContent = '🏆 Submit Score (1 HBAR)';
        
        // Focus on name input
        setTimeout(() => {
            playerNameInput.focus();
        }, 100);
    }
    
    hideModal() {
        const modal = document.getElementById('game-over-modal');
        modal.style.display = 'none';
        this.currentModal = null;
        this.lastGameResult = null;
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
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

        // Update mobile controls if needed
        if (window.mobileControls) {
            const wasMobile = window.mobileControls.isEnabled;
            const isMobile = window.mobileControls.isMobileDevice();
            
            if (wasMobile !== isMobile) {
                window.mobileControls.isEnabled = isMobile;
                if (isMobile && window.gameNavigation?.isCurrentViewGame()) {
                    window.mobileControls.showControls();
                } else {
                    window.mobileControls.hideControls();
                }
            }
        }
    }

    // Enhanced game over handler
    showGameOver(gameId, score, performance = {}) {
        // Calculate and award tokens
        const tokensEarned = window.earningSystem.awardTokens(gameId, score, performance);
        
        // Store game result for potential submission
        this.lastGameResult = {
            gameId: gameId,
            score: score,
            tokensEarned: tokensEarned.tokensEarned,
            performance: performance,
            timestamp: Date.now()
        };

        // Update final stats display
        this.updateGameOverDisplay(gameId, score, tokensEarned, performance);
        
        // Show achievements if any
        if (tokensEarned.achievements && tokensEarned.achievements.length > 0) {
            this.showAchievements(tokensEarned.achievements);
        }
        
        // Show level up notification if occurred
        if (tokensEarned.levelUp) {
            this.showNotification('🎉 Level Up! You gained additional token bonuses!', 'success');
        }
        
        // Show the modal
        this.showModal();

        // Vibrate for mobile feedback
        if (window.mobileControls && window.mobileControls.isEnabled) {
            window.mobileControls.vibrate(200);
        }
    }

    updateGameOverDisplay(gameId, score, tokensResult, performance) {
        const finalStats = document.getElementById('final-stats');
        const tokensEarnedFinal = document.getElementById('tokens-earned-final');
        
        if (finalStats) {
            const gameDisplayName = this.getGameDisplayName(gameId);
            let statsHTML = `
                <h3>🎮 ${gameDisplayName}</h3>
                <div class="final-score">
                    <span class="score-label">Final Score:</span>
                    <span class="score-value">${score.toLocaleString()}</span>
                </div>
            `;

            // Add performance bonuses if any
            if (performance.perfect) {
                statsHTML += '<div class="bonus-item">⭐ Perfect Game Bonus!</div>';
            }
            if (performance.noDeaths) {
                statsHTML += '<div class="bonus-item">💎 No Deaths Bonus!</div>';
            }
            if (performance.speedBonus) {
                statsHTML += '<div class="bonus-item">⚡ Speed Bonus!</div>';
            }
            if (performance.combo && performance.combo > 10) {
                statsHTML += `<div class="bonus-item">🔥 ${performance.combo}x Combo Bonus!</div>`;
            }

            finalStats.innerHTML = statsHTML;
        }
        
        if (tokensEarnedFinal) {
            tokensEarnedFinal.textContent = tokensResult.tokensEarned.toLocaleString();
        }
    }

    showAchievements(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.showNotification(
                    `🏆 Achievement Unlocked: ${achievement.name}! ${achievement.description}`,
                    'achievement'
                );
            }, index * 2000); // Stagger achievement notifications
        });
    }

    getGameDisplayName(gameId) {
        const names = {
            'cosmic-collector': 'Cosmic Collector',
            'token-battle': 'Token Battle',
            'space-defender': 'Space Defender',
            'asteroid-miner': 'Asteroid Miner'
        };
        return names[gameId] || gameId;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, type === 'achievement' ? 5000 : 3000);
    }

    // Utility methods for games to use
    static getInstance() {
        return window.cosmicApp;
    }

    static showGameOver(gameId, score, performance = {}) {
        if (window.cosmicApp) {
            window.cosmicApp.showGameOver(gameId, score, performance);
        }
    }

    // Debug and utility methods
    getSystemStatus() {
        return {
            currentView: window.gameNavigation?.getCurrentView(),
            playerTokens: window.earningSystem?.getTokens(),
            playerLevel: window.earningSystem?.getLevel(),
            dailyStreak: window.earningSystem?.getDailyStreak(),
            achievements: window.earningSystem?.getAchievements(),
            ownedNFTs: window.marketplace?.getOwnedItems().length,
            mobileControlsActive: window.mobileControls?.isEnabled
        };
    }

    resetPlayerProgress() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
            if (window.earningSystem) {
                window.earningSystem.reset();
            }
            if (window.leaderboard) {
                window.leaderboard.clearLeaderboards();
            }
            localStorage.clear();
            this.showNotification('All progress has been reset!', 'info');
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
    
    console.log('Available sections:', {
        'marketplace': 'NFT marketplace with gameplay items',
        'leaderboard': 'Player rankings and statistics'
    });

    console.log('Keyboard shortcuts:');
    console.log('1-4: Switch between games');
    console.log('M: Open marketplace');
    console.log('L: Open leaderboard');
    console.log('ESC: Close modals');
});

// Debug utilities (enhanced)
window.cosmicDebug = {
    switchGame: (gameId) => {
        if (window.gameNavigation) {
            window.gameNavigation.switchToGame(gameId);
        }
    },
    switchSection: (sectionId) => {
        if (window.gameNavigation) {
            window.gameNavigation.switchToSection(sectionId);
        }
    },
    getCurrentView: () => {
        return window.gameNavigation?.getCurrentView();
    },
    getCurrentGame: () => {
        return window.gameNavigation?.getCurrentGame();
    },
    stopAllGames: () => {
        if (window.gameNavigation) {
            window.gameNavigation.stopAllGames();
        }
    },
    getSystemStatus: () => {
        return window.cosmicApp?.getSystemStatus();
    },
    addTokens: (amount) => {
        if (window.earningSystem) {
            window.earningSystem.playerData.totalTokens += amount;
            window.earningSystem.savePlayerData();
            window.earningSystem.updateDisplay();
            console.log(`Added ${amount} tokens`);
        }
    },
    simulateGameOver: (gameId = 'cosmic-collector', score = 1000) => {
        CosmicGamesApp.showGameOver(gameId, score, {
            perfect: Math.random() > 0.7,
            noDeaths: Math.random() > 0.5,
            speedBonus: Math.random() > 0.6,
            combo: Math.floor(Math.random() * 20)
        });
    },
    resetProgress: () => {
        window.cosmicApp?.resetPlayerProgress();
    },
    getHederaService: () => {
        return window.hederaService;
    }
};

// Global helper functions for games
window.showGameOver = (gameId, score, performance = {}) => {
    CosmicGamesApp.showGameOver(gameId, score, performance);
};

window.updateTokenDisplay = (gameId, tokensEarned) => {
    const tokenElement = document.getElementById(`${gameId}-tokens-earned`);
    if (tokenElement) {
        tokenElement.textContent = tokensEarned;
    }
};

// Legacy compatibility
window.cosmicApp = window.cosmicApp || {};
window.cosmicApp.showGameOver = (gameId, score, performance) => {
    CosmicGamesApp.showGameOver(gameId, score, performance);
};