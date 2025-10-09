// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CosmicShipNFT
 * @dev NFT contract for Cosmic Collector game ships
 * @author MiniMax Agent
 */
contract CosmicShipNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    
    // Ship types and their properties
    enum ShipType { BASIC, ADVANCED, LEGENDARY }
    
    struct Ship {
        ShipType shipType;
        uint256 mintedAt;
        uint256 level;
        uint256 experience;
        string customName;
    }
    
    // Mapping from token ID to ship data
    mapping(uint256 => Ship) public ships;
    
    // Mapping from ship type to mint price
    mapping(ShipType => uint256) public mintPrices;
    
    // Events
    event ShipMinted(address indexed to, uint256 indexed tokenId, ShipType shipType);
    event ShipUpgraded(uint256 indexed tokenId, uint256 newLevel);
    event ExperienceGained(uint256 indexed tokenId, uint256 experience);
    
    constructor(address initialOwner) ERC721("Cosmic Ship", "CSHIP") {
        _transferOwnership(initialOwner);
        
        // Set initial mint prices (in wei)
        mintPrices[ShipType.BASIC] = 10 ether;      // 10 HBAR
        mintPrices[ShipType.ADVANCED] = 25 ether;   // 25 HBAR
        mintPrices[ShipType.LEGENDARY] = 50 ether;  // 50 HBAR
    }
    
    /**
     * @dev Mint a new ship NFT
     */
    function mintShip(
        address to,
        ShipType shipType,
        string memory tokenURI,
        string memory customName
    ) public payable nonReentrant {
        require(msg.value >= mintPrices[shipType], "Insufficient payment");
        require(bytes(tokenURI).length > 0, "Token URI required");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        ships[tokenId] = Ship({
            shipType: shipType,
            mintedAt: block.timestamp,
            level: 1,
            experience: 0,
            customName: customName
        });
        
        emit ShipMinted(to, tokenId, shipType);
        
        // Transfer excess payment back
        if (msg.value > mintPrices[shipType]) {
            payable(msg.sender).transfer(msg.value - mintPrices[shipType]);
        }
    }
    
    /**
     * @dev Add experience to a ship (only owner can call)
     */
    function addExperience(uint256 tokenId, uint256 exp) external {
        require(_exists(tokenId), "Ship does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not ship owner");
        
        ships[tokenId].experience += exp;
        
        // Level up logic (every 1000 experience = 1 level)
        uint256 newLevel = (ships[tokenId].experience / 1000) + 1;
        if (newLevel > ships[tokenId].level) {
            ships[tokenId].level = newLevel;
            emit ShipUpgraded(tokenId, newLevel);
        }
        
        emit ExperienceGained(tokenId, exp);
    }
    
    /**
     * @dev Get ship details
     */
    function getShip(uint256 tokenId) external view returns (Ship memory) {
        require(_exists(tokenId), "Ship does not exist");
        return ships[tokenId];
    }
    
    /**
     * @dev Get user's ships
     */
    function getUserShips(address user) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(user);
        uint256[] memory userShips = new uint256[](balance);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && ownerOf(i) == user) {
                userShips[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return userShips;
    }
    
    /**
     * @dev Update mint prices (only owner)
     */
    function updateMintPrice(ShipType shipType, uint256 newPrice) external onlyOwner {
        mintPrices[shipType] = newPrice;
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Get total supply
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    // Override functions for ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}