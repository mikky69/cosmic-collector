// Asteroid Miner Game - Mine asteroids for crypto rewards
class AsteroidMinerGame {
    constructor() {
        this.canvas = document.getElementById('minerCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'stopped';
        
        // Game stats
        this.credits = 0;
        this.fuel = 100;
        this.cargoCapacity = 100;
        this.cargoUsed = 0;
        
        // Game objects
        this.ship = null;
        this.asteroids = [];
        this.ores = [];
        this.particles = [];
        
        // Mining
        this.miningTarget = null;
        this.miningProgress = 0;
        
        // Timers
        this.asteroidSpawnTimer = 0;
        this.fuelConsumptionTimer = 0;
        this.lastTime = 0;
        
        // Input
        this.keys = {};
        
        this.setupCanvas();
        this.setupControls();
        this.setupInput();
    }
    
    setupCanvas() {
        const container = document.getElementById('miner-game-area');
        const maxWidth = Math.min(container.clientWidth - 40, 800);
        const maxHeight = Math.min(window.innerHeight - 300, 600);
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
    }
    
    setupControls() {
        document.getElementById('miner-start').addEventListener('click', () => {
            if (this.gameState === 'stopped' || this.gameState === 'gameOver') {
                this.startGame();
            }
        });
        
        document.getElementById('miner-pause').addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        });
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.credits = 0;
        this.fuel = 100;
        this.cargoUsed = 0;
        
