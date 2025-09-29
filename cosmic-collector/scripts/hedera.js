// Hedera Hashgraph Integration for Cosmic Collector
// Mikky Studio - 2025

class HederaService {
    constructor() {
        this.client = null;
        this.account = null;
        this.privateKey = null;
        this.isConnected = false;
        this.isTestnet = true;
        
        // Testnet configuration
        this.testnetNodes = {
            '0.testnet.hedera.com:50211': '0.0.3',
            '1.testnet.hedera.com:50211': '0.0.4',
            '2.testnet.hedera.com:50211': '0.0.5',
            '3.testnet.hedera.com:50211': '0.0.6'
        };
        
        // Game-specific token and contract IDs (will be set after deployment)
        this.gameTokenId = null;
        this.nftTokenId = null;
        this.gameContractId = null;
        
        this.initializeHedera();
    }

    async initializeHedera() {
        try {
            // Initialize Hedera SDK for testnet
            const { Client, AccountId, PrivateKey, Hbar } = window.Hashgraph;
            
            // Create client for testnet
            this.client = Client.forTestnet();
            
            console.log('Hedera service initialized for testnet');
        } catch (error) {
            console.error('Failed to initialize Hedera service:', error);
        }
    }

    async connectWallet() {
        try {
            // In a real implementation, this would connect to HashPack or other wallet
            // For demo purposes, we'll simulate wallet connection
            const result = await this.simulateWalletConnection();
            
            if (result.success) {
                this.account = result.accountId;
                this.isConnected = true;
                
                // Update UI
                this.updateWalletUI();
                
                return { success: true, accountId: this.account };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('Wallet connection failed:', error);
            return { success: false, error: error.message };
        }
    }

    async simulateWalletConnection() {
        // Simulate wallet connection delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate a simulated testnet account
        const accountId = `0.0.${Math.floor(Math.random() * 100000) + 1000}`;
        const balance = Math.floor(Math.random() * 1000) + 100; // Random balance 100-1100 HBAR
        
        return {
            success: true,
            accountId: accountId,
            balance: balance
        };
    }

    updateWalletUI() {
        const connectBtn = document.getElementById('connectWalletBtn');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        const walletBalance = document.getElementById('walletBalance');
        
        if (this.isConnected) {
            connectBtn.classList.add('hidden');
            walletInfo.classList.remove('hidden');
            walletAddress.textContent = this.account;
            walletBalance.textContent = `${Math.floor(Math.random() * 1000) + 100} HBAR`;
        } else {
            connectBtn.classList.remove('hidden');
            walletInfo.classList.add('hidden');
        }
    }

    async createGameToken() {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            // Simulate token creation
            console.log('Creating game token on Hedera testnet...');
            
            // In real implementation, this would use TokenCreateTransaction
            const tokenId = `0.0.${Math.floor(Math.random() * 100000) + 200000}`;
            
            this.gameTokenId = tokenId;
            console.log(`Game token created: ${tokenId}`);
            
            return { success: true, tokenId: tokenId };
        } catch (error) {
            console.error('Token creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async createNFTCollection() {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            console.log('Creating NFT collection on Hedera testnet...');
            
            // Simulate NFT collection creation
            const nftTokenId = `0.0.${Math.floor(Math.random() * 100000) + 300000}`;
            
            this.nftTokenId = nftTokenId;
            console.log(`NFT collection created: ${nftTokenId}`);
            
            return { success: true, tokenId: nftTokenId };
        } catch (error) {
            console.error('NFT collection creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async mintShipNFT(shipType, metadata) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            console.log(`Minting ${shipType} NFT...`);
            
            // Simulate minting delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate unique serial number
            const serialNumber = Math.floor(Math.random() * 10000) + 1;
            
            const nft = {
                tokenId: this.nftTokenId,
                serialNumber: serialNumber,
                shipType: shipType,
                metadata: metadata,
                owner: this.account,
                mintTime: new Date().toISOString()
            };
            
            // Store in localStorage for demo
            this.saveNFTToStorage(nft);
            
            console.log('NFT minted successfully:', nft);
            return { success: true, nft: nft };
        } catch (error) {
            console.error('NFT minting failed:', error);
            return { success: false, error: error.message };
        }
    }

    async purchaseShip(shipType, price) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            console.log(`Purchasing ${shipType} for ${price} HBAR...`);
            
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Create ship metadata
            const metadata = {
                name: this.getShipName(shipType),
                type: shipType,
                stats: this.getShipStats(shipType),
                rarity: this.getShipRarity(shipType),
                image: `ships/${shipType}.png`
            };
            
            // Mint NFT for purchased ship
            const mintResult = await this.mintShipNFT(shipType, metadata);
            
            if (mintResult.success) {
                return {
                    success: true,
                    transaction: `0.0.${Math.floor(Math.random() * 1000000) + 100000}`,
                    nft: mintResult.nft
                };
            }
            
            throw new Error('Failed to mint NFT for purchased ship');
        } catch (error) {
            console.error('Ship purchase failed:', error);
            return { success: false, error: error.message };
        }
    }

