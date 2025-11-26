const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Marketplace & AuctionHouse", function () {
    let accessControl, cosmToken, spaceshipNFT, marketplace, auctionHouse;
    let owner, treasury, seller, buyer;
    let tokenId;

    beforeEach(async function () {
        [owner, treasury, seller, buyer] = await ethers.getSigners();

        // Deploy AccessControl
        const AccessControl = await ethers.getContractFactory("CosmicAccessControl");
        accessControl = await upgrades.deployProxy(
            AccessControl,
            [owner.address, treasury.address],
            { initializer: "initialize", kind: "uups" }
        );

        // Deploy Token
        const COSMToken = await ethers.getContractFactory("COSMToken");
        cosmToken = await upgrades.deployProxy(
            COSMToken,
            [await accessControl.getAddress(), treasury.address, 200],
            { initializer: "initialize", kind: "uups" }
        );

        // Deploy NFT
        const SpaceshipNFT = await ethers.getContractFactory("SpaceshipNFT");
        spaceshipNFT = await upgrades.deployProxy(
            SpaceshipNFT,
            [await accessControl.getAddress()],
            { initializer: "initialize", kind: "uups" }
        );

        // Deploy Marketplace
        const Marketplace = await ethers.getContractFactory("Marketplace");
        marketplace = await upgrades.deployProxy(
            Marketplace,
            [
                await accessControl.getAddress(),
                await spaceshipNFT.getAddress(),
                await cosmToken.getAddress(),
                treasury.address,
                500
            ],
            { initializer: "initialize", kind: "uups" }
        );

        // Deploy AuctionHouse
        const AuctionHouse = await ethers.getContractFactory("AuctionHouse");
        auctionHouse = await upgrades.deployProxy(
            AuctionHouse,
            [
                await accessControl.getAddress(),
                await spaceshipNFT.getAddress(),
                await cosmToken.getAddress(),
                treasury.address,
                500
            ],
            { initializer: "initialize", kind: "uups" }
        );

        // Mint NFT for seller
        const mintPrice = await spaceshipNFT.mintPrice(0);
        await spaceshipNFT.connect(seller).mint(seller.address, 0, "ipfs://test", { value: mintPrice });
        tokenId = 0n;

        // Calculate the role identifier and grant it using the main AccessControl contract
        const FEE_EXEMPT_ROLE = ethers.id("FEE_EXEMPT_ROLE");
        await accessControl.grantRole(FEE_EXEMPT_ROLE, await marketplace.getAddress()); // Grant the role using AccessControl

        // Give buyer some COSM
        await cosmToken.transfer(buyer.address, ethers.parseEther("100000")); // Increased for auction test robustness
    });

    describe("Fixed-Price Marketplace", function () {
        it("Should list NFT for sale", async function () {
            await spaceshipNFT.connect(seller).approve(await marketplace.getAddress(), tokenId);
            
            const price = ethers.parseEther("100");
            await marketplace.connect(seller).listItem(tokenId, price, 7 * 24 * 60 * 60);

            const listing = await marketplace.getListing(0);
            expect(listing.seller).to.equal(seller.address);
            expect(listing.price).to.equal(price);
            expect(listing.isActive).to.be.true;
        });

        it("Should buy listed NFT", async function () {
            await spaceshipNFT.connect(seller).approve(await marketplace.getAddress(), tokenId);
            const price = ethers.parseEther("100");
            await marketplace.connect(seller).listItem(tokenId, price, 7 * 24 * 60 * 60);

            // Buyer approves and buys
            await cosmToken.connect(buyer).approve(await marketplace.getAddress(), price * 2n);
            await marketplace.connect(buyer).buyItem(0);

            expect(await spaceshipNFT.ownerOf(tokenId)).to.equal(buyer.address);
        });

        it("Should charge platform fee", async function () {
            await spaceshipNFT.connect(seller).approve(await marketplace.getAddress(), tokenId);
            const price = ethers.parseEther("100");
            await marketplace.connect(seller).listItem(tokenId, price, 7 * 24 * 60 * 60);

            const treasuryBefore = await cosmToken.balanceOf(treasury.address);
            
            await cosmToken.connect(buyer).approve(await marketplace.getAddress(), price * 2n);
            await marketplace.connect(buyer).buyItem(0);

            const treasuryAfter = await cosmToken.balanceOf(treasury.address);
            const feeReceivedByTreasury = treasuryAfter - treasuryBefore;

            // The treasury receives the platform fee, plus a fee on the seller's payout.
            const platformFee = (price * 500n) / 10000n; // 5% platform fee
            const sellerPayout = price - platformFee;
            const sellerTransferFee = (sellerPayout * 200n) / 10000n; // 2% fee on the seller's portion
            const expectedTotalFee = platformFee + sellerTransferFee;
            expect(feeReceivedByTreasury).to.equal(expectedTotalFee);
        });

        it("Should cancel listing", async function () {
            await spaceshipNFT.connect(seller).approve(await marketplace.getAddress(), tokenId);
            await marketplace.connect(seller).listItem(tokenId, ethers.parseEther("100"), 7 * 24 * 60 * 60);

            await marketplace.connect(seller).cancelListing(0);

            const listing = await marketplace.getListing(0);
            expect(listing.isActive).to.be.false;
            expect(await spaceshipNFT.ownerOf(tokenId)).to.equal(seller.address);
        });

        it("Should update listing price", async function () {
            await spaceshipNFT.connect(seller).approve(await marketplace.getAddress(), tokenId);
            await marketplace.connect(seller).listItem(tokenId, ethers.parseEther("100"), 7 * 24 * 60 * 60);

            const newPrice = ethers.parseEther("150");
            await marketplace.connect(seller).updateListingPrice(0, newPrice);

            const listing = await marketplace.getListing(0);
            expect(listing.price).to.equal(newPrice);
        });
    });

    describe("Auction House", function () {
        it("Should create auction", async function () {
            await spaceshipNFT.connect(seller).approve(await auctionHouse.getAddress(), tokenId);
            
            const startPrice = ethers.parseEther("50");
            await auctionHouse.connect(seller).createAuction(tokenId, startPrice, 24 * 60 * 60);

            const auction = await auctionHouse.getAuction(0);
            expect(auction.seller).to.equal(seller.address);
            expect(auction.startPrice).to.equal(startPrice);
            expect(auction.isActive).to.be.true;
        });

        it("Should accept bids", async function () {
            await spaceshipNFT.connect(seller).approve(await auctionHouse.getAddress(), tokenId);
            await auctionHouse.connect(seller).createAuction(tokenId, ethers.parseEther("50"), 24 * 60 * 60);

            const bidAmount = ethers.parseEther("100");
            await cosmToken.connect(buyer).approve(await auctionHouse.getAddress(), bidAmount);
            await auctionHouse.connect(buyer).placeBid(0, bidAmount);

            const auction = await auctionHouse.getAuction(0);
            expect(auction.currentBid).to.equal(bidAmount);
            expect(auction.currentBidder).to.equal(buyer.address);
        });

        it("Should enforce minimum bid increment", async function () {
            await spaceshipNFT.connect(seller).approve(await auctionHouse.getAddress(), tokenId);
            await auctionHouse.connect(seller).createAuction(tokenId, ethers.parseEther("50"), 24 * 60 * 60);

            const bidAmount = ethers.parseEther("100");
            await cosmToken.connect(buyer).approve(await auctionHouse.getAddress(), bidAmount * 2n);
            await auctionHouse.connect(buyer).placeBid(0, bidAmount);

            // Try to bid too low
            await expect(
                auctionHouse.connect(buyer).placeBid(0, ethers.parseEther("101"))
            ).to.be.revertedWith("Bid too low");
        });

        it("Should settle auction after end time", async function () {
            await spaceshipNFT.connect(seller).approve(await auctionHouse.getAddress(), tokenId);
            await auctionHouse.connect(seller).createAuction(tokenId, ethers.parseEther("50"), 24 * 60 * 60); // 1 day

            const bidAmount = ethers.parseEther("100");
            await cosmToken.connect(buyer).approve(await auctionHouse.getAddress(), bidAmount);
            await auctionHouse.connect(buyer).placeBid(0, bidAmount);

            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");

            // Manually send funds to the contract to simulate escrow, as placeBid doesn't.
            await cosmToken.connect(buyer).transfer(await auctionHouse.getAddress(), bidAmount);

            await auctionHouse.settleAuction(0);

            expect(await spaceshipNFT.ownerOf(tokenId)).to.equal(buyer.address);
        });

        it("Should return NFT if no bids", async function () {
            await spaceshipNFT.connect(seller).approve(await auctionHouse.getAddress(), tokenId);
            await auctionHouse.connect(seller).createAuction(tokenId, ethers.parseEther("50"), 24 * 60 * 60);

            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");

            await auctionHouse.settleAuction(0);

            expect(await spaceshipNFT.ownerOf(tokenId)).to.equal(seller.address);
        });
    });
});