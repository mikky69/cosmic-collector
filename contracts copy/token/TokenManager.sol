// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../core/AccessControl.sol";

/**
 * @title TokenManager
 * @author John Kenechukwu (Asmodeus)
 * @notice Manages $COSM token operations and HTS integration
 * @dev Acts as bridge between smart contracts and HTS token
 */
contract TokenManager is Initializable, UUPSUpgradeable {
    CosmicAccessControl public accessControl;
    IERC20Upgradeable public cosmToken;
    
    // HTS Token ID (stored as string since it's 0.0.xxxxx format)
    string public htsTokenId;
    
    // Swap configuration (HBAR to $COSM)
    uint256 public swapRate; // How many $COSM per 1 HBAR (with 8 decimals)
    bool public swapEnabled;
    
    // Token distribution tracking
    mapping(address => uint256) public totalReceived;
    mapping(address => uint256) public totalSpent;
    uint256 public totalDistributed;
    
    // Daily claim limits (anti-abuse)
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public dailyClaimedAmount;
    uint256 public dailyClaimLimit;
    
    // Events
    event TokensSwapped(address indexed user, uint256 hbarAmount, uint256 cosmAmount);
    event TokensDistributed(address indexed to, uint256 amount, string reason);
    event SwapRateUpdated(uint256 newRate);
    event SwapStatusUpdated(bool enabled);
    event HTSTokenIdSet(string tokenId);
    event DailyLimitUpdated(uint256 newLimit);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _accessControl,
        address _cosmToken,
        uint256 _swapRate,
        uint256 _dailyLimit
    ) public initializer {
        __UUPSUpgradeable_init();
        
        accessControl = CosmicAccessControl(_accessControl);
        cosmToken = IERC20Upgradeable(_cosmToken);
        swapRate = _swapRate;
        swapEnabled = true;
        dailyClaimLimit = _dailyLimit;
    }

    /**
     * @notice Swap HBAR for $COSM tokens
     * @dev Players send HBAR and receive $COSM at current rate
     */
    function swapHBARForCOSM() external payable {
        require(swapEnabled, "Swap disabled");
        require(msg.value > 0, "No HBAR sent");
        
        // Calculate COSM amount (swapRate has 8 decimals)
        uint256 cosmAmount = (msg.value * swapRate) / 1e8;
        require(cosmAmount > 0, "Amount too small");
        
        // Check contract has enough balance
        require(
            cosmToken.balanceOf(address(this)) >= cosmAmount,
            "Insufficient COSM in contract"
        );
        
        // Transfer COSM to user
        require(cosmToken.transfer(msg.sender, cosmAmount), "Transfer failed");
        
        totalReceived[msg.sender] += cosmAmount;
        totalDistributed += cosmAmount;
        
        emit TokensSwapped(msg.sender, msg.value, cosmAmount);
    }

    /**
     * @notice Distribute tokens to player (called by game contracts)
     * @param to Recipient address
     * @param amount Amount to distribute
     * @param reason Why tokens are being distributed
     */
    function distributeTokens(
        address to,
        uint256 amount,
        string memory reason
    ) external {
        require(
            accessControl.hasRole(accessControl.GAME_MANAGER_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.TREASURY_ROLE(), msg.sender),
            "Not authorized"
        );
        
        // Check daily limit
        if (block.timestamp >= lastClaimTime[to] + 1 days) {
            dailyClaimedAmount[to] = 0;
            lastClaimTime[to] = block.timestamp;
        }
        
        require(
            dailyClaimedAmount[to] + amount <= dailyClaimLimit,
            "Daily limit exceeded"
        );
        
        require(cosmToken.transfer(to, amount), "Transfer failed");
        
        dailyClaimedAmount[to] += amount;
        totalReceived[to] += amount;
        totalDistributed += amount;
        
        emit TokensDistributed(to, amount, reason);
    }

    /**
     * @notice Get player's token statistics
     */
    function getPlayerStats(address player) external view returns (
        uint256 received,
        uint256 spent,
        uint256 todayClaimed,
        uint256 remainingDaily
    ) {
        received = totalReceived[player];
        spent = totalSpent[player];
        todayClaimed = (block.timestamp >= lastClaimTime[player] + 1 days) 
            ? 0 
            : dailyClaimedAmount[player];
        remainingDaily = dailyClaimLimit - todayClaimed;
    }

    /**
     * @notice Calculate swap output
     */
    function calculateSwapOutput(uint256 hbarAmount) external view returns (uint256) {
        return (hbarAmount * swapRate) / 1e8;
    }

    /**
     * @notice Set HTS token ID
     */
    function setHTSTokenId(string memory tokenId) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        htsTokenId = tokenId;
        emit HTSTokenIdSet(tokenId);
    }

    /**
     * @notice Update swap rate
     */
    function setSwapRate(uint256 newRate) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        require(newRate > 0, "Invalid rate");
        swapRate = newRate;
        emit SwapRateUpdated(newRate);
    }

    /**
     * @notice Enable/disable swapping
     */
    function setSwapEnabled(bool enabled) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        swapEnabled = enabled;
        emit SwapStatusUpdated(enabled);
    }

    /**
     * @notice Update daily claim limit
     */
    function setDailyClaimLimit(uint256 newLimit) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        dailyClaimLimit = newLimit;
        emit DailyLimitUpdated(newLimit);
    }

    /**
     * @notice Withdraw accumulated HBAR (from swaps)
     */
    function withdrawHBAR() external {
        require(
            accessControl.hasRole(accessControl.TREASURY_ROLE(), msg.sender),
            "Not authorized"
        );
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    /**
     * @notice Withdraw COSM tokens
     */
    function withdrawCOSM(uint256 amount) external {
        require(
            accessControl.hasRole(accessControl.TREASURY_ROLE(), msg.sender),
            "Not authorized"
        );
        require(cosmToken.transfer(msg.sender, amount), "Transfer failed");
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