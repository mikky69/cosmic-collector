// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library GameTypes {
    // Ship Rarity Levels
    enum ShipRarity {
        Common,      // 0
        Uncommon,    // 1
        Rare,        // 2
        Epic         // 3
    }

    // Ship Types
    enum ShipType {
        ClassicFighter,  // 0 - Balanced
        SpeedRacer,      // 1 - Fast, low armor
        HeavyTank,       // 2 - Slow, high armor
        StealthNinja     // 3 - Special ability
    }

    // Game IDs for the 4 games
    enum GameId {
        CosmicCollector,  // 0 - Original space shooter
        Game2,            // 1 - Second game
        Game3,            // 2 - Third game
        Game4             // 3 - Fourth game
    }

    // Ship Stats Structure
    struct ShipStats {
        uint8 speed;        // 1-100
        uint8 armor;        // 1-100
        uint8 firepower;    // 1-100
        uint8 luck;         // 1-100 (affects drops)
        ShipRarity rarity;
        ShipType shipType;
        bool hasSpecialAbility;
        uint256 pointsMultiplier; // Basis points (10000 = 1x, 15000 = 1.5x)
    }

    // Marketplace Listing
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        bool isActive;
        uint256 listedAt;
        uint256 expiresAt;
    }

    // Auction Structure
    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 startPrice;
        uint256 currentBid;
        address currentBidder;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isSettled;
    }

    // Leaderboard Entry
    struct LeaderboardEntry {
        address player;
        uint256 score;
        uint256 timestamp;
        GameId gameId;
        uint256 tokenId; // NFT used (0 if none)
    }

    // Reward Claim
    struct RewardClaim {
        address player;
        uint256 amount;
        uint256 claimableAt;
        uint256 expiresAt;
        bool claimed;
        GameId gameId;
    }

    // Game Session (for anti-cheat)
    struct GameSession {
        address player;
        uint256 startTime;
        uint256 endTime;
        uint256 score;
        bytes32 sessionHash;
        bool verified;
        GameId gameId;
    }
}