/*This script dynamically updates our frontend whenever we deploy or redeploy our contracts by modifying the constants file in our frontend. It ensures that the contract address and
ABI associated with each chain ID are automatically adjusted whenever a new contract is deployed, maintaining synchronization between 
our smart contract and the frontend interface.*/

require("dotenv").config();
const fs = require("fs");
const { network } = require("hardhat");

const FRONTEND_CONTRACTADDRESSES =
  "../nft-marketplace-frontend/constants/contractAddresses.json";
const FRONTEND_ABI = "../nft-marketplace-frontend/constants/marketAbi.json";
const NFT_ABI = "../nft-marketplace-frontend/constants/nftAbi.json";
const chainId = network.config.chainId;
let nftMarket;

module.exports = async ({ deployments }) => {
  console.log("hi");
  if (process.env.UPDATE_FRONT_END) {
    console.log("Updating front end...");
    nftMarket = await deployments.get("NftMarketplace");
    nftToken = await deployments.get("BasicNft");
    updateContractAddresses();
    updateMarketAbi();
    updateNftAbi();
    console.log(`Front end updated at ContractAddress: ${nftMarket.address}`);
  }
};

const updateContractAddresses = () => {
  const currentAddresses = JSON.parse(
    fs.readFileSync(FRONTEND_CONTRACTADDRESSES, "utf8")
  );
  if (
    chainId in currentAddresses &&
    currentAddresses[chainId] != nftMarket.address.toString()
  ) {
    currentAddresses[chainId] = nftMarket.address.toString();
  } else if (!(chainId in currentAddresses)) {
    currentAddresses[chainId] = nftMarket.address.toString();
  }
  fs.writeFileSync(
    FRONTEND_CONTRACTADDRESSES,
    JSON.stringify(currentAddresses)
  );
};

const updateMarketAbi = () => {
  fs.writeFileSync(FRONTEND_ABI, JSON.stringify(nftMarket.abi));
};

const updateNftAbi = () => {
  fs.writeFileSync(NFT_ABI, JSON.stringify(nftToken.abi));
};
module.exports.tags = ["all", "frontend"];
