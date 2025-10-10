// Fixed Space Snake Game - 100% Working
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
        
        this.setupInput();
        this.initializeGame();
        
        console.log('Space Snake Game created - Canvas:', this.canvas.width, 'x', this.canvas.height);
        console.log('Grid:', this.gridWidth, 'x', this.gridHeight);
    }

    setupInput() {
        // Detect if device is mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (window.innerWidth <= 768 && 'ontouchstart' in window);
        
        // Touch controls for mobile
        this.touchControls = {
            startX: 0,
            startY: 0,
            minSwipeDistance: 30
        };
        
        // Remove any existing listeners
        this.boundKeyHandler = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.boundKeyHandler);
        
        // Add mobile touch controls
        if (this.isMobile) {
            this.setupTouchControls();
        }
        
        console.log(this.isMobile ? 'Snake: Mobile controls enabled' : 'Snake: Desktop controls enabled');
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
        this.moveInterval = 300;
        this.moveTimer = 0;
        
        this.snake = [
            { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 2) }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = [];
        this.powerUps = [];
        
        this.createStarfield();
        this.spawnFood();
        this.updateUI();
        this.start();
        
        console.log('Space Snake restarted');
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
        
        // Occasionally spawn power-ups
        if (Math.random() < 0.001 && this.powerUps.length < 1) {
            this.spawnPowerUp();
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
            
            if (food.type === 'normal') {
                this.score += 10;
            } else {
                this.score += 25;
                this.moveInterval = Math.max(80, this.moveInterval - 10); // Speed up
            }
            
            // Level up every 100 points
            if (this.score % 100 === 0) {
                this.level++;
                this.moveInterval = Math.max(80, this.moveInterval - 15);
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
                break;
            case 'shrink':
                if (this.snake.length > 1) {
                    this.snake.pop();
                    if (this.snake.length > 1) this.snake.pop();
                }
                this.score += 30;
                break;
            case 'score':
                this.score += 100;
                break;
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
    }

    gameOver() {
        this.isRunning = false;
        this.stop();
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalGems').textContent = this.snake.length;
        
        // Show game over screen
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('gameOverScreen').classList.add('active');
    }
}