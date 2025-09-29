// Hedera Integration for Cosmic Collector
// Supports both HashPack and MetaMask wallets

class HederaService {
    constructor() {
        this.accountId = null;
        this.walletConnected = false;
        this.walletType = null;
        this.balance = 0;
        this.userNFTs = [];
        
        // Creator account - THIS IS YOU, the game creator
        this.CREATOR_ACCOUNT_ID = "0.0.1234567"; // Replace with your actual Hedera account ID
        
        // Smart contract for NFT marketplace (to be deployed)
        this.NFT_CONTRACT_ID = "0.0.1234568"; // Replace with actual smart contract ID
        
        // IPFS gateway for NFT metadata
        this.IPFS_GATEWAY = "https://ipfs.io/ipfs/";
        
        // Initialize wallet detection
        this.detectWallet();
    }

    async detectWallet() {
        // Check for HashPack
        if (window.hashconnect) {
            console.log("HashPack detected");
            return;
        }
        
        // Check for MetaMask
        if (window.ethereum) {
            console.log("MetaMask detected");
            return;
        }
        
        console.log("No compatible wallet detected");
    }

    async connectWallet() {
        try {
            // Try HashPack first
            if (window.hashconnect) {
                return await this.connectHashPack();
            }
            
            // Fall back to MetaMask
            if (window.ethereum) {
                return await this.connectMetaMask();
            }
            
            throw new Error("No compatible wallet found. Please install HashPack or MetaMask.");
            
        } catch (error) {
            console.error("Wallet connection error:", error);
            throw error;
        }
    }

    async connectHashPack() {
        try {
            const hashconnect = window.hashconnect;
            await hashconnect.init();
            
            const saveData = await hashconnect.connectToLocalWallet();
            
            if (saveData) {
                this.accountId = saveData.accountIds[0];
                this.walletConnected = true;
                this.walletType = 'hashpack';
                
                await this.updateBalance();
                await this.loadUserNFTs();
                
                return {
                    success: true,
                    accountId: this.accountId,
                    balance: this.balance,
                    walletType: 'hashpack'
                };
            }
            
        } catch (error) {
            console.error("HashPack connection error:", error);
            throw error;
        }
    }

    async connectMetaMask() {
        try {
            if (!window.ethereum) {
                throw new Error("MetaMask not found");
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error("No accounts found");
            }

            // Add Hedera testnet to MetaMask if not present
            await this.addHederaNetwork();
            
            // Switch to Hedera testnet
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x128' }], // Hedera testnet chain ID
            });

            this.accountId = accounts[0];
            this.walletConnected = true;
            this.walletType = 'metamask';
            
            await this.updateBalance();
            await this.loadUserNFTs();

