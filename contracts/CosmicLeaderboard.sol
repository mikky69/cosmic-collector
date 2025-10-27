// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Cosmic Collection Leaderboard Contract
 * @dev Manages game leaderboards on Hedera blockchain
 * @author Engr. Mikailu Nadro
 */
contract CosmicLeaderboard {
    address public owner;
    
    struct ScoreEntry {
        address player;
        uint256 score;
        uint256 timestamp;
        uint256 cosmEarned;
        string playerName;
    }
    
    struct PlayerProfile {
        string displayName;
        uint256 totalScore;
        uint256 totalCosmEarned;
        uint256 gamesPlayed;
        uint256 lastPlayed;
    }
    
    mapping(string => ScoreEntry[]) public gameLeaderboards;
    mapping(string => mapping(address => uint256)) public playerBestScores;
    mapping(address => PlayerProfile) public playerProfiles;
    mapping(string => uint256) public totalGamesPlayed;
    
    event ScoreSubmitted(
        address indexed player,
        string game,
        uint256 score,
        uint256 cosmEarned,
        uint256 timestamp
    );
    
    event NewHighScore(
        address indexed player,
        string game,
        uint256 newScore,
        uint256 previousScore
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function submitScore(
        string memory gameName,
        uint256 score,
        uint256 cosmEarned,
        string memory playerName
    ) public returns (bool) {
        require(score > 0, "Score must be greater than 0");
        
        PlayerProfile storage profile = playerProfiles[msg.sender];
        if (bytes(profile.displayName).length == 0) {
            profile.displayName = playerName;
        }
        profile.totalScore += score;
        profile.totalCosmEarned += cosmEarned;
        profile.gamesPlayed++;
        profile.lastPlayed = block.timestamp;
        
        uint256 previousBest = playerBestScores[gameName][msg.sender];
        if (score > previousBest) {
            playerBestScores[gameName][msg.sender] = score;
            emit NewHighScore(msg.sender, gameName, score, previousBest);
        }
        
        gameLeaderboards[gameName].push(ScoreEntry({
            player: msg.sender,
            score: score,
            timestamp: block.timestamp,
            cosmEarned: cosmEarned,
            playerName: bytes(playerName).length > 0 ? playerName : profile.displayName
        }));
        
        totalGamesPlayed[gameName]++;
        
        emit ScoreSubmitted(msg.sender, gameName, score, cosmEarned, block.timestamp);
        
        return true;
    }
    
    function getPlayerBestScore(string memory gameName, address player) 
        public 
        view 
        returns (uint256) 
    {
        return playerBestScores[gameName][player];
    }
    
    function getPlayerProfile(address player) 
        public 
        view 
        returns (
            string memory displayName,
            uint256 totalScore,
            uint256 totalCosmEarned,
            uint256 gamesPlayed,
            uint256 lastPlayed
        ) 
    {
        PlayerProfile memory profile = playerProfiles[player];
        return (
            profile.displayName,
            profile.totalScore,
            profile.totalCosmEarned,
            profile.gamesPlayed,
            profile.lastPlayed
        );
    }
}
