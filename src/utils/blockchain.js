// Blockchain utilities for Cosmic Collector
import { ethers } from 'ethers';
import { mockContracts, CONTRACT_ADDRESSES as MOCK_ADDRESSES } from './mockContracts.js';

// Contract addresses (will be updated after deployment)
const CONTRACT_ADDRESSES = {
    COSMIC_COLLECTOR: process.env.REACT_APP_COSMIC_COLLECTOR_ADDRESS || '',
    COSMIC_NFT: process.env.REACT_APP_COSMIC_NFT_ADDRESS || '',
    COSMIC_MARKETPLACE: process.env.REACT_APP_COSMIC_MARKETPLACE_ADDRESS || ''
};

// Development mode - use mock contracts if real addresses aren't available
const USE_MOCK_CONTRACTS = !CONTRACT_ADDRESSES.COSMIC_COLLECTOR || process.env.REACT_APP_USE_MOCK === 'true';

// Hedera Testnet configuration
const HEDERA_TESTNET = {
    chainId: '0x128', // 296 in decimal
    chainName: 'Hedera Testnet',
    nativeCurrency: {
        name: 'HBAR',
        symbol: 'HBAR',
        decimals: 18
    },
    rpcUrls: ['https://testnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/testnet']
};

let provider = null;
let signer = null;
let contracts = {};

// Initialize blockchain connection
export const initializeBlockchain = async () => {
    if (USE_MOCK_CONTRACTS) {
        console.log('🎮 Using mock contracts for development');
        await mockContracts.wallet.connect();
        return true;
    }

    try {
        if (typeof window.ethereum !== 'undefined') {
            provider = new ethers.BrowserProvider(window.ethereum);
            
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Add Hedera Testnet if not present
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: HEDERA_TESTNET.chainId }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [HEDERA_TESTNET],
                    });
                }
            }
            
            signer = await provider.getSigner();
            
            // Initialize contracts if addresses are available
            if (CONTRACT_ADDRESSES.COSMIC_COLLECTOR) {
                await initializeContracts();
            }
            
            return true;
        } else {
            console.warn('MetaMask not found. Please install MetaMask.');
            return false;
        }
    } catch (error) {
        console.error('Error initializing blockchain:', error);
        return false;
    }
};

// Contract ABIs (simplified for demo)
const COSMIC_COLLECTOR_ABI = [
    "function getPlayerStats(address player) view returns (uint256 score, uint256 level, uint256 cosmicEnergy, uint256 itemsCollected)",
    "function updateScore(uint256 newScore) external",
    "function collectItem(string itemType, uint256 value) external",
    "function getLeaderboard() view returns (address[] memory players, uint256[] memory scores)"
];

const COSMIC_NFT_ABI = [
    "function mintCollectible(address to, string itemType, string rarity) external returns (uint256)",
    "function getPlayerNFTs(address player) view returns (uint256[] memory)",
    "function tokenURI(uint256 tokenId) view returns (string memory)"
];

const COSMIC_MARKETPLACE_ABI = [
    "function listNFT(uint256 tokenId, uint256 price) external returns (uint256)",
    "function getActiveListings() view returns (uint256[] memory, uint256[] memory, uint256[] memory)",
    "function buyNFT(uint256 listingId) external payable"
];

// Initialize contracts
const initializeContracts = async () => {
    if (!signer) throw new Error('Signer not initialized');
    
    contracts.cosmicCollector = new ethers.Contract(
        CONTRACT_ADDRESSES.COSMIC_COLLECTOR,
        COSMIC_COLLECTOR_ABI,
        signer
    );
    
    contracts.cosmicNFT = new ethers.Contract(
        CONTRACT_ADDRESSES.COSMIC_NFT,
        COSMIC_NFT_ABI,
        signer
    );
    
    contracts.cosmicMarketplace = new ethers.Contract(
        CONTRACT_ADDRESSES.COSMIC_MARKETPLACE,
        COSMIC_MARKETPLACE_ABI,
        signer
    );
};

// Player functions
export const getPlayerStats = async (address) => {
    try {
        if (USE_MOCK_CONTRACTS) {
            return await mockContracts.cosmicCollector.getPlayerStats(address);
        }
        
        if (!contracts.cosmicCollector) {
            throw new Error('Contract not initialized');
        }
        
        const stats = await contracts.cosmicCollector.getPlayerStats(address);
        return {
            score: Number(stats.score),
            level: Number(stats.level),
            cosmicEnergy: Number(stats.cosmicEnergy),
            itemsCollected: Number(stats.itemsCollected)
        };
    } catch (error) {
        console.error('Error getting player stats:', error);
        return { score: 0, level: 1, cosmicEnergy: 100, itemsCollected: 0 };
    }
};

export const updatePlayerScore = async (newScore) => {
    try {
        if (USE_MOCK_CONTRACTS) {
            const address = mockContracts.wallet.account;
            return await mockContracts.cosmicCollector.updateScore(address, newScore);
        }
        
        if (!contracts.cosmicCollector) {
            throw new Error('Contract not initialized');
        }
        
        const tx = await contracts.cosmicCollector.updateScore(newScore);
        await tx.wait();
        return true;
    } catch (error) {
        console.error('Error updating score:', error);
        return false;
    }
};

