// Space Defender Game - Defend your base from asteroids
class SpaceDefenderGame {
    constructor() {
        this.canvas = document.getElementById('defenderCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'stopped';
        
        // Game stats
        this.score = 0;
        this.wave = 1;
        this.baseHealth = 100;
        
        // Game objects
        this.base = null;
        this.turrets = [];
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        
        // Timers
        this.asteroidSpawnTimer = 0;
        this.lastTime = 0;
        
        // Input
        this.mouse = { x: 0, y: 0, clicked: false };
        
        this.setupCanvas();
        this.setupControls();
        this.setupInput();
    }
    
    setupCanvas() {
        const container = document.getElementById('defender-game-area');
        const maxWidth = Math.min(container.clientWidth - 40, 800);
        const maxHeight = Math.min(window.innerHeight - 300, 600);
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
    }
    
    setupControls() {
        document.getElementById('defender-start').addEventListener('click', () => {
            if (this.gameState === 'stopped' || this.gameState === 'gameOver') {
                this.startGame();
            }
        });
        
        document.getElementById('defender-pause').addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        });
    }
    
    setupInput() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                this.mouse.clicked = true;
                this.fireTurret();
            }
        });

        // Add touch support for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                this.mouse.x = touch.clientX - rect.left;
                this.mouse.y = touch.clientY - rect.top;
                this.fireTurret();
            }
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.wave = 1;
        this.baseHealth = 100;
        
        // Initialize base
        this.base = {
            x: this.canvas.width / 2 - 30,
            y: this.canvas.height - 60,
            width: 60,
            height: 40
        };
        
        // Initialize turrets
        this.turrets = [
            {
                x: this.canvas.width / 2 - 40,
                y: this.canvas.height - 80,
                angle: 0,
                shootCooldown: 0
            },
            {
                x: this.canvas.width / 2 + 40,
                y: this.canvas.height - 80,
                angle: 0,
                shootCooldown: 0
            }
        ];
        
        // Clear arrays
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        
        this.asteroidSpawnTimer = 0;
        this.lastTime = performance.now();
        
        this.updateUI();
        this.gameLoop();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('defender-pause').textContent = '▶️ Resume';
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('defender-pause').textContent = '⏸️ Pause';
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop(currentTime = performance.now()) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update turrets
        this.updateTurrets(deltaTime);
        
        // Spawn asteroids
        this.spawnAsteroids(deltaTime);
        
        // Update asteroids
        this.updateAsteroids(deltaTime);
        
        // Update bullets
        this.updateBullets(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
        
        // Check game over
        if (this.baseHealth <= 0) {
            this.gameOver();
        }
        
        // Check wave completion
        if (this.asteroids.length === 0 && this.asteroidSpawnTimer > 10) {
            this.wave++;
            this.asteroidSpawnTimer = 0;
        }
    }
    
    updateTurrets(deltaTime) {
        this.turrets.forEach(turret => {
            // Get mobile input
            const mobileInput = this.getMobileInput();
            
            // Aim at mouse or use mobile joystick for aiming
            if (mobileInput.hasInput) {
                // Use joystick for aiming direction
                const joystick = window.mobileControls.getJoystickVector();
                if (Math.abs(joystick.x) > 0.2 || Math.abs(joystick.y) > 0.2) {
                    turret.angle = Math.atan2(joystick.y, joystick.x);
                }
                
                // Auto-fire when mobile fire button is pressed
                if (mobileInput.fire && turret.shootCooldown <= 0) {
                    this.fireTurret();
                }
            } else {
                // Use mouse for aiming (desktop)
                const dx = this.mouse.x - turret.x;
                const dy = this.mouse.y - turret.y;
                turret.angle = Math.atan2(dy, dx);
            }
            
            // Update cooldown
            if (turret.shootCooldown > 0) {
                turret.shootCooldown -= deltaTime;
            }
        });
    }
    
    getMobileInput() {
        // Get input from mobile controls if available
        if (window.mobileControls && window.mobileControls.isEnabled) {
            const joystick = window.mobileControls.getJoystickVector();
            
            return {
                hasInput: true,
                fire: window.mobileControls.isPressed('fire'),
                special: window.mobileControls.isPressed('special'),
                joystick: joystick
            };
        }
        
        return {
            hasInput: false,
            fire: false,
            special: false,
            joystick: { x: 0, y: 0 }
        };
    }
    
    fireTurret() {
        this.turrets.forEach(turret => {
            if (turret.shootCooldown <= 0) {
                this.bullets.push({
                    x: turret.x,
                    y: turret.y,
                    vx: Math.cos(turret.angle) * 400,
                    vy: Math.sin(turret.angle) * 400,
                    size: 4
                });
                turret.shootCooldown = 0.3;
            }
        });
    }
    
    spawnAsteroids(deltaTime) {
        this.asteroidSpawnTimer += deltaTime;
        const spawnRate = Math.max(0.5, 2 - this.wave * 0.1);
        
        if (this.asteroidSpawnTimer >= spawnRate && this.asteroids.length < this.wave * 3 + 5) {
            const side = Math.random() < 0.5 ? 'top' : 'side';
            let x, y, vx, vy;
            
            if (side === 'top') {
                x = Math.random() * this.canvas.width;
                y = -30;
                vx = (Math.random() - 0.5) * 100;
                vy = 50 + this.wave * 10;
            } else {
                x = Math.random() < 0.5 ? -30 : this.canvas.width + 30;
                y = Math.random() * this.canvas.height * 0.5;
                vx = x < 0 ? 50 + this.wave * 10 : -(50 + this.wave * 10);
                vy = Math.random() * 50;
            }
            
            this.asteroids.push({
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                size: 15 + Math.random() * 20,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 4
            });
            
            this.asteroidSpawnTimer = 0;
        }
    }
    
    updateAsteroids(deltaTime) {
        this.asteroids.forEach((asteroid, index) => {
            asteroid.x += asteroid.vx * deltaTime;
            asteroid.y += asteroid.vy * deltaTime;
            asteroid.rotation += asteroid.rotationSpeed * deltaTime;
            
            // Remove asteroids that hit the base
            if (asteroid.y > this.canvas.height - 60 && 
                asteroid.x > this.base.x - asteroid.size && 
                asteroid.x < this.base.x + this.base.width + asteroid.size) {
                this.baseHealth -= 20;
                this.createExplosion(asteroid.x, asteroid.y);
                this.asteroids.splice(index, 1);
            }
            
            // Remove asteroids that are off-screen
            if (asteroid.x < -50 || asteroid.x > this.canvas.width + 50 || asteroid.y > this.canvas.height + 50) {
                this.asteroids.splice(index, 1);
            }
        });
    }
    
    updateBullets(deltaTime) {
        this.bullets.forEach((bullet, index) => {
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
            
            // Remove bullets that are off-screen
            if (bullet.x < 0 || bullet.x > this.canvas.width || bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(index, 1);
            }
        });
    }
    
    updateParticles(deltaTime) {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    checkCollisions() {
        // Bullet-Asteroid collisions
        this.bullets.forEach((bullet, bulletIndex) => {
            this.asteroids.forEach((asteroid, asteroidIndex) => {
                const dx = bullet.x - asteroid.x;
                const dy = bullet.y - asteroid.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < asteroid.size) {
                    // Create explosion
                    this.createExplosion(asteroid.x, asteroid.y);
                    
                    // Remove bullet and asteroid
                    this.bullets.splice(bulletIndex, 1);
                    this.asteroids.splice(asteroidIndex, 1);
                    
                    // Increase score
                    this.score += 50 * this.wave;
                }
            });
        });
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.5 + Math.random() * 0.5,
                color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.drawStars();
        
        // Draw base
        this.drawBase();
        
        // Draw turrets
        this.drawTurrets();
        
        // Draw asteroids
        this.drawAsteroids();
        
        // Draw bullets
        this.drawBullets();
        
        // Draw particles
        this.drawParticles();
        
        // Draw crosshair
        this.drawCrosshair();
    }
    
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 123) % this.canvas.width;
            const y = (i * 456) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    drawBase() {
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(this.base.x, this.base.y, this.base.width, this.base.height);
        
        // Draw base details
        this.ctx.fillStyle = '#0080ff';
        this.ctx.fillRect(this.base.x + 5, this.base.y + 5, this.base.width - 10, this.base.height - 10);
    }
    
    drawTurrets() {
        this.turrets.forEach(turret => {
            this.ctx.save();
            this.ctx.translate(turret.x, turret.y);
            this.ctx.rotate(turret.angle);
            
            // Draw turret base
            this.ctx.fillStyle = '#808080';
            this.ctx.fillRect(-8, -8, 16, 16);
            
            // Draw turret barrel
            this.ctx.fillStyle = '#a0a0a0';
            this.ctx.fillRect(0, -3, 25, 6);
            
            this.ctx.restore();
        });
    }
    
    drawAsteroids() {
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            
            // Draw irregular asteroid shape
            const sides = 8;
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2;
                const radius = asteroid.size * (0.8 + Math.sin(i * 2) * 0.2);
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
            this.ctx.restore();
        });
    }
    
    drawBullets() {
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x - bullet.size/2, bullet.y - bullet.size/2, bullet.size, bullet.size);
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawCrosshair() {
        if (this.gameState === 'playing') {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouse.x - 10, this.mouse.y);
            this.ctx.lineTo(this.mouse.x + 10, this.mouse.y);
            this.ctx.moveTo(this.mouse.x, this.mouse.y - 10);
            this.ctx.lineTo(this.mouse.x, this.mouse.y + 10);
            this.ctx.stroke();
        }
    }
    
    updateUI() {
        document.getElementById('defender-score').textContent = this.score;
        document.getElementById('defender-wave').textContent = this.wave;
        
        const healthBar = document.getElementById('defender-health');
        healthBar.style.width = `${Math.max(0, this.baseHealth)}%`;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        const stats = document.getElementById('final-stats');
        
        stats.innerHTML = `
            <h3>🛡️ Defense Failed</h3>
            <p><strong>Final Score:</strong> ${this.score}</p>
            <p><strong>Waves Survived:</strong> ${this.wave - 1}</p>
            <p><strong>Asteroids Destroyed:</strong> ${Math.floor(this.score / 50)}</p>
        `;
        
        // Use centralized modal system
        if (window.cosmicApp) {
            window.cosmicApp.showModal();
        }
    }
    
    stop() {
        this.gameState = 'stopped';
    }
}
