/**
 * Leaderboard System
 * Manages player rankings across all games
 */

class LeaderboardSystem {
    constructor() {
        this.leaderboards = this.loadLeaderboards();
        this.currentGame = 'all';
        this.init();
    }

    loadLeaderboards() {
        const saved = localStorage.getItem('cosmic_games_leaderboards');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Initialize with demo data
        return {
            'cosmic-collector': [
                { name: 'SpaceAce', score: 15420, tokens: 85, date: '2025-10-09' },
                { name: 'StarHunter', score: 12350, tokens: 72, date: '2025-10-08' },
                { name: 'CosmicRider', score: 9870, tokens: 58, date: '2025-10-07' },
                { name: 'NovaBlast', score: 8650, tokens: 45, date: '2025-10-06' },
                { name: 'GalaxyGuard', score: 7240, tokens: 38, date: '2025-10-05' }
            ],
            'token-battle': [
                { name: 'CryptoKing', score: 28, tokens: 95, date: '2025-10-09' },
                { name: 'TokenMaster', score: 25, tokens: 87, date: '2025-10-08' },
                { name: 'CoinWhiz', score: 22, tokens: 76, date: '2025-10-07' },
                { name: 'TradeExpert', score: 19, tokens: 65, date: '2025-10-06' },
                { name: 'MarketPro', score: 16, tokens: 52, date: '2025-10-05' }
            ],
            'space-defender': [
                { name: 'DefenderX', score: 18750, tokens: 92, date: '2025-10-09' },
                { name: 'ShieldMaster', score: 16200, tokens: 81, date: '2025-10-08' },
                { name: 'BaseGuard', score: 14500, tokens: 73, date: '2025-10-07' },
                { name: 'TurretKing', score: 12800, tokens: 64, date: '2025-10-06' },
                { name: 'WaveBreaker', score: 11300, tokens: 56, date: '2025-10-05' }
            ],
            'asteroid-miner': [
                { name: 'MinerPro', score: 45200, tokens: 120, date: '2025-10-09' },
                { name: 'RockCrusher', score: 38500, tokens: 98, date: '2025-10-08' },
                { name: 'SpaceMiner', score: 32100, tokens: 85, date: '2025-10-07' },
                { name: 'AsteroidAce', score: 28700, tokens: 74, date: '2025-10-06' },
                { name: 'OreHunter', score: 24900, tokens: 62, date: '2025-10-05' }
            ]
        };
    }

    init() {
        this.setupTabButtons();
        this.displayLeaderboard('all');
        this.setupGameLeaderboardModal();
    }

