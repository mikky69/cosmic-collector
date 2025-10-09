// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CosmicLeaderboard
 * @dev Leaderboard contract for Cosmic Collector games
 * @author MiniMax Agent
 */
contract CosmicLeaderboard is Ownable, ReentrancyGuard {
    
    enum GameType { COSMIC_COLLECTOR, SPACE_SNAKE }
    
    struct ScoreEntry {
        address player;
        uint256 score;
        uint256 timestamp;
        GameType gameType;
        string playerName;
        bool isVerified;
    }
    
    struct PlayerStats {
        uint256 totalGames;
        uint256 bestScore;
        uint256 totalScore;
        uint256 lastPlayed;
        uint256 achievements;
    }
    
    // Game-specific leaderboards
    mapping(GameType => ScoreEntry[]) public gameLeaderboards;
    
    // Player statistics
    mapping(address => mapping(GameType => PlayerStats)) public playerStats;
    
    // Global player rankings
    mapping(address => uint256) public globalRankings;
    
    // Score submission fee
    uint256 public scoreSubmissionFee = 0.1 ether; // 0.1 HBAR
    
    // Maximum leaderboard entries per game
    uint256 public constant MAX_LEADERBOARD_SIZE = 100;
    
    // Events
    event ScoreSubmitted(address indexed player, GameType gameType, uint256 score, uint256 timestamp);
    event PersonalBestAchieved(address indexed player, GameType gameType, uint256 newBest);
    event LeaderboardPositionChanged(address indexed player, GameType gameType, uint256 position);
    event AchievementUnlocked(address indexed player, uint256 achievementId);
    
    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }
    
    /**
     * @dev Submit a score to the leaderboard
     */
    function submitScore(
        GameType gameType,
        uint256 score,
        string memory playerName
    ) external payable nonReentrant {
        require(msg.value >= scoreSubmissionFee, "Insufficient fee");
        require(score > 0, "Score must be greater than 0");
        require(bytes(playerName).length > 0 && bytes(playerName).length <= 32, "Invalid player name");
        
        // Update player stats
        PlayerStats storage stats = playerStats[msg.sender][gameType];
        stats.totalGames++;
        stats.totalScore += score;
        stats.lastPlayed = block.timestamp;
        
        bool isPersonalBest = false;
        if (score > stats.bestScore) {
            stats.bestScore = score;
            isPersonalBest = true;
            emit PersonalBestAchieved(msg.sender, gameType, score);
        }
        
        // Create score entry
        ScoreEntry memory newEntry = ScoreEntry({
            player: msg.sender,
            score: score,
            timestamp: block.timestamp,
            gameType: gameType,
            playerName: playerName,
            isVerified: true
        });
        
        // Add to leaderboard and sort
        _addToLeaderboard(gameType, newEntry);
        
        // Check for achievements
        _checkAchievements(msg.sender, gameType, score);
        
        emit ScoreSubmitted(msg.sender, gameType, score, block.timestamp);
        
        // Refund excess payment
        if (msg.value > scoreSubmissionFee) {
            payable(msg.sender).transfer(msg.value - scoreSubmissionFee);
        }
    }
    
    /**
     * @dev Add score to leaderboard and maintain sorting
     */
    function _addToLeaderboard(GameType gameType, ScoreEntry memory newEntry) private {
        ScoreEntry[] storage leaderboard = gameLeaderboards[gameType];
        
        // Find insertion position
        uint256 insertIndex = leaderboard.length;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (newEntry.score > leaderboard[i].score) {
                insertIndex = i;
                break;
            }
        }
        
        // Insert at position
        leaderboard.push(newEntry);
        
        // Shift elements to maintain order
        for (uint256 i = leaderboard.length - 1; i > insertIndex; i--) {
            leaderboard[i] = leaderboard[i - 1];
        }
        leaderboard[insertIndex] = newEntry;
        
        // Remove excess entries
        if (leaderboard.length > MAX_LEADERBOARD_SIZE) {
            leaderboard.pop();
        }
        
        // Emit position change event
        if (insertIndex < MAX_LEADERBOARD_SIZE) {
            emit LeaderboardPositionChanged(newEntry.player, gameType, insertIndex + 1);
        }
    }
    
    /**
     * @dev Check and unlock achievements
     */
    function _checkAchievements(address player, GameType gameType, uint256 score) private {
        PlayerStats storage stats = playerStats[player][gameType];
        uint256 currentAchievements = stats.achievements;
        
        // Achievement 1: First game (bit 0)
        if (stats.totalGames == 1 && (currentAchievements & 1) == 0) {
            stats.achievements |= 1;
            emit AchievementUnlocked(player, 1);
        }
        
        // Achievement 2: Score over 1000 (bit 1)
        if (score >= 1000 && (currentAchievements & 2) == 0) {
            stats.achievements |= 2;
            emit AchievementUnlocked(player, 2);
        }
        
        // Achievement 3: Score over 5000 (bit 2)
        if (score >= 5000 && (currentAchievements & 4) == 0) {
            stats.achievements |= 4;
            emit AchievementUnlocked(player, 3);
        }
        
        // Achievement 4: Play 10 games (bit 3)
        if (stats.totalGames >= 10 && (currentAchievements & 8) == 0) {
            stats.achievements |= 8;
            emit AchievementUnlocked(player, 4);
        }
        
        // Achievement 5: Play 100 games (bit 4)
        if (stats.totalGames >= 100 && (currentAchievements & 16) == 0) {
            stats.achievements |= 16;
            emit AchievementUnlocked(player, 5);
        }
    }
    
    /**
     * @dev Get leaderboard for a specific game
     */
    function getLeaderboard(GameType gameType, uint256 limit) external view returns (ScoreEntry[] memory) {
        ScoreEntry[] storage fullLeaderboard = gameLeaderboards[gameType];
        uint256 length = fullLeaderboard.length > limit ? limit : fullLeaderboard.length;
        
        ScoreEntry[] memory result = new ScoreEntry[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = fullLeaderboard[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get player's rank in a specific game
     */
    function getPlayerRank(address player, GameType gameType) external view returns (uint256) {
        ScoreEntry[] storage leaderboard = gameLeaderboards[gameType];
        
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == player) {
                return i + 1; // 1-indexed rank
            }
        }
        
        return 0; // Not on leaderboard
    }
    
    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player, GameType gameType) external view returns (PlayerStats memory) {
        return playerStats[player][gameType];
    }
    
    /**
     * @dev Get player's achievements as a bitmap
     */
    function getPlayerAchievements(address player, GameType gameType) external view returns (uint256) {
        return playerStats[player][gameType].achievements;
    }
    
    /**
     * @dev Check if player has specific achievement
     */
    function hasAchievement(address player, GameType gameType, uint256 achievementId) external view returns (bool) {
        require(achievementId > 0 && achievementId <= 32, "Invalid achievement ID");
        uint256 achievements = playerStats[player][gameType].achievements;
        return (achievements & (1 << (achievementId - 1))) != 0;
    }
    
    /**
     * @dev Get top players across all games
     */
    function getTopPlayers(uint256 limit) external view returns (address[] memory, uint256[] memory) {
        // Simple implementation - in production, you might want a more sophisticated ranking system
        address[] memory players = new address[](limit);
        uint256[] memory scores = new uint256[](limit);
        
        // This is a placeholder - implement based on your ranking logic
        return (players, scores);
    }
    
    /**
     * @dev Update score submission fee (only owner)
     */
    function updateScoreSubmissionFee(uint256 newFee) external onlyOwner {
        scoreSubmissionFee = newFee;
    }
    
    /**
     * @dev Emergency function to clear leaderboard (only owner)
     */
    function clearLeaderboard(GameType gameType) external onlyOwner {
        delete gameLeaderboards[gameType];
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
     * @dev Get leaderboard size for a game
     */
    function getLeaderboardSize(GameType gameType) external view returns (uint256) {
        return gameLeaderboards[gameType].length;
    }
}