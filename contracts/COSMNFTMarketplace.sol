// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title COSM NFT Marketplace Contract
 * @dev Manages NFT purchases and character enhancements
 */
contract COSMNFTMarketplace {
    address public owner;
    
    struct NFT {
        uint256 id;
        string name;
        string nftType;
        uint256 price;
        uint256 hbarPrice;
        string metadata;
        bool active;
        uint256 supply;
        uint256 minted;
    }
    
    struct PlayerNFT {
        uint256 nftId;
        uint256 purchaseTime;
        bool equipped;
    }
    
    mapping(uint256 => NFT) public nfts;
    mapping(address => mapping(uint256 => PlayerNFT)) public playerNFTs;
    mapping(address => uint256[]) public playerNFTList;
    
    uint256 public nftCount;
    
    event NFTCreated(uint256 indexed nftId, string name, uint256 price);
    event NFTPurchased(address indexed buyer, uint256 indexed nftId, uint256 price);
    event NFTEquipped(address indexed player, uint256 indexed nftId);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        createInitialNFTs();
    }
    
    function createInitialNFTs() private {
        createNFT("Speed Runner", "character", 500 * 10**8, 5 * 10**8, 
                  '{"boost":"speed","value":50}', 100);
        
        createNFT("Power Tank", "character", 800 * 10**8, 8 * 10**8,
                  '{"boost":"damage","value":100}', 100);
        
        createNFT("Fortune Hunter", "character", 1000 * 10**8, 10 * 10**8,
                  '{"boost":"rewards","value":50}', 50);
    }
    
    function createNFT(
        string memory name,
        string memory nftType,
        uint256 price,
        uint256 hbarPrice,
        string memory metadata,
        uint256 supply
    ) public onlyOwner returns (uint256) {
        nftCount++;
        
        nfts[nftCount] = NFT({
            id: nftCount,
            name: name,
            nftType: nftType,
            price: price,
            hbarPrice: hbarPrice,
            metadata: metadata,
            active: true,
            supply: supply,
            minted: 0
        });
        
        emit NFTCreated(nftCount, name, price);
        return nftCount;
    }
    
    function purchaseNFTWithHBAR(uint256 nftId) public payable returns (bool) {
        NFT storage nft = nfts[nftId];
        require(nft.active, "NFT not active");
        require(nft.minted < nft.supply, "Sold out");
        require(msg.value >= nft.hbarPrice, "Insufficient HBAR");
        
        playerNFTs[msg.sender][nftId] = PlayerNFT({
            nftId: nftId,
            purchaseTime: block.timestamp,
            equipped: false
        });
        
        playerNFTList[msg.sender].push(nftId);
        nft.minted++;
        
        emit NFTPurchased(msg.sender, nftId, msg.value);
        return true;
    }
    
    function equipNFT(uint256 nftId) public returns (bool) {
        require(playerNFTs[msg.sender][nftId].nftId == nftId, "NFT not owned");
        
        playerNFTs[msg.sender][nftId].equipped = true;
        emit NFTEquipped(msg.sender, nftId);
        
        return true;
    }
    
    function getPlayerNFTs(address player) public view returns (uint256[] memory) {
        return playerNFTList[player];
    }
}
