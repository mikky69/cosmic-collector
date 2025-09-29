// Main Game Logic for Cosmic Collector
// Mikky Studio - 2025

class CosmicCollectorGame {
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
        this.gems = 0;
        this.gameTime = 0;
        
        // Physics world
        this.physics = new PhysicsEngine.PhysicsWorld();
        this.physics.setBounds(0, 0, canvas.width, canvas.height);
        
        // Game entities
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.pickups = [];
        this.stars = [];
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Game settings
        this.playerSpeed = 300;
        this.bulletSpeed = 500;
        this.enemySpawnRate = 2.0; // enemies per second
        this.pickupSpawnRate = 1.0;
        this.difficultyMultiplier = 1.0;
        
        // Timers
        this.lastEnemySpawn = 0;
        this.lastPickupSpawn = 0;
        this.lastShot = 0;
        this.shotCooldown = 0.2; // seconds between shots
        
        // Visual effects
        this.screenShake = 0;
        this.flashEffect = 0;
        
        this.initializeGame();
    }

    initializeGame() {
        // Create starfield background
        this.createStarfield();
        
        // Create player
        this.createPlayer();
        
        // Initialize UI
        this.updateUI();
        
        console.log('Cosmic Collector initialized');
    }

    createStarfield() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 50 + 25,
                brightness: Math.random() * 0.8 + 0.2
            });
        }
    }

    createPlayer() {
        const playerBody = new PhysicsEngine.PhysicsBody(
            this.canvas.width / 2,
            this.canvas.height - 50,
            1
        );
        playerBody.radius = 15;
        playerBody.friction = 0.95;
        
        this.player = {
            body: playerBody,
            health: 100,
            maxHealth: 100,
            shipType: 'classic',
            invulnerable: 0,
            shield: false,
            weaponLevel: 1
        };
        
        this.physics.addBody(playerBody);
    }

    setupInput() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
            
            // Handle special keys
            if (e.code === 'Escape') {
                this.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.lastTime = performance.now();
            this.gameLoop();
            console.log('Game started');
        }
    }

    stop() {
        this.isRunning = false;
        console.log('Game stopped');
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? 'Game paused' : 'Game resumed');
    }

    restart() {
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gems = 0;
        this.gameTime = 0;
        this.difficultyMultiplier = 1.0;
        
        // Clear entities
        this.enemies = [];
        this.bullets = [];
        this.pickups = [];
        this.physics.clear();
        
        // Reset effects
        this.screenShake = 0;
        this.flashEffect = 0;
        
        // Recreate player and stars
        this.createStarfield();
        this.createPlayer();
        
        this.updateUI();
        this.start();
        
        console.log('Game restarted');
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
        
        // Update difficulty
        this.difficultyMultiplier = 1 + (this.level - 1) * 0.2;
        
        // Handle input
        this.handleInput(deltaTime);
        
        // Update physics
        this.physics.update(deltaTime);
        
        // Update entities
        this.updatePlayer(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateBullets(deltaTime);
        this.updatePickups(deltaTime);
        this.updateStars(deltaTime);
        
        // Spawn entities
        this.spawnEnemies(deltaTime);
        this.spawnPickups(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update effects
        this.updateEffects(deltaTime);
        
        // Check level progression
        this.checkLevelUp();
        
        // Check game over
        this.checkGameOver();
        
        // Update UI
        this.updateUI();
    }

    handleInput(deltaTime) {
        if (!this.player || this.player.invulnerable > 0) return;
        
        const playerBody = this.player.body;
        const force = new PhysicsEngine.Vector2D(0, 0);
        
        // Movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            force.x -= this.playerSpeed;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            force.x += this.playerSpeed;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            force.y -= this.playerSpeed;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            force.y += this.playerSpeed;
        }
        
        // Apply movement force
        if (force.magnitude() > 0) {
            playerBody.applyForce(force.normalize().multiply(this.playerSpeed * playerBody.mass));
            
            // Create engine trail
            this.physics.particleSystem.createTrail(
                playerBody.position.x,
                playerBody.position.y + 10,
                -playerBody.velocity.x * 0.1,
                -playerBody.velocity.y * 0.1
            );
        }
        
        // Shooting
        if (this.keys['Space'] && this.gameTime - this.lastShot > this.shotCooldown) {
            this.shoot();
            this.lastShot = this.gameTime;
        }
    }

    shoot() {
        if (!this.player) return;
        
        const playerPos = this.player.body.position;
        
        // Create bullet
        const bulletBody = new PhysicsEngine.PhysicsBody(
            playerPos.x,
            playerPos.y - 20,
            0.1
        );
        bulletBody.radius = 3;
        bulletBody.velocity = new PhysicsEngine.Vector2D(0, -this.bulletSpeed);
        
        const bullet = {
            body: bulletBody,
            type: 'player',
            damage: 25 * this.player.weaponLevel,
            life: 2.0 // seconds
        };
        
        this.bullets.push(bullet);
        this.physics.addBody(bulletBody);
        
        // Sound effect (would be actual audio in full implementation)
        console.log('Pew!');
    }

    spawnEnemies(deltaTime) {
        if (this.gameTime - this.lastEnemySpawn > 1 / (this.enemySpawnRate * this.difficultyMultiplier)) {
            this.createEnemy();
            this.lastEnemySpawn = this.gameTime;
        }
    }

    createEnemy() {
        const types = ['basic', 'fast', 'heavy'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let x = Math.random() * this.canvas.width;
        let y = -20;
        let health, speed, size, score;
        
        switch (type) {
            case 'basic':
                health = 50;
                speed = 100;
                size = 12;
                score = 100;
                break;
            case 'fast':
                health = 25;
                speed = 200;
                size = 8;
                score = 150;
                break;
            case 'heavy':
                health = 100;
                speed = 50;
                size = 18;
                score = 200;
                break;
        }
        
        const enemyBody = new PhysicsEngine.PhysicsBody(x, y, 1);
        enemyBody.radius = size;
        enemyBody.velocity = new PhysicsEngine.Vector2D(0, speed * this.difficultyMultiplier);
        
        const enemy = {
            body: enemyBody,
            type: type,
            health: health,
            maxHealth: health,
            scoreValue: score,
            lastShot: 0,
            shootCooldown: 1.0 + Math.random() * 2.0
        };
        
        this.enemies.push(enemy);
        this.physics.addBody(enemyBody);
    }

    spawnPickups(deltaTime) {
        if (this.gameTime - this.lastPickupSpawn > 1 / this.pickupSpawnRate) {
            this.createPickup();
            this.lastPickupSpawn = this.gameTime;
        }
    }

    createPickup() {
        const types = ['gem', 'health', 'weapon', 'shield'];
        const weights = [0.5, 0.2, 0.2, 0.1]; // Probability weights
        
        let random = Math.random();
        let type = 'gem';
        let cumulative = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                type = types[i];
                break;
            }
        }
        
        const x = Math.random() * (this.canvas.width - 40) + 20;
        const y = -20;
        
        const pickupBody = new PhysicsEngine.PhysicsBody(x, y, 0.5);
        pickupBody.radius = 10;
        pickupBody.velocity = new PhysicsEngine.Vector2D(0, 80);
        
        const pickup = {
            body: pickupBody,
            type: type,
            value: this.getPickupValue(type),
            life: 10.0 // seconds before disappearing
        };
        
        this.pickups.push(pickup);
        this.physics.addBody(pickupBody);
    }

    getPickupValue(type) {
        switch (type) {
            case 'gem': return 50;
            case 'health': return 25;
            case 'weapon': return 1;
            case 'shield': return 5.0; // seconds of shield
            default: return 10;
        }
    }

    updatePlayer(deltaTime) {
        if (!this.player) return;
        
        // Update invulnerability
        if (this.player.invulnerable > 0) {
            this.player.invulnerable -= deltaTime;
        }
        
        // Keep player in bounds
        const pos = this.player.body.position;
        const radius = this.player.body.radius;
        
        if (pos.x < radius) {
            this.player.body.position.x = radius;
            this.player.body.velocity.x = 0;
        }
        if (pos.x > this.canvas.width - radius) {
            this.player.body.position.x = this.canvas.width - radius;
            this.player.body.velocity.x = 0;
        }
        if (pos.y < radius) {
            this.player.body.position.y = radius;
            this.player.body.velocity.y = 0;
        }
        if (pos.y > this.canvas.height - radius) {
            this.player.body.position.y = this.canvas.height - radius;
            this.player.body.velocity.y = 0;
        }
    }

    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Remove enemies that are off screen
            if (enemy.body.position.y > this.canvas.height + 50) {
                this.physics.removeBody(enemy.body);
                this.enemies.splice(i, 1);
                continue;
            }
            
            // Enemy AI - basic shooting
            if (this.player && this.gameTime - enemy.lastShot > enemy.shootCooldown) {
                this.enemyShoot(enemy);
                enemy.lastShot = this.gameTime;
            }
        }
    }

    enemyShoot(enemy) {
        if (!this.player) return;
        
        const enemyPos = enemy.body.position;
        const playerPos = this.player.body.position;
        
        // Calculate direction to player
        const direction = playerPos.subtract(enemyPos).normalize();
        
        const bulletBody = new PhysicsEngine.PhysicsBody(
            enemyPos.x,
            enemyPos.y + 10,
            0.1
        );
        bulletBody.radius = 2;
        bulletBody.velocity = direction.multiply(300);
        
        const bullet = {
            body: bulletBody,
            type: 'enemy',
            damage: 20,
            life: 3.0
        };
        
        this.bullets.push(bullet);
        this.physics.addBody(bulletBody);
    }

    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.life -= deltaTime;
            
            // Remove expired or off-screen bullets
            if (bullet.life <= 0 || 
                bullet.body.position.y < -20 || 
                bullet.body.position.y > this.canvas.height + 20) {
                this.physics.removeBody(bullet.body);
                this.bullets.splice(i, 1);
            }
        }
    }

    updatePickups(deltaTime) {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            pickup.life -= deltaTime;
            
            // Remove expired or off-screen pickups
            if (pickup.life <= 0 || pickup.body.position.y > this.canvas.height + 50) {
                this.physics.removeBody(pickup.body);
                this.pickups.splice(i, 1);
            }
        }
    }

    updateStars(deltaTime) {
        this.stars.forEach(star => {
            star.y += star.speed * deltaTime;
            
            if (star.y > this.canvas.height) {
                star.y = -5;
                star.x = Math.random() * this.canvas.width;
            }
        });
    }

    checkCollisions() {
        if (!this.player) return;
        
        // Player vs Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.player.invulnerable <= 0 && 
                PhysicsEngine.CollisionDetector.circleToCircle(this.player.body, enemy.body)) {
                
                this.damagePlayer(30);
                this.destroyEnemy(enemy, i);
                this.addScreenShake(0.3);
                break;
            }
        }
        
        // Player vs Pickups
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            if (PhysicsEngine.CollisionDetector.circleToCircle(this.player.body, pickup.body)) {
                this.collectPickup(pickup);
                this.physics.removeBody(pickup.body);
                this.pickups.splice(i, 1);
            }
        }
        
        // Bullets vs Enemies/Player
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            if (bullet.type === 'player') {
                // Player bullets vs enemies
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (PhysicsEngine.CollisionDetector.circleToCircle(bullet.body, enemy.body)) {
                        this.damageEnemy(enemy, bullet.damage);
                        this.physics.removeBody(bullet.body);
                        this.bullets.splice(i, 1);
                        
                        if (enemy.health <= 0) {
                            this.score += enemy.scoreValue;
                            this.destroyEnemy(enemy, j);
                        }
                        break;
                    }
                }
            } else if (bullet.type === 'enemy') {
                // Enemy bullets vs player
                if (this.player.invulnerable <= 0 && 
                    PhysicsEngine.CollisionDetector.circleToCircle(bullet.body, this.player.body)) {
                    
                    this.damagePlayer(bullet.damage);
                    this.physics.removeBody(bullet.body);
                    this.bullets.splice(i, 1);
                }
            }
        }
    }

    damagePlayer(damage) {
        if (this.player.invulnerable > 0) return;
        
        this.player.health -= damage;
        this.player.invulnerable = 1.0; // 1 second of invulnerability
        
        this.physics.particleSystem.createExplosion(
            this.player.body.position.x,
            this.player.body.position.y,
            0.5
        );
        
        this.addScreenShake(0.2);
        this.addFlashEffect(0.3);
        
        if (this.player.health <= 0) {
            this.lives--;
            if (this.lives > 0) {
                this.player.health = this.player.maxHealth;
                this.player.invulnerable = 2.0;
            }
        }
    }

    damageEnemy(enemy, damage) {
        enemy.health -= damage;
        
        // Create hit effect
        this.physics.particleSystem.createPickupEffect(
            enemy.body.position.x,
            enemy.body.position.y,
            'blue'
        );
    }

    destroyEnemy(enemy, index) {
        this.physics.particleSystem.createExplosion(
            enemy.body.position.x,
            enemy.body.position.y,
            1.0
        );
        
        this.physics.removeBody(enemy.body);
        this.enemies.splice(index, 1);
    }

    collectPickup(pickup) {
        const playerPos = this.player.body.position;
        
        this.physics.particleSystem.createPickupEffect(
            playerPos.x,
            playerPos.y,
            'green'
        );
        
        switch (pickup.type) {
            case 'gem':
                this.gems += pickup.value;
                this.score += pickup.value * 2;
                break;
            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + pickup.value);
                break;
            case 'weapon':
                this.player.weaponLevel = Math.min(5, this.player.weaponLevel + pickup.value);
                this.shotCooldown = Math.max(0.1, this.shotCooldown - 0.02);
                break;
            case 'shield':
                this.player.invulnerable = Math.max(this.player.invulnerable, pickup.value);
                break;
        }
    }

    addScreenShake(intensity) {
        this.screenShake = Math.max(this.screenShake, intensity);
    }

    addFlashEffect(intensity) {
        this.flashEffect = Math.max(this.flashEffect, intensity);
    }

    updateEffects(deltaTime) {
        if (this.screenShake > 0) {
            this.screenShake -= deltaTime * 2;
            if (this.screenShake < 0) this.screenShake = 0;
        }
        
        if (this.flashEffect > 0) {
            this.flashEffect -= deltaTime * 3;
            if (this.flashEffect < 0) this.flashEffect = 0;
        }
    }

    checkLevelUp() {
        const newLevel = Math.floor(this.score / 5000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            console.log(`Level up! Now level ${this.level}`);
            
            // Level up effects
            this.addFlashEffect(0.5);
            if (this.player) {
                this.physics.particleSystem.createPickupEffect(
                    this.player.body.position.x,
                    this.player.body.position.y,
                    'purple'
                );
            }
        }
    }

    checkGameOver() {
        if (this.lives <= 0 && this.player && this.player.health <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.stop();
        
        // Show game over screen
        const gameOverScreen = document.getElementById('gameOverScreen');
        const gameScreen = document.getElementById('gameScreen');
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalGems').textContent = this.gems;
        document.getElementById('finalLevel').textContent = this.level;
        
        gameScreen.classList.remove('active');
        gameOverScreen.classList.add('active');
        
        console.log(`Game Over! Final Score: ${this.score}`);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        document.getElementById('gems').textContent = this.gems;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake * 10;
            const shakeY = (Math.random() - 0.5) * this.screenShake * 10;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Render stars
        this.renderStars();
        
        // Render physics effects
        this.physics.render(this.ctx);
        
        // Render entities
        this.renderPlayer();
        this.renderEnemies();
        this.renderBullets();
        this.renderPickups();
        
        // Apply flash effect
        if (this.flashEffect > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashEffect * 0.3})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Reset transform
        if (this.screenShake > 0) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        
        // Render pause overlay
        if (this.isPaused) {
            this.renderPauseOverlay();
        }
    }

    renderStars() {
        this.ctx.fillStyle = 'white';
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.brightness;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    renderPlayer() {
        if (!this.player) return;
        
        const pos = this.player.body.position;
        
        // Render invulnerability effect
        if (this.player.invulnerable > 0) {
            this.ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.gameTime * 20);
        }
        
        // Render ship
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y - 15);
        this.ctx.lineTo(pos.x - 10, pos.y + 15);
        this.ctx.lineTo(pos.x, pos.y + 10);
        this.ctx.lineTo(pos.x + 10, pos.y + 15);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Render health bar
        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const healthPercent = this.player.health / this.player.maxHealth;
        
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(pos.x - healthBarWidth/2, pos.y - 25, healthBarWidth, healthBarHeight);
        
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(pos.x - healthBarWidth/2, pos.y - 25, healthBarWidth * healthPercent, healthBarHeight);
        
        this.ctx.globalAlpha = 1;
    }

    renderEnemies() {
        this.enemies.forEach(enemy => {
            const pos = enemy.body.position;
            
            // Choose color based on enemy type
            let color;
            switch (enemy.type) {
                case 'basic': color = '#ff6b6b'; break;
                case 'fast': color = '#feca57'; break;
                case 'heavy': color = '#ff9ff3'; break;
                default: color = '#ff6b6b';
            }
            
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            
            // Render enemy ship
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y + enemy.body.radius);
            this.ctx.lineTo(pos.x - enemy.body.radius, pos.y - enemy.body.radius);
            this.ctx.lineTo(pos.x, pos.y - enemy.body.radius * 0.5);
            this.ctx.lineTo(pos.x + enemy.body.radius, pos.y - enemy.body.radius);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            // Health bar for damaged enemies
            if (enemy.health < enemy.maxHealth) {
                const healthPercent = enemy.health / enemy.maxHealth;
                const barWidth = enemy.body.radius * 1.5;
                const barHeight = 2;
                
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(pos.x - barWidth/2, pos.y - enemy.body.radius - 8, barWidth, barHeight);
                
                this.ctx.fillStyle = 'green';
                this.ctx.fillRect(pos.x - barWidth/2, pos.y - enemy.body.radius - 8, barWidth * healthPercent, barHeight);
            }
        });
    }

    renderBullets() {
        this.bullets.forEach(bullet => {
            const pos = bullet.body.position;
            
            this.ctx.fillStyle = bullet.type === 'player' ? '#00ff88' : '#ff4444';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, bullet.body.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Bullet trail
            const trailLength = bullet.body.velocity.magnitude() * 0.1;
            const trailDirection = bullet.body.velocity.normalize().multiply(-trailLength);
            
            this.ctx.strokeStyle = bullet.type === 'player' ? '#00ff88' : '#ff4444';
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.ctx.lineTo(pos.x + trailDirection.x, pos.y + trailDirection.y);
            this.ctx.stroke();
            
            this.ctx.globalAlpha = 1;
        });
    }

    renderPickups() {
        this.pickups.forEach(pickup => {
            const pos = pickup.body.position;
            
            // Pulsing effect
            const pulse = 1 + 0.2 * Math.sin(this.gameTime * 5);
            const size = pickup.body.radius * pulse;
            
            // Color based on pickup type
            let color;
            switch (pickup.type) {
                case 'gem': color = '#00ff88'; break;
                case 'health': color = '#ff4444'; break;
                case 'weapon': color = '#ffaa00'; break;
                case 'shield': color = '#4488ff'; break;
                default: color = '#ffffff';
            }
            
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            
            // Render pickup
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Render symbol
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            let symbol;
            switch (pickup.type) {
                case 'gem': symbol = '💎'; break;
                case 'health': symbol = '❤️'; break;
                case 'weapon': symbol = '⚡'; break;
                case 'shield': symbol = '🛡️'; break;
                default: symbol = '?';
            }
            
            this.ctx.fillText(symbol, pos.x, pos.y);
        });
    }

    renderPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '48px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '16px Orbitron';
        this.ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
}

// Export game class
window.CosmicCollectorGame = CosmicCollectorGame;