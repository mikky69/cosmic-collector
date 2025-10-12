// Enhanced Space Snake Game with Mobile Controls & Rewards
// Mikky Studio - 2025

class SpaceSnakeGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.moveTimer = 0;
        this.moveInterval = 300; // milliseconds between moves
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.tokens = 0; // Added token system
        this.bonusMultiplier = 1;
        this.streak = 0; // Food eating streak
        
        // Grid settings
        this.gridSize = 25;
        this.gridWidth = Math.floor(canvas.width / this.gridSize);
        this.gridHeight = Math.floor(canvas.height / this.gridSize);
        
        // Snake
        this.snake = [
            { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 2) }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        // Food and power-ups
        this.food = [];
        this.powerUps = [];
        this.stars = [];
        this.specialItems = []; // New special reward items
        
        // Reward system
        this.achievements = {
            firstFood: false,
            reach10Length: false,
            reach50Score: false,
            reach100Score: false,
            perfectLevel: false
        };
        
        this.setupInput();
        this.initializeGame();
        
        console.log('Enhanced Space Snake Game created - Canvas:', this.canvas.width, 'x', this.canvas.height);
        console.log('Grid:', this.gridWidth, 'x', this.gridHeight);
    }

    setupInput() {
        // Detect if device is mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (window.innerWidth <= 768 && 'ontouchstart' in window);
        
        // Touch controls for mobile (fallback)
        this.touchControls = {
            startX: 0,
            startY: 0,
            minSwipeDistance: 30
        };
        
        // Remove any existing listeners
        this.boundKeyHandler = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.boundKeyHandler);
        
        // Mobile controls integration
        if (this.isMobile) {
            this.setupTouchControls();
            this.setupVirtualJoystickIntegration();
        }
        
        console.log(this.isMobile ? 'Snake: Mobile controls enabled (joystick + swipe)' : 'Snake: Desktop controls enabled');
    }
    
    setupVirtualJoystickIntegration() {
        // Check for mobile controls module
        if (typeof window.mobileControls !== 'undefined' && window.mobileControls) {
            console.log('Snake: Virtual joystick integration enabled');
            
            // Poll joystick state in game loop
            this.useVirtualJoystick = true;
            this.lastJoystickDirection = null;
            this.joystickThreshold = 0.3; // Minimum joystick movement to register
        }
    }
    
    setupTouchControls() {
        // Touch start
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            
            this.touchControls.startX = touch.clientX - rect.left;
            this.touchControls.startY = touch.clientY - rect.top;
        });
        
        // Touch end - detect swipe direction
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!e.changedTouches.length) return;
            
            const touch = e.changedTouches[0];
            const rect = this.canvas.getBoundingClientRect();
            
            const endX = touch.clientX - rect.left;
            const endY = touch.clientY - rect.top;
            
            const deltaX = endX - this.touchControls.startX;
            const deltaY = endY - this.touchControls.startY;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Only process swipe if it's long enough
            if (distance < this.touchControls.minSwipeDistance) return;
            
            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0 && this.direction.x !== -1) {
                    this.nextDirection = { x: 1, y: 0 }; // Right
                } else if (deltaX < 0 && this.direction.x !== 1) {
                    this.nextDirection = { x: -1, y: 0 }; // Left
                }
            } else {
                // Vertical swipe
                if (deltaY > 0 && this.direction.y !== -1) {
                    this.nextDirection = { x: 0, y: 1 }; // Down
                } else if (deltaY < 0 && this.direction.y !== 1) {
                    this.nextDirection = { x: 0, y: -1 }; // Up
                }
            }
        });
        
        // Prevent scrolling on mobile
        document.body.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    handleKeyDown(e) {
        if (!this.isRunning || this.isPaused) return;
        
        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 };
                break;
        }
        e.preventDefault();
    }

    initializeGame() {
        this.createStarfield();
        this.spawnFood();
        this.updateUI();
        console.log('Space Snake initialized with', this.stars.length, 'stars');
    }

    createStarfield() {
        this.stars = [];
        for (let i = 0; i < 40; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.8 + 0.2
            });
        }
    }

    spawnFood() {
        if (this.food.length >= 3) return; // Max 3 food items
        
        let attempts = 0;
        let newFood;
        
        do {
            newFood = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight),
                type: Math.random() < 0.8 ? 'normal' : 'power'
            };
            attempts++;
        } while (this.isPositionOccupied(newFood.x, newFood.y) && attempts < 50);
        
        if (attempts < 50) {
            this.food.push(newFood);
            console.log('Food spawned at:', newFood.x, newFood.y);
        }
    }

    isPositionOccupied(x, y) {
        return this.snake.some(segment => segment.x === x && segment.y === y) ||
               this.food.some(food => food.x === x && food.y === y) ||
               this.powerUps.some(powerUp => powerUp.x === x && powerUp.y === y);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
            console.log('Space Snake started');
        }
    }

    restart() {
        // Clean up first
        this.stop();
        
        // Reset state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.tokens = 0;
        this.bonusMultiplier = 1;
        this.streak = 0;
        this.moveInterval = 300;
        this.moveTimer = 0;
        
        this.snake = [
            { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 2) }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = [];
        this.powerUps = [];
        this.specialItems = [];
        
        // Reset achievements for new game
        this.achievements = {
            firstFood: false,
            reach10Length: false,
            reach50Score: false,
            reach100Score: false,
            perfectLevel: false
        };
        
        this.createStarfield();
        this.spawnFood();
        this.updateUI();
        this.start();
        
        console.log('Enhanced Space Snake restarted');
    }

    stop() {
        this.isRunning = false;
        if (this.boundKeyHandler) {
            document.removeEventListener('keydown', this.boundKeyHandler);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        console.log('Snake game', this.isPaused ? 'paused' : 'resumed');
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Process virtual joystick input (mobile)
        if (this.isMobile && this.useVirtualJoystick && window.mobileControls) {
            this.processJoystickInput();
        }
        
        this.moveTimer += deltaTime;
        
        // Move snake at regular intervals
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.moveSnake();
        }
        
        // Spawn more food if needed
        if (this.food.length < 2) {
            this.spawnFood();
        }
        
        // Update power-ups (remove expired ones)
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.duration -= deltaTime;
            return powerUp.duration > 0;
        });
        
        // Update special items
        this.specialItems = this.specialItems.filter(item => {
            item.duration -= deltaTime;
            return item.duration > 0;
        });
        
        // Occasionally spawn power-ups
        if (Math.random() < 0.001 && this.powerUps.length < 1) {
            this.spawnPowerUp();
        }
        
        // Occasionally spawn special reward items
        if (Math.random() < 0.0005 && this.specialItems.length < 1 && this.score > 50) {
            this.spawnSpecialItem();
        }
    }
    
    processJoystickInput() {
        const joystick = window.mobileControls.getJoystickState();
        
        // Only process if joystick is moved significantly
        if (Math.abs(joystick.x) > this.joystickThreshold || Math.abs(joystick.y) > this.joystickThreshold) {
            let newDirection = null;
            
            // Determine primary direction based on joystick
            if (Math.abs(joystick.x) > Math.abs(joystick.y)) {
                // Horizontal movement is stronger
                if (joystick.x > this.joystickThreshold && this.direction.x !== -1) {
                    newDirection = { x: 1, y: 0 }; // Right
                } else if (joystick.x < -this.joystickThreshold && this.direction.x !== 1) {
                    newDirection = { x: -1, y: 0 }; // Left
                }
            } else {
                // Vertical movement is stronger
                if (joystick.y > this.joystickThreshold && this.direction.y !== -1) {
                    newDirection = { x: 0, y: 1 }; // Down
                } else if (joystick.y < -this.joystickThreshold && this.direction.y !== 1) {
                    newDirection = { x: 0, y: -1 }; // Up
                }
            }
            
            // Only change direction if it's different from current
            if (newDirection && (newDirection.x !== this.direction.x || newDirection.y !== this.direction.y)) {
                this.nextDirection = newDirection;
                this.lastJoystickDirection = newDirection;
            }
        }
    }

    moveSnake() {
        this.direction = { ...this.nextDirection };
        
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collision (wrap around)
        if (head.x < 0) head.x = this.gridWidth - 1;
        if (head.x >= this.gridWidth) head.x = 0;
        if (head.y < 0) head.y = this.gridHeight - 1;
        if (head.y >= this.gridHeight) head.y = 0;
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.lives--;
            this.streak = 0; // Reset streak on collision
            this.bonusMultiplier = 1; // Reset multiplier
            
            if (this.lives <= 0) {
                this.gameOver();
                return;
            } else {
                this.resetPosition();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        const foodIndex = this.food.findIndex(food => food.x === head.x && food.y === head.y);
        if (foodIndex !== -1) {
            const food = this.food[foodIndex];
            this.food.splice(foodIndex, 1);
            
            // Enhanced scoring system
            let baseScore = 0;
            if (food.type === 'normal') {
                baseScore = 10;
                this.streak++;
            } else {
                baseScore = 25;
                this.streak += 2;
                this.moveInterval = Math.max(80, this.moveInterval - 10); // Speed up
            }
            
            // Apply bonus multiplier and streak bonus
            const finalScore = Math.floor(baseScore * this.bonusMultiplier + (this.streak * 2));
            this.score += finalScore;
            
            // Earn tokens based on performance
            this.tokens += Math.floor(finalScore / 15) + (this.streak > 5 ? 1 : 0);
            
            // Update multiplier based on streak
            if (this.streak >= 5) this.bonusMultiplier = 1.5;
            if (this.streak >= 10) this.bonusMultiplier = 2.0;
            if (this.streak >= 15) this.bonusMultiplier = 2.5;
            
            // Check achievements
            this.checkAchievements();
            
            // Level up every 100 points
            if (this.score % 100 === 0) {
                this.level++;
                this.moveInterval = Math.max(80, this.moveInterval - 15);
                this.tokens += this.level; // Bonus tokens for leveling up
            }
            
            // Update earning system
            if (window.earningSystem) {
                window.earningSystem.addEarnings('spaceSnake', finalScore);
            }
            
            // Don't remove tail - snake grows
        } else {
            // Check power-up collision
            const powerUpIndex = this.powerUps.findIndex(powerUp => powerUp.x === head.x && powerUp.y === head.y);
            if (powerUpIndex !== -1) {
                const powerUp = this.powerUps[powerUpIndex];
                this.powerUps.splice(powerUpIndex, 1);
                this.applyPowerUp(powerUp);
            }
            
            // Check special item collision
            const specialIndex = this.specialItems.findIndex(item => item.x === head.x && item.y === head.y);
            if (specialIndex !== -1) {
                const item = this.specialItems[specialIndex];
                this.specialItems.splice(specialIndex, 1);
                this.applySpecialItem(item);
            }
            
            // Remove tail - snake doesn't grow
            this.snake.pop();
        }
        
        this.updateUI();
    }

    spawnPowerUp() {
        let powerUp;
        let attempts = 0;
        
        do {
            powerUp = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight),
                type: ['slow', 'shrink', 'score'][Math.floor(Math.random() * 3)],
                duration: 8000
            };
            attempts++;
        } while (this.isPositionOccupied(powerUp.x, powerUp.y) && attempts < 50);
        
        if (attempts < 50) {
            this.powerUps.push(powerUp);
        }
    }

    applyPowerUp(powerUp) {
        switch(powerUp.type) {
            case 'slow':
                this.moveInterval += 50;
                this.score += 20;
                this.tokens += 2;
                break;
            case 'shrink':
                if (this.snake.length > 1) {
                    this.snake.pop();
                    if (this.snake.length > 1) this.snake.pop();
                }
                this.score += 30;
                this.tokens += 3;
                break;
            case 'score':
                this.score += 100;
                this.tokens += 5;
                break;
        }
    }
    
    spawnSpecialItem() {
        let item;
        let attempts = 0;
        
        do {
            item = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight),
                type: ['diamond', 'star', 'chest'][Math.floor(Math.random() * 3)],
                duration: 10000 // 10 seconds to collect
            };
            attempts++;
        } while (this.isPositionOccupied(item.x, item.y) && attempts < 50);
        
        if (attempts < 50) {
            this.specialItems.push(item);
            console.log('Special item spawned:', item.type);
        }
    }
    
    applySpecialItem(item) {
        switch(item.type) {
            case 'diamond':
                this.score += 200;
                this.tokens += 15;
                this.bonusMultiplier += 0.5;
                break;
            case 'star':
                this.score += 150;
                this.tokens += 10;
                this.streak += 3; // Bonus streak
                break;
            case 'chest':
                this.score += 100;
                this.tokens += 20; // Lots of tokens!
                this.lives = Math.min(this.lives + 1, 5); // Extra life (max 5)
                break;
        }
        
        // Visual feedback for special items
        console.log(`Special item collected: ${item.type} (+${this.tokens} tokens)`);
    }
    
    checkAchievements() {
        // First food achievement
        if (!this.achievements.firstFood && this.score >= 10) {
            this.achievements.firstFood = true;
            this.tokens += 5;
            console.log('Achievement: First Food! (+5 tokens)');
        }
        
        // Snake length achievement
        if (!this.achievements.reach10Length && this.snake.length >= 10) {
            this.achievements.reach10Length = true;
            this.tokens += 10;
            console.log('Achievement: Snake Master! (+10 tokens)');
        }
        
        // Score achievements
        if (!this.achievements.reach50Score && this.score >= 50) {
            this.achievements.reach50Score = true;
            this.tokens += 8;
            console.log('Achievement: Score Champion! (+8 tokens)');
        }
        
        if (!this.achievements.reach100Score && this.score >= 100) {
            this.achievements.reach100Score = true;
            this.tokens += 15;
            console.log('Achievement: Century Club! (+15 tokens)');
        }
        
        // Perfect level (no collisions in a level)
        if (!this.achievements.perfectLevel && this.level >= 2 && this.lives === 3) {
            this.achievements.perfectLevel = true;
            this.tokens += 20;
            console.log('Achievement: Perfect Run! (+20 tokens)');
        }
    }

    resetPosition() {
        this.snake = [
            { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 2) }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render stars
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.alpha;
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Render grid (subtle)
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.canvas.width, y * this.gridSize);
            this.ctx.stroke();
        }
        
        // Render snake
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            if (index === 0) {
                // Head - bright cyan
                this.ctx.fillStyle = '#00ffff';
                this.ctx.strokeStyle = '#ffffff';
            } else {
                // Body - darker cyan
                this.ctx.fillStyle = '#00aaaa';
                this.ctx.strokeStyle = '#ffffff';
            }
            
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        });
        
        // Render food
        this.food.forEach(food => {
            const x = food.x * this.gridSize + this.gridSize/2;
            const y = food.y * this.gridSize + this.gridSize/2;
            
            if (food.type === 'normal') {
                this.ctx.fillStyle = '#ffff00'; // Yellow
            } else {
                this.ctx.fillStyle = '#ff0080'; // Pink
            }
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.gridSize/3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        
        // Render power-ups
        this.powerUps.forEach(powerUp => {
            const x = powerUp.x * this.gridSize + this.gridSize/2;
            const y = powerUp.y * this.gridSize + this.gridSize/2;
            
            let color;
            switch(powerUp.type) {
                case 'slow': color = '#00ff80'; break;
                case 'shrink': color = '#ff8000'; break;
                case 'score': color = '#8000ff'; break;
            }
            
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.gridSize/4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Pulsing effect
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 200);
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.gridSize/3, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        });
        
        // Render special items
        this.specialItems.forEach(item => {
            const x = item.x * this.gridSize + this.gridSize/2;
            const y = item.y * this.gridSize + this.gridSize/2;
            
            let color;
            let shape;
            switch(item.type) {
                case 'diamond': 
                    color = '#00ffff'; 
                    shape = 'diamond';
                    break;
                case 'star': 
                    color = '#ffff00'; 
                    shape = 'star';
                    break;
                case 'chest': 
                    color = '#ffd700'; 
                    shape = 'chest';
                    break;
            }
            
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            
            // Sparkling effect
            this.ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 100);
            
            if (shape === 'diamond') {
                // Draw diamond shape
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - this.gridSize/3);
                this.ctx.lineTo(x + this.gridSize/4, y);
                this.ctx.lineTo(x, y + this.gridSize/3);
                this.ctx.lineTo(x - this.gridSize/4, y);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            } else if (shape === 'star') {
                // Draw star shape
                this.ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                    const radius = i % 2 === 0 ? this.gridSize/3 : this.gridSize/6;
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    if (i === 0) this.ctx.moveTo(px, py);
                    else this.ctx.lineTo(px, py);
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            } else {
                // Draw chest (rectangle with rounded corners)
                const size = this.gridSize/3;
                this.ctx.beginPath();
                this.ctx.roundRect(x - size/2, y - size/2, size, size, 3);
                this.ctx.fill();
                this.ctx.stroke();
            }
            
            this.ctx.globalAlpha = 1;
        });
        
        // Render pause overlay
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2);
            this.ctx.textAlign = 'left';
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        document.getElementById('gems').textContent = this.snake.length;
        
        // Update enhanced UI elements if they exist
        const tokensElement = document.getElementById('tokens');
        if (tokensElement) tokensElement.textContent = this.tokens;
        
        const streakElement = document.getElementById('streak');
        if (streakElement) streakElement.textContent = this.streak;
        
        const multiplierElement = document.getElementById('multiplier');
        if (multiplierElement) multiplierElement.textContent = `${this.bonusMultiplier}x`;
        
        // Show streak and multiplier info if significant
        if (this.streak >= 5) {
            console.log(`Snake Streak: ${this.streak} | Multiplier: ${this.bonusMultiplier}x`);
        }
    }

    gameOver() {
        this.isRunning = false;
        this.stop();
        
        // Update final stats
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalGems').textContent = this.snake.length;
        
        // Update additional stats if elements exist
        const finalTokensElement = document.getElementById('finalTokens');
        if (finalTokensElement) finalTokensElement.textContent = this.tokens;
        
        const finalStreakElement = document.getElementById('finalStreak');
        if (finalStreakElement) finalStreakElement.textContent = this.streak;
        
        // Log final performance
        console.log(`Game Over - Score: ${this.score}, Tokens: ${this.tokens}, Max Streak: ${this.streak}`);
        
        // Update leaderboard if available
        if (window.leaderboard) {
            window.leaderboard.updateScore('spaceSnake', this.score, {
                level: this.level,
                length: this.snake.length,
                tokens: this.tokens,
                streak: this.streak
            });
        }
        
        // Show game over screen
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('gameOverScreen').classList.add('active');
    }
}