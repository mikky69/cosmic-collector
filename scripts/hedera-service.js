/**
 * Hedera Integration Service for Cosmic Collection Games
 * Handles wallet connection, COSM token transactions, NFT marketplace, and leaderboard
 * Author: Engr. Mikailu Nadro
 */

class HederaService {
    constructor() {
        this.accountId = null;
        this.walletConnected = false;
        this.cosmTokenId = null;
        this.network = 'testnet';
        
        // Contract addresses (UPDATE THESE AFTER DEPLOYMENT)
        this.contracts = {
            cosmToken: '0.0.XXXXXX',
            nftMarketplace: '0.0.YYYYYY',
            leaderboard: '0.0.ZZZZZZ'
        };
    }

    async connectWallet() {
        try {
            if (!window.hashconnect) {
                alert('Please install HashPack wallet extension from https://www.hashpack.app/');
                return { success: false, error: 'HashPack not installed' };
            }

            const hashconnect = window.hashconnect;
            await hashconnect.init({
                projectId: 'cosmic-collection',
                name: 'Cosmic Collection',
                description: 'Play-to-Earn Gaming Platform on Hedera',
                icon: 'https://cosmic-collector.vercel.app/logo.png'
            });

            const pairingData = await hashconnect.connect();
            this.accountId = pairingData.accountIds[0];
            this.walletConnected = true;

            console.log('Wallet connected:', this.accountId);
            return {
                success: true,
                accountId: this.accountId
            };

        } catch (error) {
            console.error('Wallet connection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async disconnectWallet() {
        try {
            if (window.hashconnect) {
                await window.hashconnect.disconnect();
            }
            this.accountId = null;
            this.walletConnected = false;
            return { success: true };
        } catch (error) {
            console.error('Disconnect error:', error);
            return { success: false, error: error.message };
        }
    }

    async getBalance() {
        if (!this.walletConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            const response = await fetch(
                `https://${this.network}.mirrornode.hedera.com/api/v1/accounts/${this.accountId}/balances`
            );
            const data = await response.json();
            
            const hbarBalance = data.balances[0].balance / 100000000;
            
            let cosmBalance = 0;
            if (this.cosmTokenId) {
                const tokenBalance = data.balances.find(b => b.token_id === this.cosmTokenId);
                if (tokenBalance) {
                    cosmBalance = tokenBalance.balance / 100000000;
                }
            }

            return {
                hbar: hbarBalance,
                cosm: cosmBalance,
                accountId: this.accountId
            };
        } catch (error) {
            console.error('Balance fetch error:', error);
            return { hbar: 0, cosm: 0, accountId: this.accountId };
        }
    }

    async submitScoreToLeaderboard(gameName, score, cosmEarned) {
        if (!this.walletConnected) {
            console.log('Wallet not connected - score saved locally');
            return {
                success: false,
                error: 'Wallet not connected'
            };
        }

        try {
            console.log('Submitting score:', {
                game: gameName,
                score: score,
                cosm: cosmEarned
            });
            
            // This will connect to your smart contract after deployment
            // For now, just log the score
            alert(`🎉 Game Complete!\n\nScore: ${score}\nCOSM Earned: ${cosmEarned.toFixed(2)}\n\nConnect wallet and deploy contracts to earn real COSM!`);
            
            return {
                success: true,
                game: gameName,
                score: score,
                cosmEarned: cosmEarned
            };

        } catch (error) {
            console.error('Submit score error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async swapHBARforCOSM(hbarAmount) {
        if (!this.walletConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log('Swapping HBAR for COSM:', hbarAmount);
            const cosmReceived = hbarAmount * 100;

            return {
                success: true,
                hbarSpent: hbarAmount,
                cosmReceived: cosmReceived
            };

        } catch (error) {
            console.error('Swap error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async purchaseNFTWithCOSM(nftId) {
        if (!this.walletConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log('Purchasing NFT with COSM:', nftId);

            return {
                success: true,
                nftId: nftId
            };

        } catch (error) {
            console.error('NFT purchase error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getLeaderboard(gameName, limit = 100) {
        try {
            console.log('Fetching leaderboard for:', gameName);
            
            // This will fetch from your smart contract after deployment
            // For now, return sample data
            return {
                success: true,
                leaderboard: []
            };

        } catch (error) {
            console.error('Get leaderboard error:', error);
            return {
                success: false,
                error: error.message,
                leaderboard: []
            };
        }
    }
}

// Create global instance
const hederaService = new HederaService();

// Make available globally
if (typeof window !== 'undefined') {
    window.hederaService = hederaService;
}
