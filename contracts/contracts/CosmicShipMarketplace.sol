// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title CosmicShipMarketplace
 * @dev Marketplace for trading Cosmic Ship NFTs and in-game items
 * @author MiniMax Agent
 */
contract CosmicShipMarketplace is ReentrancyGuard, Ownable {
    
    // In-game item types
    enum ItemType { WEAPON_UPGRADE, SHIELD_UPGRADE, SPEED_BOOST, LIVES_PACK }
    
    struct GameItem {
        ItemType itemType;
        uint256 price;
        uint256 quantity;
        bool isActive;
        string name;
        string description;
    }
    
    struct NFTListing {
        address seller;
        uint256 price;
        bool isActive;
        uint256 listedAt;
    }
    
    // Reference to the NFT contract
    IERC721 public cosmicShipNFT;
    
    // Game items available for purchase
    mapping(ItemType => GameItem) public gameItems;
    
    // NFT listings
    mapping(uint256 => NFTListing) public nftListings;
    
    // User purchases (for game integration)
    mapping(address => mapping(ItemType => uint256)) public userItems;
    
    // Events
    event ItemPurchased(address indexed buyer, ItemType itemType, uint256 quantity, uint256 totalCost);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTPurchased(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event NFTDelisted(uint256 indexed tokenId, address indexed seller);
    event ItemUpdated(ItemType itemType, uint256 price, uint256 quantity);
    
    constructor(address _nftContract, address initialOwner) {
        cosmicShipNFT = IERC721(_nftContract);
        _transferOwnership(initialOwner);
        
        // Initialize game items
        _initializeGameItems();
    }
    
    /**
     * @dev Initialize default game items
     */
    function _initializeGameItems() private {
        gameItems[ItemType.WEAPON_UPGRADE] = GameItem({
            itemType: ItemType.WEAPON_UPGRADE,
            price: 5 ether,  // 5 HBAR
            quantity: 1000,
            isActive: true,
            name: "Plasma Cannon Upgrade",
            description: "Increases weapon damage by 50%"
        });
        
        gameItems[ItemType.SHIELD_UPGRADE] = GameItem({
            itemType: ItemType.SHIELD_UPGRADE,
            price: 3 ether,  // 3 HBAR
            quantity: 1000,
            isActive: true,
            name: "Energy Shield Boost",
            description: "Increases shield capacity by 75%"
        });
        
        gameItems[ItemType.SPEED_BOOST] = GameItem({
            itemType: ItemType.SPEED_BOOST,
            price: 2 ether,  // 2 HBAR
            quantity: 1000,
            isActive: true,
            name: "Quantum Thruster",
            description: "Increases ship speed by 30% for one game"
        });
        
        gameItems[ItemType.LIVES_PACK] = GameItem({
            itemType: ItemType.LIVES_PACK,
            price: 1 ether,  // 1 HBAR
            quantity: 1000,
            isActive: true,
            name: "Life Support Pack",
            description: "Grants 3 extra lives"
        });
    }
    
    /**
     * @dev Purchase in-game items
     */
    function purchaseItem(ItemType itemType, uint256 quantity) external payable nonReentrant {
        GameItem storage item = gameItems[itemType];
        require(item.isActive, "Item not available");
        require(item.quantity >= quantity, "Insufficient stock");
        
        uint256 totalCost = item.price * quantity;
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Update stock
        item.quantity -= quantity;
        
        // Add items to user's inventory
        userItems[msg.sender][itemType] += quantity;
        
        emit ItemPurchased(msg.sender, itemType, quantity, totalCost);
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }
    
    /**
     * @dev List NFT for sale
     */
    function listNFT(uint256 tokenId, uint256 price) external {
        require(cosmicShipNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(cosmicShipNFT.isApprovedForAll(msg.sender, address(this)) || 
                cosmicShipNFT.getApproved(tokenId) == address(this), "Marketplace not approved");
        require(price > 0, "Price must be greater than 0");
        require(!nftListings[tokenId].isActive, "Already listed");
        
        nftListings[tokenId] = NFTListing({
            seller: msg.sender,
            price: price,
            isActive: true,
            listedAt: block.timestamp
        });
        
        emit NFTListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Purchase listed NFT
     */
    function purchaseNFT(uint256 tokenId) external payable nonReentrant {
        NFTListing storage listing = nftListings[tokenId];
        require(listing.isActive, "NFT not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        require(cosmicShipNFT.ownerOf(tokenId) == listing.seller, "Seller no longer owns NFT");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Remove listing
        listing.isActive = false;
        
        // Transfer NFT
        cosmicShipNFT.safeTransferFrom(seller, msg.sender, tokenId);
        
        // Calculate marketplace fee (5%)
        uint256 marketplaceFee = (price * 5) / 100;
        uint256 sellerAmount = price - marketplaceFee;
        
        // Transfer payments
        payable(seller).transfer(sellerAmount);
        // Marketplace fee stays in contract for owner withdrawal
        
        emit NFTPurchased(tokenId, msg.sender, seller, price);
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }
    
    /**
     * @dev Delist NFT
     */
    function delistNFT(uint256 tokenId) external {
        NFTListing storage listing = nftListings[tokenId];
        require(listing.isActive, "NFT not listed");
        require(listing.seller == msg.sender || owner() == msg.sender, "Not authorized");
        
        listing.isActive = false;
        emit NFTDelisted(tokenId, listing.seller);
    }
    
    /**
     * @dev Get user's item balance
     */
    function getUserItemBalance(address user, ItemType itemType) external view returns (uint256) {
        return userItems[user][itemType];
    }
    
    /**
     * @dev Use item (decrease user's balance) - only owner can call
     */
    function useItem(address user, ItemType itemType, uint256 quantity) external onlyOwner {
        require(userItems[user][itemType] >= quantity, "Insufficient items");
        userItems[user][itemType] -= quantity;
    }
    
    /**
     * @dev Update game item (only owner)
     */
    function updateGameItem(
        ItemType itemType,
        uint256 price,
        uint256 quantity,
        bool isActive,
        string memory name,
        string memory description
    ) external onlyOwner {
        gameItems[itemType] = GameItem({
            itemType: itemType,
            price: price,
            quantity: quantity,
            isActive: isActive,
            name: name,
            description: description
        });
        
        emit ItemUpdated(itemType, price, quantity);
    }
    
    /**
     * @dev Get all active NFT listings
     */
    function getActiveListings() external view returns (uint256[] memory) {
        // This is a simple implementation - in production, you might want pagination
        uint256[] memory tempArray = new uint256[](1000); // Adjust size as needed
        uint256 count = 0;
        
        // Check up to 10000 token IDs (adjust based on your NFT contract)
        for (uint256 i = 0; i < 10000; i++) {
            if (nftListings[i].isActive) {
                tempArray[count] = i;
                count++;
            }
        }
        
        // Create properly sized array
        uint256[] memory activeListings = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            activeListings[i] = tempArray[i];
        }
        
        return activeListings;
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
}