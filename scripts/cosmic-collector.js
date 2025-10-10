// Cosmic Collector - Enhanced Space Shooter Game
class CosmicCollectorGame {
    constructor() {
        this.canvas = document.getElementById('cosmicCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'stopped'; // stopped, playing, paused, gameOver
        
        // Game stats
        this.score = 0;
        this.level = 1;
        this.health = 100;
        this.lives = 3;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.powerUps = [];
        this.particles = [];
        
        // Timers
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        this.lastTime = 0;
        
        // Input
        this.keys = {};
        
        this.setupCanvas();
        this.setupControls();
        this.setupInput();
    }
    
    setupCanvas() {
        const container = document.getElementById('cosmic-game-area');
        const isMobile = window.mobileControls && window.mobileControls.isEnabled;
        
        if (isMobile) {
            // Mobile sizing
            const maxWidth = Math.min(container.clientWidth - 20, window.innerWidth - 40);
            const maxHeight = Math.min(window.innerHeight * 0.4, 300);
            
            this.canvas.width = maxWidth;
            this.canvas.height = maxHeight;
        } else {
            // Desktop sizing
            const maxWidth = Math.min(container.clientWidth - 40, 800);
            const maxHeight = Math.min(window.innerHeight - 300, 600);
            
            this.canvas.width = maxWidth;
            this.canvas.height = maxHeight;
        }
        
        // Ensure canvas maintains aspect ratio
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';
    }
    
    setupControls() {
        document.getElementById('cosmic-start').addEventListener('click', () => {
            if (this.gameState === 'stopped' || this.gameState === 'gameOver') {
                this.startGame();
            }
        });
        
        document.getElementById('cosmic-pause').addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        });
        
        document.getElementById('cosmic-reset').addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Prevent default for game keys
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'escape'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
            
            // Handle escape key
            if (e.key === 'Escape') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.health = 100;
        this.lives = 3;
        
        // Clear arrays
        this.enemies = [];
        this.bullets = [];
        this.powerUps = [];
        this.particles = [];
        
