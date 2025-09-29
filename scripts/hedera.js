// Enhanced Hedera Integration with HashPack + MetaMask Support
// Mikky Studio - 2025

class HederaService {
    constructor() {
        this.isConnected = false;
        this.accountId = null;
        this.balance = 0;
        this.provider = null;
        this.walletType = null; // 'hashpack' or 'metamask'
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Hedera service with multi-wallet support...');
            this.checkAvailableWallets();
        } catch (error) {
            console.error('Failed to initialize Hedera service:', error);
        }
    }

    checkAvailableWallets() {
        const availableWallets = [];
        
        // Check for HashPack
        if (window.hashConnect || window.hashpack) {
            availableWallets.push('HashPack');
        }
        
        // Check for MetaMask with Hedera support
        if (window.ethereum && window.ethereum.isMetaMask) {
            availableWallets.push('MetaMask');
        }
        
        console.log('Available wallets:', availableWallets);
        
        if (availableWallets.length === 0) {
            this.updateConnectButton('No Hedera Wallet Found');
        } else if (availableWallets.length === 1) {
            this.updateConnectButton(`Connect ${availableWallets[0]}`);
        } else {
            this.updateConnectButton('Connect Wallet');
        }
    }

    updateConnectButton(text) {
        const connectBtn = document.getElementById('connectWalletBtn');
        if (connectBtn) {
            connectBtn.textContent = text;
        }
    }

    async connectWallet() {
        try {
            console.log('Attempting wallet connection...');
            
            // Check available wallets and let user choose
            const hasHashPack = window.hashConnect || window.hashpack;
            const hasMetaMask = window.ethereum && window.ethereum.isMetaMask;
            
            if (!hasHashPack && !hasMetaMask) {
                return {
                    success: false,
                    error: 'No supported wallets found. Please install HashPack or MetaMask with Hedera support.'
                };
            }
            
            // If both are available, prefer HashPack for Hedera
            if (hasHashPack) {
                return await this.connectHashPack();
            } else if (hasMetaMask) {
                return await this.connectMetaMask();
            }
            
        } catch (error) {
            console.error('Wallet connection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async connectHashPack() {
        try {
            console.log('Connecting to HashPack...');
            
            // For demo purposes, simulate HashPack connection
            // In production, use actual HashConnect integration:
            /*
            const hashConnect = new HashConnect(
                LedgerId.TESTNET,
                'cosmic-collector',
                'Cosmic Collector Game',
                'https://your-domain.com'
            );
            
            await hashConnect.init();
            const pairingData = await hashConnect.connectToLocalWallet();
            */
            
            // Simulated connection for demo
            this.accountId = '0.0.' + Math.floor(Math.random() * 1000000);
            this.balance = 50 + Math.random() * 200; // Random testnet balance
            this.isConnected = true;
            this.walletType = 'hashpack';
            
            this.updateWalletUI();
            
            return {
                success: true,
                accountId: this.accountId,
                balance: this.balance,
                walletType: 'HashPack'
            };
            
        } catch (error) {
            console.error('HashPack connection error:', error);
            return {
                success: false,
                error: `HashPack connection failed: ${error.message}`
            };
        }
    }

    async connectMetaMask() {
        try {
            console.log('Connecting to MetaMask for Hedera...');
            
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length === 0) {
                throw new Error('No accounts available');
            }
            
            // Check if connected to Hedera testnet
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            // Hedera testnet chain ID (if supported by MetaMask)
            const hederaTestnetChainId = '0x128'; // 296 in hex
            
            if (chainId !== hederaTestnetChainId) {
                // Try to switch to Hedera testnet
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: hederaTestnetChainId }],
                    });
                } catch (switchError) {
                    // If network doesn't exist, add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: hederaTestnetChainId,
                                chainName: 'Hedera Testnet',
                                rpcUrls: ['https://testnet.hashio.io/api'],
                                nativeCurrency: {
                                    name: 'HBAR',
                                    symbol: 'HBAR',
                                    decimals: 8
                                },
                                blockExplorerUrls: ['https://hashscan.io/testnet/']
                            }]
                        });
                    } else {
                        throw switchError;
                    }
                }
            }
            
            // Get balance
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [accounts[0], 'latest']
            });
            
            // Convert from wei to HBAR (simplified conversion)
            const hbarBalance = parseInt(balance, 16) / Math.pow(10, 8);
            
            this.accountId = '0.0.' + Math.abs(accounts[0].slice(-6).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
            this.balance = hbarBalance || (50 + Math.random() * 200); // Fallback to simulated balance
            this.isConnected = true;
            this.walletType = 'metamask';
            this.provider = window.ethereum;
            
            this.updateWalletUI();
            
            return {
                success: true,
                accountId: this.accountId,
                balance: this.balance,
                walletType: 'MetaMask'
            };
            
        } catch (error) {
            console.error('MetaMask connection error:', error);
            return {
                success: false,
                error: `MetaMask connection failed: ${error.message}`
            };
        }
    }

    async disconnectWallet() {
        this.isConnected = false;
        this.accountId = null;
        this.balance = 0;
        this.walletType = null;
        this.provider = null;
        this.updateWalletUI();
        this.checkAvailableWallets();
    }

    updateWalletUI() {
        const connectBtn = document.getElementById('connectWalletBtn');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        const walletBalance = document.getElementById('walletBalance');
        
        if (this.isConnected) {
            const walletName = this.walletType === 'hashpack' ? 'HashPack' : 'MetaMask';
            connectBtn.textContent = `Disconnect ${walletName}`;
            connectBtn.onclick = () => this.disconnectWallet();
            
            walletInfo.classList.remove('hidden');
            walletAddress.textContent = `${this.accountId} (${walletName})`;
            walletBalance.textContent = `${this.balance.toFixed(2)} HBAR`;
        } else {
            this.checkAvailableWallets();
            connectBtn.onclick = async () => {
                const result = await this.connectWallet();
                if (!result.success) {
                    alert(result.error);
                }
            };
            walletInfo.classList.add('hidden');
        }
    }

    // Transaction methods with wallet-specific handling
    async purchaseShip(shipType, price) {
        if (!this.isConnected) {
            return { success: false, error: 'Wallet not connected' };
        }

        if (this.balance < price) {
            return { success: false, error: 'Insufficient HBAR balance' };
        }

        try {
            console.log(`Processing ${price} HBAR payment via ${this.walletType}...`);
            
            if (this.walletType === 'metamask') {
                return await this.executeMetaMaskTransaction(price, `Ship purchase: ${shipType}`);
            } else {
                return await this.executeHashPackTransaction(price, `Ship purchase: ${shipType}`);
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async executeHashPackTransaction(amount, memo) {
        // Simulate HashPack transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.balance -= amount;
        this.updateWalletUI();
        
        return {
            success: true,
            transaction: this.generateTransactionId(),
            walletType: 'HashPack'
        };
    }

    async executeMetaMaskTransaction(amount, memo) {
        try {
            // Convert HBAR to wei (simplified)
            const amountInWei = '0x' + Math.floor(amount * Math.pow(10, 8)).toString(16);
            
            const transactionParameters = {
                to: '0x' + '0'.repeat(40), // Placeholder address
                value: amountInWei,
                gas: '0x5208', // 21000
                gasPrice: '0x09184e72a000', // 10000000000000
            };
            
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });
            
            this.balance -= amount;
            this.updateWalletUI();
            
            return {
                success: true,
                transaction: txHash,
                walletType: 'MetaMask'
            };
            
        } catch (error) {
            if (error.code === 4001) {
                return { success: false, error: 'Transaction rejected by user' };
            }
            throw error;
        }
    }

    async mintShipNFT(shipType, metadata) {
        if (!this.isConnected) {
            return { success: false, error: 'Wallet not connected' };
        }

        const mintCost = 10;
        if (this.balance < mintCost) {
            return { success: false, error: 'Insufficient HBAR balance' };
        }

        try {
            console.log(`Minting NFT via ${this.walletType}...`);
            
            // Simulate NFT minting
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            this.balance -= mintCost;
            this.updateWalletUI();
            
            return {
                success: true,
                transaction: this.generateTransactionId(),
                tokenId: this.generateTokenId(),
                metadata: metadata,
                walletType: this.walletType
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async submitScore(score, playerName) {
        if (!this.isConnected) {
            return { success: false, error: 'Wallet not connected' };
        }

        const submitCost = 1;
        if (this.balance < submitCost) {
            return { success: false, error: 'Insufficient HBAR balance' };
        }

        try {
            console.log(`Submitting score via ${this.walletType}...`);
            
            // Simulate score submission
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.balance -= submitCost;
            this.updateWalletUI();
            
            return {
                success: true,
                submission: {
                    transaction: this.generateTransactionId(),
                    score: score,
                    playerName: playerName,
                    timestamp: Date.now(),
                    walletType: this.walletType
                }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    generateTransactionId() {
        return '0.0.' + Math.floor(Math.random() * 1000000) + '@' + 
               (Math.floor(Date.now() / 1000)) + '.' + 
               Math.floor(Math.random() * 1000000000);
    }

    generateTokenId() {
        return '0.0.' + Math.floor(Math.random() * 1000000);
    }

    // Ship utility methods
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
        return stats[shipType] || stats.classic;
    }

    getShipRarity(shipType) {
        const rarities = {
            classic: 'Common',
            speed: 'Rare',
            tank: 'Epic',
            stealth: 'Legendary'
        };
        return rarities[shipType] || 'Common';
    }
}

// Global service instance
window.hederaService = new HederaService();
