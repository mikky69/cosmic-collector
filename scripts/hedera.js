// Hedera blockchain integration
class HederaService {
    constructor() {
        this.isConnected = false;
        this.accountId = null;
        this.balance = 0;
        this.network = 'testnet';
    }
    
    async connectWallet() {
        try {
            // Placeholder for actual Hedera wallet connection
            console.log('Attempting to connect to Hedera wallet...');
            
            // Simulate connection delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo purposes
            this.isConnected = true;
            this.accountId = '0.0.123456';
            this.balance = 100; // Demo balance
            
            this.updateWalletUI();
            return true;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            return false;
        }
    }
    
    async disconnectWallet() {
        this.isConnected = false;
        this.accountId = null;
        this.balance = 0;
        this.updateWalletUI();
    }
    
    updateWalletUI() {
        const addressElement = document.getElementById('wallet-address');
        const balanceElement = document.getElementById('hbar-balance');
        
        if (this.isConnected) {
            addressElement.textContent = `Wallet: ${this.accountId}`;
            balanceElement.textContent = `Balance: ${this.balance} HBAR`;
        } else {
            addressElement.textContent = 'Wallet: Not Connected';
            balanceElement.textContent = 'Balance: 0 HBAR';
        }
    }
    
    async submitScore(score, playerName) {
        if (!this.isConnected) {
            alert('Please connect your wallet first!');
            return false;
        }
        
        if (this.balance < 1) {
            alert('Insufficient HBAR balance. You need at least 1 HBAR to submit a score.');
            return false;
        }
        
        try {
            // Simulate transaction
            console.log(`Submitting score: ${score} for player: ${playerName}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.balance -= 1; // Deduct fee
            this.updateWalletUI();
            
            alert(`Score submitted successfully!\nPlayer: ${playerName}\nScore: ${score}\nTransaction fee: 1 HBAR`);
            return true;
        } catch (error) {
            console.error('Score submission failed:', error);
            alert('Failed to submit score. Please try again.');
            return false;
        }
    }
    
    async purchaseShip(shipType, price) {
        if (!this.isConnected) {
            alert('Please connect your wallet first!');
            return false;
        }
        
        if (this.balance < price) {
            alert(`Insufficient HBAR balance. You need ${price} HBAR to purchase this ship.`);
            return false;
        }
        
        try {
            console.log(`Purchasing ship: ${shipType} for ${price} HBAR`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.balance -= price;
            this.updateWalletUI();
            
            alert(`Ship purchased successfully!\nType: ${shipType}\nPrice: ${price} HBAR\nNFT minted to your account.`);
            return true;
        } catch (error) {
            console.error('Ship purchase failed:', error);
            alert('Failed to purchase ship. Please try again.');
            return false;
        }
    }
}

// Global Hedera service instance
window.hederaService = new HederaService();

// Setup score submission
document.addEventListener('DOMContentLoaded', () => {
    const submitScoreBtn = document.getElementById('submit-score');
    if (submitScoreBtn) {
        submitScoreBtn.addEventListener('click', async () => {
            const playerName = document.getElementById('player-name').value.trim();
            if (!playerName) {
                alert('Please enter your name!');
                return;
            }
            
            const finalScore = parseInt(document.getElementById('final-score').textContent);
            await window.hederaService.submitScore(finalScore, playerName);
        });
    }
    
    // Connect wallet button
    const connectWalletBtn = document.getElementById('connect-wallet');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            if (window.hederaService.isConnected) {
                await window.hederaService.disconnectWallet();
                connectWalletBtn.textContent = '🔗 CONNECT WALLET';
            } else {
                const connected = await window.hederaService.connectWallet();
                if (connected) {
                    connectWalletBtn.textContent = '🔌 DISCONNECT WALLET';
                }
            }
        });
    }
});