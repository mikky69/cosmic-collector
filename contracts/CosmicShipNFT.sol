// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CosmicShipNFT
 * @dev NFT contract for Cosmic Collector spaceship NFTs
 * @author Mikky Studio
 */
contract CosmicShipNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Ship types and their properties
    enum ShipType { CLASSIC, SPEED, TANK, STEALTH }
    enum Rarity { COMMON, UNCOMMON, RARE, LEGENDARY }
    
    struct ShipAttributes {
        ShipType shipType;
        Rarity rarity;
        uint256 speed;
        uint256 armor;
        uint256 firepower;
        uint256 mintBlock;
        string metadataURI;
    }
    
    // Mapping from token ID to ship attributes
    mapping(uint256 => ShipAttributes) public shipAttributes;
    
    // Mapping from owner to list of token IDs
    mapping(address => uint256[]) public ownerTokens;
    
    // Minting prices in tinybars (1 HBAR = 100,000,000 tinybars)
    uint256 public constant MINT_PRICE = 1000000000; // 10 HBAR in tinybars
    
    // Events
    event ShipMinted(
        uint256 indexed tokenId, 
        address indexed owner, 
        ShipType shipType, 
        Rarity rarity
    );
    
    event ShipTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    
    constructor() ERC721("Cosmic Ship NFT", "COSMIC") {}
    
    /**
     * @dev Mint a new spaceship NFT
     * @param to Address to mint the NFT to
     * @param shipType Type of ship to mint
     * @param metadataURI IPFS URI for metadata
     */
    function mintShip(
        address to, 
        ShipType shipType, 
        string memory metadataURI
    ) public payable returns (uint256) {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Generate ship attributes
        Rarity rarity = _generateRarity();
        (uint256 speed, uint256 armor, uint256 firepower) = _generateStats(shipType, rarity);
        
        // Store ship attributes
        shipAttributes[tokenId] = ShipAttributes({
            shipType: shipType,
            rarity: rarity,
            speed: speed,
            armor: armor,
            firepower: firepower,
            mintBlock: block.number,
            metadataURI: metadataURI
        });
        
        // Add to owner's token list
        ownerTokens[to].push(tokenId);
        
        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        // Send payment to contract owner (creator)
        payable(owner()).transfer(msg.value);
        
        emit ShipMinted(tokenId, to, shipType, rarity);
        
        return tokenId;
    }
    
    /**
     * @dev Get all NFTs owned by an address
     * @param owner Address to query
     * @return Array of token IDs
     */
    function getOwnerTokens(address owner) public view returns (uint256[] memory) {
        return ownerTokens[owner];
    }
    
    /**
     * @dev Get ship attributes for a token ID
     * @param tokenId Token ID to query
     * @return Ship attributes struct
     */
    function getShipAttributes(uint256 tokenId) public view returns (ShipAttributes memory) {
        require(_exists(tokenId), "Token does not exist");
        return shipAttributes[tokenId];
    }
    
    /**
     * @dev Generate random rarity based on probabilities
     * @return Generated rarity
     */
    function _generateRarity() private view returns (Rarity) {
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, _tokenIdCounter.current()))) % 100;
        
        if (rand < 50) return Rarity.COMMON;        // 50%
        if (rand < 80) return Rarity.UNCOMMON;      // 30%
        if (rand < 95) return Rarity.RARE;          // 15%
        return Rarity.LEGENDARY;                     // 5%
    }
    
    /**
     * @dev Generate ship stats based on type and rarity
     * @param shipType Type of ship
     * @param rarity Rarity of ship
     * @return speed, armor, firepower stats
     */
    function _generateStats(ShipType shipType, Rarity rarity) private view returns (uint256, uint256, uint256) {
        uint256 baseSpeed = 5;
        uint256 baseArmor = 5;
        uint256 baseFirepower = 5;
        
        // Adjust base stats by ship type
        if (shipType == ShipType.SPEED) {
            baseSpeed += 3;
            baseArmor -= 1;
        } else if (shipType == ShipType.TANK) {
            baseArmor += 3;
            baseSpeed -= 1;
        } else if (shipType == ShipType.STEALTH) {
            baseFirepower += 2;
            baseSpeed += 1;
            baseArmor -= 1;
        }
        
        // Adjust by rarity
        uint256 rarityBonus = uint256(rarity) * 2;
        baseSpeed += rarityBonus;
        baseArmor += rarityBonus;
        baseFirepower += rarityBonus;
        
        // Add some randomness
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        baseSpeed += randomSeed % 3;
        baseArmor += (randomSeed >> 8) % 3;
        baseFirepower += (randomSeed >> 16) % 3;
        
        // Cap at 10
        if (baseSpeed > 10) baseSpeed = 10;
        if (baseArmor > 10) baseArmor = 10;
        if (baseFirepower > 10) baseFirepower = 10;
        
        return (baseSpeed, baseArmor, baseFirepower);
    }
    
    /**
     * @dev Override transfer to update owner token list
     */
    function _transfer(address from, address to, uint256 tokenId) internal override {
        super._transfer(from, to, tokenId);
        
        // Remove from old owner's list
        uint256[] storage fromTokens = ownerTokens[from];
        for (uint256 i = 0; i < fromTokens.length; i++) {
            if (fromTokens[i] == tokenId) {
                fromTokens[i] = fromTokens[fromTokens.length - 1];
                fromTokens.pop();
                break;
            }
        }
        
        // Add to new owner's list
        ownerTokens[to].push(tokenId);
        
        emit ShipTransferred(tokenId, from, to);
    }
    
    /**
     * @dev Get total number of minted tokens
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
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
     * @dev Required override for ERC721URIStorage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    /**
     * @dev Required override for ERC721URIStorage
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}