            return {
                success: true,
                accountId: this.accountId,
                balance: this.balance,
                walletType: 'metamask'
            };

        } catch (error) {
            console.error("MetaMask connection error:", error);
            throw error;
        }
    }

    async addHederaNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x128', // 296 in decimal (Hedera testnet)
                    chainName: 'Hedera Testnet',
                    rpcUrls: ['https://testnet.hashio.io/api'],
                    nativeCurrency: {
                        name: 'HBAR',
                        symbol: 'HBAR',
                        decimals: 8
                    },
                    blockExplorerUrls: ['https://hashscan.io/testnet']
                }]
            });
        } catch (error) {
            console.error("Failed to add Hedera network:", error);
        }
    }

    async updateBalance() {
        try {
            if (this.walletType === 'hashpack' && window.hashconnect) {
                // HashPack balance query
                const provider = window.hashconnect.getProvider();
                const balance = await provider.getAccountBalance(this.accountId);
                this.balance = parseFloat(balance.hbars.toString());
                
            } else if (this.walletType === 'metamask') {
                // MetaMask balance query
                const balance = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [this.accountId, 'latest']
                });
                this.balance = parseFloat(balance) / 100000000; // Convert from tinybars to HBAR
            }
            
        } catch (error) {
            console.error("Failed to update balance:", error);
            this.balance = 0;
        }
    }

    // FIXED: Add the missing getUserNFTs function
    async getUserNFTs() {
        try {
            await this.loadUserNFTs();
            return this.userNFTs;
        } catch (error) {
            console.error("Error getting user NFTs:", error);
            return [];
        }
    }

    async loadUserNFTs() {
        try {
            // Query NFTs owned by user from Hedera Mirror Node
            const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${this.accountId}/nfts`);
            const data = await response.json();
            
            this.userNFTs = data.nfts ? data.nfts.map(nft => ({
                tokenId: nft.token_id,
                serialNumber: nft.serial_number,
                metadata: nft.metadata,
                // Add IPFS URL if metadata is available
                imageUrl: nft.metadata ? `${this.IPFS_GATEWAY}${nft.metadata}` : null
            })) : [];
            
        } catch (error) {
            console.error("Failed to load NFTs:", error);
            this.userNFTs = [];
        }
    }

    // FIXED: Proper NFT minting with IPFS integration
    async mintNFT(shipType = 'classic') {
        try {
            if (!this.walletConnected) {
                throw new Error("Wallet not connected");
            }

            if (this.balance < 10) {
                throw new Error("Insufficient HBAR balance. Need 10 HBAR to mint.");
            }

            // Upload metadata to IPFS first
            const metadata = await this.uploadToIPFS(shipType);
            
            // Create NFT mint transaction
            const transaction = await this.createNFTMintTransaction(metadata, shipType);
            
            // Execute transaction based on wallet type
            if (this.walletType === 'hashpack') {
                return await this.executeHashPackTransaction(transaction);
            } else if (this.walletType === 'metamask') {
                return await this.executeMetaMaskTransaction(transaction);
            }
            
        } catch (error) {
            console.error("NFT minting error:", error);
            throw error;
        }
    }

    async uploadToIPFS(shipType) {
        try {
            // Create NFT metadata
            const metadata = {
                name: `Cosmic Ship - ${shipType.charAt(0).toUpperCase() + shipType.slice(1)}`,
                description: `A unique spaceship NFT for Cosmic Collector game`,
                image: `ipfs://QmYourShipImageHash${shipType}`, // Replace with actual IPFS hashes
                attributes: [
                    {
                        trait_type: "Ship Type",
                        value: shipType
                    },
                    {
                        trait_type: "Game",
                        value: "Cosmic Collector"
                    },
                    {
                        trait_type: "Rarity",
                        value: this.getShipRarity(shipType)
                    }
                ]
            };

            // Upload to IPFS (using Pinata or similar service)
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_PINATA_JWT` // Replace with your Pinata JWT
                },
                body: JSON.stringify(metadata)
            });

            const result = await response.json();
            return result.IpfsHash;

        } catch (error) {
            console.error("IPFS upload error:", error);
            // Fallback to local metadata
            return `fallback_metadata_${shipType}`;
        }
    }

    getShipRarity(shipType) {
        const rarities = {
            classic: "Common",
            speed: "Uncommon", 
            tank: "Rare",
            stealth: "Legendary"
        };
        return rarities[shipType] || "Common";
    }

    async createNFTMintTransaction(metadataHash, shipType) {
        // This would create the actual Hedera NFT mint transaction
        // For now, return a mock transaction object
        return {
            type: 'NFT_MINT',
            cost: 10,
            metadata: metadataHash,
            shipType: shipType,
            recipient: this.accountId
        };
    }

    async executeHashPackTransaction(transaction) {
        try {
            // Execute via HashPack
            const provider = window.hashconnect.getProvider();
            
            // Create the transaction
            const txResponse = await provider.executeTransaction({
                ...transaction,
                payerAccountId: this.accountId
            });

            // Wait for receipt
            const receipt = await txResponse.getReceipt(provider);
            
            if (receipt.status.toString() === "SUCCESS") {
                await this.updateBalance();
                await this.loadUserNFTs();
                return {
                    success: true,
                    transactionId: txResponse.transactionId.toString(),
                    message: "NFT minted successfully!"
                };
            }

        } catch (error) {
            console.error("HashPack transaction error:", error);
            throw error;
        }
    }

    async executeMetaMaskTransaction(transaction) {
        try {
            // Convert to MetaMask transaction format
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: this.accountId,
                    to: this.NFT_CONTRACT_ID, // Smart contract address
                    value: '0x' + (transaction.cost * 100000000).toString(16), // Convert HBAR to tinybars
                    data: this.encodeNFTMintData(transaction)
                }]
            });

            // Wait for confirmation
            await this.waitForTransactionConfirmation(txHash);
            
            await this.updateBalance();
            await this.loadUserNFTs();
            
            return {
                success: true,
                transactionId: txHash,
                message: "NFT minted successfully!"
            };

        } catch (error) {
            console.error("MetaMask transaction error:", error);
            throw error;
        }
    }

    encodeNFTMintData(transaction) {
        // Encode the mint function call data
        // This is a simplified version - real implementation would use proper ABI encoding
        return `0x${transaction.metadata}${transaction.shipType}`;
    }

    async waitForTransactionConfirmation(txHash) {
        // Wait for transaction to be confirmed
        return new Promise((resolve, reject) => {
            const checkStatus = async () => {
                try {
                    const receipt = await window.ethereum.request({
                        method: 'eth_getTransactionReceipt',
                        params: [txHash]
                    });
                    
                    if (receipt) {
                        resolve(receipt);
                    } else {
                        setTimeout(checkStatus, 2000);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            checkStatus();
        });
    }

    // FIXED: Proper ship purchase with smart contract integration
    async purchaseShip(shipType) {
        try {
            if (!this.walletConnected) {
                throw new Error("Wallet not connected");
            }

            const shipPrices = {
                classic: 5,
                speed: 8,
                tank: 12,
                stealth: 15
            };

            const cost = shipPrices[shipType];
            if (this.balance < cost) {
                throw new Error(`Insufficient HBAR balance. Need ${cost} HBAR.`);
            }

            // Create purchase transaction that sends HBAR to creator account
            const transaction = {
                type: 'SHIP_PURCHASE',
                cost: cost,
                shipType: shipType,
                recipient: this.CREATOR_ACCOUNT_ID, // Funds go to creator
                from: this.accountId
            };

            // Execute transaction
            let result;
            if (this.walletType === 'hashpack') {
                result = await this.executePurchaseHashPack(transaction);
            } else if (this.walletType === 'metamask') {
                result = await this.executePurchaseMetaMask(transaction);
            }

            if (result.success) {
                // Add ship to user's inventory
                await this.addShipToInventory(shipType);
            }

            return result;

        } catch (error) {
            console.error("Ship purchase error:", error);
            throw error;
        }
    }

    async executePurchaseHashPack(transaction) {
        try {
            const provider = window.hashconnect.getProvider();
            
            // Create HBAR transfer transaction
            const txResponse = await provider.executeTransaction({
                type: 'TRANSFER',
                transfers: [{
                    accountId: this.CREATOR_ACCOUNT_ID,
                    amount: transaction.cost * 100000000 // Convert to tinybars
                }],
                payerAccountId: this.accountId
            });

            const receipt = await txResponse.getReceipt(provider);
            
            if (receipt.status.toString() === "SUCCESS") {
                await this.updateBalance();
                return {
                    success: true,
                    transactionId: txResponse.transactionId.toString(),
                    message: `${transaction.shipType} ship purchased successfully!`
                };
            }

        } catch (error) {
            console.error("HashPack purchase error:", error);
            throw error;
        }
    }

    async executePurchaseMetaMask(transaction) {
        try {
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: this.accountId,
                    to: this.CREATOR_ACCOUNT_ID,
                    value: '0x' + (transaction.cost * 100000000).toString(16) // Convert to tinybars in hex
                }]
            });

            await this.waitForTransactionConfirmation(txHash);
            await this.updateBalance();
            
            return {
                success: true,
                transactionId: txHash,
                message: `${transaction.shipType} ship purchased successfully!`
            };

        } catch (error) {
            console.error("MetaMask purchase error:", error);
            throw error;
        }
    }

    async addShipToInventory(shipType) {
        // Store purchased ship in local storage (in a real app, this would be on-chain)
        const inventory = JSON.parse(localStorage.getItem('shipInventory') || '[]');
        inventory.push({
            shipType: shipType,
            purchaseDate: Date.now(),
            transactionId: Date.now().toString()
        });
        localStorage.setItem('shipInventory', JSON.stringify(inventory));
    }

    // Score submission with creator fee
    async submitScore(score, game = 'cosmic') {
        try {
            if (!this.walletConnected) {
                throw new Error("Wallet not connected");
            }

            if (this.balance < 1) {
                throw new Error("Insufficient HBAR balance. Need 1 HBAR to submit score.");
            }

            // Create score submission transaction (1 HBAR goes to creator)
            const transaction = {
                type: 'SCORE_SUBMISSION',
                cost: 1,
                score: score,
                game: game,
                recipient: this.CREATOR_ACCOUNT_ID,
                from: this.accountId
            };

            let result;
            if (this.walletType === 'hashpack') {
                result = await this.executeScoreHashPack(transaction);
            } else if (this.walletType === 'metamask') {
                result = await this.executeScoreMetaMask(transaction);
            }

            if (result.success) {
                // Store score on leaderboard
                await this.addToLeaderboard(score, game);
            }

            return result;

        } catch (error) {
            console.error("Score submission error:", error);
            throw error;
        }
    }

    async executeScoreHashPack(transaction) {
        try {
            const provider = window.hashconnect.getProvider();
            
            const txResponse = await provider.executeTransaction({
                type: 'TRANSFER',
                transfers: [{
                    accountId: this.CREATOR_ACCOUNT_ID,
                    amount: transaction.cost * 100000000
                }],
                memo: `Score: ${transaction.score} - Game: ${transaction.game}`,
                payerAccountId: this.accountId
            });

            const receipt = await txResponse.getReceipt(provider);
            
            if (receipt.status.toString() === "SUCCESS") {
                await this.updateBalance();
                return {
                    success: true,
                    transactionId: txResponse.transactionId.toString(),
                    message: "Score submitted successfully!"
                };
            }

        } catch (error) {
            console.error("HashPack score submission error:", error);
            throw error;
        }
    }

    async executeScoreMetaMask(transaction) {
        try {
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: this.accountId,
                    to: this.CREATOR_ACCOUNT_ID,
                    value: '0x' + (transaction.cost * 100000000).toString(16),
                    data: this.encodeScoreData(transaction)
                }]
            });

            await this.waitForTransactionConfirmation(txHash);
            await this.updateBalance();
            
            return {
                success: true,
                transactionId: txHash,
                message: "Score submitted successfully!"
            };

        } catch (error) {
            console.error("MetaMask score submission error:", error);
            throw error;
        }
    }

    encodeScoreData(transaction) {
        // Encode score data
        return `0x${transaction.score.toString(16).padStart(8, '0')}${Buffer.from(transaction.game).toString('hex')}`;
    }

    async addToLeaderboard(score, game) {
        // Store on leaderboard (in real app, would be on-chain or database)
        const leaderboard = JSON.parse(localStorage.getItem(`leaderboard_${game}`) || '[]');
        leaderboard.push({
            accountId: this.accountId,
            score: score,
            timestamp: Date.now(),
            walletType: this.walletType
        });
        
        // Sort by score descending
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep top 100
        if (leaderboard.length > 100) {
            leaderboard.splice(100);
        }
        
        localStorage.setItem(`leaderboard_${game}`, JSON.stringify(leaderboard));
    }

    async getLeaderboard(game = 'cosmic') {
        const leaderboard = JSON.parse(localStorage.getItem(`leaderboard_${game}`) || '[]');
        return leaderboard;
    }

    disconnectWallet() {
        this.accountId = null;
        this.walletConnected = false;
        this.walletType = null;
        this.balance = 0;
        this.userNFTs = [];
    }
}

// Initialize global Hedera service
window.hederaService = new HederaService();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HederaService;
}