    async submitScore(score, playerName) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            console.log(`Submitting score ${score} to leaderboard...`);
            
            // Simulate transaction processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const submission = {
                player: playerName || 'Anonymous',
                score: score,
                account: this.account,
                timestamp: new Date().toISOString(),
                transaction: `0.0.${Math.floor(Math.random() * 1000000) + 100000}`
            };
            
            // Store in localStorage for demo
            this.saveScoreToLeaderboard(submission);
            
            console.log('Score submitted successfully:', submission);
            return { success: true, submission: submission };
        } catch (error) {
            console.error('Score submission failed:', error);
            return { success: false, error: error.message };
        }
    }

    getUserNFTs() {
        try {
            const nfts = JSON.parse(localStorage.getItem('cosmicCollectorNFTs') || '[]');
            return nfts.filter(nft => nft.owner === this.account);
        } catch (error) {
            console.error('Failed to load NFTs:', error);
            return [];
        }
    }

    getLeaderboard() {
        try {
            const scores = JSON.parse(localStorage.getItem('cosmicCollectorLeaderboard') || '[]');
            return scores.sort((a, b) => b.score - a.score).slice(0, 10);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            return [];
        }
    }

    saveNFTToStorage(nft) {
        try {
            const nfts = JSON.parse(localStorage.getItem('cosmicCollectorNFTs') || '[]');
            nfts.push(nft);
            localStorage.setItem('cosmicCollectorNFTs', JSON.stringify(nfts));
        } catch (error) {
            console.error('Failed to save NFT:', error);
        }
    }

    saveScoreToLeaderboard(submission) {
        try {
            const scores = JSON.parse(localStorage.getItem('cosmicCollectorLeaderboard') || '[]');
            scores.push(submission);
            localStorage.setItem('cosmicCollectorLeaderboard', JSON.stringify(scores));
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }

    getShipName(shipType) {
        const names = {
            classic: 'Classic Fighter',
            speed: 'Speed Racer',
            tank: 'Heavy Tank',
            stealth: 'Stealth Ninja'
        };
        return names[shipType] || 'Unknown Ship';
    }

    getShipStats(shipType) {
        const stats = {
            classic: { speed: 5, armor: 5, firepower: 5 },
            speed: { speed: 8, armor: 3, firepower: 4 },
            tank: { speed: 3, armor: 8, firepower: 6 },
            stealth: { speed: 6, armor: 4, firepower: 5 }
        };
        return stats[shipType] || { speed: 5, armor: 5, firepower: 5 };
    }

    getShipRarity(shipType) {
        const rarities = {
            classic: 'Common',
            speed: 'Uncommon',
            tank: 'Rare',
            stealth: 'Epic'
        };
        return rarities[shipType] || 'Common';
    }

    disconnect() {
        this.isConnected = false;
        this.account = null;
        this.updateWalletUI();
        console.log('Wallet disconnected');
    }
}

// Global Hedera service instance
window.hederaService = new HederaService();