export const collectItem = async (itemType, value) => {
    try {
        if (USE_MOCK_CONTRACTS) {
            const address = mockContracts.wallet.account;
            return await mockContracts.cosmicCollector.collectItem(address, itemType, value);
        }
        
        if (!contracts.cosmicCollector) {
            throw new Error('Contract not initialized');
        }
        
        const tx = await contracts.cosmicCollector.collectItem(itemType, value);
        await tx.wait();
        return true;
    } catch (error) {
        console.error('Error collecting item:', error);
        return false;
    }
};

export const getLeaderboard = async () => {
    try {
        if (USE_MOCK_CONTRACTS) {
            return await mockContracts.cosmicCollector.getLeaderboard();
        }
        
        if (!contracts.cosmicCollector) {
            throw new Error('Contract not initialized');
        }
        
        const [players, scores] = await contracts.cosmicCollector.getLeaderboard();
        return players.map((player, index) => ({
            address: player,
            score: Number(scores[index])
        }));
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
};

// NFT functions
export const mintNFT = async (itemType, rarity) => {
    try {
        if (USE_MOCK_CONTRACTS) {
            const address = mockContracts.wallet.account;
            return await mockContracts.cosmicNFT.mintCollectible(address, itemType, rarity);
        }
        
        if (!contracts.cosmicNFT) {
            throw new Error('Contract not initialized');
        }
        
        const address = await signer.getAddress();
        const tx = await contracts.cosmicNFT.mintCollectible(address, itemType, rarity);
        const receipt = await tx.wait();
        
        // Extract token ID from events (simplified)
        return { success: true, tokenId: receipt.logs.length };
    } catch (error) {
        console.error('Error minting NFT:', error);
        return { success: false, error: error.message };
    }
};

export const getPlayerNFTs = async (address) => {
    try {
        if (USE_MOCK_CONTRACTS) {
            return await mockContracts.cosmicNFT.getPlayerNFTs(address);
        }
        
        if (!contracts.cosmicNFT) {
            throw new Error('Contract not initialized');
        }
        
        const tokenIds = await contracts.cosmicNFT.getPlayerNFTs(address);
        return tokenIds.map(id => Number(id));
    } catch (error) {
        console.error('Error getting player NFTs:', error);
        return [];
    }
};

// Marketplace functions
export const listNFTForSale = async (tokenId, price) => {
    try {
        if (USE_MOCK_CONTRACTS) {
            const address = mockContracts.wallet.account;
            return await mockContracts.cosmicMarketplace.listNFT(tokenId, price, address);
        }
        
        if (!contracts.cosmicMarketplace) {
            throw new Error('Contract not initialized');
        }
        
        const tx = await contracts.cosmicMarketplace.listNFT(tokenId, ethers.parseEther(price.toString()));
        await tx.wait();
        return true;
    } catch (error) {
        console.error('Error listing NFT:', error);
        return false;
    }
};

export const buyNFT = async (listingId, price) => {
    try {
        if (USE_MOCK_CONTRACTS) {
            const address = mockContracts.wallet.account;
            return await mockContracts.cosmicMarketplace.buyNFT(listingId, address);
        }
        
        if (!contracts.cosmicMarketplace) {
            throw new Error('Contract not initialized');
        }
        
        const tx = await contracts.cosmicMarketplace.buyNFT(listingId, {
            value: ethers.parseEther(price.toString())
        });
        await tx.wait();
        return true;
    } catch (error) {
        console.error('Error buying NFT:', error);
        return false;
    }
};

export const getMarketplaceListings = async () => {
    try {
        if (USE_MOCK_CONTRACTS) {
            return await mockContracts.cosmicMarketplace.getActiveListings();
        }
        
        if (!contracts.cosmicMarketplace) {
            throw new Error('Contract not initialized');
        }
        
        const [listingIds, tokenIds, prices] = await contracts.cosmicMarketplace.getActiveListings();
        return listingIds.map((id, index) => ({
            listingId: Number(id),
            tokenId: Number(tokenIds[index]),
            price: ethers.formatEther(prices[index])
        }));
    } catch (error) {
        console.error('Error getting marketplace listings:', error);
        return [];
    }
};

// Utility functions
export const getWalletAddress = async () => {
    if (USE_MOCK_CONTRACTS) {
        return mockContracts.wallet.account;
    }
    
    if (!signer) return null;
    return await signer.getAddress();
};

export const getWalletBalance = async () => {
    if (USE_MOCK_CONTRACTS) {
        return (await mockContracts.wallet.getBalance()).toString();
    }
    
    if (!provider || !signer) return '0';
    
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
};

export const getCurrentContractAddresses = () => {
    if (USE_MOCK_CONTRACTS) {
        return MOCK_ADDRESSES;
    }
    return CONTRACT_ADDRESSES;
};

export const isUsingMockContracts = () => USE_MOCK_CONTRACTS;

export { CONTRACT_ADDRESSES };