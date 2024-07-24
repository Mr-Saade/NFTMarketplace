const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Nft Marketplace Tests", function () {
      let nftMarket, basicNft, deployer, user, nftMarketUser, TOKEN_ADDRESS;
      const PRICE = ethers.parseEther("0.005");

      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        user = accounts[1];
        await deployments.fixture(["basic", "market"]);
        basicNft = await ethers.getContractAt(
          "BasicNft",
          "0x5FbDB2315678afecb367f032d93F642f64180aa3", //locally deployed token contract address
          deployer
        );
        TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; //locally deployed token contract address

        await basicNft.mintNft();
        nftMarket = await ethers.getContractAt(
          "NftMarketplace",
          "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", //locally deployed nftMarket contract address
          deployer
        );
        nftMarketUser = await ethers.getContractAt(
          "NftMarketplace",
          "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
          user
        );
      });

      describe("List NFt", () => {
        it("Should revert if the user is not the owner of the NFT and wants to list it", async () => {
          await expect(nftMarketUser.listNft(TOKEN_ADDRESS, 1, PRICE))
            .to.be.revertedWithCustomError(
              nftMarketUser,
              "NFTMARKETPLACE__NOT_OWNER"
            )
            .withArgs(user.address, deployer.address);
        });
        it("Should revert if user does not approve the marketplace for the NFT to be listed", async () => {
          await expect(nftMarket.listNft(TOKEN_ADDRESS, 1, PRICE))
            .to.be.revertedWithCustomError(
              nftMarket,
              "NFTMARKETPLACE__NOT_APPROVED"
            )
            .withArgs(TOKEN_ADDRESS, 1);
        });
        it("Should revert if a user lists the same NFT multiple times", async () => {
          await basicNft.approve(await nftMarket.getAddress(), 1);
          await nftMarket.listNft(TOKEN_ADDRESS, 1, PRICE);
          await expect(nftMarket.listNft(TOKEN_ADDRESS, 1, PRICE))
            .to.be.revertedWithCustomError(
              nftMarket,
              "NFTMARKETPLACE__ALREADY_LISTED"
            )
            .withArgs(TOKEN_ADDRESS, 1);
        });
        it("Should revert if price is 0 or less", async () => {
          await basicNft.approve(await nftMarket.getAddress(), 1);
          await expect(
            nftMarket.listNft(TOKEN_ADDRESS, 1, ethers.parseEther("0"))
          )
            .to.be.revertedWithCustomError(
              nftMarket,
              "NFTMARKETPLACE__INVALID_PRICE"
            )
            .withArgs(ethers.parseEther("0"));
        });
        it("After a successful NFT listing, our market state should be updated correctly with the new listing and an event should be emitted", async () => {
          await basicNft.approve(await nftMarket.getAddress(), 1);
          await expect(nftMarket.listNft(TOKEN_ADDRESS, 1, PRICE)).to.emit(
            nftMarket,
            "NftListed"
          );
          const listing = await nftMarket.getListings(TOKEN_ADDRESS, 1);
          const seller = listing.seller;
          const price = listing.price;
          assert.equal(seller, deployer.address);
          assert.equal(price, PRICE);
        });
      });

      describe("buyNft", () => {
        beforeEach(async () => {
          await basicNft.approve(await nftMarket.getAddress(), 1);
          await nftMarket.listNft(TOKEN_ADDRESS, 1, PRICE);
        });
        it("revert if a user tries to buy a non listed nft in the marketplace", async () => {
          await expect(
            nftMarketUser.buyNft(TOKEN_ADDRESS, 2, {
              value: PRICE,
            })
          ).to.be.revertedWithCustomError(
            nftMarketUser,
            "NFTMARKETPLACE__NOT_LISTED"
          );
        });
        it("revert if sentValue is not equal to the price of the NFT to be bought", async () => {
          await expect(
            nftMarketUser.buyNft(TOKEN_ADDRESS, 1, {
              value: Number(PRICE) - 10,
            })
          ).to.be.revertedWithCustomError(
            nftMarketUser,
            "NFTMARKETPLACE__INVALID_PAYMENT_AMOUNT"
          );
        });
        it("if an NFT is successful bought, listing should be deleted ,seller's balance should be updated with the NFT price and NFT should be transferred to new owner(buyer) and it should emit an event", async () => {
          //delete listing
          const initListing = await nftMarket.getListings(TOKEN_ADDRESS, 1);

          await expect(
            nftMarketUser.buyNft(TOKEN_ADDRESS, 1, {
              value: PRICE,
            })
          )
            .to.emit(nftMarketUser, "NftBought")
            .withArgs(deployer.address, user.address, TOKEN_ADDRESS, PRICE, 1);

          const finalListing = await nftMarket.getListings(TOKEN_ADDRESS, 1);
          assert.equal(initListing.price, PRICE);
          assert.equal(finalListing.price, 0);

          // seller's balance incremented;
          const proceeds = await nftMarket.getProceeds(deployer.address);
          assert.equal(proceeds, PRICE);

          //nft transfer
          const nftOwner = await basicNft.ownerOf(1);
          assert.equal(nftOwner, user.address);
        });
      });
      describe("cancelListing", () => {
        beforeEach(async () => {
          await basicNft.approve(await nftMarket.getAddress(), 1);
          await nftMarket.listNft(TOKEN_ADDRESS, 1, PRICE);
        });
        it("revert if user tries canceling an nft that is not listed, revert if the caller is not the owner of the NFT listed to be canceled", async () => {
          //reverts upon cancelling non existent nft on market
          await expect(
            nftMarket.cancelListing(TOKEN_ADDRESS, 2)
          ).to.be.revertedWithCustomError(
            nftMarket,
            "NFTMARKETPLACE__NOT_LISTED"
          );

          //reverts if caller is not owner
          await expect(
            nftMarketUser.cancelListing(TOKEN_ADDRESS, 1)
          ).to.be.revertedWithCustomError(
            nftMarketUser,
            "NFTMARKETPLACE__UNAUTHORIZED_CANCEL"
          );
        });
        it("delete the listing after sunccessfully cancelling, emit an event", async () => {
          //delete listing
          const initListing = await nftMarket.getListings(TOKEN_ADDRESS, 1);
          await expect(nftMarket.cancelListing(TOKEN_ADDRESS, 1)).to.emit(
            nftMarket,
            "ListingCancelled"
          );
          const finalListing = await nftMarket.getListings(TOKEN_ADDRESS, 1);
          assert.equal(initListing.price, PRICE);
          assert.equal(finalListing.price, 0);
        });
      });
      describe("updateListing", () => {
        const UPDATED_PRICE = ethers.parseEther("2");
        beforeEach(async () => {
          await basicNft.approve(await nftMarket.getAddress(), 1);
          await nftMarket.listNft(TOKEN_ADDRESS, 1, PRICE);
        });
        it("revert if user tries updating an nft listing that is not listed, revert if the caller is not the owner of the NFT listed to be updated, reverts if new price is 0", async () => {
          //reverts if nft to be updated is non existent
          await expect(
            nftMarket.updateListing(TOKEN_ADDRESS, 2, UPDATED_PRICE)
          ).to.be.revertedWithCustomError(
            nftMarket,
            "NFTMARKETPLACE__NOT_LISTED"
          );

          //reverts if caller is not owner of nft
          await expect(
            nftMarketUser.updateListing(TOKEN_ADDRESS, 1, UPDATED_PRICE)
          ).to.be.revertedWithCustomError(
            nftMarket,
            "NFTMARKETPLACE__UNAUTHORIZED_UPDATE"
          );

          //reverts if new price is 0
          await expect(
            nftMarket.updateListing(TOKEN_ADDRESS, 1, 0)
          ).to.be.revertedWithCustomError(
            nftMarket,
            "NFTMARKETPLACE__INVALID_PRICE"
          );
        });
        it("after succesful update, the price of the nft should be updated to new price set by the nftOwner and emit an event", async () => {
          await expect(
            nftMarket.updateListing(TOKEN_ADDRESS, 1, UPDATED_PRICE)
          ).to.emit(nftMarket, "ListingUpdated");
          //nft price should be updated
          const listing = await nftMarket.getListings(TOKEN_ADDRESS, 1);
          assert.equal(UPDATED_PRICE, listing.price);
        });
      });

      describe("withdrawProceeds", () => {
        beforeEach(async () => {
          await basicNft.approve(await nftMarket.getAddress(), 1);
          await nftMarket.listNft(TOKEN_ADDRESS, 1, PRICE);
          await nftMarketUser.buyNft(TOKEN_ADDRESS, 1, { value: PRICE });
        });
        it("reverts if caller has no proceeds", async () => {
          await expect(
            nftMarketUser.withdrawProceeds()
          ).to.be.revertedWithCustomError(
            nftMarketUser,
            "NFTMARKETPLACE__NO_PROCEEDS"
          );
        });
        it("caller proceeds in the market should be reset after successful withdrawal and emit an event", async () => {
          await expect(nftMarket.withdrawProceeds()).to.emit(
            nftMarket,
            "ProceedsWithdrawn"
          );
          const proceeds = await nftMarket.getProceeds(deployer.address);
          assert.equal(proceeds, 0);
        });
      });
    });
