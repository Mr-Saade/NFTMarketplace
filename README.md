# Nft-marketplace

To run test, run yarn hardhat test --parallel

# NFT Marketplace

This is a decentralized NFT Marketplace smart contract that allows users to list their NFTs for sale, purchase listed NFTs, update or cancel their listings, and withdraw proceeds from their sales.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Smart Contract Details](#smart-contract-details)
- [Testing](#testing)
- [Contributing](#contributing)

## Features

- **List NFTs**: Users can list their NFTs for sale by specifying the nft token address with it's token id and the price.
- **Buy NFTs**: Users can purchase listed NFTs by sending the exact payment amount.
- **Cancel Listings**: Users can cancel their listings if the NFT has not been sold.
- **Update Listings**: Users can update the price of their listed NFTs.
- **Withdraw Proceeds**: Sellers can withdraw their earnings from sales.
- **Events**: The contract emits events for listing, buying, canceling, updating, and withdrawing actions.

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Mr-Saade/NFTMarketplace.git
   cd NFTMarketplace
   ```

2. **Install dependencies**:
   Ensure you have yarn installed. Then, install the required packages by running:

   ```bash
   yarn
   ```

3. **Compile the contracts**:
   Use Hardhat to compile the smart contracts:
   ```bash
   yarn hardhat compile
   ```

## Usage

1. **Deploy the contract**:
   You can deploy the contract to a local running blockchain or a testnet by running:

   ```bash
   yarn hardhat run scripts/deploy.js --network your_network
   ```

2. **Interact with the contract**:
   You can run the mint-list script to mint and list an NFT on the marketplace by adjusting the contract addresses in the script to your deployed contract addresses.
   ```bash
   yarn hardhat run scripts/mint-list.js --network your_network
   ```

### Testing

Run tests to ensure the contract's functionality:

```bash
yarn hardhat test --parallel
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.
