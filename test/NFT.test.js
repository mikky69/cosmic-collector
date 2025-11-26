const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("SpaceshipNFT", function () {
    let spaceshipNFT, accessControl, nftManager;
    let owner, user1, user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy AccessControl
        const AccessControl = await ethers.getContractFactory("CosmicAccessControl");
        accessControl = await upgrades.deployProxy(
            AccessControl,
            [owner.address, user1.address],
            { initializer: "initialize", kind: "uups" }
        );

        // Deploy SpaceshipNFT
        const SpaceshipNFT = await ethers.getContractFactory("SpaceshipNFT");
        spaceshipNFT = await upgrades.deployProxy(
            SpaceshipNFT,
            [await accessControl.getAddress()],
            { initializer: "initialize", kind: "uups" }
        );

        // Deploy NFTManager
        const NFTManager = await ethers.getContractFactory("NFTManager");
        nftManager = await upgrades.deployProxy(
            NFTManager,
            [await accessControl.getAddress(), await spaceshipNFT.getAddress()],
            { initializer: "initialize", kind: "uups" }
        );
    });

    describe("Minting", function () {
        it("Should mint NFT with correct payment", async function () {
            const mintPrice = await spaceshipNFT.mintPrice(0); // ClassicFighter
            
            const tx = await spaceshipNFT.connect(user1).mint(
                user1.address,
                0,
                "ipfs://test",
                { value: mintPrice }
            );

            await tx.wait();
            expect(await spaceshipNFT.balanceOf(user1.address)).to.equal(1);
        });

        it("Should fail without payment", async function () {
            await expect(
                spaceshipNFT.connect(user1).mint(user1.address, 0, "ipfs://test")
            ).to.be.revertedWith("Insufficient payment");
        });

        it("Should generate random rarity", async function () {
            const mintPrice = await spaceshipNFT.mintPrice(0);
            
            await spaceshipNFT.connect(user1).mint(
                user1.address,
                0,
                "ipfs://test",
                { value: mintPrice }
            );

            const stats = await spaceshipNFT.getShipStats(0);
            expect(stats.rarity).to.be.gte(0); // Rarity is Common or better
            expect(stats.rarity).to.be.lte(3); // Rarity is Epic or worse
        });

        it("Should have different stats for different ship types", async function () {
            const mintPrice1 = await spaceshipNFT.mintPrice(0); // ClassicFighter
            const mintPrice2 = await spaceshipNFT.mintPrice(1); // SpeedRacer

            await spaceshipNFT.connect(user1).mint(user1.address, 0, "ipfs://1", { value: mintPrice1 });
            await spaceshipNFT.connect(user1).mint(user1.address, 1, "ipfs://2", { value: mintPrice2 });

            const stats1 = await spaceshipNFT.getShipStats(0);
            const stats2 = await spaceshipNFT.getShipStats(1);

            expect(stats1.shipType).to.not.equal(stats2.shipType);
        });
    });

    describe("Stats System", function () {
        let tokenId;

        beforeEach(async function () {
            const mintPrice = await spaceshipNFT.mintPrice(0);
            await spaceshipNFT.connect(user1).mint(user1.address, 0, "ipfs://test", { value: mintPrice });
            tokenId = 0n;
        });

        it("Should have valid base stats", async function () {
            const stats = await spaceshipNFT.getShipStats(tokenId);
            
            expect(stats.speed).to.be.gt(0).and.lte(100);
            expect(stats.armor).to.be.gt(0).and.lte(100);
            expect(stats.firepower).to.be.gt(0).and.lte(100);
            expect(stats.luck).to.be.gt(0).and.lte(100);
            expect(stats.pointsMultiplier).to.be.gte(10000); // At least 1x
        });

        it("Should cap stats at 100", async function () {
            const stats = await spaceshipNFT.getShipStats(tokenId);
            
            expect(stats.speed).to.be.lte(100);
            expect(stats.armor).to.be.lte(100);
            expect(stats.firepower).to.be.lte(100);
            expect(stats.luck).to.be.lte(100);
        });
    });

    describe("NFT Manager - Upgrades", function () {
        let tokenId;

        beforeEach(async function () {
            const mintPrice = await spaceshipNFT.mintPrice(0);
            await spaceshipNFT.connect(user1).mint(user1.address, 0, "ipfs://test", { value: mintPrice });
            tokenId = 0n;
        });

        it("Should upgrade NFT with payment", async function () {
            const upgradeInfo = await nftManager.getUpgradeInfo(tokenId);
            
            await nftManager.connect(user1).upgradeNFT(tokenId, {
                value: upgradeInfo.nextUpgradeCost
            });

            const newInfo = await nftManager.getUpgradeInfo(tokenId);
            expect(newInfo.currentLevel).to.equal(1);
        });

        it("Should enforce cooldown", async function () {
            const upgradeInfo = await nftManager.getUpgradeInfo(tokenId);
            
            await nftManager.connect(user1).upgradeNFT(tokenId, {
                value: upgradeInfo.nextUpgradeCost
            });

            await expect(
                nftManager.connect(user1).upgradeNFT(tokenId, { value: upgradeInfo.nextUpgradeCost })
            ).to.be.revertedWith("Cooldown active");
        });
    });

    describe("Admin Functions", function () {
        it("Should allow admin to mint reward NFTs", async function () {
            await spaceshipNFT.mintReward(user2.address, 0, 3, "ipfs://reward");
            
            expect(await spaceshipNFT.balanceOf(user2.address)).to.equal(1);
            
            const stats = await spaceshipNFT.getShipStats(0);
            expect(stats.rarity).to.equal(3); // Epic
        });

        it("Should update mint prices", async function () {
            const newPrice = ethers.parseEther("10");
            await spaceshipNFT.setMintPrice(0, newPrice);
            
            expect(await spaceshipNFT.mintPrice(0)).to.equal(newPrice);
        });

        it("Should prevent non-admin from changing prices", async function () {
            await expect(
                spaceshipNFT.connect(user2).setMintPrice(0, ethers.parseEther("1"))
            ).to.be.reverted;
        });
    });
});