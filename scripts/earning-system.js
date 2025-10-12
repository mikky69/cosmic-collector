/**
 * Earning System
 * Manages token rewards and player progression
 */

class EarningSystem {
    constructor() {
        this.playerData = this.loadPlayerData();
        this.tokenMultipliers = this.getActiveMultipliers();
        this.achievementBonuses = this.loadAchievements();
        this.init();
    }

    loadPlayerData() {
        const saved = localStorage.getItem('cosmic_games_player_data');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return {
            totalTokens: 0,
            level: 1,
            experience: 0,
            gamesPlayed: 0,
            totalScore: 0,
            achievements: [],
            dailyStreak: 0,
            lastPlayDate: null
        };
    }

    init() {
        this.updateDisplay();
        this.checkDailyStreak();
        this.checkLevelUp();
    }

    // Token earning calculations
    calculateTokenReward(game, score, performance = {}) {
        let baseTokens = this.getBaseTokens(game, score);
        
        // Apply performance multipliers
        baseTokens *= this.getPerformanceMultiplier(performance);
        
        // Apply NFT multipliers
        baseTokens *= this.getNFTMultipliers();
        
        // Apply level bonus (5% per level)
        baseTokens *= (1 + (this.playerData.level - 1) * 0.05);
        
        // Apply daily streak bonus
        baseTokens *= this.getDailyStreakMultiplier();
        
        // Apply achievement bonuses
        baseTokens *= this.getAchievementMultiplier();
        
        return Math.floor(baseTokens);
    }

    getBaseTokens(game, score) {
        const gameRates = {
            'cosmic-collector': score / 100,
            'token-battle': score * 2,
            'space-defender': score / 80,
            'asteroid-miner': score / 150
        };
        
        return Math.max(1, gameRates[game] || score / 100);
    }

    getPerformanceMultiplier(performance) {
        let multiplier = 1.0;
        
        // Bonus for perfect performance
        if (performance.perfect) multiplier += 0.5;
        
        // Bonus for no deaths
        if (performance.noDeaths) multiplier += 0.3;
        
        // Bonus for speed completion
        if (performance.speedBonus) multiplier += 0.2;
        
        // Bonus for combo/streak
        if (performance.combo && performance.combo > 10) {
            multiplier += Math.min(0.5, performance.combo * 0.02);
        }
        
        return multiplier;
    }

    getNFTMultipliers() {
        let multiplier = 1.0;
        
        if (window.marketplace) {
            const ownedItems = window.marketplace.getOwnedItems();
            
            ownedItems.forEach(item => {
                if (item.effect.type === 'token_boost') {
                    multiplier *= item.effect.multiplier;
                }
            });
        }
        
        return multiplier;
    }

    getDailyStreakMultiplier() {
        const streak = this.playerData.dailyStreak;
        if (streak <= 0) return 1.0;
        
        // Up to 50% bonus for 7+ day streak
        return 1 + Math.min(0.5, streak * 0.07);
    }

    getAchievementMultiplier() {
        let multiplier = 1.0;
        
        // Each achievement adds 2% permanent bonus
        multiplier += this.playerData.achievements.length * 0.02;
        
        return multiplier;
    }

    // Award tokens and update player data
    awardTokens(game, score, performance = {}) {
        const tokensEarned = this.calculateTokenReward(game, score, performance);
        
        // Update player data
        this.playerData.totalTokens += tokensEarned;
        this.playerData.gamesPlayed++;
        this.playerData.totalScore += score;
        this.playerData.experience += this.calculateExperience(tokensEarned, performance);
        
        // Update daily streak
        this.updateDailyStreak();
        
        // Check for achievements
        this.checkAchievements(game, score, performance);
        
        // Check for level up
        this.checkLevelUp();
        
        // Save data
        this.savePlayerData();
        
        // Update display
        this.updateDisplay();
        
        return {
            tokensEarned: tokensEarned,
            totalTokens: this.playerData.totalTokens,
            levelUp: this.lastLevelUp || false,
            achievements: this.newAchievements || []
        };
    }

    calculateExperience(tokens, performance) {
        let exp = tokens * 10;
        
        // Bonus experience for good performance
        if (performance.perfect) exp += 100;
        if (performance.noDeaths) exp += 50;
        if (performance.speedBonus) exp += 30;
        
        return exp;
    }

