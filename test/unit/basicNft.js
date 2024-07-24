const { assert } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Basic NFT Unit Tests", function () {
      let basicNft, deployer;

      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["basic"]);
        basicNft = await ethers.getContractAt(
          "BasicNft",
          "0x5FbDB2315678afecb367f032d93F642f64180aa3", //locally deployed token contract address
          deployer
        );
      });

      describe("Constructor", () => {
        it("Initializes the NFT Correctly.", async () => {
          const name = await basicNft.name();
          const symbol = await basicNft.symbol();
          const tokenCounter = await basicNft.getTokenCounter();
          assert.equal(name, "DOGGIE");
          assert.equal(symbol, "DG");
          assert.equal(tokenCounter.toString(), "0");
        });
      });

      describe("Mint NFT", () => {
        beforeEach(async () => {
          const txResponse = await basicNft.mintNft();
          await txResponse.wait(1);
        });
        it("Allows users to mint an NFT, and updates appropriately", async function () {
          const tokenURI = await basicNft.tokenURI(0);
          const tokenCounter = await basicNft.getTokenCounter();

          assert.equal(tokenCounter.toString(), "1");
          assert.equal(tokenURI, await basicNft.TOKEN_URI());
        });
        it("Show the correct balance and owner of an NFT", async function () {
          const deployerAddress = deployer.address;
          const deployerBalance = await basicNft.balanceOf(deployerAddress);
          const owner = await basicNft.ownerOf("1");

          assert.equal(deployerBalance.toString(), "1");
          assert.equal(owner, deployerAddress);
        });
      });
    });
