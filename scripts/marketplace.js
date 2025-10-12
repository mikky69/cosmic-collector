/**
 * NFT Marketplace System
 * Handles NFT item browsing, purchasing, and integration with games
 */

class NFTMarketplace {
    constructor() {
        this.items = this.initializeItems();
        this.playerInventory = this.loadPlayerInventory();
        this.selectedItem = null;
        this.init();
    }

    initializeItems() {
        return {
            ships: [
                {
                    id: 'stealth_fighter',
                    name: 'Stealth Fighter',
                    description: 'Invisible to enemies for 3 seconds every 30 seconds',
                    price: 50,
                    rarity: 'rare',
                    image: '🚀',
                    effect: { type: 'stealth', duration: 3000, cooldown: 30000 },
                    games: ['cosmic-collector', 'space-defender']
                },
                {
                    id: 'plasma_cruiser',
                    name: 'Plasma Cruiser',
                    description: '+50% damage, +25% speed',
                    price: 75,
                    rarity: 'epic',
                    image: '🛸',
                    effect: { type: 'stats', damage: 1.5, speed: 1.25 },
                    games: ['cosmic-collector', 'asteroid-miner']
                },
                {
                    id: 'mining_vessel',
                    name: 'Super Mining Vessel',
                    description: '2x mining speed, +50% cargo capacity',
                    price: 40,
                    rarity: 'uncommon',
                    image: '⛏️',
                    effect: { type: 'mining', speed: 2, cargo: 1.5 },
                    games: ['asteroid-miner']
                }
            ],
            weapons: [
                {
                    id: 'plasma_cannon',
                    name: 'Plasma Cannon',
                    description: 'Pierces through multiple enemies',
                    price: 30,
                    rarity: 'uncommon',
                    image: '🔫',
                    effect: { type: 'pierce', count: 3 },
                    games: ['cosmic-collector', 'space-defender']
                },
                {
                    id: 'laser_burst',
                    name: 'Laser Burst',
                    description: 'Fires 3 shots simultaneously',
                    price: 45,
                    rarity: 'rare',
                    image: '⚡',
                    effect: { type: 'multishot', count: 3 },
                    games: ['cosmic-collector', 'space-defender']
                },
                {
                    id: 'mining_laser',
                    name: 'Advanced Mining Laser',
                    description: 'Faster asteroid destruction',
                    price: 35,
                    rarity: 'uncommon',
                    image: '🔥',
                    effect: { type: 'mining_damage', multiplier: 2 },
                    games: ['asteroid-miner']
                }
            ],
            powerups: [
                {
                    id: 'shield_generator',
                    name: 'Shield Generator',
                    description: 'Start each game with a protective shield',
                    price: 25,
                    rarity: 'common',
                    image: '🛡️',
                    effect: { type: 'start_shield', duration: 10000 },
                    games: ['cosmic-collector', 'space-defender']
                },
                {
                    id: 'token_magnet',
                    name: 'Token Magnet',
                    description: '+50% token earnings from all games',
                    price: 60,
                    rarity: 'epic',
                    image: '🧲',
                    effect: { type: 'token_boost', multiplier: 1.5 },
                    games: ['cosmic-collector', 'token-battle', 'space-defender', 'asteroid-miner']
                },
                {
                    id: 'auto_pilot',
                    name: 'Auto Pilot',
                    description: 'Automatically avoids some obstacles',
                    price: 40,
                    rarity: 'rare',
                    image: '🤖',
                    effect: { type: 'auto_avoid', chance: 0.3 },
                    games: ['cosmic-collector', 'asteroid-miner']
                }
            ],
            skins: [
                {
                    id: 'neon_glow',
                    name: 'Neon Glow',
                    description: 'Cool neon visual effects',
                    price: 20,
                    rarity: 'common',
                    image: '✨',
                    effect: { type: 'visual', glow: true },
                    games: ['cosmic-collector', 'space-defender', 'asteroid-miner']
                },
                {
                    id: 'golden_ship',
                    name: 'Golden Ship',
                    description: 'Luxurious golden appearance',
                    price: 100,
                    rarity: 'legendary',
                    image: '👑',
                    effect: { type: 'visual', color: 'gold', prestige: true },
                    games: ['cosmic-collector', 'space-defender', 'asteroid-miner']
                },
                {
                    id: 'rainbow_trail',
                    name: 'Rainbow Trail',
                    description: 'Leaves a beautiful rainbow trail',
                    price: 30,
                    rarity: 'rare',
                    image: '🌈',
                    effect: { type: 'visual', trail: 'rainbow' },
                    games: ['cosmic-collector', 'asteroid-miner']
                }
            ]
        };
    }

    init() {
        this.setupCategoryButtons();
        this.setupPurchaseModal();
        this.displayItems('ships'); // Default category
    }

