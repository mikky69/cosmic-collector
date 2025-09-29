// Asteroid Blast Game - Simple but addictive space shooter
// Mikky Studio - 2025

class AsteroidBlastGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameTime = 0;
        
        // Game entities
        this.player = { x: canvas.width/2, y: canvas.height-30, angle: 0, thrust: false };
        this.bullets = [];
        this.asteroids = [];
        this.stars = [];
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Game settings
        this.bulletSpeed = 400;
        this.asteroidCount = 5;
        
        this.initializeGame();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.shoot();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    initializeGame() {
        this.createStarfield();
        this.createAsteroids();
        this.updateUI();
        console.log('Asteroid Blast initialized');
    }

    createStarfield() {
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1
            });
        }
    }

    createAsteroids() {
        this.asteroids = [];
        for (let i = 0; i < this.asteroidCount + this.level - 1; i++) {
            let x, y;
            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;
            } while (this.distance(x, y, this.player.x, this.player.y) < 100);
            
            this.asteroids.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                size: 30 + Math.random() * 20,
                health: 3
            });
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.lastTime = performance.now();
            this.gameLoop();
            console.log('Asteroid Blast started');
        }
    }

    restart() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameTime = 0;
        this.player = { x: this.canvas.width/2, y: this.canvas.height-30, angle: 0, thrust: false };
        this.bullets = [];
        this.createStarfield();
        this.createAsteroids();
        this.updateUI();
        this.start();
        console.log('Asteroid Blast restarted');
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        
        // Handle player input
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.angle -= 300 * deltaTime;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.angle += 300 * deltaTime;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.thrust = true;
            const thrust = 200 * deltaTime;
            const radians = (this.player.angle - 90) * Math.PI / 180;
            this.player.x += Math.cos(radians) * thrust;
            this.player.y += Math.sin(radians) * thrust;
        } else {
            this.player.thrust = false;
        }
        
        // Keep player in bounds
        this.player.x = Math.max(15, Math.min(this.canvas.width - 15, this.player.x));
        this.player.y = Math.max(15, Math.min(this.canvas.height - 15, this.player.y));
        
        // Update bullets
        this.bullets.forEach((bullet, i) => {
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
            bullet.life -= deltaTime;
            
            if (bullet.life <= 0 || bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(i, 1);
            }
        });
        
        // Update asteroids
        this.asteroids.forEach(asteroid => {
            asteroid.x += asteroid.vx * deltaTime;
            asteroid.y += asteroid.vy * deltaTime;
            
            // Wrap around screen
            if (asteroid.x < -asteroid.size) asteroid.x = this.canvas.width + asteroid.size;
            if (asteroid.x > this.canvas.width + asteroid.size) asteroid.x = -asteroid.size;
            if (asteroid.y < -asteroid.size) asteroid.y = this.canvas.height + asteroid.size;
            if (asteroid.y > this.canvas.height + asteroid.size) asteroid.y = -asteroid.size;
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Check level completion
        if (this.asteroids.length === 0) {
            this.level++;
            this.score += 500;
            this.createAsteroids();
        }
        
        this.updateUI();
    }

    checkCollisions() {
        // Bullets vs asteroids
        this.bullets.forEach((bullet, bulletIndex) => {
            this.asteroids.forEach((asteroid, asteroidIndex) => {
                if (this.distance(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.size) {
                    asteroid.health--;
                    this.bullets.splice(bulletIndex, 1);
                    this.score += 10;
                    
                    if (asteroid.health <= 0) {
                        this.asteroids.splice(asteroidIndex, 1);
                        this.score += 50;
                        
                        // Split larger asteroids
                        if (asteroid.size > 25) {
                            for (let i = 0; i < 2; i++) {
                                this.asteroids.push({
                                    x: asteroid.x,
                                    y: asteroid.y,
                                    vx: (Math.random() - 0.5) * 150,
                                    vy: (Math.random() - 0.5) * 150,
                                    size: asteroid.size * 0.6,
                                    health: 2
                                });
                            }
                        }
                    }
                }
            });
        });
        
        // Player vs asteroids
        this.asteroids.forEach(asteroid => {
            if (this.distance(this.player.x, this.player.y, asteroid.x, asteroid.y) < asteroid.size + 10) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameOver();
                } else {
                    // Reset player position
                    this.player.x = this.canvas.width / 2;
                    this.player.y = this.canvas.height - 30;
                }
            }
        });
    }

    shoot() {
        if (!this.isRunning || this.isPaused) return;
        
        const radians = (this.player.angle - 90) * Math.PI / 180;
        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(radians) * this.bulletSpeed,
            vy: Math.sin(radians) * this.bulletSpeed,
            life: 2
        });
    }

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render stars
        this.ctx.fillStyle = 'white';
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Render player
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle * Math.PI / 180);
        
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(-8, 15);
        this.ctx.lineTo(0, 8);
        this.ctx.lineTo(8, 15);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Thrust effect
        if (this.player.thrust) {
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.beginPath();
            this.ctx.moveTo(-4, 15);
            this.ctx.lineTo(0, 25);
            this.ctx.lineTo(4, 15);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
        
        // Render bullets
        this.ctx.fillStyle = '#ffe66d';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Render asteroids
        this.ctx.strokeStyle = '#a8e6cf';
        this.ctx.fillStyle = '#666';
        this.ctx.lineWidth = 2;
        this.asteroids.forEach(asteroid => {
            this.ctx.beginPath();
            this.ctx.arc(asteroid.x, asteroid.y, asteroid.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        });
        
        // Render pause overlay
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2);
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        document.getElementById('gems').textContent = '---';
    }

    gameOver() {
        this.isRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalGems').textContent = '---';
        
        // Show game over screen
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('gameOverScreen').classList.add('active');
    }
}