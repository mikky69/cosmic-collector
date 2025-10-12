// Core game logic
class GameEngine {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.entities = [];
        this.lastTime = 0;
        this.running = false;
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameSpeed = 1.0;
        
        // Input handling
        this.keys = {};
        this.setupInput();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stop() {
        this.running = false;
    }
    
    gameLoop(currentTime = performance.now()) {
        if (!this.running) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update all entities
        this.entities.forEach(entity => {
            if (entity.active) {
                entity.update(deltaTime);
            }
        });
        
        // Remove inactive entities
        this.entities = this.entities.filter(entity => entity.active);
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render background
        this.renderBackground();
        
        // Render all entities
        this.entities.forEach(entity => {
            if (entity.active) {
                entity.render(this.ctx);
            }
        });
    }
    
    renderBackground() {
        // Simple starfield
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 1234) % this.canvas.width;
            const y = (i * 5678 + performance.now() * 0.01) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }
}

window.GameEngine = GameEngine;