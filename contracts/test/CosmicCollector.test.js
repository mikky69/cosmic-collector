const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cosmic Collector Contracts", function () {
  let cosmicShipNFT;
  let cosmicShipMarketplace;
  let cosmicLeaderboard;
  let owner;
  let user1;
  let user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy CosmicShipNFT
    const CosmicShipNFT = await ethers.getContractFactory("CosmicShipNFT");
    cosmicShipNFT = await CosmicShipNFT.deploy(owner.address);
    await cosmicShipNFT.waitForDeployment();
    
    // Deploy CosmicShipMarketplace
    const CosmicShipMarketplace = await ethers.getContractFactory("CosmicShipMarketplace");
    cosmicShipMarketplace = await CosmicShipMarketplace.deploy(
      await cosmicShipNFT.getAddress(),
      owner.address
    );
    await cosmicShipMarketplace.waitForDeployment();
    
    // Deploy CosmicLeaderboard
    const CosmicLeaderboard = await ethers.getContractFactory("CosmicLeaderboard");
    cosmicLeaderboard = await CosmicLeaderboard.deploy(owner.address);
    await cosmicLeaderboard.waitForDeployment();
  });
  
  describe("CosmicShipNFT", function () {
    it("Should mint a basic ship NFT", async function () {
      const mintPrice = ethers.parseEther("10"); // 10 HBAR for basic ship
      const tokenURI = "https://ipfs.io/ipfs/QmTest123";
      const customName = "My First Ship";
      
      await expect(
        cosmicShipNFT.connect(user1).mintShip(
          user1.address,
          0, // ShipType.BASIC
          tokenURI,
          customName,
          { value: mintPrice }
        )
      ).to.emit(cosmicShipNFT, "ShipMinted")
       .withArgs(user1.address, 0, 0); // tokenId 0, ShipType.BASIC
      
      expect(await cosmicShipNFT.ownerOf(0)).to.equal(user1.address);
      expect(await cosmicShipNFT.tokenURI(0)).to.equal(tokenURI);
    });
    
    it("Should add experience and level up", async function () {
      // First mint a ship
      const mintPrice = ethers.parseEther("10");
      await cosmicShipNFT.connect(user1).mintShip(
        user1.address,
        0,
        "https://ipfs.io/ipfs/QmTest123",
        "Test Ship",
        { value: mintPrice }
      );
      
      // Add experience (1000 exp = 1 level)
      await expect(
        cosmicShipNFT.connect(user1).addExperience(0, 1500)
      ).to.emit(cosmicShipNFT, "ShipUpgraded")
       .withArgs(0, 2); // Level 2
      
      const ship = await cosmicShipNFT.getShip(0);
      expect(ship.level).to.equal(2);
      expect(ship.experience).to.equal(1500);
    });
    
    it("Should get user's ships", async function () {
      const mintPrice = ethers.parseEther("10");
      
      // Mint two ships for user1
      await cosmicShipNFT.connect(user1).mintShip(
        user1.address, 0, "uri1", "Ship1", { value: mintPrice }
      );
      await cosmicShipNFT.connect(user1).mintShip(
        user1.address, 0, "uri2", "Ship2", { value: mintPrice }
      );
      
      const userShips = await cosmicShipNFT.getUserShips(user1.address);
      expect(userShips.length).to.equal(2);
      expect(userShips[0]).to.equal(0);
      expect(userShips[1]).to.equal(1);
    });
  });
  
  describe("CosmicShipMarketplace", function () {
    it("Should purchase game items", async function () {
      const itemPrice = ethers.parseEther("5"); // 5 HBAR for weapon upgrade
      
      await expect(
        cosmicShipMarketplace.connect(user1).purchaseItem(
          0, // ItemType.WEAPON_UPGRADE
          2, // quantity
          { value: itemPrice * 2n }
        )
      ).to.emit(cosmicShipMarketplace, "ItemPurchased")
       .withArgs(user1.address, 0, 2, itemPrice * 2n);
      
      const balance = await cosmicShipMarketplace.getUserItemBalance(user1.address, 0);
      expect(balance).to.equal(2);
    });
    
    it("Should list and purchase NFT", async function () {
      // First mint an NFT
      const mintPrice = ethers.parseEther("10");
      await cosmicShipNFT.connect(user1).mintShip(
        user1.address, 0, "uri", "Ship", { value: mintPrice }
      );
      
      // Approve marketplace
      await cosmicShipNFT.connect(user1).setApprovalForAll(await cosmicShipMarketplace.getAddress(), true);
      
      // List NFT
      const listPrice = ethers.parseEther("15");
      await expect(
        cosmicShipMarketplace.connect(user1).listNFT(0, listPrice)
      ).to.emit(cosmicShipMarketplace, "NFTListed")
       .withArgs(0, user1.address, listPrice);
      
      // Purchase NFT
      await expect(
        cosmicShipMarketplace.connect(user2).purchaseNFT(0, { value: listPrice })
      ).to.emit(cosmicShipMarketplace, "NFTPurchased")
       .withArgs(0, user2.address, user1.address, listPrice);
      
      expect(await cosmicShipNFT.ownerOf(0)).to.equal(user2.address);
    });
  });
  
  describe("CosmicLeaderboard", function () {
    it("Should submit score and update leaderboard", async function () {
      const fee = ethers.parseEther("0.1");
      
      await expect(
        cosmicLeaderboard.connect(user1).submitScore(
          0, // GameType.COSMIC_COLLECTOR
          1500,
          "Player1",
          { value: fee }
        )
      ).to.emit(cosmicLeaderboard, "ScoreSubmitted");
      
      const stats = await cosmicLeaderboard.getPlayerStats(user1.address, 0);
      expect(stats.bestScore).to.equal(1500);
      expect(stats.totalGames).to.equal(1);
    });
    
    it("Should unlock achievements", async function () {
      const fee = ethers.parseEther("0.1");
      
      // Submit first score (should unlock first game achievement)
      await expect(
        cosmicLeaderboard.connect(user1).submitScore(0, 500, "Player1", { value: fee })
      ).to.emit(cosmicLeaderboard, "AchievementUnlocked")
       .withArgs(user1.address, 1);
      
      // Submit high score (should unlock high score achievement)
      await expect(
        cosmicLeaderboard.connect(user1).submitScore(0, 1500, "Player1", { value: fee })
      ).to.emit(cosmicLeaderboard, "AchievementUnlocked")
       .withArgs(user1.address, 2);
      
      expect(await cosmicLeaderboard.hasAchievement(user1.address, 0, 1)).to.be.true;
      expect(await cosmicLeaderboard.hasAchievement(user1.address, 0, 2)).to.be.true;
    });
    
    it("Should maintain leaderboard order", async function () {
      const fee = ethers.parseEther("0.1");
      
      // Submit scores from different users
      await cosmicLeaderboard.connect(user1).submitScore(0, 1000, "Player1", { value: fee });
      await cosmicLeaderboard.connect(user2).submitScore(0, 1500, "Player2", { value: fee });
      await cosmicLeaderboard.connect(user1).submitScore(0, 800, "Player1", { value: fee });
      
      const leaderboard = await cosmicLeaderboard.getLeaderboard(0, 10);
      expect(leaderboard[0].score).to.equal(1500); // Highest score first
      expect(leaderboard[0].player).to.equal(user2.address);
      expect(leaderboard[1].score).to.equal(1000);
    });
  });
});