// Physics engine placeholder
class PhysicsEngine {
    static checkCollision(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (entity1.radius + entity2.radius);
    }
    
    static applyForce(entity, force) {
        entity.velocity = entity.velocity.add(force);
    }
}

window.PhysicsEngine = PhysicsEngine;