    setupTabButtons() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Display leaderboard for selected game
                const game = btn.getAttribute('data-game');
                this.displayLeaderboard(game);
            });
        });
    }

    displayLeaderboard(game) {
        this.currentGame = game;
        const container = document.getElementById('leaderboard-table');
        if (!container) return;

        if (game === 'all') {
            this.displayOverallLeaderboard(container);
        } else {
            this.displayGameLeaderboard(container, game);
        }
    }

    displayOverallLeaderboard(container) {
        // Combine all leaderboards and rank by total tokens
        const allPlayers = {};
        
        Object.entries(this.leaderboards).forEach(([gameId, players]) => {
            players.forEach(player => {
                if (!allPlayers[player.name]) {
                    allPlayers[player.name] = {
                        name: player.name,
                        totalTokens: 0,
                        gamesPlayed: 0,
                        bestScores: {}
                    };
                }
                
                allPlayers[player.name].totalTokens += player.tokens;
                allPlayers[player.name].gamesPlayed++;
                allPlayers[player.name].bestScores[gameId] = Math.max(
                    allPlayers[player.name].bestScores[gameId] || 0,
                    player.score
                );
            });
        });

        // Sort by total tokens
        const sortedPlayers = Object.values(allPlayers)
            .sort((a, b) => b.totalTokens - a.totalTokens)
            .slice(0, 10);

        container.innerHTML = `
            <div class="leaderboard-header">
                <h3>🌟 Overall Rankings</h3>
                <p>Ranked by total tokens earned across all games</p>
            </div>
            <div class="leaderboard-list">
                ${sortedPlayers.map((player, index) => `
                    <div class="leaderboard-entry ${index < 3 ? 'top-three' : ''}">
                        <div class="rank">
                            ${this.getRankDisplay(index + 1)}
                        </div>
                        <div class="player-info">
                            <div class="player-name">${player.name}</div>
                            <div class="player-stats">
                                💎 ${player.totalTokens} tokens | 🎮 ${player.gamesPlayed} games
                            </div>
                        </div>
                        <div class="player-achievements">
                            ${Object.entries(player.bestScores).map(([game, score]) => 
                                `<span class="achievement" title="${this.getGameDisplayName(game)}: ${score}">${this.getGameIcon(game)}</span>`
                            ).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayGameLeaderboard(container, game) {
        const players = this.leaderboards[game] || [];
        const sortedPlayers = [...players]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        container.innerHTML = `
            <div class="leaderboard-header">
                <h3>${this.getGameIcon(game)} ${this.getGameDisplayName(game)} Rankings</h3>
                <p>Top players in ${this.getGameDisplayName(game)}</p>
            </div>
            <div class="leaderboard-list">
                ${sortedPlayers.map((player, index) => `
                    <div class="leaderboard-entry ${index < 3 ? 'top-three' : ''}">
                        <div class="rank">
                            ${this.getRankDisplay(index + 1)}
                        </div>
                        <div class="player-info">
                            <div class="player-name">${player.name}</div>
                            <div class="player-stats">
                                🏆 ${player.score.toLocaleString()} | 💎 ${player.tokens} tokens
                            </div>
                            <div class="player-date">${player.date}</div>
                        </div>
                        <div class="player-score">
                            ${player.score.toLocaleString()}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupGameLeaderboardModal() {
        const modal = document.getElementById('game-leaderboard-modal');
        const closeBtn = document.getElementById('close-game-leaderboard');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeGameLeaderboard();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeGameLeaderboard();
                }
            });
        }
    }

    showGameLeaderboard(game) {
        const modal = document.getElementById('game-leaderboard-modal');
        const title = document.getElementById('leaderboard-game-title');
        const content = document.getElementById('game-leaderboard-content');

        if (!modal || !title || !content) return;

        title.textContent = `🏆 ${this.getGameDisplayName(game)} Leaderboard`;
        
        const players = this.leaderboards[game] || [];
        const sortedPlayers = [...players]
            .sort((a, b) => b.score - a.score)
            .slice(0, 20); // Show top 20 in modal

        content.innerHTML = `
            <div class="game-leaderboard-content">
                <div class="leaderboard-stats">
                    <div class="stat-card">
                        <div class="stat-value">${sortedPlayers.length}</div>
                        <div class="stat-label">Total Players</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${sortedPlayers[0]?.score.toLocaleString() || '0'}</div>
                        <div class="stat-label">Best Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(sortedPlayers.reduce((sum, p) => sum + p.score, 0) / sortedPlayers.length) || 0}</div>
                        <div class="stat-label">Average Score</div>
                    </div>
                </div>
                
                <div class="detailed-leaderboard">
                    ${sortedPlayers.map((player, index) => `
                        <div class="detailed-entry ${index < 3 ? 'top-three' : ''}">
                            <div class="entry-rank">${this.getRankDisplay(index + 1)}</div>
                            <div class="entry-player">
                                <div class="entry-name">${player.name}</div>
                                <div class="entry-date">${player.date}</div>
                            </div>
                            <div class="entry-score">${player.score.toLocaleString()}</div>
                            <div class="entry-tokens">💎 ${player.tokens}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    closeGameLeaderboard() {
        const modal = document.getElementById('game-leaderboard-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    addScore(game, playerName, score, tokensEarned) {
        if (!this.leaderboards[game]) {
            this.leaderboards[game] = [];
        }

        const entry = {
            name: playerName || 'Anonymous',
            score: score,
            tokens: tokensEarned,
            date: new Date().toISOString().split('T')[0]
        };

        this.leaderboards[game].push(entry);
        
        // Keep only top 100 scores per game
        this.leaderboards[game] = this.leaderboards[game]
            .sort((a, b) => b.score - a.score)
            .slice(0, 100);

        this.saveLeaderboards();
        
        // Refresh display if current game is being viewed
        if (this.currentGame === game || this.currentGame === 'all') {
            this.displayLeaderboard(this.currentGame);
        }

        return this.getPlayerRank(game, score);
    }

    getPlayerRank(game, score) {
        const players = this.leaderboards[game] || [];
        const sortedScores = players.map(p => p.score).sort((a, b) => b - a);
        return sortedScores.findIndex(s => s <= score) + 1;
    }

    getRankDisplay(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
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

    getGameIcon(gameId) {
        const icons = {
            'cosmic-collector': '🌌',
            'token-battle': '⚔️',
            'space-defender': '🛡️',
            'asteroid-miner': '⛏️'
        };
        return icons[gameId] || '🎮';
    }

    saveLeaderboards() {
        localStorage.setItem('cosmic_games_leaderboards', JSON.stringify(this.leaderboards));
    }

    getTopPlayers(game, count = 5) {
        const players = this.leaderboards[game] || [];
        return players
            .sort((a, b) => b.score - a.score)
            .slice(0, count);
    }

    clearLeaderboards(game = null) {
        if (game) {
            this.leaderboards[game] = [];
        } else {
            this.leaderboards = {
                'cosmic-collector': [],
                'token-battle': [],
                'space-defender': [],
                'asteroid-miner': []
            };
        }
        this.saveLeaderboards();
        this.displayLeaderboard(this.currentGame);
    }
}

// Global leaderboard instance
window.leaderboard = new LeaderboardSystem();

// Global function for games to show specific leaderboards
window.showGameLeaderboard = function(game) {
    window.leaderboard.showGameLeaderboard(game);
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardSystem;
}