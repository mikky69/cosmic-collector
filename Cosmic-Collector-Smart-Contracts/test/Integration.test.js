const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Cosmic Collector - Full Integration", function () {
    let accessControl, gameRegistry, cosmToken, spaceshipNFT;
    let treasury, rewardDistributor, marketplace, leaderboard;
    let owner1, owner2, player1, player2;

    before(async function () {
        [owner1, owner2, player1, player2] = await ethers.getSigners();

        console.log("\n🚀 Deploying all contracts...\n");

        // Deploy AccessControl
        const AccessControl = await ethers.getContractFactory("CosmicAccessControl");
        accessControl = await upgrades.deployProxy(
            AccessControl,
            [owner1.address, owner2.address],
            { initializer: "initialize", kind: "uups" }
        );
        await accessControl.waitForDeployment();

        // Deploy GameRegistry
        const GameRegistry = await ethers.getContractFactory("GameRegistry");
        gameRegistry = await upgrades.deployProxy(
            GameRegistry,
            [await accessControl.getAddress()],
            { initializer: "initialize", kind: "uups" }
        );
        await gameRegistry.waitForDeployment();

        // Deploy Token
        const COSMToken = await ethers.getContractFactory("COSMToken");
        cosmToken = await upgrades.deployProxy(
            COSMToken,
            [await accessControl.getAddress(), owner1.address, 200],
            { initializer: "initialize", kind: "uups" }
        );
        await cosmToken.waitForDeployment();

        // Deploy NFT
        const SpaceshipNFT = await ethers.getContractFactory("SpaceshipNFT");
        spaceshipNFT = await upgrades.deployProxy(
            SpaceshipNFT,
            [await accessControl.getAddress()],
            { initializer: "initialize", kind: "uups" }
        );
        await spaceshipNFT.waitForDeployment();

        // Deploy Treasury
        const Treasury = await ethers.getContractFactory("Treasury");
        treasury = await upgrades.deployProxy(
            Treasury,
            [
                await accessControl.getAddress(),
                await cosmToken.getAddress(),
                ethers.parseEther("10000")
            ],
            { initializer: "initialize", kind: "uups" }
        );
        await treasury.waitForDeployment();

        // Deploy RewardDistributor
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        rewardDistributor = await upgrades.deployProxy(
            RewardDistributor,
            [
                await accessControl.getAddress(),
                await treasury.getAddress(),
                7 * 24 * 60 * 60
            ],
            { initializer: "initialize", kind: "uups" }
        );
        await rewardDistributor.waitForDeployment();

        // Deploy Marketplace
        const Marketplace = await ethers.getContractFactory("Marketplace");
        marketplace = await upgrades.deployProxy(
            Marketplace,
            [
                await accessControl.getAddress(),
                await spaceshipNFT.getAddress(),
                await cosmToken.getAddress(),
                await treasury.getAddress(),
                500
            ],
            { initializer: "initialize", kind: "uups" }
        );
        await marketplace.waitForDeployment();

        // Deploy LeaderboardManager
        const LeaderboardManager = await ethers.getContractFactory("LeaderboardManager");
        leaderboard = await upgrades.deployProxy(
            LeaderboardManager,
            [
                await accessControl.getAddress(),
                await gameRegistry.getAddress(),
                ethers.parseEther("1")
            ],
            { initializer: "initialize", kind: "uups" }
        );
        await leaderboard.waitForDeployment();

        // Setup roles
        await accessControl.grantTreasuryRole(await treasury.getAddress());
        await accessControl.grantTreasuryRole(await rewardDistributor.getAddress());
        await accessControl.grantGameManager(await leaderboard.getAddress());

        // Transfer tokens to treasury
        const deployerBalance = await cosmToken.balanceOf(owner1.address);
        await cosmToken.transfer(await treasury.getAddress(), deployerBalance / 2n);

        console.log("✅ All contracts deployed and configured\n");
    });

    describe("1. Token Functionality", function () {
        it("Should have correct total supply", async function () {
            const totalSupply = await cosmToken.totalSupply();
            expect(totalSupply).to.equal(ethers.parseEther("1000000000"));
        });

        it("Should transfer with fee deduction", async function () {
            // Transfer from a non-exempt account (player1) to another (player2)
            const amount = ethers.parseEther("1000");
            await cosmToken.connect(owner1).transfer(player1.address, amount * 2n); // Ensure player1 has enough

            const balanceBefore = await cosmToken.balanceOf(player2.address);
            await cosmToken.connect(player1).transfer(player2.address, amount);

            const balanceAfter = await cosmToken.balanceOf(player2.address);
            expect(balanceAfter).to.be.lt(balanceBefore + amount); // Less due to fee
        });

        it("Should burn tokens", async function () {
            const burnAmount = ethers.parseEther("100");
            const balanceBefore = await cosmToken.balanceOf(player1.address);

            await cosmToken.connect(player1).burn(burnAmount);

            const balanceAfter = await cosmToken.balanceOf(player1.address);
            expect(balanceAfter).to.equal(balanceBefore - burnAmount);
        });
    });

    describe("2. NFT Minting and Stats", function () {
        let tokenId;

        it("Should mint NFT with payment", async function () {
            const mintPrice = await spaceshipNFT.mintPrice(0); // ClassicFighter

            const tx = await spaceshipNFT.connect(player1).mint(
                player1.address,
                0, // ShipType.ClassicFighter
                "ipfs://test-metadata",
                { value: mintPrice }
            );

            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return spaceshipNFT.interface.parseLog(log).name === "ShipMinted";
                } catch (e) {
                    return false;
                }
            });

            tokenId = event ? spaceshipNFT.interface.parseLog(event).args.tokenId : 0n;
            expect(await spaceshipNFT.ownerOf(tokenId)).to.equal(player1.address);
        });

        it("Should have correct ship stats", async function () {
            const stats = await spaceshipNFT.getShipStats(tokenId);
            
            expect(stats.shipType).to.equal(0); // ClassicFighter
            expect(stats.speed).to.be.gt(0);
            expect(stats.armor).to.be.gt(0);
            expect(stats.firepower).to.be.gt(0);
            expect(stats.pointsMultiplier).to.be.gte(10000); // At least 1x
        });
    });

    describe("3. Game Session and Anti-Cheat", function () {
        let sessionId;

        it("Should start game session", async function () {
            const tx = await gameRegistry.connect(player1).startSession(0, 0); // GameId 0, no NFT
            const receipt = await tx.wait();

            const event = receipt.logs.find(log => {
                try {
                    return gameRegistry.interface.parseLog(log).name === "SessionStarted";
                } catch (e) {
                    return false;
                }
            });

            sessionId = event ? gameRegistry.interface.parseLog(event).args.sessionId : ethers.ZeroHash;
            expect(sessionId).to.not.equal(ethers.ZeroHash);
        });

        it("Should end session with score", async function () {
            await ethers.provider.send("evm_increaseTime", [60]); // 1 minute
            await ethers.provider.send("evm_mine");

            await gameRegistry.connect(player1).endSession(
                sessionId,
                1000, // score
                "0x" // proof
            );

            const session = await gameRegistry.getSession(sessionId);
            expect(session.score).to.equal(1000);
        });

        it("Should verify session (admin only)", async function () {
            // Grant game manager role to owner for testing
            await accessControl.grantGameManager(owner1.address);

            await gameRegistry.verifySession(sessionId, true);

            const session = await gameRegistry.getSession(sessionId);
            expect(session.verified).to.be.true;
        });
    });

    describe("4. Marketplace Trading", function () {
        let tokenId, listingId;

        before(async function () {
            // Mint NFT for player1
            const mintPrice = await spaceshipNFT.mintPrice(0);
            const tx = await spaceshipNFT.connect(player1).mint(
                player1.address,
                0,
                "ipfs://test",
                { value: mintPrice }
            );
            const receipt = await tx.wait();
            tokenId = 1n; // Second minted NFT
        });

        it("Should list NFT for sale", async function () {
            // Approve marketplace
            await spaceshipNFT.connect(player1).approve(await marketplace.getAddress(), tokenId);

            // List
            const price = ethers.parseEther("100");
            const tx = await marketplace.connect(player1).listItem(
                tokenId,
                price,
                7 * 24 * 60 * 60 // 7 days
            );

            const receipt = await tx.wait();
            listingId = 0n; // First listing

            const listing = await marketplace.getListing(listingId);
            expect(listing.seller).to.equal(player1.address);
            expect(listing.price).to.equal(price);
            expect(listing.isActive).to.be.true;
        });

        it("Should buy listed NFT", async function () {
            // Give player2 some COSM tokens
            await cosmToken.transfer(player2.address, ethers.parseEther("1000"));

            const listing = await marketplace.getListing(listingId);

            // Approve marketplace to spend COSM
            await cosmToken.connect(player2).approve(
                await marketplace.getAddress(),
                listing.price * 2n // Extra for fees
            );

            // Buy
            await marketplace.connect(player2).buyItem(listingId);

            // Verify ownership transferred
            expect(await spaceshipNFT.ownerOf(tokenId)).to.equal(player2.address);
        });
    });

    describe("5. Reward Distribution", function () {
        let claimId;

        it("Should allocate reward to player", async function () {
            const amount = ethers.parseEther("50");

            const tx = await rewardDistributor.allocateReward(
                player1.address,
                amount,
                0 // GameId
            );

            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return rewardDistributor.interface.parseLog(log).name === "RewardAllocated";
                } catch (e) {
                    return false;
                }
            });

            claimId = event ? rewardDistributor.interface.parseLog(event).args.claimId : ethers.ZeroHash;
            expect(claimId).to.not.equal(ethers.ZeroHash);
        });

        it("Should allow player to claim reward", async function () {
            const balanceBefore = await cosmToken.balanceOf(player1.address);

            await rewardDistributor.connect(player1).claimReward(claimId);

            const balanceAfter = await cosmToken.balanceOf(player1.address);
            expect(balanceAfter).to.be.gt(balanceBefore);
        });

        it("Should not allow double claiming", async function () {
            await expect(
                rewardDistributor.connect(player1).claimReward(claimId)
            ).to.be.revertedWith("Already claimed");
        });
    });

    describe("6. Treasury Multi-Sig", function () {
        it("Should require two approvals for withdrawal", async function () {
            const amount = ethers.parseEther("1000");

            // Owner1 requests
            const tx = await treasury.requestWithdrawal(player1.address, amount);
            const receipt = await tx.wait();
            const requestId = 0n;

            // Owner2 approves
            await treasury.connect(owner2).approveWithdrawal(requestId);

            // Execute
            await treasury.executeWithdrawal(requestId);

            // Verify
            const request = await treasury.withdrawalRequests(requestId);
            expect(request.executed).to.be.true;
        });
    });

    describe("7. Leaderboard", function () {
        let sessionId;

        it("Should submit score to leaderboard", async function () {
            // Start and complete a session first
            const startTx = await gameRegistry.connect(player1).startSession(0, 0);
            const startReceipt = await startTx.wait();
            const startEvent = startReceipt.logs.find(log => {
                try {
                    return gameRegistry.interface.parseLog(log).name === "SessionStarted";
                } catch (e) {
                    return false;
                }
            });
            sessionId = gameRegistry.interface.parseLog(startEvent).args.sessionId;

            await ethers.provider.send("evm_increaseTime", [60]);
            await ethers.provider.send("evm_mine");

            await gameRegistry.connect(player1).endSession(sessionId, 5000, "0x");
            await gameRegistry.verifySession(sessionId, true);

            // Submit to leaderboard
            const fee = await leaderboard.submissionFee();
            await leaderboard.connect(player1).submitScore(
                sessionId,
                5000,
                0,
                0, // GameId
                { value: fee }
            );

            const bestScore = await leaderboard.getPlayerBestScore(0, player1.address);
            expect(bestScore).to.equal(5000);
        });
    });

    describe("8. Access Control", function () {
        it("Should prevent unauthorized access", async function () {
            await expect(
                treasury.connect(player1).requestWithdrawal(player1.address, 100)
            ).to.be.reverted;
        });

        it("Should allow both owners to admin", async function () {
            const hasRole1 = await accessControl.hasRole(
                await accessControl.OWNER_ROLE(),
                owner1.address
            );
            const hasRole2 = await accessControl.hasRole(
                await accessControl.OWNER_ROLE(),
                owner2.address
            );

            expect(hasRole1).to.be.true;
            expect(hasRole2).to.be.true;
        });
    });
});