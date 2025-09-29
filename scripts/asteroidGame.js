// Fixed Asteroid Blast Game - 100% Working
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
        this.player = { 
            x: canvas.width/2, 
            y: canvas.height/2, 
            angle: 0, 
            vx: 0,
            vy: 0,
            thrust: false,
            radius: 12
        };
        this.bullets = [];
        this.asteroids = [];
        this.stars = [];
        this.particles = [];
        
        // Game settings
        this.bulletSpeed = 500;
        this.asteroidCount = 4 + this.level;
        this.lastShot = 0;
        this.shotCooldown = 150; // milliseconds
        
        this.setupInput();
        this.initializeGame();
        
        console.log('Asteroid Blast Game created');
    }

    setupInput() {
        this.keys = {};
        this.boundKeyDownHandler = this.handleKeyDown.bind(this);
        this.boundKeyUpHandler = this.handleKeyUp.bind(this);
        
        document.addEventListener('keydown', this.boundKeyDownHandler);
        document.addEventListener('keyup', this.boundKeyUpHandler);
    }
    
    handleKeyDown(e) {
        this.keys[e.code] = true;
        if (e.code === 'Space' && this.isRunning && !this.isPaused) {
            e.preventDefault();
            this.shoot();
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    initializeGame() {
        this.createStarfield();
        this.createAsteroids();
        this.updateUI();
        console.log('Asteroid Blast initialized with', this.asteroids.length, 'asteroids');
    }

    createStarfield() {
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.8 + 0.2
            });
        }
    }

    createAsteroids() {
        this.asteroids = [];
        const count = this.asteroidCount + Math.floor(this.level / 2);
        
        for (let i = 0; i < count; i++) {
            let x, y;
            let attempts = 0;
            
            // Make sure asteroids don't spawn too close to player
            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;
                attempts++;
            } while (this.distance(x, y, this.player.x, this.player.y) < 120 && attempts < 50);
            
            const size = 25 + Math.random() * 35;
            
            this.asteroids.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 120,
                size: size,
                health: Math.ceil(size / 20),
                maxHealth: Math.ceil(size / 20),
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 4
            });
        }
        
        console.log('Created', this.asteroids.length, 'asteroids for level', this.level);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
            console.log('Asteroid Blast started');
        }
    }

    restart() {
        this.stop();
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameTime = 0;
        this.lastShot = 0;
        
        this.player = { 
            x: this.canvas.width/2, 
            y: this.canvas.height/2, 
            angle: 0, 
            vx: 0,
            vy: 0,
            thrust: false,
            radius: 12
        };
        this.bullets = [];
        this.particles = [];
        
        this.createStarfield();
        this.createAsteroids();
        this.updateUI();
        this.start();
        
        console.log('Asteroid Blast restarted');
    }
    
    stop() {
        this.isRunning = false;
        if (this.boundKeyDownHandler) {
            document.removeEventListener('keydown', this.boundKeyDownHandler);
            document.removeEventListener('keyup', this.boundKeyUpHandler);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        console.log('Asteroid game', this.isPaused ? 'paused' : 'resumed');
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
            this.player.angle -= 200 * deltaTime;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.angle += 200 * deltaTime;
        }
        
        // Thrust
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.thrust = true;
            const thrustPower = 300 * deltaTime;
            const radians = (this.player.angle - 90) * Math.PI / 180;
            this.player.vx += Math.cos(radians) * thrustPower;
            this.player.vy += Math.sin(radians) * thrustPower;
        } else {
            this.player.thrust = false;
        }
        
        // Apply physics to player
        this.player.x += this.player.vx * deltaTime;
        this.player.y += this.player.vy * deltaTime;
        
        // Apply friction
        this.player.vx *= 0.98;
        this.player.vy *= 0.98;
        
        // Screen wrapping for player
        if (this.player.x < 0) this.player.x = this.canvas.width;
        if (this.player.x > this.canvas.width) this.player.x = 0;
        if (this.player.y < 0) this.player.y = this.canvas.height;
        if (this.player.y > this.canvas.height) this.player.y = 0;
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
            bullet.life -= deltaTime;
            
            // Screen wrapping for bullets
            if (bullet.x < 0) bullet.x = this.canvas.width;
            if (bullet.x > this.canvas.width) bullet.x = 0;
            if (bullet.y < 0) bullet.y = this.canvas.height;
            if (bullet.y > this.canvas.height) bullet.y = 0;
            
            return bullet.life > 0;
        });
        
        // Update asteroids
        this.asteroids.forEach(asteroid => {
            asteroid.x += asteroid.vx * deltaTime;
            asteroid.y += asteroid.vy * deltaTime;
            asteroid.rotation += asteroid.rotationSpeed * deltaTime;
            
            // Screen wrapping for asteroids
            if (asteroid.x < -asteroid.size) asteroid.x = this.canvas.width + asteroid.size;
            if (asteroid.x > this.canvas.width + asteroid.size) asteroid.x = -asteroid.size;
            if (asteroid.y < -asteroid.size) asteroid.y = this.canvas.height + asteroid.size;
            if (asteroid.y > this.canvas.height + asteroid.size) asteroid.y = -asteroid.size;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Check level completion
        if (this.asteroids.length === 0) {
            this.level++;
            this.score += 1000;
            this.asteroidCount = Math.min(4 + this.level, 10);
            this.createAsteroids();
            console.log('Level', this.level, 'started with', this.asteroids.length, 'asteroids');
        }
        
        this.updateUI();
    }

    checkCollisions() {
        // Bullets vs asteroids
        this.bullets.forEach((bullet, bulletIndex) => {
            this.asteroids.forEach((asteroid, asteroidIndex) => {
                if (this.distance(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.size) {
                    // Hit!
                    asteroid.health--;
                    this.bullets.splice(bulletIndex, 1);
                    this.score += 20;
                    
                    // Create hit particles
                    this.createParticles(asteroid.x, asteroid.y, '#ffaa00', 8);
                    
                    if (asteroid.health <= 0) {
                        this.asteroids.splice(asteroidIndex, 1);
                        this.score += 100;
                        
                        // Create destruction particles
                        this.createParticles(asteroid.x, asteroid.y, '#ff4444', 15);
                        
                        // Split larger asteroids
                        if (asteroid.size > 25) {
                            const pieces = Math.min(3, Math.floor(asteroid.size / 20));
                            for (let i = 0; i < pieces; i++) {
                                const angle = (Math.PI * 2 / pieces) * i;
                                const speed = 80 + Math.random() * 40;
                                
                                this.asteroids.push({
                                    x: asteroid.x + Math.cos(angle) * 20,
                                    y: asteroid.y + Math.sin(angle) * 20,
                                    vx: Math.cos(angle) * speed + asteroid.vx * 0.3,
                                    vy: Math.sin(angle) * speed + asteroid.vy * 0.3,
                                    size: asteroid.size * 0.6,
                                    health: Math.max(1, Math.floor(asteroid.maxHealth * 0.6)),
                                    maxHealth: Math.max(1, Math.floor(asteroid.maxHealth * 0.6)),
                                    rotation: Math.random() * Math.PI * 2,
                                    rotationSpeed: (Math.random() - 0.5) * 6
                                });
                            }
                        }
                    }
                }
            });
        });
        
        // Player vs asteroids
        this.asteroids.forEach(asteroid => {
            if (this.distance(this.player.x, this.player.y, asteroid.x, asteroid.y) < asteroid.size + this.player.radius) {
                // Player hit!
                this.lives--;
                this.createParticles(this.player.x, this.player.y, '#ff6666', 12);
                
                if (this.lives <= 0) {
                    this.gameOver();
                } else {
                    // Reset player position and velocity
                    this.player.x = this.canvas.width / 2;
                    this.player.y = this.canvas.height / 2;
                    this.player.vx = 0;
                    this.player.vy = 0;
                    this.player.angle = 0;
                }
            }
        });
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 150 + 50;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                alpha: 1,
                size: Math.random() * 3 + 1
            });
        }
    }

    shoot() {
        const currentTime = performance.now();
        if (currentTime - this.lastShot < this.shotCooldown) return;
        
        this.lastShot = currentTime;
        
        const radians = (this.player.angle - 90) * Math.PI / 180;
        
        this.bullets.push({
            x: this.player.x + Math.cos(radians) * 15,
            y: this.player.y + Math.sin(radians) * 15,
            vx: Math.cos(radians) * this.bulletSpeed + this.player.vx,
            vy: Math.sin(radians) * this.bulletSpeed + this.player.vy,
            life: 3 // 3 seconds lifetime
        });
    }

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
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
        
        // Render particles
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Render player
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle * Math.PI / 180);
        
        this.ctx.fillStyle = '#00ffff';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(-10, 15);
        this.ctx.lineTo(0, 8);
        this.ctx.lineTo(10, 15);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Thrust effect
        if (this.player.thrust) {
            this.ctx.fillStyle = '#ff6600';
            this.ctx.beginPath();
            this.ctx.moveTo(-6, 15);
            this.ctx.lineTo(0, 25 + Math.random() * 8);
            this.ctx.lineTo(6, 15);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
        
        // Render bullets
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Render asteroids
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            
            // Health-based coloring
            const healthPercent = asteroid.health / asteroid.maxHealth;
            if (healthPercent > 0.6) {
                this.ctx.strokeStyle = '#888888';
                this.ctx.fillStyle = '#444444';
            } else if (healthPercent > 0.3) {
                this.ctx.strokeStyle = '#aa6600';
                this.ctx.fillStyle = '#553300';
            } else {
                this.ctx.strokeStyle = '#cc3333';
                this.ctx.fillStyle = '#661111';
            }
            
            this.ctx.lineWidth = 3;
            
            // Draw irregular asteroid shape
            const points = 8;
            this.ctx.beginPath();
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const variation = 0.7 + Math.sin(angle * 3 + asteroid.rotation) * 0.3;
                const radius = asteroid.size * variation;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.restore();
        });
        
        // Render UI text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Level: ${this.level}`, 20, this.canvas.height - 60);
        this.ctx.fillText(`Asteroids: ${this.asteroids.length}`, 20, this.canvas.height - 40);
        this.ctx.fillText(`Bullets: ${this.bullets.length}`, 20, this.canvas.height - 20);
        
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
        document.getElementById('gems').textContent = this.asteroids.length;
    }

    gameOver() {
        this.isRunning = false;
        this.stop();
        
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