    updateDailyStreak() {
        const today = new Date().toDateString();
        const lastPlay = this.playerData.lastPlayDate;
        
        if (lastPlay !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastPlay === yesterday.toDateString()) {
                // Continuous streak
                this.playerData.dailyStreak++;
            } else if (lastPlay !== today) {
                // Broken streak or first play
                this.playerData.dailyStreak = 1;
            }
            
            this.playerData.lastPlayDate = today;
        }
    }

    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastPlay = this.playerData.lastPlayDate;
        
        if (lastPlay && lastPlay !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastPlay !== yesterday.toDateString()) {
                // Streak broken
                this.playerData.dailyStreak = 0;
                this.savePlayerData();
            }
        }
    }

    checkLevelUp() {
        const requiredExp = this.getRequiredExperience(this.playerData.level);
        this.lastLevelUp = false;
        
        while (this.playerData.experience >= requiredExp) {
            this.playerData.level++;
            this.playerData.experience -= requiredExp;
            this.lastLevelUp = true;
            
            // Award level up bonus
            const levelBonus = this.playerData.level * 10;
            this.playerData.totalTokens += levelBonus;
            
            this.showNotification(`🎉 Level Up! You are now level ${this.playerData.level}! Bonus: ${levelBonus} tokens`, 'success');
        }
        
        if (this.lastLevelUp) {
            this.updateDisplay();
        }
    }

    getRequiredExperience(level) {
        // Exponential experience curve
        return Math.floor(100 * Math.pow(1.2, level - 1));
    }

    checkAchievements(game, score, performance) {
        this.newAchievements = [];
        
        const achievements = [
            {
                id: 'first_game',
                name: 'Getting Started',
                description: 'Play your first game',
                condition: () => this.playerData.gamesPlayed >= 1,
                icon: '🌟'
            },
            {
                id: 'token_collector',
                name: 'Token Collector',
                description: 'Earn 100 tokens',
                condition: () => this.playerData.totalTokens >= 100,
                icon: '💎'
            },
            {
                id: 'score_master',
                name: 'Score Master',
                description: 'Achieve 10,000 points in any game',
                condition: () => score >= 10000,
                icon: '🏆'
            },
            {
                id: 'perfect_game',
                name: 'Perfect Game',
                description: 'Complete a game without taking damage',
                condition: () => performance.noDeaths === true,
                icon: '⭐'
            },
            {
                id: 'daily_warrior',
                name: 'Daily Warrior',
                description: 'Play for 7 days in a row',
                condition: () => this.playerData.dailyStreak >= 7,
                icon: '🔥'
            },
            {
                id: 'level_master',
                name: 'Level Master',
                description: 'Reach level 10',
                condition: () => this.playerData.level >= 10,
                icon: '👑'
            },
            {
                id: 'games_master',
                name: 'Games Master',
                description: 'Play all 4 games',
                condition: () => this.getGamesPlayedCount() >= 4,
                icon: '🎮'
            }
        ];
        
        achievements.forEach(achievement => {
            if (!this.playerData.achievements.includes(achievement.id) && 
                achievement.condition()) {
                
                this.playerData.achievements.push(achievement.id);
                this.newAchievements.push(achievement);
                
                // Award achievement bonus
                const bonus = 50;
                this.playerData.totalTokens += bonus;
                
                this.showNotification(`🏆 Achievement Unlocked: ${achievement.name}! Bonus: ${bonus} tokens`, 'achievement');
            }
        });
    }

    getGamesPlayedCount() {
        // This would need to be tracked per game, simplified for now
        return Math.min(4, Math.floor(this.playerData.gamesPlayed / 5));
    }

    updateDisplay() {
        // Update tokens display
        const tokenDisplay = document.getElementById('playerTokens');
        if (tokenDisplay) {
            tokenDisplay.textContent = this.playerData.totalTokens.toLocaleString();
        }
        
        // Update level display
        const levelDisplay = document.getElementById('playerLevel');
        if (levelDisplay) {
            levelDisplay.textContent = this.playerData.level;
        }
        
        // Update experience progress (if element exists)
        const expDisplay = document.getElementById('playerExp');
        if (expDisplay) {
            const requiredExp = this.getRequiredExperience(this.playerData.level);
            const progress = (this.playerData.experience / requiredExp) * 100;
            expDisplay.style.width = `${progress}%`;
        }
    }

    // Public methods for games to use
    getTokens() {
        return this.playerData.totalTokens;
    }

    spendTokens(amount) {
        if (this.playerData.totalTokens >= amount) {
            this.playerData.totalTokens -= amount;
            this.savePlayerData();
            this.updateDisplay();
            return true;
        }
        return false;
    }

    getLevel() {
        return this.playerData.level;
    }

    getDailyStreak() {
        return this.playerData.dailyStreak;
    }

    getAchievements() {
        return this.playerData.achievements;
    }

    savePlayerData() {
        localStorage.setItem('cosmic_games_player_data', JSON.stringify(this.playerData));
    }

    loadAchievements() {
        // Load achievement data if needed
        return {};
    }

    getActiveMultipliers() {
        // Calculate all active multipliers
        return {
            nft: this.getNFTMultipliers(),
            level: 1 + (this.playerData.level - 1) * 0.05,
            streak: this.getDailyStreakMultiplier(),
            achievement: this.getAchievementMultiplier()
        };
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
        }, 4000);
    }

    // Reset system (for testing)
    reset() {
        this.playerData = {
            totalTokens: 0,
            level: 1,
            experience: 0,
            gamesPlayed: 0,
            totalScore: 0,
            achievements: [],
            dailyStreak: 0,
            lastPlayDate: null
        };
        this.savePlayerData();
        this.updateDisplay();
    }
}

// Global earning system instance
window.earningSystem = new EarningSystem();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EarningSystem;
}