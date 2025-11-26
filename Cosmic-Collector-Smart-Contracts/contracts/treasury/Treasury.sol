// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../core/AccessControl.sol";

contract Treasury is Initializable, UUPSUpgradeable {
    CosmicAccessControl public accessControl;
    IERC20Upgradeable public cosmToken;
    
    // Reward pools
    mapping(uint256 => uint256) public dailyRewardPool; // day => amount
    mapping(uint256 => bool) public poolFunded;
    
    uint256 public defaultDailyPool;
    
    // Withdrawal tracking
    mapping(address => uint256) public totalWithdrawn;
    uint256 public totalTreasuryWithdrawn;
    
    // Multi-sig withdrawal (both owners must approve)
    struct WithdrawalRequest {
        address to;
        uint256 amount;
        bool approved1;
        bool approved2;
        address approver1;
        address approver2;
        bool executed;
        uint256 createdAt;
    }
    
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    uint256 public withdrawalRequestCounter;
    
    // Events
    event RewardPoolFunded(uint256 indexed day, uint256 amount);
    event WithdrawalRequested(uint256 indexed requestId, address to, uint256 amount);
    event WithdrawalApproved(uint256 indexed requestId, address approver);
    event WithdrawalExecuted(uint256 indexed requestId, address to, uint256 amount);
    event DefaultPoolUpdated(uint256 newAmount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _accessControl,
        address _cosmToken,
        uint256 _defaultDailyPool
    ) public initializer {
        __UUPSUpgradeable_init();
        
        accessControl = CosmicAccessControl(_accessControl);
        cosmToken = IERC20Upgradeable(_cosmToken);
        defaultDailyPool = _defaultDailyPool;
    }

    /**
     * @notice Fund daily reward pool
     * @param day Day number (timestamp / 1 days)
     * @param amount Amount to add
     */
    function fundDailyPool(uint256 day, uint256 amount) external {
        require(
            accessControl.hasRole(accessControl.TREASURY_ROLE(), msg.sender),
            "Not authorized"
        );
        require(amount > 0, "Amount must be > 0");
        
        dailyRewardPool[day] += amount;
        poolFunded[day] = true;
        
        emit RewardPoolFunded(day, amount);
    }

    /**
     * @notice Get available pool for current day
     */
    function getCurrentDayPool() public view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        return poolFunded[today] ? dailyRewardPool[today] : defaultDailyPool;
    }

    /**
     * @notice Get pool for specific day
     */
    function getDayPool(uint256 day) external view returns (uint256) {
        return poolFunded[day] ? dailyRewardPool[day] : defaultDailyPool;
    }

    /**
     * @notice Distribute reward (called by RewardDistributor contract)
     * @param to Recipient
     * @param amount Amount to distribute
     */
    function distributeReward(address to, uint256 amount) external {
        require(
            accessControl.hasRole(accessControl.TREASURY_ROLE(), msg.sender),
            "Not authorized"
        );
        require(cosmToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        
        require(cosmToken.transfer(to, amount), "Transfer failed");
        totalWithdrawn[to] += amount;
    }

    /**
     * @notice Request withdrawal (requires both owners to approve)
     * @param to Recipient
     * @param amount Amount to withdraw
     */
    function requestWithdrawal(address to, uint256 amount) external returns (uint256) {
        require(
            accessControl.hasRole(accessControl.OWNER_ROLE(), msg.sender),
            "Not authorized"
        );
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be > 0");
        require(cosmToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        
        uint256 requestId = withdrawalRequestCounter++;
        
        withdrawalRequests[requestId] = WithdrawalRequest({
            to: to,
            amount: amount,
            approved1: true,
            approved2: false,
            approver1: msg.sender,
            approver2: address(0),
            executed: false,
            createdAt: block.timestamp
        });
        
        emit WithdrawalRequested(requestId, to, amount);
        return requestId;
    }

    /**
     * @notice Approve withdrawal request
     * @param requestId Request to approve
     */
    function approveWithdrawal(uint256 requestId) external {
        require(
            accessControl.hasRole(accessControl.OWNER_ROLE(), msg.sender),
            "Not authorized"
        );
        
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        require(!request.executed, "Already executed");
        require(msg.sender != request.approver1, "Already approved");
        require(block.timestamp <= request.createdAt + 7 days, "Request expired");
        
        request.approved2 = true;
        request.approver2 = msg.sender;
        
        emit WithdrawalApproved(requestId, msg.sender);
    }

    /**
     * @notice Execute approved withdrawal
     * @param requestId Request to execute
     */
    function executeWithdrawal(uint256 requestId) external {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        
        require(!request.executed, "Already executed");
        require(request.approved1 && request.approved2, "Not fully approved");
        require(block.timestamp <= request.createdAt + 7 days, "Request expired");
        
        request.executed = true;
        
        require(cosmToken.transfer(request.to, request.amount), "Transfer failed");
        totalTreasuryWithdrawn += request.amount;
        
        emit WithdrawalExecuted(requestId, request.to, request.amount);
    }

    /**
     * @notice Update default daily pool amount
     */
    function setDefaultDailyPool(uint256 amount) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        defaultDailyPool = amount;
        emit DefaultPoolUpdated(amount);
    }

    /**
     * @notice Get treasury balance
     */
    function getBalance() external view returns (uint256) {
        return cosmToken.balanceOf(address(this));
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