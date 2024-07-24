//This script interacts with deployed contracts on the Sepolia testnet to mint and list an NFT on the marketplace.

const { ethers } = require("hardhat");

async function mintAndList() {
  const TOKEN_ADDRESS = "0x831a23BCBcD09d45b8db90AAf73A36941183E2e2"; //deployed token contract address on sepolia
  const TOKEN_ID = 1;
  const PRICE = ethers.parseEther("0.005");
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  basicNft = await ethers.getContractAt(
    "BasicNft",
    "0x831a23BCBcD09d45b8db90AAf73A36941183E2e2",
    deployer
  );

  nftMarket = await ethers.getContractAt(
    "NftMarketplace",
    "0x919f91C1662205bDA2375b4955d2E592298B50fa", //deployed nftMarket contract address on sepolia
    deployer
  );
  console.log("Minting and Approving NFT for market...");
  await basicNft.mintNft();

  await basicNft.approve(await nftMarket.getAddress(), TOKEN_ID);

  console.log("NFT Minted and Approved for market!");

  console.log("Listing NFT on market...");
  await nftMarket.listNft(TOKEN_ADDRESS, TOKEN_ID, PRICE);

  console.log("NFT listed on market!...");
}

mintAndList()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
