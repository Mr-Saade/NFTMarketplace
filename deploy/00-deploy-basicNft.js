const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify.js");
require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  const arguments = [];
  const basicNft = await deploy("BasicNft", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // Verify the deployment
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_KEY) {
    log("Verifying...");
    await verify(basicNft.address, arguments);
  }
};

module.exports.tags = ["all", "basic"];
