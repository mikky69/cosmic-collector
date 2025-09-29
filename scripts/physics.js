// Physics Engine for Cosmic Collector
// Realistic movement, collision detection, and particle effects
// Mikky Studio - 2025

class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(vector) {
        return new Vector2D(this.x + vector.x, this.y + vector.y);
    }

    subtract(vector) {
        return new Vector2D(this.x - vector.x, this.y - vector.y);
    }

    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    divide(scalar) {
        return new Vector2D(this.x / scalar, this.y / scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2D(0, 0);
        return new Vector2D(this.x / mag, this.y / mag);
    }

    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    distance(vector) {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2D(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    limit(max) {
        if (this.magnitude() > max) {
            return this.normalize().multiply(max);
        }
        return new Vector2D(this.x, this.y);
    }

    clone() {
        return new Vector2D(this.x, this.y);
    }
}

class PhysicsBody {
    constructor(x, y, mass = 1) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.acceleration = new Vector2D(0, 0);
        this.mass = mass;
        this.radius = 10;
        this.restitution = 0.8; // Bounciness
        this.friction = 0.98; // Air resistance
        this.angularVelocity = 0;
        this.angle = 0;
        this.forces = [];
    }

    applyForce(force) {
        // F = ma, so a = F/m
        const acceleration = force.divide(this.mass);
        this.acceleration = this.acceleration.add(acceleration);
    }

    applyImpulse(impulse) {
        // Instant velocity change
        this.velocity = this.velocity.add(impulse.divide(this.mass));
    }

    update(deltaTime) {
        // Update velocity with acceleration
        this.velocity = this.velocity.add(this.acceleration.multiply(deltaTime));
        
        // Apply friction
        this.velocity = this.velocity.multiply(this.friction);
        
        // Update position with velocity
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        
        // Update rotation
        this.angle += this.angularVelocity * deltaTime;
        
        // Reset acceleration for next frame
        this.acceleration = new Vector2D(0, 0);
    }

    checkCollision(other) {
        const distance = this.position.distance(other.position);
        return distance < (this.radius + other.radius);
    }

    resolveCollision(other) {
        const distance = this.position.distance(other.position);
        const minDistance = this.radius + other.radius;
        
        if (distance >= minDistance) return;

        // Calculate collision normal
        const normal = other.position.subtract(this.position).normalize();
        
        // Separate objects
        const overlap = minDistance - distance;
        const separation = normal.multiply(overlap * 0.5);
        this.position = this.position.subtract(separation);
        other.position = other.position.add(separation);
        
        // Calculate relative velocity
        const relativeVelocity = this.velocity.subtract(other.velocity);
        const velocityAlongNormal = relativeVelocity.dot(normal);
        
        // Don't resolve if objects separating
        if (velocityAlongNormal > 0) return;
        
        // Calculate restitution
        const restitution = Math.min(this.restitution, other.restitution);
        
        // Calculate impulse scalar
        const impulseScalar = -(1 + restitution) * velocityAlongNormal / (1/this.mass + 1/other.mass);
        
        // Apply impulse
        const impulse = normal.multiply(impulseScalar);
        this.velocity = this.velocity.subtract(impulse.divide(this.mass));
        other.velocity = other.velocity.add(impulse.divide(other.mass));
    }
}

class Particle {
    constructor(x, y, vx = 0, vy = 0, life = 1.0) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(vx, vy);
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 3 + 1;
        this.color = {
            r: 255,
            g: 255,
            b: 255,
            a: 1
        };
        this.gravity = new Vector2D(0, 50);
    }

    update(deltaTime) {
        this.velocity = this.velocity.add(this.gravity.multiply(deltaTime));
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        this.life -= deltaTime;
        
        // Fade out over time
        this.color.a = this.life / this.maxLife;
    }

    isDead() {
        return this.life <= 0;
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.color.a;
        ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count = 10, config = {}) {
        const defaultConfig = {
            velocityRange: { min: -100, max: 100 },
            lifeRange: { min: 0.5, max: 2.0 },
            colorRange: {
                r: { min: 200, max: 255 },
                g: { min: 200, max: 255 },
                b: { min: 200, max: 255 }
            },
            gravity: new Vector2D(0, 50)
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        
        for (let i = 0; i < count; i++) {
            const vx = Math.random() * (finalConfig.velocityRange.max - finalConfig.velocityRange.min) + finalConfig.velocityRange.min;
            const vy = Math.random() * (finalConfig.velocityRange.max - finalConfig.velocityRange.min) + finalConfig.velocityRange.min;
            const life = Math.random() * (finalConfig.lifeRange.max - finalConfig.lifeRange.min) + finalConfig.lifeRange.min;
            
            const particle = new Particle(x, y, vx, vy, life);
            particle.color.r = Math.random() * (finalConfig.colorRange.r.max - finalConfig.colorRange.r.min) + finalConfig.colorRange.r.min;
            particle.color.g = Math.random() * (finalConfig.colorRange.g.max - finalConfig.colorRange.g.min) + finalConfig.colorRange.g.min;
            particle.color.b = Math.random() * (finalConfig.colorRange.b.max - finalConfig.colorRange.b.min) + finalConfig.colorRange.b.min;
            particle.gravity = finalConfig.gravity;
            
            this.particles.push(particle);
        }
    }

    createExplosion(x, y, intensity = 1) {
        this.emit(x, y, Math.floor(20 * intensity), {
            velocityRange: { min: -200 * intensity, max: 200 * intensity },
            lifeRange: { min: 0.5, max: 1.5 },
            colorRange: {
                r: { min: 255, max: 255 },
                g: { min: 100, max: 200 },
                b: { min: 0, max: 100 }
            },
            gravity: new Vector2D(0, 30)
        });
    }

    createPickupEffect(x, y, color = 'green') {
        const colorConfig = {
            green: { r: { min: 0, max: 100 }, g: { min: 200, max: 255 }, b: { min: 0, max: 100 } },
            blue: { r: { min: 0, max: 100 }, g: { min: 100, max: 200 }, b: { min: 200, max: 255 } },
            purple: { r: { min: 200, max: 255 }, g: { min: 0, max: 100 }, b: { min: 200, max: 255 } }
        };
        
        this.emit(x, y, 15, {
            velocityRange: { min: -150, max: 150 },
            lifeRange: { min: 0.8, max: 1.2 },
            colorRange: colorConfig[color] || colorConfig.green,
            gravity: new Vector2D(0, -20)
        });
    }

    createTrail(x, y, vx, vy) {
        this.emit(x, y, 3, {
            velocityRange: { min: -50, max: 50 },
            lifeRange: { min: 0.2, max: 0.5 },
            colorRange: {
                r: { min: 100, max: 200 },
                g: { min: 100, max: 200 },
                b: { min: 200, max: 255 }
            },
            gravity: new Vector2D(0, 0)
        });
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        this.particles.forEach(particle => {
            particle.render(ctx);
        });
    }

    clear() {
        this.particles = [];
    }
}

class CollisionDetector {
    static circleToCircle(a, b) {
        const distance = a.position.distance(b.position);
        return distance < (a.radius + b.radius);
    }

    static circleToRect(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.position.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.position.y, rect.y + rect.height));
        
        const distance = Math.sqrt(
            (circle.position.x - closestX) ** 2 + 
            (circle.position.y - closestY) ** 2
        );
        
        return distance < circle.radius;
    }

    static pointToRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width && 
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }

    static lineToCircle(lineStart, lineEnd, circle) {
        const d = lineEnd.subtract(lineStart);
        const f = lineStart.subtract(circle.position);
        
        const a = d.dot(d);
        const b = 2 * f.dot(d);
        const c = f.dot(f) - circle.radius * circle.radius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            return false;
        }
        
        const discriminantSqrt = Math.sqrt(discriminant);
        const t1 = (-b - discriminantSqrt) / (2 * a);
        const t2 = (-b + discriminantSqrt) / (2 * a);
        
        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }
}