        // Create player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 30,
            height: 30,
            speed: 300,
            shootCooldown: 0
        };
        
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        this.lastTime = performance.now();
        
        this.updateUI();
        this.gameLoop();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('cosmic-pause').textContent = '▶️ Resume';
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('cosmic-pause').textContent = '⏸️ Pause';
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    resetGame() {
        this.gameState = 'stopped';
        document.getElementById('cosmic-pause').textContent = '⏸️ Pause';
        this.updateUI();
        this.clearCanvas();
        this.drawWelcomeScreen();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Show game over modal
        const stats = document.getElementById('final-stats');
        
        stats.innerHTML = `
            <h3>🌌 Cosmic Collector - Mission Complete</h3>
            <p><strong>Final Score:</strong> ${this.score}</p>
            <p><strong>Level Reached:</strong> ${this.level}</p>
            <p><strong>Lives Remaining:</strong> ${this.lives}</p>
        `;
        
        // Use centralized modal system
        if (window.cosmicApp) {
            window.cosmicApp.showModal();
        }
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
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update bullets
        this.updateBullets(deltaTime);
        
        // Update enemies
        this.updateEnemies(deltaTime);
        
        // Update power-ups
        this.updatePowerUps(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Spawn enemies
        this.spawnEnemies(deltaTime);
        
        // Spawn power-ups
        this.spawnPowerUps(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
        
        // Check game over
        if (this.health <= 0) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.health = 100;
            }
        }
    }
    
    updatePlayer(deltaTime) {
        // Handle input (keyboard + mobile)
        const speed = this.player.speed * deltaTime;
        
        // Get mobile controls input
        const mobileInput = this.getMobileInput();
        
        // Movement - combine keyboard and mobile input
        const moveLeft = (this.keys['a'] || this.keys['arrowleft']) || mobileInput.left;
        const moveRight = (this.keys['d'] || this.keys['arrowright']) || mobileInput.right;
        const moveUp = (this.keys['w'] || this.keys['arrowup']) || mobileInput.up;
        const moveDown = (this.keys['s'] || this.keys['arrowdown']) || mobileInput.down;
        
        if (moveLeft && this.player.x > 0) {
            this.player.x -= speed;
        }
        if (moveRight && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += speed;
        }
        if (moveUp && this.player.y > 0) {
            this.player.y -= speed;
        }
        if (moveDown && this.player.y < this.canvas.height - this.player.height) {
            this.player.y += speed;
        }
        
        // Handle shooting - combine keyboard and mobile input
        if (this.player.shootCooldown > 0) {
            this.player.shootCooldown -= deltaTime;
        }
        
        const shouldShoot = (this.keys[' '] || mobileInput.fire) && this.player.shootCooldown <= 0;
        if (shouldShoot) {
            this.shootBullet();
            this.player.shootCooldown = 0.2; // 200ms cooldown
        }
    }
    
    getMobileInput() {
        // Get input from mobile controls if available
        if (window.mobileControls && window.mobileControls.isEnabled) {
            const joystick = window.mobileControls.getJoystickVector();
            const threshold = 0.3; // Minimum joystick movement to register
            
            return {
                left: joystick.x < -threshold,
                right: joystick.x > threshold,
                up: joystick.y < -threshold,
                down: joystick.y > threshold,
                fire: window.mobileControls.isPressed('fire'),
                special: window.mobileControls.isPressed('special')
            };
        }
        
        return {
            left: false,
            right: false,
            up: false,
            down: false,
            fire: false,
            special: false
        };
    }
    
    shootBullet() {
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 2,
            y: this.player.y,
            width: 4,
            height: 10,
            speed: 500,
            fromPlayer: true
        });
    }
    
    updateBullets(deltaTime) {
        this.bullets.forEach((bullet, index) => {
            if (bullet.fromPlayer) {
                bullet.y -= bullet.speed * deltaTime;
            } else {
                bullet.y += bullet.speed * deltaTime;
            }
            
            // Remove bullets that are off-screen
            if (bullet.y < -bullet.height || bullet.y > this.canvas.height) {
                this.bullets.splice(index, 1);
            }
        });
    }
    
    spawnEnemies(deltaTime) {
        this.enemySpawnTimer += deltaTime;
        const spawnRate = Math.max(0.5, 2 - this.level * 0.1);
        
        if (this.enemySpawnTimer >= spawnRate) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 30),
                y: -30,
                width: 30,
                height: 30,
                speed: 100 + this.level * 20,
                health: 1,
                type: 'basic'
            });
            this.enemySpawnTimer = 0;
        }
    }
    
    updateEnemies(deltaTime) {
        this.enemies.forEach((enemy, index) => {
            enemy.y += enemy.speed * deltaTime;
            
            // Remove enemies that are off-screen
            if (enemy.y > this.canvas.height) {
                this.enemies.splice(index, 1);
            }
        });
    }
    
    spawnPowerUps(deltaTime) {
        this.powerUpSpawnTimer += deltaTime;
        
        if (this.powerUpSpawnTimer >= 8) { // Every 8 seconds
            const types = ['health', 'weapon', 'score'];
            this.powerUps.push({
                x: Math.random() * (this.canvas.width - 20),
                y: -20,
                width: 20,
                height: 20,
                speed: 80,
                type: types[Math.floor(Math.random() * types.length)]
            });
            this.powerUpSpawnTimer = 0;
        }
    }
    
    updatePowerUps(deltaTime) {
        this.powerUps.forEach((powerUp, index) => {
            powerUp.y += powerUp.speed * deltaTime;
            
            // Remove power-ups that are off-screen
            if (powerUp.y > this.canvas.height) {
                this.powerUps.splice(index, 1);
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
        // Bullet-Enemy collisions
        this.bullets.forEach((bullet, bulletIndex) => {
            if (!bullet.fromPlayer) return;
            
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    // Create explosion particles
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    // Remove bullet and enemy
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    
                    // Increase score
                    this.score += 100;
                    
                    // Level up
                    if (this.score > this.level * 1000) {
                        this.level++;
                    }
                }
            });
        });
        
        // Player-Enemy collisions
        this.enemies.forEach((enemy, index) => {
            if (this.isColliding(this.player, enemy)) {
                this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                this.enemies.splice(index, 1);
                this.health -= 20;
            }
        });
        
        // Player-PowerUp collisions
        this.powerUps.forEach((powerUp, index) => {
            if (this.isColliding(this.player, powerUp)) {
                this.applyPowerUp(powerUp.type);
                this.powerUps.splice(index, 1);
            }
        });
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    applyPowerUp(type) {
        switch (type) {
            case 'health':
                this.health = Math.min(100, this.health + 30);
                break;
            case 'weapon':
                // For now, just increase score
                this.score += 50;
                break;
            case 'score':
                this.score += 200;
                break;
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
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
        this.clearCanvas();
        this.drawStars();
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawPowerUps();
        this.drawParticles();
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 123) % this.canvas.width;
            const y = (i * 456 + performance.now() * 0.01) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    drawPlayer() {
        if (!this.player) return;
        
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw engine glow
        this.ctx.fillStyle = '#ff6600';
        this.ctx.fillRect(this.player.x + this.player.width / 2 - 3, this.player.y + this.player.height, 6, 10);
    }
    
    drawBullets() {
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }
    
    drawEnemies() {
        this.ctx.fillStyle = '#ff6b6b';
        this.enemies.forEach(enemy => {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
    }
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            let color = '#ffffff';
            switch (powerUp.type) {
                case 'health': color = '#ff4444'; break;
                case 'weapon': color = '#44ff44'; break;
                case 'score': color = '#ffff44'; break;
            }
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
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
    
    drawWelcomeScreen() {
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '24px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🌌 Cosmic Collector', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '16px Orbitron';
        this.ctx.fillText('Click "Start Game" to begin!', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '14px Orbitron';
        this.ctx.fillText('Controls: WASD/Arrow Keys to move, Space to shoot', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
    
    updateUI() {
        document.getElementById('cosmic-score').textContent = this.score;
        document.getElementById('cosmic-level').textContent = this.level;
        document.getElementById('cosmic-lives').textContent = this.lives;
        
        const healthBar = document.getElementById('cosmic-health');
        healthBar.style.width = `${Math.max(0, this.health)}%`;
    }
    
    stop() {
        this.gameState = 'stopped';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Game will be initialized by navigation system
});
