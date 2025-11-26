// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../core/AccessControl.sol";

/**
 * @title COSMToken
 * @author John Kenechukwu (Asmodeus)
 * @notice $COSM token for Cosmic Collector game
 * @dev Fixed supply of 1 billion with custom transfer fees and burning

 */
contract COSMToken is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, UUPSUpgradeable {
    CosmicAccessControl public accessControl;

    // Token configuration
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion
    uint256 public transferFeeBasisPoints; // Fee in basis points (100 = 1%)
    uint256 public constant MAX_FEE_BASIS_POINTS = 800; // Max 8%

    // Fee collection
    address public feeCollector;
    uint256 public totalFeesCollected;

    // Whitelist for fee exemptions
    mapping(address => bool) public feeExempt;

    // Events
    event TransferFeeUpdated(uint256 newFeeBasisPoints);
    event FeeCollectorUpdated(address indexed newCollector);
    event FeeExemptionUpdated(address indexed account, bool exempt);
    event FeesCollected(address indexed from, address indexed to, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _accessControl,
        address _feeCollector,
        uint256 _initialFeeBasisPoints
    ) public initializer {
        __ERC20_init("Cosmic Token", "COSM");
        __ERC20Burnable_init();
        __UUPSUpgradeable_init();

        require(_feeCollector != address(0), "Invalid fee collector");
        require(_initialFeeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee too high");

        accessControl = CosmicAccessControl(_accessControl);
        feeCollector = _feeCollector;
        transferFeeBasisPoints = _initialFeeBasisPoints;

        // Mint entire supply to deployer (will be distributed to treasury)
        _mint(msg.sender, MAX_SUPPLY);

        // Exempt treasury and this contract from fees
        feeExempt[_feeCollector] = true;
        feeExempt[address(this)] = true;
    }

    /**
     * @notice Transfer with automatic fee deduction
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        uint256 fee = _calculateFee(owner, to, amount);
        
        if (fee > 0) {
            uint256 amountAfterFee = amount - fee;
            _transfer(owner, feeCollector, fee);
            _transfer(owner, to, amountAfterFee);
            totalFeesCollected += fee;
            emit FeesCollected(owner, to, fee);
        } else {
            _transfer(owner, to, amount);
        }
        
        return true;
    }

    /**
     * @notice TransferFrom with automatic fee deduction
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        
        uint256 fee = _calculateFee(from, to, amount);
        
        if (fee > 0) {
            uint256 amountAfterFee = amount - fee;
            _transfer(from, feeCollector, fee);
            _transfer(from, to, amountAfterFee);
            totalFeesCollected += fee;
            emit FeesCollected(from, to, fee);
        } else {
            _transfer(from, to, amount);
        }
        
        return true;
    }

    /**
     * @notice Calculate transfer fee
     */
    function _calculateFee(
        address from,
        address to,
        uint256 amount
    ) internal view returns (uint256) {
        // No fee if either party is exempt
        if (feeExempt[from] || feeExempt[to]) {
            return 0;
        }
        
        // Calculate fee
        return (amount * transferFeeBasisPoints) / 10000;
    }

    /**
     * @notice Update transfer fee (2-8%)
     */
    function setTransferFee(uint256 newFeeBasisPoints) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        require(
            newFeeBasisPoints >= 200 && newFeeBasisPoints <= MAX_FEE_BASIS_POINTS,
            "Fee must be between 2-8%"
        );
        
        transferFeeBasisPoints = newFeeBasisPoints;
        emit TransferFeeUpdated(newFeeBasisPoints);
    }

    /**
     * @notice Update fee collector address
     */
    function setFeeCollector(address newCollector) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        require(newCollector != address(0), "Invalid address");
        
        feeCollector = newCollector;
        emit FeeCollectorUpdated(newCollector);
    }

    /**
     * @notice Set fee exemption status for an address
     */
    function setFeeExempt(address account, bool exempt) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        
        feeExempt[account] = exempt;
        emit FeeExemptionUpdated(account, exempt);
    }

    /**
     * @notice Calculate fee for a transfer (view function)
     */
    function calculateTransferFee(
        address from,
        address to,
        uint256 amount
    ) external view returns (uint256 fee, uint256 amountAfterFee) {
        fee = _calculateFee(from, to, amount);
        amountAfterFee = amount - fee;
    }

    /**
     * @notice Burn tokens (deflationary mechanism)
     */
    function burn(uint256 amount) public virtual override {
        super.burn(amount);
    }

    /**
     * @notice Burn tokens from another account
     */
    function burnFrom(address account, uint256 amount) public virtual override {
        super.burnFrom(account, amount);
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