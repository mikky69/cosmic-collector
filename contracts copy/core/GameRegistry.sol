// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/GameTypes.sol";
import "./AccessControl.sol";

/**
 * @title GameRegistry
 * @author John Kenechukwu (Asmodeus)
 * @notice Central registry for game validation and session management
 * @dev Prevents cheating by validating game sessions
 */
contract GameRegistry is Initializable, UUPSUpgradeable {
    CosmicAccessControl public accessControl;

    // Game session tracking
    mapping(bytes32 => GameTypes.GameSession) public sessions;
    mapping(address => bytes32[]) public playerSessions;
    
    // Game configuration
    mapping(GameTypes.GameId => bool) public gameEnabled;
    mapping(GameTypes.GameId => uint256) public maxScorePerSession;
    mapping(GameTypes.GameId => uint256) public minSessionDuration;
    mapping(GameTypes.GameId => uint256) public maxSessionDuration;

    // Anti-cheat rate limiting
    mapping(address => uint256) public lastSessionTime;
    uint256 public sessionCooldown; // Minimum time between sessions

    // Events
    event SessionStarted(address indexed player, bytes32 sessionId, GameTypes.GameId gameId);
    event SessionEnded(address indexed player, bytes32 sessionId, uint256 score);
    event SessionVerified(bytes32 sessionId, bool valid);
    event GameConfigUpdated(GameTypes.GameId gameId, uint256 maxScore, uint256 minDuration, uint256 maxDuration);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _accessControl) public initializer {
        __UUPSUpgradeable_init();
        
        accessControl = CosmicAccessControl(_accessControl);
        sessionCooldown = 30 seconds; // 30 second cooldown between games

        // Initialize default game configs
        for (uint8 i = 0; i < 4; i++) {
            GameTypes.GameId gameId = GameTypes.GameId(i);
            gameEnabled[gameId] = true;
            maxScorePerSession[gameId] = 1000000; // 1 million max
            minSessionDuration[gameId] = 30 seconds;
            maxSessionDuration[gameId] = 1 hours;
        }
    }

    /**
     * @notice Start a new game session
     * @param gameId Which game is being played
     * @param tokenId NFT being used (0 if none)
     * @return sessionId Unique session identifier
     */
    function startSession(
        GameTypes.GameId gameId,
        uint256 tokenId
    ) external returns (bytes32) {
        require(gameEnabled[gameId], "Game not enabled");
        require(
            block.timestamp >= lastSessionTime[msg.sender] + sessionCooldown,
            "Session cooldown active"
        );

        // Generate unique session ID
        bytes32 sessionId = keccak256(
            abi.encodePacked(
                msg.sender,
                block.timestamp,
                block.number,
                gameId,
                tokenId
            )
        );

        // Create session
        sessions[sessionId] = GameTypes.GameSession({
            player: msg.sender,
            startTime: block.timestamp,
            endTime: 0,
            score: 0,
            sessionHash: sessionId,
            verified: false,
            gameId: gameId
        });

        playerSessions[msg.sender].push(sessionId);
        lastSessionTime[msg.sender] = block.timestamp;

        emit SessionStarted(msg.sender, sessionId, gameId);
        return sessionId;
    }

    /**
     * @notice End a game session and submit score
     * @param sessionId Session to end
     * @param score Final score
     * @param _proof Cryptographic proof from backend
     */
    function endSession(
        bytes32 sessionId,
        uint256 score,
        bytes memory _proof
    ) external {
        GameTypes.GameSession storage session = sessions[sessionId];
        
        require(session.player == msg.sender, "Not your session");
        require(session.endTime == 0, "Session already ended");
        require(session.startTime > 0, "Session not found");

        uint256 duration = block.timestamp - session.startTime;
        GameTypes.GameId gameId = session.gameId;

        // Validate session duration
        require(
            duration >= minSessionDuration[gameId] && duration <= maxSessionDuration[gameId],
            "Invalid session duration"
        );

        // Validate score
        require(score <= maxScorePerSession[gameId], "Score too high");

        // Update session
        session.endTime = block.timestamp;
        session.score = score;

        emit SessionEnded(msg.sender, sessionId, score);
    }

    /**
     * @notice Verify session (called by backend oracle)
     * @param sessionId Session to verify
     * @param valid Whether session is valid
     */
    function verifySession(bytes32 sessionId, bool valid) 
        external 
    {
        require(
            accessControl.hasRole(accessControl.GAME_MANAGER_ROLE(), msg.sender),
            "Not authorized"
        );

        GameTypes.GameSession storage session = sessions[sessionId];
        require(session.endTime > 0, "Session not ended");
        require(!session.verified, "Already verified");

        session.verified = valid;
        emit SessionVerified(sessionId, valid);
    }

    /**
     * @notice Get session details
     */
    function getSession(bytes32 sessionId) external view returns (GameTypes.GameSession memory) {
        return sessions[sessionId];
    }

    /**
     * @notice Get all sessions for a player
     */
    function getPlayerSessions(address player) external view returns (bytes32[] memory) {
        return playerSessions[player];
    }

    /**
     * @notice Update game configuration
     */
    function updateGameConfig(
        GameTypes.GameId gameId,
        uint256 _maxScore,
        uint256 _minDuration,
        uint256 _maxDuration
    ) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );

        maxScorePerSession[gameId] = _maxScore;
        minSessionDuration[gameId] = _minDuration;
        maxSessionDuration[gameId] = _maxDuration;

        emit GameConfigUpdated(gameId, _maxScore, _minDuration, _maxDuration);
    }

    /**
     * @notice Enable/disable a game
     */
    function setGameEnabled(GameTypes.GameId gameId, bool enabled) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        gameEnabled[gameId] = enabled;
    }

    /**
     * @notice Update session cooldown
     */
    function setSessionCooldown(uint256 _cooldown) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        sessionCooldown = _cooldown;
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        require(
            accessControl.hasRole(accessControl.OWNER_ROLE(), msg.sender),
            "Not authorized"
        );
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}