// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/GameTypes.sol";
import "../core/AccessControl.sol";
import "../core/GameRegistry.sol";

/**
 * @title LeaderboardManager.sol
 * @author John Kenechukwu (Asmodeus)
 * @notice Manages leaderboards for all 4 games
 * @dev Scores are submitted here, actual leaderboard data stored in HCS
 */
contract LeaderboardManager is Initializable, UUPSUpgradeable {
    CosmicAccessControl public accessControl;
    GameRegistry public gameRegistry;
    
    // Leaderboard entries
    mapping(GameTypes.GameId => mapping(uint256 => GameTypes.LeaderboardEntry)) public leaderboards;
    mapping(GameTypes.GameId => uint256) public entryCounter;
    mapping(GameTypes.GameId => mapping(address => uint256)) public playerBestScore;
    
    // Top scores tracking
    mapping(GameTypes.GameId => uint256[10]) public topScores; // Top 10 per game
    mapping(GameTypes.GameId => address[10]) public topPlayers;
    
    // HCS Topic IDs (set by admin)
    mapping(GameTypes.GameId => string) public hcsTopicIds;
    
    // Score submission fee (1 HBAR)
    uint256 public submissionFee;
    
    // Events
    event ScoreSubmitted(
        address indexed player,
        GameTypes.GameId indexed gameId,
        uint256 score,
        uint256 tokenId,
        bytes32 sessionId
    );
    event NewHighScore(address indexed player, GameTypes.GameId indexed gameId, uint256 score);
    event TopTenUpdated(GameTypes.GameId indexed gameId);
    event HCSTopicSet(GameTypes.GameId indexed gameId, string topicId);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _accessControl,
        address _gameRegistry,
        uint256 _submissionFee
    ) public initializer {
        __UUPSUpgradeable_init();
        
        accessControl = CosmicAccessControl(_accessControl);
        gameRegistry = GameRegistry(_gameRegistry);
        submissionFee = _submissionFee;
    }

    /**
     * @notice Submit score to leaderboard
     * @param sessionId Game session ID from GameRegistry
     * @param score Final score
     * @param tokenId NFT used (0 if none)
     * @param gameId Which game
     */
    function submitScore(
        bytes32 sessionId,
        uint256 score,
        uint256 tokenId,
        GameTypes.GameId gameId
    ) external payable {
        require(msg.value >= submissionFee, "Insufficient fee");
        
        // Verify session
        GameTypes.GameSession memory session = gameRegistry.getSession(sessionId);
        require(session.player == msg.sender, "Not your session");
        require(session.verified, "Session not verified");
        require(session.gameId == gameId, "Game ID mismatch");
        require(session.score == score, "Score mismatch");
        
        // Create leaderboard entry
        uint256 entryId = entryCounter[gameId]++;
        
        leaderboards[gameId][entryId] = GameTypes.LeaderboardEntry({
            player: msg.sender,
            score: score,
            timestamp: block.timestamp,
            gameId: gameId,
            tokenId: tokenId
        });
        
        // Update player's best score
        if (score > playerBestScore[gameId][msg.sender]) {
            playerBestScore[gameId][msg.sender] = score;
            emit NewHighScore(msg.sender, gameId, score);
        }
        
        // Update top 10
        _updateTopTen(gameId, msg.sender, score);
        
        emit ScoreSubmitted(msg.sender, gameId, score, tokenId, sessionId);
    }

    /**
     * @notice Update top 10 leaderboard
     */
    function _updateTopTen(GameTypes.GameId gameId, address player, uint256 score) internal {
        uint256[10] storage scores = topScores[gameId];
        address[10] storage players = topPlayers[gameId];
        
        // Find insertion point
        for (uint256 i = 0; i < 10; i++) {
            if (score > scores[i]) {
                // Shift lower scores down
                for (uint256 j = 9; j > i; j--) {
                    scores[j] = scores[j-1];
                    players[j] = players[j-1];
                }
                
                // Insert new score
                scores[i] = score;
                players[i] = player;
                
                emit TopTenUpdated(gameId);
                break;
            }
        }
    }

    /**
     * @notice Get top 10 for a game
     */
    function getTopTen(GameTypes.GameId gameId) external view returns (
        address[10] memory players,
        uint256[10] memory scores
    ) {
        return (topPlayers[gameId], topScores[gameId]);
    }

    /**
     * @notice Get player's best score for a game
     */
    function getPlayerBestScore(GameTypes.GameId gameId, address player) external view returns (uint256) {
        return playerBestScore[gameId][player];
    }

    /**
     * @notice Set HCS topic ID for a game
     */
    function setHCSTopic(GameTypes.GameId gameId, string memory topicId) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        hcsTopicIds[gameId] = topicId;
        emit HCSTopicSet(gameId, topicId);
    }

    /**
     * @notice Update submission fee
     */
    function setSubmissionFee(uint256 newFee) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        submissionFee = newFee;
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
}