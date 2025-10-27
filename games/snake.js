// Space Snake Game - Fixed and Enhanced with COSM Token Integration

class SpaceSnake {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = 20;
        
        // Responsive canvas sizing
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.food = this.generateFood();
        this.specialItems = [];
        this.score = 0;
        this.cosmEarned = 0;
        this.gameSpeed = 100;
        this.isRunning = false;
        this.isPaused = false;
        this.gameLoop = null;
        
        // Mobile controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.setupControls();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, 600);
        this.canvas.width = size;
        this.canvas.height = size;
        this.gridSize = size / this.tileCount;
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction.y === 0) this.nextDirection = {x: 0, y: -1};
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction.y === 0) this.nextDirection = {x: 0, y: 1};
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction.x === 0) this.nextDirection = {x: -1, y: 0};
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction.x === 0) this.nextDirection = {x: 1, y: 0};
                    e.preventDefault();
                    break;
                case ' ':
                    this.togglePause();
                    e.preventDefault();
                    break;
            }
        });
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, {passive: false});
        
        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isRunning) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - this.touchStartX;
            const dy = touchEndY - this.touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 30 && this.direction.x === 0) {
                    this.nextDirection = {x: 1, y: 0};
                } else if (dx < -30 && this.direction.x === 0) {
                    this.nextDirection = {x: -1, y: 0};
                }
            } else {
                // Vertical swipe
                if (dy > 30 && this.direction.y === 0) {
                    this.nextDirection = {x: 0, y: 1};
                } else if (dy < -30 && this.direction.y === 0) {
                    this.nextDirection = {x: 0, y: -1};
                }
            }
            e.preventDefault();
        }, {passive: false});
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        return newFood;
    }
    
    generateSpecialItem() {
        if (Math.random() < 0.3 && this.specialItems.length < 2) {
            let newItem;
            do {
                newItem = {
                    x: Math.floor(Math.random() * this.tileCount),
                    y: Math.floor(Math.random() * this.tileCount),
                    type: Math.random() < 0.5 ? 'cosm' : 'boost',
                    lifetime: 100
                };
            } while (
                this.snake.some(s => s.x === newItem.x && s.y === newItem.y) ||
                (this.food.x === newItem.x && this.food.y === newItem.y)
            );
            this.specialItems.push(newItem);
        }
    }
    
    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.food = this.generateFood();
        this.specialItems = [];
        this.score = 0;
        this.cosmEarned = 0;
        this.gameSpeed = 100;
        
        // Update display
        document.getElementById('score').textContent = 'Score: 0';
        document.getElementById('cosm').textContent = 'COSM: 0.00';
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    update() {
        if (!this.isRunning || this.isPaused) return;
        
        this.direction = {...this.nextDirection};
        
        // Move snake
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };
        
        // Wrap around walls
        if (head.x < 0) head.x = this.tileCount - 1;
        if (head.x >= this.tileCount) head.x = 0;
        if (head.y < 0) head.y = this.tileCount - 1;
        if (head.y >= this.tileCount) head.y = 0;
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.cosmEarned += 0.1;
            this.food = this.generateFood();
            this.generateSpecialItem();
            
            // Update display
            document.getElementById('score').textContent = 'Score: ' + this.score;
            document.getElementById('cosm').textContent = 'COSM: ' + this.cosmEarned.toFixed(2);
            
            // Speed up every 5 foods
            if (this.score % 50 === 0) {
                this.gameSpeed = Math.max(50, this.gameSpeed - 10);
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
            }
        } else {
            this.snake.pop();
        }
        
        // Check special item collision
        this.specialItems = this.specialItems.filter(item => {
            item.lifetime--;
            if (item.lifetime <= 0) return false;
            
            if (head.x === item.x && head.y === item.y) {
                if (item.type === 'cosm') {
                    this.cosmEarned += 1.0;
                    this.score += 50;
                } else if (item.type === 'boost') {
                    this.score += 25;
                    this.cosmEarned += 0.5;
                }
                document.getElementById('score').textContent = 'Score: ' + this.score;
                document.getElementById('cosm').textContent = 'COSM: ' + this.cosmEarned.toFixed(2);
                return false;
            }
            return true;
        });
        
        this.draw();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#1a1f3a';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // Draw food
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0, Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw special items
        this.specialItems.forEach(item => {
            this.ctx.fillStyle = item.type === 'cosm' ? '#ffd700' : '#00ffff';
            this.ctx.beginPath();
            this.ctx.arc(
                item.x * this.gridSize + this.gridSize / 2,
                item.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 3,
                0, Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#00ff88' : '#00aa55';
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
        
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    gameOver() {
        this.isRunning = false;
        clearInterval(this.gameLoop);
        
        // Draw game over screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('Final Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('COSM Earned: ' + this.cosmEarned.toFixed(2), this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Click Start to play again', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }
}

// Initialize game
const snakeGame = new SpaceSnake('snakeCanvas');
