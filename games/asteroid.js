// Space Defender - Asteroid Game with COSM Token Integration

class AsteroidGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Responsive sizing
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.ship = null;
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        this.score = 0;
        this.cosmEarned = 0;
        this.health = 100;
        this.wave = 1;
        this.isRunning = false;
        this.keys = {};
        this.mousePos = {x: 0, y: 0};
        this.isMobile = 'ontouchstart' in window;
        
        // Game settings
        this.asteroidSpawnRate = 60;
        this.frameCount = 0;
        
        this.setupControls();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = Math.min(container.clientWidth, 800);
        this.canvas.height = Math.min(600, window.innerHeight - 300);
    }
    
    setupControls() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' && this.isRunning) {
                this.shoot();
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });
        
        this.canvas.addEventListener('click', () => {
            if (this.isRunning) this.shoot();
        });
        
        // Touch
        this.canvas.addEventListener('touchmove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
            e.preventDefault();
        }, {passive: false});
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.isRunning) this.shoot();
            e.preventDefault();
        }, {passive: false});
    }
    
    start() {
        this.ship = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 30,
            height: 30,
            speed: 5
        };
        
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        this.score = 0;
        this.cosmEarned = 0;
        this.health = 100;
        this.wave = 1;
        this.frameCount = 0;
        this.isRunning = true;
        this.asteroidSpawnRate = 60;
        
        // Update display
        document.getElementById('score').textContent = 'Score: 0';
        document.getElementById('cosm').textContent = 'COSM: 0.00';
        
        this.gameLoop();
    }
    
    shoot() {
        if (!this.ship) return;
        
        this.bullets.push({
            x: this.ship.x,
            y: this.ship.y,
            width: 4,
            height: 12,
            speed: 8,
            damage: 10
        });
    }
    
    spawnAsteroid() {
        const size = 20 + Math.random() * 40;
        this.asteroids.push({
            x: Math.random() * (this.canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: 1 + Math.random() * 2 + (this.wave * 0.3),
            health: size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                color: color || '#ff6600'
            });
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    update() {
        if (!this.isRunning) return;
        
        this.frameCount++;
        
        // Move ship
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.ship.x = Math.max(0, this.ship.x - this.ship.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.ship.x = Math.min(this.canvas.width - this.ship.width, this.ship.x + this.ship.speed);
        }
        
        // Mobile aim
        if (this.isMobile && this.mousePos.x > 0) {
            const targetX = this.mousePos.x - this.ship.width / 2;
            const dx = targetX - this.ship.x;
            this.ship.x += dx * 0.1;
        }
        
        // Spawn asteroids
        if (this.frameCount % this.asteroidSpawnRate === 0) {
            this.spawnAsteroid();
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
        });
        
        // Update asteroids
        this.asteroids = this.asteroids.filter(asteroid => {
            asteroid.y += asteroid.speed;
            asteroid.rotation += asteroid.rotationSpeed;
            
            // Check collision with ship
            if (this.checkCollision(asteroid, this.ship)) {
                this.health -= 20;
                this.createParticles(asteroid.x, asteroid.y, 15, '#ff0000');
                
                if (this.health <= 0) {
                    this.gameOver();
                }
                return false;
            }
            
            // Check collision with bullets
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                if (this.checkCollision(this.bullets[i], asteroid)) {
                    asteroid.health -= this.bullets[i].damage;
                    this.bullets.splice(i, 1);
                    
                    if (asteroid.health <= 0) {
                        this.score += Math.floor(asteroid.width);
                        this.cosmEarned += asteroid.width * 0.01;
                        this.createParticles(asteroid.x, asteroid.y, 20);
                        
                        // Update display
                        document.getElementById('score').textContent = 'Score: ' + this.score;
                        document.getElementById('cosm').textContent = 'COSM: ' + this.cosmEarned.toFixed(2);
                        
                        return false;
                    }
                }
            }
            
            return asteroid.y < this.canvas.height + asteroid.height;
        });
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
        
        // Wave progression
        if (this.score > this.wave * 500) {
            this.wave++;
            this.asteroidSpawnRate = Math.max(20, this.asteroidSpawnRate - 5);
        }
    }
    
    draw() {
        // Background
        this.ctx.fillStyle = '#000814';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Stars effect
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (this.frameCount + i * 50) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
        
        // Draw ship
        if (this.ship) {
            this.ctx.save();
            this.ctx.translate(this.ship.x + this.ship.width / 2, this.ship.y + this.ship.height / 2);
            
            this.ctx.fillStyle = '#00ffff';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -this.ship.height / 2);
            this.ctx.lineTo(-this.ship.width / 2, this.ship.height / 2);
            this.ctx.lineTo(this.ship.width / 2, this.ship.height / 2);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        // Draw bullets
        this.ctx.fillStyle = '#00ff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // Draw asteroids
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
            this.ctx.rotate(asteroid.rotation);
            
            this.ctx.fillStyle = '#8b4513';
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = asteroid.width / 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.restore();
        });
        
        // Draw particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 30;
            this.ctx.fillRect(p.x, p.y, 3, 3);
        });
        this.ctx.globalAlpha = 1;
        
        // Draw health bar
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(10, 10, 200, 20);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(10, 10, this.health * 2, 20);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.strokeRect(10, 10, 200, 20);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Health: ' + this.health + '%', 15, 25);
        
        // Wave info
        this.ctx.fillText('Wave: ' + this.wave, this.canvas.width - 80, 25);
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameOver() {
        this.isRunning = false;
        
        // Draw game over
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 80);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('Final Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillText('COSM Earned: ' + this.cosmEarned.toFixed(2), this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText('Waves Survived: ' + this.wave, this.canvas.width / 2, this.canvas.height / 2 + 60);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Click Start to play again', this.canvas.width / 2, this.canvas.height / 2 + 100);
    }
}

// Initialize
const asteroidGame = new AsteroidGame('asteroidCanvas');
