// Token Battle Game - Crypto Knowledge Battle
class TokenBattleGame {
    constructor() {
        this.gameState = 'stopped'; // stopped, playing, gameOver
        this.mode = 'demo'; // demo, live
        
        // Game stats
        this.score = 0;
        this.timeLeft = 30;
        this.currentQuestion = null;
        this.questionIndex = 0;
        
        // Game data
        this.tokenData = [];
        this.questions = [];
        
        // Timers
        this.gameTimer = null;
        this.questionTimer = null;
        
        this.setupControls();
        this.loadTokenData();
        this.generateQuestions();
    }
    
    setupControls() {
        document.getElementById('token-start').addEventListener('click', () => {
            this.startBattle();
        });
        
        document.getElementById('token-mode-toggle').addEventListener('click', () => {
            this.toggleMode();
        });
    }
    
    toggleMode() {
        this.mode = this.mode === 'demo' ? 'live' : 'demo';
        const button = document.getElementById('token-mode-toggle');
        button.textContent = this.mode === 'demo' ? '🔄 Demo Mode' : '📊 Live Mode';
        
        if (this.mode === 'live') {
            this.loadLiveTokenData();
        } else {
            this.loadTokenData();
        }
    }
    
    async loadLiveTokenData() {
        try {
            // Simulate API call - in real implementation, this would call CoinGecko/CoinMarketCap
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
            
            if (response.ok) {
                const data = await response.json();
                this.tokenData = data.slice(0, 20).map(token => ({
                    name: token.name,
                    symbol: token.symbol.toUpperCase(),
                    price: token.current_price,
                    marketCap: token.market_cap,
                    volume24h: token.total_volume,
                    priceChange24h: token.price_change_percentage_24h,
                    rank: token.market_cap_rank,
                    icon: token.image
                }));
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.log('Live data unavailable, using demo data');
            this.loadTokenData();
        }
        
        this.generateQuestions();
    }
    
    loadTokenData() {
        // Demo token data
        this.tokenData = [
            {
                name: 'Bitcoin',
                symbol: 'BTC',
                price: 45000,
                marketCap: 850000000000,
                volume24h: 25000000000,
                priceChange24h: 2.5,
                rank: 1,
                icon: '🪙'
            },
            {
                name: 'Ethereum',
                symbol: 'ETH',
                price: 3200,
                marketCap: 380000000000,
                volume24h: 18000000000,
                priceChange24h: 1.8,
                rank: 2,
                icon: '⛄'
            },
            {
                name: 'Cardano',
                symbol: 'ADA',
                price: 1.25,
                marketCap: 42000000000,
                volume24h: 2500000000,
                priceChange24h: -0.5,
                rank: 8,
                icon: '🔷'
            },
            {
                name: 'Solana',
                symbol: 'SOL',
                price: 180,
                marketCap: 75000000000,
                volume24h: 3200000000,
                priceChange24h: 4.2,
                rank: 5,
                icon: '🌟'
            },
            {
                name: 'Polkadot',
                symbol: 'DOT',
                price: 28,
                marketCap: 32000000000,
                volume24h: 1800000000,
                priceChange24h: -1.2,
                rank: 9,
                icon: '🔴'
            },
            {
                name: 'Chainlink',
                symbol: 'LINK',
                price: 22,
                marketCap: 12000000000,
                volume24h: 850000000,
                priceChange24h: 3.1,
                rank: 15,
                icon: '🔗'
            },
            {
                name: 'Avalanche',
                symbol: 'AVAX',
                price: 95,
                marketCap: 28000000000,
                volume24h: 1200000000,
                priceChange24h: 2.8,
                rank: 11,
                icon: '❄️'
            },
            {
                name: 'Polygon',
                symbol: 'MATIC',
                price: 2.1,
                marketCap: 18000000000,
                volume24h: 900000000,
                priceChange24h: 1.5,
                rank: 18,
                icon: '🔶'
            }
        ];
    }
    
    generateQuestions() {
        this.questions = [];
        
        const questionTypes = [
            'market_cap',
            'price',
            'volume',
            'price_change',
            'rank'
        ];
        
        // Generate 50 questions
        for (let i = 0; i < 50; i++) {
            const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
            const tokens = this.getRandomTokenPair();
            
            this.questions.push({
                type: type,
                tokenA: tokens.tokenA,
                tokenB: tokens.tokenB,
                correct: this.determineCorrectAnswer(type, tokens.tokenA, tokens.tokenB)
            });
        }
    }
    
    getRandomTokenPair() {
        const shuffled = [...this.tokenData].sort(() => 0.5 - Math.random());
        return {
            tokenA: shuffled[0],
            tokenB: shuffled[1]
        };
    }
    
    determineCorrectAnswer(type, tokenA, tokenB) {
        switch (type) {
            case 'market_cap':
                return tokenA.marketCap > tokenB.marketCap ? 'A' : 'B';
            case 'price':
                return tokenA.price > tokenB.price ? 'A' : 'B';
            case 'volume':
                return tokenA.volume24h > tokenB.volume24h ? 'A' : 'B';
            case 'price_change':
                return tokenA.priceChange24h > tokenB.priceChange24h ? 'A' : 'B';
            case 'rank':
                return tokenA.rank < tokenB.rank ? 'A' : 'B'; // Lower rank is better
            default:
                return 'A';
        }
    }
    
    startBattle() {
        this.gameState = 'playing';
        this.score = 0;
        this.timeLeft = 30;
        this.questionIndex = 0;
        
        // Update UI
        document.getElementById('token-start').textContent = '⚙️ Battle in Progress...';
        document.getElementById('token-start').disabled = true;
        
        // Start game timer
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.endBattle();
            }
        }, 1000);
        
        this.nextQuestion();
    }
    
    nextQuestion() {
        if (this.questionIndex >= this.questions.length) {
            this.generateQuestions();
            this.questionIndex = 0;
        }
        
        this.currentQuestion = this.questions[this.questionIndex];
        this.displayQuestion();
        this.questionIndex++;
    }
    
    displayQuestion() {
        const question = this.currentQuestion;
        const questionText = this.getQuestionText(question.type);
        
        document.getElementById('question-text').textContent = questionText;
        
        // Update token cards
        this.updateTokenCard('token-a', question.tokenA);
        this.updateTokenCard('token-b', question.tokenB);
        
        // Add click listeners
        this.setupTokenCardListeners();
    }
    
    getQuestionText(type) {
        const questions = {
            market_cap: 'Which token has a higher market cap?',
            price: 'Which token has a higher price?',
            volume: 'Which token has higher 24h trading volume?',
            price_change: 'Which token has better 24h price performance?',
            rank: 'Which token has a better market ranking?'
        };
        
        return questions[type] || 'Which token is better?';
    }
    
    updateTokenCard(cardId, token) {
        const card = document.getElementById(cardId);
        
        card.querySelector('.token-icon').textContent = token.icon;
        card.querySelector('.token-name').textContent = `${token.name} (${token.symbol})`;
        
        const dataText = this.getTokenDataText(token);
        card.querySelector('.token-data').textContent = dataText;
        
        // Reset card state
        card.classList.remove('selected', 'correct', 'incorrect');
    }
    
    getTokenDataText(token) {
        return `Price: $${token.price.toLocaleString()}\nMarket Cap: $${(token.marketCap / 1e9).toFixed(1)}B\nVolume: $${(token.volume24h / 1e9).toFixed(1)}B\n24h: ${token.priceChange24h.toFixed(1)}%\nRank: #${token.rank}`;
    }
    
    setupTokenCardListeners() {
        const tokenA = document.getElementById('token-a');
        const tokenB = document.getElementById('token-b');
        
        // Remove existing listeners
        tokenA.replaceWith(tokenA.cloneNode(true));
        tokenB.replaceWith(tokenB.cloneNode(true));
        
        // Add new listeners
        document.getElementById('token-a').addEventListener('click', () => {
            this.selectToken('A');
        });
        
        document.getElementById('token-b').addEventListener('click', () => {
            this.selectToken('B');
        });
    }
    
    selectToken(choice) {
        if (this.gameState !== 'playing') return;
        
        const isCorrect = choice === this.currentQuestion.correct;
        
        // Update score
        if (isCorrect) {
            this.score += this.calculateScore();
        }
        
        // Visual feedback
        this.showAnswerFeedback(choice, isCorrect);
        
        // Next question after delay
        setTimeout(() => {
            if (this.gameState === 'playing') {
                this.nextQuestion();
            }
        }, 1500);
        
        this.updateScore();
    }
    
    calculateScore() {
        const baseScore = 100;
        const timeBonus = Math.floor(this.timeLeft * 2);
        return baseScore + timeBonus;
    }
    
    showAnswerFeedback(choice, isCorrect) {
        const chosenCard = document.getElementById(choice === 'A' ? 'token-a' : 'token-b');
        const otherCard = document.getElementById(choice === 'A' ? 'token-b' : 'token-a');
        
        if (isCorrect) {
            chosenCard.classList.add('correct');
        } else {
            chosenCard.classList.add('incorrect');
            // Show correct answer
            const correctCard = document.getElementById(this.currentQuestion.correct === 'A' ? 'token-a' : 'token-b');
            correctCard.classList.add('correct');
        }
    }
    
    endBattle() {
        this.gameState = 'gameOver';
        
        // Clear timer
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        // Update UI
        document.getElementById('token-start').textContent = '⚔️ Start Battle';
        document.getElementById('token-start').disabled = false;
        
        // Show results
        this.showBattleResults();
    }
    
    showBattleResults() {
        const stats = document.getElementById('final-stats');
        
        const questionsAnswered = Math.max(1, this.questionIndex);
        const accuracy = Math.round((this.score / (questionsAnswered * 100)) * 100);
        
        stats.innerHTML = `
            <h3>⚔️ Token Battle Results</h3>
            <p><strong>Final Score:</strong> ${this.score}</p>
            <p><strong>Questions Answered:</strong> ${questionsAnswered}</p>
            <p><strong>Accuracy:</strong> ${accuracy}%</p>
            <p><strong>Mode:</strong> ${this.mode === 'demo' ? 'Demo' : 'Live Data'}</p>
        `;
        
        // Use centralized modal system
        if (window.cosmicApp) {
            window.cosmicApp.showModal();
        }
    }
    
    updateTimerDisplay() {
        const timerElement = document.getElementById('battle-timer');
        timerElement.textContent = this.timeLeft;
        
        // Change color based on time left
        if (this.timeLeft <= 5) {
            timerElement.style.color = '#ff0000';
        } else if (this.timeLeft <= 10) {
            timerElement.style.color = '#ff6600';
        } else {
            timerElement.style.color = '#ff6b6b';
        }
    }
    
    updateScore() {
        document.getElementById('battle-score').textContent = `Score: ${this.score}`;
    }
    
    stop() {
        this.gameState = 'stopped';
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Game will be initialized by navigation system
});