const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("GameRegistry", function () {
    let gameRegistry, accessControl;
    let owner, player;

    beforeEach(async function () {
        this.timeout(60000); // Increase timeout for this hook

        [owner, player] = await ethers.getSigners();

        const AccessControl = await ethers.getContractFactory("CosmicAccessControl");
        accessControl = await upgrades.deployProxy(
            AccessControl,
            [owner.address, player.address],
            { initializer: "initialize", kind: "uups" }
        );

        const GameRegistry = await ethers.getContractFactory("GameRegistry");
        gameRegistry = await upgrades.deployProxy(
            GameRegistry,
            [await accessControl.getAddress()],
            { initializer: "initialize", kind: "uups" }
        );
    });

    describe("Session Management", function () {
        it("Should start game session", async function () {
            const tx = await gameRegistry.connect(player).startSession(0, 0);
            const receipt = await tx.wait();
            
            const event = receipt.logs.find(log => {
                try {
                    return gameRegistry.interface.parseLog(log).name === "SessionStarted";
                } catch (e) {
                    return false;
                }
            });

            expect(event).to.not.be.undefined;
        });

        it("Should enforce session cooldown", async function () {
            await gameRegistry.connect(player).startSession(0, 0);
            
            await expect(
                gameRegistry.connect(player).startSession(0, 0)
            ).to.be.revertedWith("Session cooldown active");
        });

        it("Should end session with score", async function () {
            const tx = await gameRegistry.connect(player).startSession(0, 0);
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return gameRegistry.interface.parseLog(log).name === "SessionStarted";
                } catch (e) {
                    return false;
                }
            });
            const sessionId = gameRegistry.interface.parseLog(event).args.sessionId;

            await ethers.provider.send("evm_increaseTime", [60]);
            await ethers.provider.send("evm_mine");

            await gameRegistry.connect(player).endSession(sessionId, 1000, "0x");

            const session = await gameRegistry.getSession(sessionId);
            expect(session.score).to.equal(1000);
        });

        it("Should verify session (game manager only)", async function () {
            await accessControl.grantGameManager(owner.address);

            const tx = await gameRegistry.connect(player).startSession(0, 0);
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return gameRegistry.interface.parseLog(log).name === "SessionStarted";
                } catch (e) {
                    return false;
                }
            });
            const sessionId = gameRegistry.interface.parseLog(event).args.sessionId;

            await ethers.provider.send("evm_increaseTime", [60]);
            await ethers.provider.send("evm_mine");

            await gameRegistry.connect(player).endSession(sessionId, 1000, "0x");
            await gameRegistry.verifySession(sessionId, true);

            const session = await gameRegistry.getSession(sessionId);
            expect(session.verified).to.be.true;
        });
    });
});