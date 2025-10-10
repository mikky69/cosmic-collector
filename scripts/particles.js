// Particle system for visual effects
class Particle {
    constructor(x, y, velocity, color, life) {
        this.position = new Vector2D(x, y);
        this.velocity = velocity;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 3 + 1;
    }
    
    update(deltaTime) {
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        this.life -= deltaTime;
        
        // Fade out
        const alpha = this.life / this.maxLife;
        this.alpha = Math.max(0, alpha);
    }
    
    render(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    createExplosion(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 200 + 50;
            const velocity = new Vector2D(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            
            const colors = ['#ff6b6b', '#ffa500', '#ffff00', '#ffffff'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push(new Particle(x, y, velocity, color, 1.0));
        }
    }
    
    update(deltaTime) {
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => !particle.isDead());
    }
    
    render(ctx) {
        this.particles.forEach(particle => particle.render(ctx));
    }
}

window.Particle = Particle;
window.ParticleSystem = ParticleSystem;