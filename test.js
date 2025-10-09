// Cosmic Collector - Test Suite
// Mikky Studio - 2025

class GameTester {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    async runAll() {
        console.log('🧪 Running Cosmic Collector Tests...');
        console.log('====================================');
        
        for (const test of this.tests) {
            try {
                await test.testFunction();
                console.log(`✅ ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                this.failed++;
            }
        }
        
        console.log('\n📊 Test Results:');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
    }
}

// Test suite
const tester = new GameTester();

// Physics Engine Tests
tester.test('Vector2D Operations', () => {
    const v1 = new PhysicsEngine.Vector2D(3, 4);
    const v2 = new PhysicsEngine.Vector2D(1, 2);
    
    if (v1.magnitude() !== 5) throw new Error('Magnitude calculation failed');
    if (v1.add(v2).x !== 4 || v1.add(v2).y !== 6) throw new Error('Vector addition failed');
    if (v1.dot(v2) !== 11) throw new Error('Dot product failed');
});

tester.test('Physics Body Creation', () => {
    const body = new PhysicsEngine.PhysicsBody(10, 20, 5);
    if (body.position.x !== 10 || body.position.y !== 20) throw new Error('Position initialization failed');
    if (body.mass !== 5) throw new Error('Mass initialization failed');
});

tester.test('Collision Detection', () => {
    const body1 = new PhysicsEngine.PhysicsBody(0, 0, 1);
    const body2 = new PhysicsEngine.PhysicsBody(15, 0, 1);
    
    body1.radius = 10;
    body2.radius = 10;
    
    if (!body1.checkCollision(body2)) throw new Error('Collision detection failed');
});

// Game Logic Tests
tester.test('Game Initialization', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const game = new CosmicCollectorGame(canvas, ctx);
    
    if (!game.physics) throw new Error('Physics world not initialized');
    if (!game.player) throw new Error('Player not created');
    if (game.score !== 0) throw new Error('Score not initialized');
});

// Hedera Service Tests
tester.test('Hedera Service Initialization', () => {
    if (!window.hederaService) throw new Error('Hedera service not available');
    if (window.hederaService.isTestnet !== true) throw new Error('Not configured for testnet');
});

tester.test('NFT Metadata Generation', () => {
    const metadata = {
        name: window.hederaService.getShipName('classic'),
        stats: window.hederaService.getShipStats('classic'),
        rarity: window.hederaService.getShipRarity('classic')
    };
    
    if (!metadata.name || !metadata.stats || !metadata.rarity) {
        throw new Error('NFT metadata generation failed');
    }
});

// UI Tests
tester.test('Screen Navigation', () => {
    const screens = ['mainMenu', 'gameScreen', 'nftScreen', 'shopScreen', 'leaderboardScreen'];
    
    for (const screenId of screens) {
        const screen = document.getElementById(screenId);
        if (!screen) throw new Error(`Screen ${screenId} not found`);
    }
});

tester.test('Button Functionality', () => {
    const buttons = ['playBtn', 'nftBtn', 'shopBtn', 'leaderboardBtn', 'connectWalletBtn'];
    
    for (const buttonId of buttons) {
        const button = document.getElementById(buttonId);
        if (!button) throw new Error(`Button ${buttonId} not found`);
    }
});

// Canvas Tests
tester.test('Canvas Setup', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    if (!canvas) throw new Error('Game canvas not found');
    if (!ctx) throw new Error('Canvas context not available');
    if (canvas.width !== 800 || canvas.height !== 600) throw new Error('Canvas dimensions incorrect');
});

// Local Storage Tests
tester.test('Local Storage Functionality', () => {
    const testData = { test: 'data' };
    localStorage.setItem('cosmicCollectorTest', JSON.stringify(testData));
    
    const retrieved = JSON.parse(localStorage.getItem('cosmicCollectorTest'));
    if (retrieved.test !== 'data') throw new Error('Local storage failed');
    
    localStorage.removeItem('cosmicCollectorTest');
});

// Performance Tests
tester.test('Physics Performance', () => {
    const world = new PhysicsEngine.PhysicsWorld();
    
    // Add many bodies
    for (let i = 0; i < 100; i++) {
        const body = new PhysicsEngine.PhysicsBody(Math.random() * 800, Math.random() * 600);
        world.addBody(body);
    }
    
    const startTime = performance.now();
    world.update(0.016); // 60 FPS
    const endTime = performance.now();
    
    if (endTime - startTime > 10) throw new Error('Physics update too slow');
});

// Export test runner
window.runTests = () => tester.runAll();

// Auto-run tests when loaded
if (typeof window !== 'undefined' && window.location && window.location.search.includes('test=true')) {
    setTimeout(() => tester.runAll(), 1000);
}

console.log('🧪 Test suite loaded. Run tests with: runTests()');