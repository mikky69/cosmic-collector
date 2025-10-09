// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CosmicShipMarketplace
 * @dev Marketplace contract for buying and selling Cosmic Collector ships
 * @author Mikky Studio
 */
contract CosmicShipMarketplace is Ownable, ReentrancyGuard {
    
    // Ship types and prices in tinybars (1 HBAR = 100,000,000 tinybars)
    enum ShipType { CLASSIC, SPEED, TANK, STEALTH }
    
    struct ShipListing {
        ShipType shipType;
        uint256 price;
        bool available;
        uint256 totalSold;
    }
    
    // Ship listings
    mapping(ShipType => ShipListing) public shipListings;
    
    // Purchased ships by user
    mapping(address => mapping(ShipType => bool)) public userShips;
    mapping(address => ShipType[]) public userShipList;
    
    // Sales tracking
    uint256 public totalSales;
    uint256 public totalRevenue;
    
    // Events
    event ShipPurchased(
        address indexed buyer,
        ShipType shipType,
        uint256 price,
        uint256 timestamp
    );
    
    event PriceUpdated(
        ShipType shipType,
        uint256 oldPrice,
        uint256 newPrice
    );
    
    constructor() {
        // Initialize ship prices (in tinybars)
        shipListings[ShipType.CLASSIC] = ShipListing({
            shipType: ShipType.CLASSIC,
            price: 500000000,  // 5 HBAR
            available: true,
            totalSold: 0
        });
        
        shipListings[ShipType.SPEED] = ShipListing({
            shipType: ShipType.SPEED,
            price: 800000000,  // 8 HBAR
            available: true,
            totalSold: 0
        });
        
        shipListings[ShipType.TANK] = ShipListing({
            shipType: ShipType.TANK,
            price: 1200000000, // 12 HBAR
            available: true,
            totalSold: 0
        });
        
        shipListings[ShipType.STEALTH] = ShipListing({
            shipType: ShipType.STEALTH,
            price: 1500000000, // 15 HBAR
            available: true,
            totalSold: 0
        });
    }
    
    /**
     * @dev Purchase a ship
     * @param shipType Type of ship to purchase
     */
    function purchaseShip(ShipType shipType) public payable nonReentrant {
        ShipListing storage listing = shipListings[shipType];
        
        require(listing.available, "Ship type not available");
        require(msg.value >= listing.price, "Insufficient payment");
        require(!userShips[msg.sender][shipType], "Ship already owned");
        
        // Mark ship as owned
        userShips[msg.sender][shipType] = true;
        userShipList[msg.sender].push(shipType);
        
        // Update sales stats
        listing.totalSold++;
        totalSales++;
        totalRevenue += listing.price;
        
        // Send payment to contract owner (creator)
        payable(owner()).transfer(listing.price);
        
        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        emit ShipPurchased(msg.sender, shipType, listing.price, block.timestamp);
    }
    
    /**
     * @dev Get user's purchased ships
     * @param user Address to query
     * @return Array of owned ship types
     */
    function getUserShips(address user) public view returns (ShipType[] memory) {
        return userShipList[user];
    }
    
    /**
     * @dev Check if user owns a specific ship type
     * @param user Address to query
     * @param shipType Ship type to check
     * @return True if user owns the ship
     */
    function ownsShip(address user, ShipType shipType) public view returns (bool) {
        return userShips[user][shipType];
    }
    
    /**
     * @dev Get ship price
     * @param shipType Ship type to query
     * @return Price in tinybars
     */
    function getShipPrice(ShipType shipType) public view returns (uint256) {
        return shipListings[shipType].price;
    }
    
    /**
     * @dev Get ship listing details
     * @param shipType Ship type to query
     * @return Ship listing struct
     */
    function getShipListing(ShipType shipType) public view returns (ShipListing memory) {
        return shipListings[shipType];
    }
    
    /**
     * @dev Update ship price (owner only)
     * @param shipType Ship type to update
     * @param newPrice New price in tinybars
     */
    function updateShipPrice(ShipType shipType, uint256 newPrice) public onlyOwner {
        uint256 oldPrice = shipListings[shipType].price;
        shipListings[shipType].price = newPrice;
        
        emit PriceUpdated(shipType, oldPrice, newPrice);
    }
    
    /**
     * @dev Toggle ship availability (owner only)
     * @param shipType Ship type to toggle
     * @param available New availability status
     */
    function setShipAvailability(ShipType shipType, bool available) public onlyOwner {
        shipListings[shipType].available = available;
    }
    
    /**
     * @dev Get total sales stats
     * @return totalSales, totalRevenue
     */
    function getSalesStats() public view returns (uint256, uint256) {
        return (totalSales, totalRevenue);
    }
    
    /**
     * @dev Get sales stats for a specific ship type
     * @param shipType Ship type to query
     * @return Total sold for this ship type
     */
    function getShipSalesCount(ShipType shipType) public view returns (uint256) {
        return shipListings[shipType].totalSold;
    }
    
    /**
     * @dev Withdraw contract balance to owner
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Emergency pause all sales (owner only)
     */
    function pauseAllSales() public onlyOwner {
        shipListings[ShipType.CLASSIC].available = false;
        shipListings[ShipType.SPEED].available = false;
        shipListings[ShipType.TANK].available = false;
        shipListings[ShipType.STEALTH].available = false;
    }
    
    /**
     * @dev Resume all sales (owner only)
     */
    function resumeAllSales() public onlyOwner {
        shipListings[ShipType.CLASSIC].available = true;
        shipListings[ShipType.SPEED].available = true;
        shipListings[ShipType.TANK].available = true;
        shipListings[ShipType.STEALTH].available = true;
    }
}