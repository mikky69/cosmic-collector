// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title AccessControl
 * @author John Kenechukwu (Asmodeus)
 * @notice Manages roles and permissions for the Cosmic Collector platform
 * @dev Two owners with multi-sig for critical operations
 */
contract CosmicAccessControl is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // Role definitions
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GAME_MANAGER_ROLE = keccak256("GAME_MANAGER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Emergency pause
    bool public paused;

    // Events
    event Paused(address account);
    event Unpaused(address account);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract with two owners
     * @param owner1 First owner address
     * @param owner2 Second owner address
     */
    function initialize(address owner1, address owner2) public initializer {
        require(owner1 != address(0) && owner2 != address(0), "Invalid owner addresses");
        require(owner1 != owner2, "Owners must be different");

        __AccessControl_init();
        __UUPSUpgradeable_init();

        // Grant roles to both owners
        _grantRole(DEFAULT_ADMIN_ROLE, owner1);
        _grantRole(DEFAULT_ADMIN_ROLE, owner2);
        _grantRole(OWNER_ROLE, owner1);
        _grantRole(OWNER_ROLE, owner2);
        _grantRole(ADMIN_ROLE, owner1);
        _grantRole(ADMIN_ROLE, owner2);

        paused = false;
    }

    /**
     * @notice Pause all contract operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        require(!paused, "Already paused");
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpause contract operations
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        require(paused, "Not paused");
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @notice Check if contract is paused
     */
    function isPaused() external view returns (bool) {
        return paused;
    }

    /**
     * @notice Modifier to check if not paused
     */
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /**
     * @notice Modifier to check if paused
     */
    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    /**
     * @notice Grant game manager role
     * @param account Address to grant role
     */
    function grantGameManager(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(GAME_MANAGER_ROLE, account);
    }

    /**
     * @notice Grant treasury role
     * @param account Address to grant role
     */
    function grantTreasuryRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(TREASURY_ROLE, account);
    }

    /**
     * @notice Grant pauser role
     * @param account Address to grant role
     */
    function grantPauserRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(PAUSER_ROLE, account);
    }

    /**
     * @notice Required by UUPSUpgradeable - only owners can upgrade
     */
    function _authorizeUpgrade(address _newImplementation) internal override whenNotPaused {
        require(hasRole(OWNER_ROLE, msg.sender), "Not an owner");
    }

    /**
     * @notice Get contract version
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}