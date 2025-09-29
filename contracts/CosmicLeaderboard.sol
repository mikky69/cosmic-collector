// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CosmicLeaderboard
 * @dev Leaderboard contract for Cosmic Collector game scores
 * @author Mikky Studio
 */
contract CosmicLeaderboard is Ownable, ReentrancyGuard {
    
    // Game types
    enum GameType { COSMIC_COLLECTOR, SPACE_SNAKE }
    
    struct ScoreEntry {
        address player;
        uint256 score;
        GameType gameType;
        uint256 timestamp;
        uint256 blockNumber;
        string playerName;
    }
    
    // Score submission fee in tinybars (1 HBAR = 100,000,000 tinybars)
    uint256 public constant SUBMISSION_FEE = 100000000; // 1 HBAR
    
    // Leaderboards for each game type
    mapping(GameType => ScoreEntry[]) public leaderboards;
    
    // Player's best scores
    mapping(address => mapping(GameType => uint256)) public playerBestScores;
    
    // Total submissions per game
    mapping(GameType => uint256) public totalSubmissions;
    
    // Total fees collected
    uint256 public totalFeesCollected;
    
    // Events
    event ScoreSubmitted(
        address indexed player,
        GameType indexed gameType,
        uint256 score,
        uint256 timestamp,
        string playerName
    );
    
    event NewHighScore(
        address indexed player,
        GameType indexed gameType,
        uint256 score,
        uint256 rank
    );
    
    constructor() {}
    
    /**
     * @dev Submit a score to the leaderboard
     * @param gameType Type of game
     * @param score Player's score
     * @param playerName Display name (optional)
     */
    function submitScore(
        GameType gameType,
        uint256 score,
        string memory playerName
    ) public payable nonReentrant {
        require(msg.value >= SUBMISSION_FEE, "Insufficient submission fee");
        require(score > 0, "Score must be greater than 0");
        require(bytes(playerName).length <= 50, "Player name too long");
        
        // Create score entry
        ScoreEntry memory newEntry = ScoreEntry({
            player: msg.sender,
            score: score,
            gameType: gameType,
            timestamp: block.timestamp,
            blockNumber: block.number,
            playerName: bytes(playerName).length > 0 ? playerName : "Anonymous"
        });
        
        // Add to leaderboard
        leaderboards[gameType].push(newEntry);
        
        // Update stats
        totalSubmissions[gameType]++;
        totalFeesCollected += SUBMISSION_FEE;
        
        // Check if this is a new personal best
        if (score > playerBestScores[msg.sender][gameType]) {
            playerBestScores[msg.sender][gameType] = score;
        }
        
        // Sort leaderboard to maintain order (keep top 100)
        _sortAndTrimLeaderboard(gameType);
        
        // Send fee to contract owner (creator)
        payable(owner()).transfer(SUBMISSION_FEE);
        
        // Refund excess payment
        if (msg.value > SUBMISSION_FEE) {
            payable(msg.sender).transfer(msg.value - SUBMISSION_FEE);
        }
        
        emit ScoreSubmitted(msg.sender, gameType, score, block.timestamp, newEntry.playerName);
        
        // Check if this made it to top ranks
        uint256 rank = _findPlayerRank(gameType, msg.sender, score);
        if (rank <= 10) {
            emit NewHighScore(msg.sender, gameType, score, rank);
        }
    }
    
    /**
     * @dev Get leaderboard for a specific game
     * @param gameType Type of game
     * @return Array of score entries
     */
    function getLeaderboard(GameType gameType) public view returns (ScoreEntry[] memory) {
        return leaderboards[gameType];
    }
    
    /**
     * @dev Get top N scores for a specific game
     * @param gameType Type of game
     * @param count Number of top scores to return
     * @return Array of score entries
     */
    function getTopScores(GameType gameType, uint256 count) public view returns (ScoreEntry[] memory) {
        ScoreEntry[] memory allScores = leaderboards[gameType];
        
        if (allScores.length <= count) {
            return allScores;
        }
        
        ScoreEntry[] memory topScores = new ScoreEntry[](count);
        for (uint256 i = 0; i < count; i++) {
            topScores[i] = allScores[i];
        }
        
        return topScores;
    }
    
    /**
     * @dev Get player's best score for a game
     * @param player Player address
     * @param gameType Type of game
     * @return Best score
     */
    function getPlayerBestScore(address player, GameType gameType) public view returns (uint256) {
        return playerBestScores[player][gameType];
    }
    
    /**
     * @dev Get player's rank for their best score
     * @param player Player address
     * @param gameType Type of game
     * @return Player's rank (1-based, 0 if not found)
     */
    function getPlayerRank(address player, GameType gameType) public view returns (uint256) {
        uint256 bestScore = playerBestScores[player][gameType];
        if (bestScore == 0) return 0;
        
        return _findPlayerRank(gameType, player, bestScore);
    }
    
    /**
     * @dev Get total number of submissions for a game
     * @param gameType Type of game
     * @return Total submissions
     */
    function getTotalSubmissions(GameType gameType) public view returns (uint256) {
        return totalSubmissions[gameType];
    }
    
    /**
     * @dev Get overall statistics
     * @return totalFeesCollected, total cosmic submissions, total snake submissions
     */
    function getOverallStats() public view returns (uint256, uint256, uint256) {
        return (
            totalFeesCollected,
            totalSubmissions[GameType.COSMIC_COLLECTOR],
            totalSubmissions[GameType.SPACE_SNAKE]
        );
    }
    
    /**
     * @dev Internal function to sort and trim leaderboard
     * @param gameType Type of game
     */
    function _sortAndTrimLeaderboard(GameType gameType) internal {
        ScoreEntry[] storage scores = leaderboards[gameType];
        
        // Simple insertion sort for small arrays (efficient for mostly sorted data)
        for (uint256 i = 1; i < scores.length; i++) {
            ScoreEntry memory key = scores[i];
            int256 j = int256(i) - 1;
            
            while (j >= 0 && scores[uint256(j)].score < key.score) {
                scores[uint256(j) + 1] = scores[uint256(j)];
                j--;
            }
            scores[uint256(j) + 1] = key;
        }
        
        // Keep only top 100 scores
        if (scores.length > 100) {
            for (uint256 i = scores.length; i > 100; i--) {
                scores.pop();
            }
        }
    }
    
    /**
     * @dev Internal function to find player's rank
     * @param gameType Type of game
     * @param player Player address
     * @param score Player's score
     * @return Player's rank (1-based)
     */
    function _findPlayerRank(GameType gameType, address player, uint256 score) internal view returns (uint256) {
        ScoreEntry[] memory scores = leaderboards[gameType];
        
        for (uint256 i = 0; i < scores.length; i++) {
            if (scores[i].player == player && scores[i].score == score) {
                return i + 1; // 1-based rank
            }
        }
        
        return 0; // Not found
    }
    
    /**
     * @dev Update submission fee (owner only)
     * @param newFee New fee in tinybars
     */
    function updateSubmissionFee(uint256 newFee) public onlyOwner {
        // Note: This would require updating the constant, 
        // or making it a state variable instead
        // For now, fee is fixed at deployment
        revert("Submission fee is fixed");
    }
    
    /**
     * @dev Clear leaderboard for a specific game (owner only, emergency function)
     * @param gameType Type of game
     */
    function clearLeaderboard(GameType gameType) public onlyOwner {
        delete leaderboards[gameType];
        totalSubmissions[gameType] = 0;
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
     * @dev Emergency function to remove inappropriate entries (owner only)
     * @param gameType Type of game
     * @param index Index of entry to remove
     */
    function removeEntry(GameType gameType, uint256 index) public onlyOwner {
        ScoreEntry[] storage scores = leaderboards[gameType];
        require(index < scores.length, "Index out of bounds");
        
        // Move last element to deleted spot and remove last element
        scores[index] = scores[scores.length - 1];
        scores.pop();
        
        // Re-sort the leaderboard
        _sortAndTrimLeaderboard(gameType);
    }
}