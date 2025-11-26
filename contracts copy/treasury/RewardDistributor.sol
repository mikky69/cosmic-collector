// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/GameTypes.sol";
import "../core/AccessControl.sol";
import "./Treasury.sol";

/**
 * @title RewardDistributor
 * @author John Kenechukwu (Asmodeus)
 * @notice Manages reward allocation and distribution to players
 * @dev Works with Treasury for actual fund distribution
 */

contract RewardDistributor is Initializable, UUPSUpgradeable {
    CosmicAccessControl public accessControl;
    Treasury public treasury;
    
    // Reward claims
    mapping(bytes32 => GameTypes.RewardClaim) public rewardClaims;
    mapping(address => bytes32[]) public playerClaims;
    
    uint256 public claimWindow; // How long rewards are claimable
    uint256 public totalRewardsDistributed;
    uint256 public totalRewardsClaimed;
    
    // Events
    event RewardAllocated(address indexed player, uint256 amount, bytes32 claimId);
    event RewardClaimed(address indexed player, uint256 amount, bytes32 claimId);
    event RewardExpired(bytes32 claimId);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _accessControl,
        address _treasury,
        uint256 _claimWindow
    ) public initializer {
        __UUPSUpgradeable_init();
        
        accessControl = CosmicAccessControl(_accessControl);
        treasury = Treasury(_treasury);
        claimWindow = _claimWindow;
    }

    /**
     * @notice Allocate reward to player
     * @param player Recipient
     * @param amount Amount to allocate
     * @param gameId Which game the reward is from
     */
    function allocateReward(
        address player,
        uint256 amount,
        GameTypes.GameId gameId
    ) external returns (bytes32) {
        require(
            accessControl.hasRole(accessControl.GAME_MANAGER_ROLE(), msg.sender),
            "Not authorized"
        );
        require(player != address(0), "Invalid player");
        require(amount > 0, "Amount must be > 0");
        
        bytes32 claimId = keccak256(abi.encodePacked(
            player,
            amount,
            block.timestamp,
            gameId
        ));
        
        rewardClaims[claimId] = GameTypes.RewardClaim({
            player: player,
            amount: amount,
            claimableAt: block.timestamp,
            expiresAt: block.timestamp + claimWindow,
            claimed: false,
            gameId: gameId
        });
        
        playerClaims[player].push(claimId);
        totalRewardsDistributed += amount;
        
        emit RewardAllocated(player, amount, claimId);
        return claimId;
    }

    /**
     * @notice Claim reward
     * @param claimId Claim to redeem
     */
    function claimReward(bytes32 claimId) external {
        GameTypes.RewardClaim storage claim = rewardClaims[claimId];
        
        require(claim.player == msg.sender, "Not your claim");
        require(!claim.claimed, "Already claimed");
        require(block.timestamp >= claim.claimableAt, "Not yet claimable");
        require(block.timestamp <= claim.expiresAt, "Claim expired");
        
        claim.claimed = true;
        totalRewardsClaimed += claim.amount;
        
        // Distribute from treasury
        treasury.distributeReward(msg.sender, claim.amount);
        
        emit RewardClaimed(msg.sender, claim.amount, claimId);
    }

    /**
     * @notice Batch claim all available rewards
     */
    function claimAllRewards() external {
        bytes32[] memory claims = playerClaims[msg.sender];
        uint256 totalClaim = 0;
        
        for (uint256 i = 0; i < claims.length; i++) {
            GameTypes.RewardClaim storage claim = rewardClaims[claims[i]];
            
            if (!claim.claimed && 
                block.timestamp >= claim.claimableAt && 
                block.timestamp <= claim.expiresAt) {
                
                claim.claimed = true;
                totalClaim += claim.amount;
                emit RewardClaimed(msg.sender, claim.amount, claims[i]);
            }
        }
        
        require(totalClaim > 0, "No rewards to claim");
        
        totalRewardsClaimed += totalClaim;
        treasury.distributeReward(msg.sender, totalClaim);
    }

    /**
     * @notice Get player's claimable rewards
     */
    function getClaimableRewards(address player) external view returns (uint256 total, uint256 count) {
        bytes32[] memory claims = playerClaims[player];
        
        for (uint256 i = 0; i < claims.length; i++) {
            GameTypes.RewardClaim memory claim = rewardClaims[claims[i]];
            
            if (!claim.claimed && 
                block.timestamp >= claim.claimableAt && 
                block.timestamp <= claim.expiresAt) {
                total += claim.amount;
                count++;
            }
        }
    }

    /**
     * @notice Get all claims for a player
     */
    function getPlayerClaims(address player) external view returns (bytes32[] memory) {
        return playerClaims[player];
    }

    /**
     * @notice Update claim window
     */
    function setClaimWindow(uint256 newWindow) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        claimWindow = newWindow;
    }

    function _authorizeUpgrade(address newImplementation) internal override {
        require(
            accessControl.hasRole(accessControl.OWNER_ROLE(), msg.sender),
            "Not authorized"
        );
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}