    setupCategoryButtons() {
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Display items for selected category
                const category = btn.getAttribute('data-category');
                this.displayItems(category);
            });
        });
    }

    displayItems(category) {
        const container = document.getElementById('marketplace-items');
        if (!container) return;

        const items = this.items[category] || [];
        
        container.innerHTML = items.map(item => `
            <div class="marketplace-item ${this.playerInventory.includes(item.id) ? 'owned' : ''}" 
                 data-item-id="${item.id}">
                <div class="item-header">
                    <div class="item-image">${item.image}</div>
                    <div class="item-rarity ${item.rarity}">${item.rarity.toUpperCase()}</div>
                </div>
                <div class="item-info">
                    <h3 class="item-name">${item.name}</h3>
                    <p class="item-description">${item.description}</p>
                    <div class="item-games">
                        <span>Works in:</span>
                        ${item.games.map(game => `<span class="game-tag">${this.getGameDisplayName(game)}</span>`).join('')}
                    </div>
                </div>
                <div class="item-footer">
                    <div class="item-price">
                        <span class="price-icon">💎</span>
                        <span class="price-amount">${item.price}</span>
                    </div>
                    ${this.playerInventory.includes(item.id) 
                        ? '<button class="item-btn owned" disabled>✓ Owned</button>'
                        : `<button class="item-btn purchase" onclick="marketplace.purchaseItem('${item.id}')">Purchase</button>`
                    }
                </div>
            </div>
        `).join('');
    }

    getGameDisplayName(gameId) {
        const names = {
            'cosmic-collector': 'Cosmic',
            'token-battle': 'Battle',
            'space-defender': 'Defender', 
            'asteroid-miner': 'Miner'
        };
        return names[gameId] || gameId;
    }

    purchaseItem(itemId) {
        const item = this.findItemById(itemId);
        if (!item) return;

        // Check if player has enough tokens
        const playerTokens = parseInt(document.getElementById('playerTokens').textContent);
        if (playerTokens < item.price) {
            this.showNotification('Not enough tokens!', 'error');
            return;
        }

        this.selectedItem = item;
        this.showPurchaseModal(item);
    }

    findItemById(itemId) {
        for (const category of Object.values(this.items)) {
            const item = category.find(item => item.id === itemId);
            if (item) return item;
        }
        return null;
    }

    showPurchaseModal(item) {
        const modal = document.getElementById('nft-purchase-modal');
        const details = document.getElementById('nft-details');
        
        if (!modal || !details) return;

        details.innerHTML = `
            <div class="nft-purchase-details">
                <div class="nft-image">${item.image}</div>
                <h3>${item.name}</h3>
                <p class="rarity ${item.rarity}">${item.rarity.toUpperCase()}</p>
                <p class="description">${item.description}</p>
                <div class="price-display">
                    <span class="price-label">Price:</span>
                    <span class="price-amount">💎 ${item.price} Tokens</span>
                </div>
                <div class="games-compatible">
                    <strong>Compatible Games:</strong>
                    <div class="game-list">
                        ${item.games.map(game => `<span class="game-badge">${this.getGameDisplayName(game)}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    setupPurchaseModal() {
        const modal = document.getElementById('nft-purchase-modal');
        const confirmBtn = document.getElementById('confirm-purchase');
        const cancelBtn = document.getElementById('cancel-purchase');

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmPurchase();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closePurchaseModal();
            });
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closePurchaseModal();
                }
            });
        }
    }

    confirmPurchase() {
        if (!this.selectedItem) return;

        const playerTokens = parseInt(document.getElementById('playerTokens').textContent);
        const newBalance = playerTokens - this.selectedItem.price;

        // Update player tokens
        document.getElementById('playerTokens').textContent = newBalance;
        
        // Add item to inventory
        this.playerInventory.push(this.selectedItem.id);
        this.savePlayerInventory();

        // Show success notification
        this.showNotification(`🎉 ${this.selectedItem.name} purchased successfully!`, 'success');

        // Refresh marketplace display
        const activeCategory = document.querySelector('.category-btn.active').getAttribute('data-category');
        this.displayItems(activeCategory);

        // Close modal
        this.closePurchaseModal();

        // Apply item effects if applicable
        this.applyItemEffects();
    }

    closePurchaseModal() {
        const modal = document.getElementById('nft-purchase-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.selectedItem = null;
    }

    applyItemEffects() {
        // This will be called by individual games to apply owned item effects
        // Games can call marketplace.getOwnedItems() to get active effects
    }

    getOwnedItems() {
        const ownedItems = [];
        for (const category of Object.values(this.items)) {
            for (const item of category) {
                if (this.playerInventory.includes(item.id)) {
                    ownedItems.push(item);
                }
            }
        }
        return ownedItems;
    }

    getOwnedItemsForGame(gameId) {
        return this.getOwnedItems().filter(item => 
            item.games.includes(gameId)
        );
    }

    loadPlayerInventory() {
        const saved = localStorage.getItem('cosmic_games_inventory');
        return saved ? JSON.parse(saved) : [];
    }

    savePlayerInventory() {
        localStorage.setItem('cosmic_games_inventory', JSON.stringify(this.playerInventory));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Global marketplace instance
window.marketplace = new NFTMarketplace();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NFTMarketplace;
}