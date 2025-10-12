// Game entities (Player, Enemies, etc.)
class Entity {
    constructor(x, y, radius = 10) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.radius = radius;
        this.health = 100;
        this.active = true;
    }
    
    update(deltaTime) {
        this.position = this.position.add(this.velocity.multiply(deltaTime));
    }
    
    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 15);
        this.shipType = 'classic';
        this.weaponLevel = 1;
        this.shields = false;
    }
}

class Enemy extends Entity {
    constructor(x, y, type = 'basic') {
        super(x, y, 12);
        this.type = type;
        this.scoreValue = 100;
    }
}

class Bullet extends Entity {
    constructor(x, y, direction) {
        super(x, y, 3);
        this.velocity = direction.multiply(500);
        this.damage = 25;
    }
}

window.Entity = Entity;
window.Player = Player;
window.Enemy = Enemy;
window.Bullet = Bullet;