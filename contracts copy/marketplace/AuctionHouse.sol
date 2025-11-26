// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../libraries/GameTypes.sol";
import "../core/AccessControl.sol";

/**
 * @title AuctionHouse
 * @author John Kenechukwu (Asmodeus)
 * @notice Time-based auctions for NFT spaceships
 * @dev Supports both $COSM and HBAR bidding with anti-snipe mechanism
 */
contract AuctionHouse is Initializable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    CosmicAccessControl public accessControl;
    IERC721Upgradeable public nftContract;
    IERC20Upgradeable public cosmToken;
    
    address public treasury;
    uint256 public platformFeeBasisPoints;
    uint256 public constant MAX_FEE = 800; // 8%
    uint256 public minBidIncrement; // Minimum % increase (basis points)
    
    // Auctions
    mapping(uint256 => GameTypes.Auction) public auctions;
    uint256 public auctionIdCounter;
    mapping(uint256 => uint256) public tokenIdToAuctionId;
    
    // Bid tracking
    mapping(uint256 => mapping(address => uint256)) public pendingReturns;
    
    // Auction configuration
    uint256 public minAuctionDuration;
    uint256 public maxAuctionDuration;
    uint256 public antiSnipeExtension; // Time extension if bid in last minutes
    
    // Events
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 startPrice,
        uint256 startTime,
        uint256 endTime
    );
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 newEndTime
    );
    event AuctionSettled(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 finalPrice
    );
    event AuctionCancelled(uint256 indexed auctionId);
    event AuctionExtended(uint256 indexed auctionId, uint256 newEndTime);
    event PlatformFeeUpdated(uint256 newFee);
    event MinBidIncrementUpdated(uint256 newIncrement);
    event BidWithdrawn(uint256 indexed auctionId, address indexed bidder, uint256 amount);

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
        __ReentrancyGuard_init();
        
        require(_platformFee >= 200 && _platformFee <= MAX_FEE, "Fee must be 2-8%");
        
        accessControl = CosmicAccessControl(_accessControl);
        nftContract = IERC721Upgradeable(_nftContract);
        cosmToken = IERC20Upgradeable(_cosmToken);
        treasury = _treasury;
        platformFeeBasisPoints = _platformFee;
        
        minBidIncrement = 500; // 5%
        minAuctionDuration = 1 hours;
        maxAuctionDuration = 7 days;
        antiSnipeExtension = 5 minutes;
    }

    /**
     * @notice Create an auction for NFT
     * @param tokenId NFT to auction
     * @param startPrice Starting bid price in $COSM
     * @param duration Auction duration in seconds
     */
    function createAuction(
        uint256 tokenId,
        uint256 startPrice,
        uint256 duration
    ) external returns (uint256) {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        require(startPrice > 0, "Start price must be > 0");
        require(
            duration >= minAuctionDuration && duration <= maxAuctionDuration,
            "Invalid duration"
        );
        require(tokenIdToAuctionId[tokenId] == 0, "Already in auction");
        
        // Transfer NFT to contract
        nftContract.transferFrom(msg.sender, address(this), tokenId);
        
        uint256 auctionId = auctionIdCounter++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        auctions[auctionId] = GameTypes.Auction({
            seller: msg.sender,
            tokenId: tokenId,
            startPrice: startPrice,
            currentBid: 0,
            currentBidder: address(0),
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            isSettled: false
        });
        
        tokenIdToAuctionId[tokenId] = auctionId;
        
        emit AuctionCreated(auctionId, msg.sender, tokenId, startPrice, startTime, endTime);
        return auctionId;
    }

    /**
     * @notice Place a bid on an auction
     * @param auctionId Auction to bid on
     * @param bidAmount Amount to bid in $COSM
     */
    function placeBid(uint256 auctionId, uint256 bidAmount) external nonReentrant {
        GameTypes.Auction storage auction = auctions[auctionId];
        
        require(auction.isActive, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(bidAmount > 0, "Bid must be > 0");
        
        // Check minimum bid
        uint256 minBid;
        if (auction.currentBid == 0) {
            minBid = auction.startPrice;
        } else {
            minBid = auction.currentBid + (auction.currentBid * minBidIncrement / 10000);
        }
        
        require(bidAmount >= minBid, "Bid too low");
        
        // Transfer $COSM from bidder
        require(
            cosmToken.transferFrom(msg.sender, address(this), bidAmount),
            "Transfer failed"
        );
        
        // Refund previous bidder (add to pending returns)
        if (auction.currentBidder != address(0)) {
            pendingReturns[auctionId][auction.currentBidder] += auction.currentBid;
        }
        
        // Update auction
        auction.currentBid = bidAmount;
        auction.currentBidder = msg.sender;
        
        // Anti-snipe: Extend auction if bid placed in last minutes
        uint256 timeRemaining = auction.endTime - block.timestamp;
        if (timeRemaining < antiSnipeExtension) {
            auction.endTime = block.timestamp + antiSnipeExtension;
            emit AuctionExtended(auctionId, auction.endTime);
        }
        
        emit BidPlaced(auctionId, msg.sender, bidAmount, auction.endTime);
    }

    /**
     * @notice Settle auction (anyone can call after end time)
     * @param auctionId Auction to settle
     */
    function settleAuction(uint256 auctionId) external nonReentrant {
        GameTypes.Auction storage auction = auctions[auctionId];
        
        require(auction.isActive, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.isSettled, "Already settled");
        
        auction.isActive = false;
        auction.isSettled = true;
        
        if (auction.currentBidder != address(0)) {
            // Auction had bids
            uint256 finalPrice = auction.currentBid;
   
            uint256 platformFee = (finalPrice * platformFeeBasisPoints) / 10000;
            uint256 sellerAmount = finalPrice - platformFee;
            
            // Transfer fee to treasury
            require(cosmToken.transfer(treasury, platformFee), "Fee transfer failed");
            
            // Transfer payment to seller
            require(cosmToken.transfer(auction.seller, sellerAmount), "Payment failed");
            
            // Transfer NFT to winner
            nftContract.transferFrom(address(this), auction.currentBidder, auction.tokenId);
            
            emit AuctionSettled(auctionId, auction.currentBidder, finalPrice);
        } else {
            // No bids, return NFT to seller
            nftContract.transferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionSettled(auctionId, address(0), 0);
        }
        
        delete tokenIdToAuctionId[auction.tokenId];
    }

    /**
     * @notice Cancel auction (seller only, before any bids)
     * @param auctionId Auction to cancel
     */
    function cancelAuction(uint256 auctionId) external {
        GameTypes.Auction storage auction = auctions[auctionId];
        
        require(auction.isActive, "Auction not active");
        require(
            msg.sender == auction.seller ||
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        require(auction.currentBidder == address(0), "Auction has bids");
        
        auction.isActive = false;
        auction.isSettled = true;
        
        // Return NFT to seller
        nftContract.transferFrom(address(this), auction.seller, auction.tokenId);
        
        delete tokenIdToAuctionId[auction.tokenId];
        emit AuctionCancelled(auctionId);
    }

    /**
     * @notice Withdraw failed bid (if outbid)
     * @param auctionId Auction to withdraw from
     */
    function withdrawBid(uint256 auctionId) external nonReentrant {
        uint256 amount = pendingReturns[auctionId][msg.sender];
        require(amount > 0, "No pending returns");
        
        pendingReturns[auctionId][msg.sender] = 0;
        require(cosmToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit BidWithdrawn(auctionId, msg.sender, amount);
    }

    /**
     * @notice Batch withdraw from multiple auctions
     * @param auctionIds Array of auction IDs to withdraw from
     */
    function batchWithdrawBids(uint256[] calldata auctionIds) external nonReentrant {
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < auctionIds.length; i++) {
            uint256 amount = pendingReturns[auctionIds[i]][msg.sender];
            if (amount > 0) {
                pendingReturns[auctionIds[i]][msg.sender] = 0;
                totalAmount += amount;
                emit BidWithdrawn(auctionIds[i], msg.sender, amount);
            }
        }
        
        require(totalAmount > 0, "No pending returns");
        require(cosmToken.transfer(msg.sender, totalAmount), "Transfer failed");
    }

    /**
     * @notice Get auction details
     */
    function getAuction(uint256 auctionId) external view returns (GameTypes.Auction memory) {
        return auctions[auctionId];
    }

    /**
     * @notice Get time remaining in auction
     */
    function getTimeRemaining(uint256 auctionId) external view returns (uint256) {
        GameTypes.Auction memory auction = auctions[auctionId];
        
        if (!auction.isActive || block.timestamp >= auction.endTime) {
            return 0;
        }
        
        return auction.endTime - block.timestamp;
    }

    /**
     * @notice Get minimum next bid
     */
    function getMinimumBid(uint256 auctionId) external view returns (uint256) {
        GameTypes.Auction memory auction = auctions[auctionId];
        
        if (auction.currentBid == 0) {
            return auction.startPrice;
        }
        
        return auction.currentBid + (auction.currentBid * minBidIncrement / 10000);
    }

    /**
     * @notice Check if auction can be settled
     */
    function canSettle(uint256 auctionId) external view returns (bool) {
        GameTypes.Auction memory auction = auctions[auctionId];
        return auction.isActive && 
               !auction.isSettled && 
               block.timestamp >= auction.endTime;
    }

    /**
     * @notice Get pending returns for user
     */
    function getPendingReturns(uint256 auctionId, address user) external view returns (uint256) {
        return pendingReturns[auctionId][user];
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
     * @notice Update minimum bid increment
     */
    function setMinBidIncrement(uint256 newIncrement) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        require(newIncrement >= 100 && newIncrement <= 2000, "Invalid increment");
        
        minBidIncrement = newIncrement;
        emit MinBidIncrementUpdated(newIncrement);
    }

    /**
     * @notice Update auction duration limits
     */
    function setAuctionDurationLimits(uint256 minDuration, uint256 maxDuration) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        require(minDuration >= 1 hours && maxDuration <= 30 days, "Invalid durations");
        require(minDuration < maxDuration, "Min must be < max");
        
        minAuctionDuration = minDuration;
        maxAuctionDuration = maxDuration;
    }

    /**
     * @notice Update anti-snipe extension time
     */
    function setAntiSnipeExtension(uint256 extensionTime) external {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Not authorized"
        );
        require(extensionTime >= 1 minutes && extensionTime <= 30 minutes, "Invalid extension");
        
        antiSnipeExtension = extensionTime;
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