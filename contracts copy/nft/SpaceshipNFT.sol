// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/GameTypes.sol";
import "../core/AccessControl.sol";

contract SpaceshipNFT is 
    Initializable, 
    ERC721Upgradeable, 
    ERC721URIStorageUpgradeable,
    UUPSUpgradeable 
{
    CosmicAccessControl public accessControl;
    
    uint256 private _tokenIdCounter;
    
    // Ship stats for each token
    mapping(uint256 => GameTypes.ShipStats) public shipStats;
    
    // Minting configuration
    mapping(GameTypes.ShipType => uint256) public mintPrice;
    mapping(GameTypes.ShipRarity => uint256) public rarityWeight;
    
    // Events
    event ShipMinted(address indexed to, uint256 indexed tokenId, GameTypes.ShipType shipType, GameTypes.ShipRarity rarity);
    event ShipStatsUpdated(uint256 indexed tokenId, GameTypes.ShipStats stats);
    event MintPriceUpdated(GameTypes.ShipType shipType, uint256 newPrice);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _accessControl) public initializer {
        __ERC721_init("Cosmic Spaceship", "CSHIP");
        __ERC721URIStorage_init();
        __UUPSUpgradeable_init();

        accessControl = CosmicAccessControl(_accessControl);
        
        // Set default mint prices (in wei, will be paid in HBAR on Hedera)
        mintPrice[GameTypes.ShipType.ClassicFighter] = 5 ether;
        mintPrice[GameTypes.ShipType.SpeedRacer] = 8 ether;
        mintPrice[GameTypes.ShipType.HeavyTank] = 12 ether;
        mintPrice[GameTypes.ShipType.StealthNinja] = 15 ether;

        // Set rarity weights
        rarityWeight[GameTypes.ShipRarity.Common] = 60;    // 60%
        rarityWeight[GameTypes.ShipRarity.Uncommon] = 25;  // 25%
        rarityWeight[GameTypes.ShipRarity.Rare] = 12;      // 12%
        rarityWeight[GameTypes.ShipRarity.Epic] = 3;       // 3%
    }

    /**
     * @notice Mint a new spaceship NFT
     * @param to Recipient address
     * @param shipType Type of ship to mint
     * @param metadataURI IPFS URI for metadata
     */
    function mint(
        address to,
        GameTypes.ShipType shipType,
        string memory metadataURI
    ) external payable returns (uint256) {
        require(msg.value >= mintPrice[shipType], "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Generate random rarity
        GameTypes.ShipRarity rarity = _generateRarity(tokenId);
        
        // Generate ship stats based on type and rarity
        GameTypes.ShipStats memory stats = _generateShipStats(shipType, rarity);
        shipStats[tokenId] = stats;

        emit ShipMinted(to, tokenId, shipType, rarity);
        
        return tokenId;
    }

    /**
     * @notice Mint ship for admin/rewards (free)
     */
    function mintReward(
        address to,
        GameTypes.ShipType shipType,
        GameTypes.ShipRarity rarity,
        string memory metadataURI
    ) external returns (uint256) {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        GameTypes.ShipStats memory stats = _generateShipStats(shipType, rarity);
        shipStats[tokenId] = stats;

        emit ShipMinted(to, tokenId, shipType, rarity);
        
        return tokenId;
    }

    /**
     * @notice Generate ship stats based on type and rarity
     */
    function _generateShipStats(
        GameTypes.ShipType shipType,
        GameTypes.ShipRarity rarity
    ) internal pure returns (GameTypes.ShipStats memory) {
        GameTypes.ShipStats memory stats;
        stats.shipType = shipType;
        stats.rarity = rarity;

        // Base stats by ship type
        if (shipType == GameTypes.ShipType.ClassicFighter) {
            stats.speed = 60;
            stats.armor = 60;
            stats.firepower = 60;
            stats.luck = 50;
            stats.hasSpecialAbility = false;
            stats.pointsMultiplier = 10000; // 1x
        } else if (shipType == GameTypes.ShipType.SpeedRacer) {
            stats.speed = 90;
            stats.armor = 40;
            stats.firepower = 50;
            stats.luck = 60;
            stats.hasSpecialAbility = false;
            stats.pointsMultiplier = 11000; // 1.1x
        } else if (shipType == GameTypes.ShipType.HeavyTank) {
            stats.speed = 40;
            stats.armor = 90;
            stats.firepower = 70;
            stats.luck = 40;
            stats.hasSpecialAbility = false;
            stats.pointsMultiplier = 12000; // 1.2x
        } else if (shipType == GameTypes.ShipType.StealthNinja) {
            stats.speed = 75;
            stats.armor = 55;
            stats.firepower = 65;
            stats.luck = 70;
            stats.hasSpecialAbility = true;
            stats.pointsMultiplier = 13000; // 1.3x
        }

        // Rarity bonuses
        uint8 rarityBonus = 0;
        uint256 multiplierBonus = 0;
        
        if (rarity == GameTypes.ShipRarity.Uncommon) {
            rarityBonus = 5;
            multiplierBonus = 1000; // +0.1x
        } else if (rarity == GameTypes.ShipRarity.Rare) {
            rarityBonus = 10;
            multiplierBonus = 2500; // +0.25x
        } else if (rarity == GameTypes.ShipRarity.Epic) {
            rarityBonus = 20;
            multiplierBonus = 5000; // +0.5x
        }

        stats.speed = _capStat(stats.speed + rarityBonus);
        stats.armor = _capStat(stats.armor + rarityBonus);
        stats.firepower = _capStat(stats.firepower + rarityBonus);
         stats.luck = _capStat(stats.luck + rarityBonus);
        stats.pointsMultiplier += multiplierBonus;

        return stats;
    }

    /**
     * @notice Generate random rarity based on weights
     */
    function _generateRarity(uint256 seed) internal view returns (GameTypes.ShipRarity) {
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            seed,
            msg.sender
        ))) % 100;

        if (random < rarityWeight[GameTypes.ShipRarity.Epic]) {
            return GameTypes.ShipRarity.Epic;
        } else if (random < rarityWeight[GameTypes.ShipRarity.Epic] + rarityWeight[GameTypes.ShipRarity.Rare]) {
            return GameTypes.ShipRarity.Rare;
        } else if (random < 100 - rarityWeight[GameTypes.ShipRarity.Common]) {
            return GameTypes.ShipRarity.Uncommon;
        }
        return GameTypes.ShipRarity.Common;
    }

    /**
     * @notice Cap stat at 100
     */
    function _capStat(uint8 stat) internal pure returns (uint8) {
        return stat > 100 ? 100 : stat;
    }

    /**
     * @notice Get ship stats
     */
    function getShipStats(uint256 tokenId) external view returns (GameTypes.ShipStats memory) {
        require(_ownerOf(tokenId) != address(0), "Ship does not exist");
        return shipStats[tokenId];
    }

    /**
     * @notice Update mint price
     */
    function setMintPrice(GameTypes.ShipType shipType, uint256 newPrice) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        mintPrice[shipType] = newPrice;
        emit MintPriceUpdated(shipType, newPrice);
    }

    /**
     * @notice Withdraw funds to treasury
     */
    function withdraw() external {
        require(
            accessControl.hasRole(accessControl.TREASURY_ROLE(), msg.sender),
            "Not authorized"
        );
        payable(msg.sender).transfer(address(this).balance);
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    {
        super._burn(tokenId);
    }

    function _authorizeUpgrade(address _newImplementation) internal view override {
        require(
            accessControl.hasRole(accessControl.OWNER_ROLE(), msg.sender),
            "Not authorized"
        );
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}