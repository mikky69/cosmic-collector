// Mock contract functionality for development/testing
// This simulates blockchain interactions without requiring real deployed contracts

class MockCosmicCollector {
    constructor() {
        this.players = new Map();
        this.contractAddress = "0x1234567890123456789012345678901234567890"; // Mock address
    }

    async getPlayerStats(address) {
        if (!this.players.has(address)) {
            this.players.set(address, {
                score: 0,
                level: 1,
                cosmicEnergy: 100,
                itemsCollected: 0,
                achievements: []
            });
        }
        return this.players.get(address);
    }

    async updateScore(address, newScore) {
        const player = await this.getPlayerStats(address);
        player.score = Math.max(player.score, newScore);
        player.level = Math.floor(player.score / 1000) + 1;
        this.players.set(address, player);
        return true;
    }

    async collectItem(address, itemType, value) {
        const player = await this.getPlayerStats(address);
        player.itemsCollected++;
        player.cosmicEnergy += value;
        player.score += value * 10;
        this.players.set(address, player);
        return true;
    }

    async getLeaderboard() {
        const players = Array.from(this.players.entries());
        return players
            .map(([address, stats]) => ({ address, ...stats }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
}

class MockCosmicNFT {
    constructor() {
        this.nfts = new Map();
        this.nextTokenId = 1;
        this.contractAddress = "0x2345678901234567890123456789012345678901"; // Mock address
    }

    async mintCollectible(address, itemType, rarity) {
        const tokenId = this.nextTokenId++;
        const nft = {
            tokenId,
            owner: address,
            itemType,
            rarity,
            mintedAt: Date.now(),
            metadata: {
                name: `Cosmic ${itemType} #${tokenId}`,
                description: `A ${rarity} ${itemType} from the cosmic realm`,
                image: `/api/placeholder/300/300`,
                attributes: [
                    { trait_type: "Type", value: itemType },
                    { trait_type: "Rarity", value: rarity },
                    { trait_type: "Power Level", value: Math.floor(Math.random() * 100) + 1 }
                ]
            }
        };
        this.nfts.set(tokenId, nft);
        return { tokenId, success: true };
    }

    async getPlayerNFTs(address) {
        return Array.from(this.nfts.values()).filter(nft => nft.owner === address);
    }

    async getNFTMetadata(tokenId) {
        return this.nfts.get(tokenId)?.metadata || null;
    }
}

class MockCosmicMarketplace {
    constructor() {
        this.listings = new Map();
        this.nextListingId = 1;
        this.contractAddress = "0x3456789012345678901234567890123456789012"; // Mock address
    }

    async listNFT(tokenId, price, seller) {
        const listingId = this.nextListingId++;
        const listing = {
            listingId,
            tokenId,
            price,
            seller,
            active: true,
            listedAt: Date.now()
        };
        this.listings.set(listingId, listing);
        return { listingId, success: true };
    }

    async getActiveListings() {
        return Array.from(this.listings.values()).filter(listing => listing.active);
    }

    async buyNFT(listingId, buyer) {
        const listing = this.listings.get(listingId);
        if (listing && listing.active) {
            listing.active = false;
            listing.buyer = buyer;
            listing.soldAt = Date.now();
            return { success: true };
        }
        return { success: false, error: "Listing not found or not active" };
    }
}

// Mock wallet connection
class MockWallet {
    constructor() {
        this.isConnected = false;
        this.account = null;
    }

    async connect() {
        // Simulate wallet connection
        this.isConnected = true;
        this.account = "0x" + Math.random().toString(16).substr(2, 40);
        return this.account;
    }

    async disconnect() {
        this.isConnected = false;
        this.account = null;
    }

    async getBalance() {
        return Math.random() * 100; // Mock HBAR balance
    }
}

// Export mock contracts
export const mockContracts = {
    cosmicCollector: new MockCosmicCollector(),
    cosmicNFT: new MockCosmicNFT(),
    cosmicMarketplace: new MockCosmicMarketplace(),
    wallet: new MockWallet()
};

// Contract addresses for the frontend
export const CONTRACT_ADDRESSES = {
    COSMIC_COLLECTOR: mockContracts.cosmicCollector.contractAddress,
    COSMIC_NFT: mockContracts.cosmicNFT.contractAddress,
    COSMIC_MARKETPLACE: mockContracts.cosmicMarketplace.contractAddress
};

export default mockContracts;