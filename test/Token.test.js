const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("COSMToken", function () {
    let cosmToken, accessControl;
    let owner, treasury, user1, user2;

    beforeEach(async function () {
        [owner, treasury, user1, user2] = await ethers.getSigners();

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
    });

    it("Should have correct name and symbol", async function () {
        expect(await cosmToken.name()).to.equal("Cosmic Token");
        expect(await cosmToken.symbol()).to.equal("COSM");
    });

    it("Should have fixed supply of 1 billion", async function () {
        const totalSupply = await cosmToken.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should charge transfer fee", async function () {
        const amount = ethers.parseEther("1000");
        await cosmToken.transfer(user1.address, amount);

        const balance = await cosmToken.balanceOf(user1.address);
        const expectedFee = (amount * 200n) / 10000n; // 2%
        
        expect(balance).to.equal(amount - expectedFee);
    });

    it("Should exempt treasury from fees", async function () {
        const amount = ethers.parseEther("1000");
        await cosmToken.transfer(treasury.address, amount);

        expect(await cosmToken.balanceOf(treasury.address)).to.equal(amount);
    });

    it("Should allow burning", async function () {
        await cosmToken.transfer(user1.address, ethers.parseEther("1000"));
        const burnAmount = ethers.parseEther("500");

        await cosmToken.connect(user1).burn(burnAmount);

        expect(await cosmToken.balanceOf(user1.address)).to.be.lt(ethers.parseEther("500"));
    });
});