class PhysicsWorld {
    constructor() {
        this.bodies = [];
        this.gravity = new Vector2D(0, 0); // No gravity by default for space game
        this.bounds = { x: 0, y: 0, width: 800, height: 600 };
        this.particleSystem = new ParticleSystem();
    }

    addBody(body) {
        this.bodies.push(body);
        return body;
    }

    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index > -1) {
            this.bodies.splice(index, 1);
        }
    }

    setBounds(x, y, width, height) {
        this.bounds = { x, y, width, height };
    }

    update(deltaTime) {
        // Update all bodies
        this.bodies.forEach(body => {
            // Apply global gravity
            if (this.gravity.magnitude() > 0) {
                body.applyForce(this.gravity.multiply(body.mass));
            }
            
            body.update(deltaTime);
            
            // Handle boundary collisions
            this.handleBoundaryCollision(body);
        });
        
        // Check collisions between bodies
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const bodyA = this.bodies[i];
                const bodyB = this.bodies[j];
                
                if (bodyA.checkCollision(bodyB)) {
                    bodyA.resolveCollision(bodyB);
                }
            }
        }
        
        // Update particle system
        this.particleSystem.update(deltaTime);
    }

    handleBoundaryCollision(body) {
        // Left boundary
        if (body.position.x - body.radius < this.bounds.x) {
            body.position.x = this.bounds.x + body.radius;
            body.velocity.x *= -body.restitution;
        }
        
        // Right boundary
        if (body.position.x + body.radius > this.bounds.x + this.bounds.width) {
            body.position.x = this.bounds.x + this.bounds.width - body.radius;
            body.velocity.x *= -body.restitution;
        }
        
        // Top boundary
        if (body.position.y - body.radius < this.bounds.y) {
            body.position.y = this.bounds.y + body.radius;
            body.velocity.y *= -body.restitution;
        }
        
        // Bottom boundary
        if (body.position.y + body.radius > this.bounds.y + this.bounds.height) {
            body.position.y = this.bounds.y + this.bounds.height - body.radius;
            body.velocity.y *= -body.restitution;
        }
    }

    render(ctx) {
        // Render particle system
        this.particleSystem.render(ctx);
        
        // Render physics bodies (for debugging)
        if (window.DEBUG_PHYSICS) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            this.bodies.forEach(body => {
                ctx.beginPath();
                ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
                ctx.stroke();
            });
        }
    }

    clear() {
        this.bodies = [];
        this.particleSystem.clear();
    }
}

// Physics utilities
class PhysicsUtils {
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomVector2D(minMagnitude, maxMagnitude) {
        const angle = Math.random() * Math.PI * 2;
        const magnitude = PhysicsUtils.randomRange(minMagnitude, maxMagnitude);
        return new Vector2D(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    static smoothstep(edge0, edge1, x) {
        const t = PhysicsUtils.clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
    }
}

// Export classes for game use
window.PhysicsEngine = {
    Vector2D,
    PhysicsBody,
    Particle,
    ParticleSystem,
    CollisionDetector,
    PhysicsWorld,
    PhysicsUtils
};