        // Initialize ship
        this.ship = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            angle: 0,
            thrust: 0,
            vx: 0,
            vy: 0,
            size: 15,
            miningRange: 40
        };
        
        // Clear arrays
        this.asteroids = [];
        this.ores = [];
        this.particles = [];
        
        // Spawn initial asteroids
        this.spawnInitialAsteroids();
        
        this.asteroidSpawnTimer = 0;
        this.fuelConsumptionTimer = 0;
        this.lastTime = performance.now();
        
        this.updateUI();
        this.gameLoop();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('miner-pause').textContent = '▶️ Resume';
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('miner-pause').textContent = '⏸️ Pause';
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    spawnInitialAsteroids() {
        for (let i = 0; i < 15; i++) {
            this.spawnAsteroid();
        }
    }
    
    spawnAsteroid() {
        // Don't spawn too close to ship
        let x, y;
        do {
            x = Math.random() * this.canvas.width;
            y = Math.random() * this.canvas.height;
        } while (this.ship && this.distance(x, y, this.ship.x, this.ship.y) < 100);
        
        const oreTypes = [
            { name: 'Iron', color: '#8B4513', value: 10, rarity: 0.4 },
            { name: 'Gold', color: '#FFD700', value: 50, rarity: 0.2 },
            { name: 'Platinum', color: '#E5E4E2', value: 100, rarity: 0.1 },
            { name: 'Lithium', color: '#CC99FF', value: 200, rarity: 0.05 }
        ];
        
        const rand = Math.random();
        let selectedOre = oreTypes[0]; // Default to Iron
        
        for (const ore of oreTypes) {
            if (rand < ore.rarity) {
                selectedOre = ore;
                break;
            }
        }
        
        this.asteroids.push({
            x: x,
            y: y,
            size: 20 + Math.random() * 30,
            ore: selectedOre,
            health: 100,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 2
        });
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
        // Update ship
        this.updateShip(deltaTime);
        
        // Update asteroids
        this.updateAsteroids(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Handle mining
        this.updateMining(deltaTime);
        
        // Consume fuel
        this.updateFuel(deltaTime);
        
        // Spawn new asteroids
        this.spawnNewAsteroids(deltaTime);
        
        // Update UI
        this.updateUI();
        
        // Check game over
        if (this.fuel <= 0) {
            this.gameOver();
        }
    }
    
    updateShip(deltaTime) {
        // Get mobile input
        const mobileInput = this.getMobileInput();
        
        // Handle rotation - combine keyboard and mobile input
        const rotateLeft = (this.keys['a'] || this.keys['arrowleft']) || mobileInput.left;
        const rotateRight = (this.keys['d'] || this.keys['arrowright']) || mobileInput.right;
        
        if (rotateLeft) {
            this.ship.angle -= 3 * deltaTime;
        }
        if (rotateRight) {
            this.ship.angle += 3 * deltaTime;
        }
        
        // Handle thrust - combine keyboard and mobile input
        const thrust = (this.keys['w'] || this.keys['arrowup']) || mobileInput.up;
        
        if (thrust) {
            this.ship.thrust = 200;
            this.createThrustParticles();
        } else {
            this.ship.thrust = 0;
        }
        
        // Apply thrust
        const thrustX = Math.cos(this.ship.angle) * this.ship.thrust * deltaTime;
        const thrustY = Math.sin(this.ship.angle) * this.ship.thrust * deltaTime;
        
        this.ship.vx += thrustX;
        this.ship.vy += thrustY;
        
        // Apply drag
        this.ship.vx *= 0.98;
        this.ship.vy *= 0.98;
        
        // Update position
        this.ship.x += this.ship.vx * deltaTime;
        this.ship.y += this.ship.vy * deltaTime;
        
        // Wrap around screen
        if (this.ship.x < 0) this.ship.x = this.canvas.width;
        if (this.ship.x > this.canvas.width) this.ship.x = 0;
        if (this.ship.y < 0) this.ship.y = this.canvas.height;
        if (this.ship.y > this.canvas.height) this.ship.y = 0;
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
    
    updateAsteroids(deltaTime) {
        this.asteroids.forEach(asteroid => {
            asteroid.rotation += asteroid.rotationSpeed * deltaTime;
        });
    }
    
    updateMining(deltaTime) {
        // Get mobile input
        const mobileInput = this.getMobileInput();
        
        // Check for mining target - combine keyboard and mobile input
        const shouldMine = this.keys[' '] || mobileInput.fire;
        
        if (shouldMine) {
            const nearbyAsteroid = this.findNearbyAsteroid();
            
            if (nearbyAsteroid && this.cargoUsed < this.cargoCapacity) {
                this.miningTarget = nearbyAsteroid;
                this.miningProgress += deltaTime * 2; // 2 seconds to mine
                
                if (this.miningProgress >= 1) {
                    this.completeMinimng();
                }
            } else {
                this.miningTarget = null;
                this.miningProgress = 0;
            }
        } else {
            this.miningTarget = null;
            this.miningProgress = 0;
        }
    }
    
    findNearbyAsteroid() {
        for (const asteroid of this.asteroids) {
            const dist = this.distance(this.ship.x, this.ship.y, asteroid.x, asteroid.y);
            if (dist < this.ship.miningRange) {
                return asteroid;
            }
        }
        return null;
    }
    
    completeMinimng() {
        if (this.miningTarget) {
            // Add ore to cargo
            this.cargoUsed += 10;
            this.credits += this.miningTarget.ore.value;
            
            // Create mining particles
            this.createMiningParticles(this.miningTarget);
            
            // Damage asteroid
            this.miningTarget.health -= 50;
            
            if (this.miningTarget.health <= 0) {
                // Remove depleted asteroid
                const index = this.asteroids.indexOf(this.miningTarget);
                if (index > -1) {
                    this.asteroids.splice(index, 1);
                }
            }
            
            this.miningTarget = null;
            this.miningProgress = 0;
        }
    }
    
    updateFuel(deltaTime) {
        this.fuelConsumptionTimer += deltaTime;
        
        if (this.fuelConsumptionTimer >= 1) { // Every second
            this.fuel -= 1;
            
            // Extra fuel consumption when thrusting
            if (this.ship.thrust > 0) {
                this.fuel -= 0.5;
            }
            
            this.fuelConsumptionTimer = 0;
        }
    }
    
    spawnNewAsteroids(deltaTime) {
        this.asteroidSpawnTimer += deltaTime;
        
        if (this.asteroidSpawnTimer >= 10 && this.asteroids.length < 10) {
            this.spawnAsteroid();
            this.asteroidSpawnTimer = 0;
        }
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
    
    createThrustParticles() {
        if (Math.random() < 0.7) {
            const angle = this.ship.angle + Math.PI;
            const speed = 100 + Math.random() * 50;
            
            this.particles.push({
                x: this.ship.x - Math.cos(this.ship.angle) * 20,
                y: this.ship.y - Math.sin(this.ship.angle) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3,
                color: '#ff6600'
            });
        }
    }
    
    createMiningParticles(asteroid) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: asteroid.x,
                y: asteroid.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.8,
                color: asteroid.ore.color
            });
        }
    }
    
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.drawStars();
        
        // Draw asteroids
        this.drawAsteroids();
        
        // Draw ship
        this.drawShip();
        
        // Draw particles
        this.drawParticles();
        
        // Draw mining beam
        this.drawMiningBeam();
        
        // Draw UI elements
        this.drawGameUI();
    }
    
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 150; i++) {
            const x = (i * 123) % this.canvas.width;
            const y = (i * 456) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillRect(x, y, size, size);
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawAsteroids() {
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            
            // Draw asteroid
            this.ctx.fillStyle = asteroid.ore.color;
            this.ctx.beginPath();
            
            const sides = 8;
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2;
                const radius = asteroid.size * (0.8 + Math.sin(i * 3) * 0.2);
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
            
            // Draw ore name
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(asteroid.ore.name, 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawShip() {
        this.ctx.save();
        this.ctx.translate(this.ship.x, this.ship.y);
        this.ctx.rotate(this.ship.angle);
        
        // Draw ship body
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(-10, -8);
        this.ctx.lineTo(-5, 0);
        this.ctx.lineTo(-10, 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw mining laser mount
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillRect(10, -2, 8, 4);
        
        this.ctx.restore();
        
        // Draw mining range indicator when near asteroid
        if (this.findNearbyAsteroid()) {
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.ship.x, this.ship.y, this.ship.miningRange, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawMiningBeam() {
        if (this.miningTarget) {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(this.ship.x, this.ship.y);
            this.ctx.lineTo(this.miningTarget.x, this.miningTarget.y);
            this.ctx.stroke();
            
            // Draw mining progress
            const progressX = this.ship.x + (this.miningTarget.x - this.ship.x) * 0.7;
            const progressY = this.ship.y + (this.miningTarget.y - this.ship.y) * 0.7;
            
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillRect(progressX - 20, progressY - 5, 40 * this.miningProgress, 10);
            
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(progressX - 20, progressY - 5, 40, 10);
        }
    }
    
    drawGameUI() {
        // Draw controls hint
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Orbitron';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Controls: WASD/Arrow Keys to move, SPACE to mine', 10, 20);
        
        if (this.cargoUsed >= this.cargoCapacity) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '16px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CARGO FULL! Return to base!', this.canvas.width / 2, 50);
        }
    }
    
    updateUI() {
        document.getElementById('miner-credits').textContent = this.credits;
        document.getElementById('miner-cargo').textContent = `${this.cargoUsed}/${this.cargoCapacity}`;
        
        const fuelBar = document.getElementById('miner-fuel');
        fuelBar.style.width = `${Math.max(0, this.fuel)}%`;
        
        if (this.fuel <= 20) {
            fuelBar.style.background = '#ff0000';
        } else if (this.fuel <= 50) {
            fuelBar.style.background = '#ffff00';
        } else {
            fuelBar.style.background = 'linear-gradient(90deg, #ff0000, #ffff00, #00ff00)';
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        const stats = document.getElementById('final-stats');
        
        stats.innerHTML = `
            <h3>⛏️ Mining Operation Complete</h3>
            <p><strong>Credits Earned:</strong> ${this.credits}</p>
            <p><strong>Cargo Collected:</strong> ${this.cargoUsed} units</p>
            <p><strong>Efficiency:</strong> ${Math.round(this.credits / Math.max(1, 100 - this.fuel))} credits per fuel</p>
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
