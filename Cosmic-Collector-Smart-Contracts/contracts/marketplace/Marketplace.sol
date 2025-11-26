// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../libraries/GameTypes.sol";
import "../core/AccessControl.sol";

contract Marketplace is Initializable, UUPSUpgradeable {
    CosmicAccessControl public accessControl;
    IERC721Upgradeable public nftContract;
    IERC20Upgradeable public cosmToken;
    
    address public treasury;
    uint256 public platformFeeBasisPoints; // 2-8% fee
    uint256 public constant MAX_FEE = 800; // 8%
    
    // Listings
    mapping(uint256 => GameTypes.Listing) public listings;
    uint256 public listingIdCounter;
    mapping(uint256 => uint256) public tokenIdToListingId;
    
    // Events
    event ItemListed(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 price);
    event ItemSold(uint256 indexed listingId, address indexed buyer, uint256 indexed tokenId, uint256 price);
    event ListingCancelled(uint256 indexed listingId, uint256 indexed tokenId);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice);
    event PlatformFeeUpdated(uint256 newFee);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _accessControl,
        address _nftContract,
        address _cosmToken,
        address _treasury,
        uint256 _platformFee
    ) public initializer {
        __UUPSUpgradeable_init();
        
        require(_platformFee >= 200 && _platformFee <= MAX_FEE, "Fee must be 2-8%");
        
        accessControl = CosmicAccessControl(_accessControl);
        nftContract = IERC721Upgradeable(_nftContract);
        cosmToken = IERC20Upgradeable(_cosmToken);
        treasury = _treasury;
        platformFeeBasisPoints = _platformFee;
    }

    /**
     * @notice List NFT for sale
     * @param tokenId NFT token ID
     * @param price Price in $COSM
     * @param duration How long listing is valid (in seconds)
     */
    function listItem(
        uint256 tokenId,
        uint256 price,
        uint256 duration
    ) external returns (uint256) {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");
        require(duration >= 1 hours && duration <= 30 days, "Invalid duration");
        require(tokenIdToListingId[tokenId] == 0, "Already listed");
        
        // Transfer NFT to marketplace
        nftContract.transferFrom(msg.sender, address(this), tokenId);
        
        uint256 listingId = listingIdCounter++;
        
        listings[listingId] = GameTypes.Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            isActive: true,
            listedAt: block.timestamp,
            expiresAt: block.timestamp + duration
        });
        
        tokenIdToListingId[tokenId] = listingId;
        
        emit ItemListed(listingId, msg.sender, tokenId, price);
        return listingId;
    }

    /**
     * @notice Buy listed NFT
     * @param listingId Listing to purchase
     */
    function buyItem(uint256 listingId) external {
        GameTypes.Listing storage listing = listings[listingId];
        
        require(listing.isActive, "Listing not active");
        require(block.timestamp <= listing.expiresAt, "Listing expired");
        require(msg.sender != listing.seller, "Cannot buy your own listing");
        
        uint256 price = listing.price;
        uint256 platformFee = (price * platformFeeBasisPoints) / 10000;
        uint256 sellerAmount = price - platformFee;
        
        // Transfer $COSM from buyer
        require(
            cosmToken.transferFrom(msg.sender, treasury, platformFee),
            "Platform fee transfer failed"
        );
        require(
            cosmToken.transferFrom(msg.sender, listing.seller, sellerAmount),
            "Seller payment failed"
        );
        
        // Transfer NFT to buyer
        nftContract.transferFrom(address(this), msg.sender, listing.tokenId);
        
        // Mark as sold
        listing.isActive = false;
        delete tokenIdToListingId[listing.tokenId];
        
        emit ItemSold(listingId, msg.sender, listing.tokenId, price);
    }

    /**
     * @notice Cancel listing
     * @param listingId Listing to cancel
     */
    function cancelListing(uint256 listingId) external {
        GameTypes.Listing storage listing = listings[listingId];
        
        require(listing.isActive, "Listing not active");
        require(
            msg.sender == listing.seller || 
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        
        // Return NFT to seller
        nftContract.transferFrom(address(this), listing.seller, listing.tokenId);
        
        listing.isActive = false;
        delete tokenIdToListingId[listing.tokenId];
        
        emit ListingCancelled(listingId, listing.tokenId);
    }

    /**
     * @notice Update listing price
     * @param listingId Listing to update
     * @param newPrice New price
     */
    function updateListingPrice(uint256 listingId, uint256 newPrice) external {
        GameTypes.Listing storage listing = listings[listingId];
        
        require(listing.isActive, "Listing not active");
        require(msg.sender == listing.seller, "Not seller");
        require(newPrice > 0, "Invalid price");
        require(block.timestamp <= listing.expiresAt, "Listing expired");
        
        listing.price = newPrice;
        emit ListingUpdated(listingId, newPrice);
    }

    /**
     * @notice Get listing details
     */
    function getListing(uint256 listingId) external view returns (GameTypes.Listing memory) {
        return listings[listingId];
    }

    /**
     * @notice Update platform fee
     */
    function setPlatformFee(uint256 newFee) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        require(newFee >= 200 && newFee <= MAX_FEE, "Fee must be 2-8%");
        
        platformFeeBasisPoints = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    /**
     * @notice Update treasury address
     */
    function setTreasury(address newTreasury) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        require(newTreasury != address(0), "Invalid address");
        treasury = newTreasury;
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