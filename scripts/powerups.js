// Power-ups and collectibles
class PowerUp {
    constructor(x, y, type) {
        this.position = new Vector2D(x, y);
        this.type = type; // 'health', 'weapon', 'shield', 'gem'
        this.radius = 8;
        this.collected = false;
        this.pulseTimer = 0;
    }
    
    update(deltaTime) {
        this.pulseTimer += deltaTime * 3;
        // Gentle floating animation
        this.position.y += Math.sin(this.pulseTimer) * 0.5;
    }
    
    render(ctx) {
        if (this.collected) return;
        
        const pulse = 1 + Math.sin(this.pulseTimer) * 0.2;
        const colors = {
            'health': '#ff4444',
            'weapon': '#44ff44',
            'shield': '#4444ff',
            'gem': '#ffff44'
        };
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(pulse, pulse);
        
        ctx.fillStyle = colors[this.type] || '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = colors[this.type];
        ctx.fill();
        
        ctx.restore();
    }
    
    collect() {
        this.collected = true;
        return this.type;
    }
}

class PowerUpManager {
    constructor() {
        this.powerUps = [];
        this.spawnTimer = 0;
        this.spawnRate = 3.0; // seconds
    }
    
    update(deltaTime, canvasWidth, canvasHeight) {
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnPowerUp(canvasWidth, canvasHeight);
            this.spawnTimer = 0;
        }
        
        this.powerUps.forEach(powerUp => powerUp.update(deltaTime));
        
        // Remove off-screen power-ups
        this.powerUps = this.powerUps.filter(powerUp => 
            !powerUp.collected && 
            powerUp.position.y < canvasHeight + 50
        );
    }
    
    spawnPowerUp(canvasWidth, canvasHeight) {
        const types = ['health', 'weapon', 'shield', 'gem', 'gem', 'gem']; // More gems
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * canvasWidth;
        const y = -20;
        
        this.powerUps.push(new PowerUp(x, y, type));
    }
    
    render(ctx) {
        this.powerUps.forEach(powerUp => powerUp.render(ctx));
    }
    
    checkCollisions(player) {
        const collected = [];
        
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                const dx = player.position.x - powerUp.position.x;
                const dy = player.position.y - powerUp.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < player.radius + powerUp.radius) {
                    collected.push(powerUp.collect());
                }
            }
        });
        
        return collected;
    }
}

window.PowerUp = PowerUp;
window.PowerUpManager = PowerUpManager;