// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "../libraries/GameTypes.sol";
import "../core/AccessControl.sol";
import "./SpaceshipNFT.sol";

/**
 * @title NFTManager
 * @author John Kenechukwu (Asmodeus)
 * @notice Manages NFT operations, upgrades, and HTS integration
 */
contract NFTManager is Initializable, UUPSUpgradeable {
    CosmicAccessControl public accessControl;
    SpaceshipNFT public spaceshipNFT;
    
    // HTS NFT Token ID
    string public htsNFTTokenId;
    
    // Upgrade system
    struct UpgradeCost {
        uint256 cosmCost;
        uint256 cooldownPeriod;
        uint8 maxUpgradeLevel;
    }
    
    mapping(GameTypes.ShipType => UpgradeCost) public upgradeCosts;
    mapping(uint256 => uint8) public upgradeLevel; // tokenId => level
    mapping(uint256 => uint256) public lastUpgradeTime;
    
    // Crafting system (combine 2 ships to get better one)
    struct CraftingRecipe {
        GameTypes.ShipRarity inputRarity;
        GameTypes.ShipRarity outputRarity;
        uint256 cosmCost;
        bool enabled;
    }
    
    mapping(uint8 => CraftingRecipe) public craftingRecipes;
    
    // NFT metadata URIs
    mapping(uint256 => string) public tokenURIs;
    
    // Events
    event NFTUpgraded(uint256 indexed tokenId, uint8 newLevel);
    event NFTsCrafted(uint256 indexed input1, uint256 indexed input2, uint256 indexed output);
    event HTSNFTTokenIdSet(string tokenId);
    event UpgradeCostUpdated(GameTypes.ShipType shipType, uint256 cost);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _accessControl,
        address _spaceshipNFT
    ) public initializer {
        __UUPSUpgradeable_init();
        
        accessControl = CosmicAccessControl(_accessControl);
        spaceshipNFT = SpaceshipNFT(_spaceshipNFT);
        
        // Initialize default upgrade costs
        upgradeCosts[GameTypes.ShipType.ClassicFighter] = UpgradeCost({
            cosmCost: 100 ether,
            cooldownPeriod: 24 hours,
            maxUpgradeLevel: 10
        });
        
        upgradeCosts[GameTypes.ShipType.SpeedRacer] = UpgradeCost({
            cosmCost: 150 ether,
            cooldownPeriod: 24 hours,
            maxUpgradeLevel: 10
        });
        
        upgradeCosts[GameTypes.ShipType.HeavyTank] = UpgradeCost({
            cosmCost: 200 ether,
            cooldownPeriod: 24 hours,
            maxUpgradeLevel: 10
        });
        
        upgradeCosts[GameTypes.ShipType.StealthNinja] = UpgradeCost({
            cosmCost: 250 ether,
            cooldownPeriod: 24 hours,
            maxUpgradeLevel: 10
        });
        
        // Initialize crafting recipes
        craftingRecipes[0] = CraftingRecipe({
            inputRarity: GameTypes.ShipRarity.Common,
            outputRarity: GameTypes.ShipRarity.Uncommon,
            cosmCost: 500 ether,
            enabled: true
        });
        
        craftingRecipes[1] = CraftingRecipe({
            inputRarity: GameTypes.ShipRarity.Uncommon,
            outputRarity: GameTypes.ShipRarity.Rare,
            cosmCost: 1000 ether,
            enabled: true
        });
        
        craftingRecipes[2] = CraftingRecipe({
            inputRarity: GameTypes.ShipRarity.Rare,
            outputRarity: GameTypes.ShipRarity.Epic,
            cosmCost: 2000 ether,
            enabled: true
        });
    }

    /**
     * @notice Upgrade NFT stats
     * @param tokenId NFT to upgrade
     */
    function upgradeNFT(uint256 tokenId) external payable {
        require(spaceshipNFT.ownerOf(tokenId) == msg.sender, "Not owner");
        
        GameTypes.ShipStats memory stats = spaceshipNFT.getShipStats(tokenId);
        UpgradeCost memory cost = upgradeCosts[stats.shipType];
        
        uint8 currentLevel = upgradeLevel[tokenId];
        require(currentLevel < cost.maxUpgradeLevel, "Max level reached");
        
        // Check cooldown
        require(
            block.timestamp >= lastUpgradeTime[tokenId] + cost.cooldownPeriod,
            "Cooldown active"
        );
        
        // Payment would be in $COSM in production
        require(msg.value >= cost.cosmCost, "Insufficient payment");
        
        // Upgrade level
        upgradeLevel[tokenId]++;
        lastUpgradeTime[tokenId] = block.timestamp;
        
        emit NFTUpgraded(tokenId, currentLevel + 1);
    }

    /**
     * @notice Craft two NFTs into a better one
     * @param tokenId1 First NFT to burn
     * @param tokenId2 Second NFT to burn
     */
    function craftNFTs(uint256 tokenId1, uint256 tokenId2) external returns (uint256) {
        require(spaceshipNFT.ownerOf(tokenId1) == msg.sender, "Not owner of token 1");
        require(spaceshipNFT.ownerOf(tokenId2) == msg.sender, "Not owner of token 2");
        require(tokenId1 != tokenId2, "Cannot use same token twice");
        
        GameTypes.ShipStats memory stats1 = spaceshipNFT.getShipStats(tokenId1);
        GameTypes.ShipStats memory stats2 = spaceshipNFT.getShipStats(tokenId2);
        
        require(stats1.rarity == stats2.rarity, "Must be same rarity");
        
        // Find recipe
        uint8 recipeId = uint8(stats1.rarity);
        CraftingRecipe memory recipe = craftingRecipes[recipeId];
        require(recipe.enabled, "Recipe not available");
        
        // Payment check (would be $COSM in production)
        // For now, this is placeholder
        
        // Burn input NFTs (in production, you'd actually burn them)
        // For testing, we'll skip the burn
        
        // Mint new NFT with higher rarity
        uint256 newTokenId = spaceshipNFT.mintReward(
            msg.sender,
            stats1.shipType,
            recipe.outputRarity,
            "ipfs://crafted-metadata"
        );
        
        emit NFTsCrafted(tokenId1, tokenId2, newTokenId);
        return newTokenId;
    }

    /**
     * @notice Get upgrade info for NFT
     */
    function getUpgradeInfo(uint256 tokenId) external view returns (
        uint8 currentLevel,
        uint8 maxLevel,
        uint256 nextUpgradeCost,
        uint256 cooldownRemaining
    ) {
        GameTypes.ShipStats memory stats = spaceshipNFT.getShipStats(tokenId);
        UpgradeCost memory cost = upgradeCosts[stats.shipType];
        
        currentLevel = upgradeLevel[tokenId];
        maxLevel = cost.maxUpgradeLevel;
        nextUpgradeCost = cost.cosmCost * (currentLevel + 1);
        
        uint256 lastUpgrade = lastUpgradeTime[tokenId]; // Cache storage read
        if (block.timestamp >= lastUpgrade + cost.cooldownPeriod) {
            cooldownRemaining = 0;
        } else {
            cooldownRemaining = (lastUpgrade + cost.cooldownPeriod) - block.timestamp;
        }
    }

    /**
     * @notice Get crafting recipe info
     */
    function getCraftingRecipe(uint8 recipeId) external view returns (CraftingRecipe memory) {
        return craftingRecipes[recipeId];
    }

    /**
     * @notice Batch mint NFTs (admin only, for rewards)
     */
    function batchMintRewards(
        address[] memory recipients,
        GameTypes.ShipType[] memory shipTypes,
        GameTypes.ShipRarity[] memory rarities,
        string[] memory metadataURIs
    ) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        
        require(
            recipients.length == shipTypes.length &&
            shipTypes.length == rarities.length &&
            rarities.length == metadataURIs.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            spaceshipNFT.mintReward(
                recipients[i],
                shipTypes[i],
                rarities[i],
                metadataURIs[i]
            );
        }
    }

    /**
     * @notice Set HTS NFT token ID
     */
    function setHTSNFTTokenId(string memory tokenId) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        htsNFTTokenId = tokenId;
        emit HTSNFTTokenIdSet(tokenId);
    }

    /**
     * @notice Update upgrade costs
     */
    function setUpgradeCost(
        GameTypes.ShipType shipType,
        uint256 cost,
        uint256 cooldown,
        uint8 maxLevel
    ) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        
        upgradeCosts[shipType] = UpgradeCost({
            cosmCost: cost,
            cooldownPeriod: cooldown,
            maxUpgradeLevel: maxLevel
        });
        
        emit UpgradeCostUpdated(shipType, cost);
    }

    /**
     * @notice Update crafting recipe
     */
    function setCraftingRecipe(
        uint8 recipeId,
        GameTypes.ShipRarity inputRarity,
        GameTypes.ShipRarity outputRarity,
        uint256 cost,
        bool enabled
    ) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        
        craftingRecipes[recipeId] = CraftingRecipe({
            inputRarity: inputRarity,
            outputRarity: outputRarity,
            cosmCost: cost,
            enabled: enabled
        });
    }

    /**
     * @notice Withdraw collected fees
     */
    function withdrawFees() external {
        require(
            accessControl.hasRole(accessControl.TREASURY_ROLE(), msg.sender),
            "Not authorized"
        );
        payable(msg.sender).transfer(address(this).balance);
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

    receive() external payable {}
}