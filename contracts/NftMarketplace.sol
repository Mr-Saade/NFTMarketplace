import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error NFTMARKETPLACE__INVALID_PRICE(uint _nftPrice);
error NFTMARKETPLACE__NOT_APPROVED(address _tokenAddress, uint _tokenId);
error NFTMARKETPLACE__ALREADY_LISTED(address _tokenAddress, uint _tokenId);
error NFTMARKETPLACE__NOT_OWNER(address _caller, address _nftowner);
error NFTMARKETPLACE__NOT_LISTED(address _tokenAddress, uint _tokenId);
error NFTMARKETPLACE__INVALID_PAYMENT_AMOUNT(uint _sentValue, uint _nftPrice);
error NFTMARKETPLACE__UNAUTHORIZED_CANCEL(address _caller, address _nftOwner);
error NFTMARKETPLACE__UNAUTHORIZED_UPDATE(address _caller, address _nftOwner);
error NFTMARKETPLACE__NO_PROCEEDS(address _withdrawer, uint _proceeds);
error NFTMARKETPLACE__PROCEEDS_WITHDRAWAL_FAILED(uint _proceeds);

contract NftMarketplace {
    //events
    event NftListed(
        address _tokenAddress,
        address indexed _nftOwner,
        uint _price,
        uint _tokenId
    );
    event NftBought(
        address indexed _seller,
        address indexed _buyer,
        address _tokenAddress,
        uint _price,
        uint _tokenId
    );
    event ListingCancelled(address _tokenAddress, uint _tokenId);
    event ListingUpdated(
        address _tokenAddress,
        uint _tokenId,
        uint _oldPrice,
        uint _newPrice
    );
    event ProceedsWithdrawn(address _withdrawer, uint _proceeds);

    struct Listings {
        uint price;
        address seller;
    }

    constructor() {}

    //state variables
    mapping(address => mapping(uint => Listings)) private s_nftListings;
    mapping(address => uint) private s_proceeds;

    //modifiers
    modifier isListed(address _tokenAddress, uint _tokenId) {
        if (s_nftListings[_tokenAddress][_tokenId].price == 0) {
            revert NFTMARKETPLACE__NOT_LISTED(_tokenAddress, _tokenId);
        }

        _;
    }

    modifier notListed(address _tokenAddress, uint _tokenId) {
        if (s_nftListings[_tokenAddress][_tokenId].price > 0) {
            revert NFTMARKETPLACE__ALREADY_LISTED(_tokenAddress, _tokenId);
        }
        _;
    }

    //Listing NFT function
    function listNft(
        address _tokenAddress,
        uint _tokenId,
        uint _price
    ) external notListed(_tokenAddress, _tokenId) {
        IERC721 nft = IERC721(_tokenAddress);
        if (nft.ownerOf(_tokenId) != msg.sender) {
            revert NFTMARKETPLACE__NOT_OWNER(msg.sender, nft.ownerOf(_tokenId));
        }
        if (nft.getApproved(_tokenId) != address(this)) {
            revert NFTMARKETPLACE__NOT_APPROVED(_tokenAddress, _tokenId);
        }

        if (_price <= 0) {
            revert NFTMARKETPLACE__INVALID_PRICE(_price);
        }

        s_nftListings[_tokenAddress][_tokenId] = Listings(_price, msg.sender);
        emit NftListed(_tokenAddress, msg.sender, _price, _tokenId);
    }

    function buyNft(
        address _tokenAddress,
        uint _tokenId
    ) external payable isListed(_tokenAddress, _tokenId) {
        Listings memory listing = s_nftListings[_tokenAddress][_tokenId];

        if (msg.value != listing.price) {
            revert NFTMARKETPLACE__INVALID_PAYMENT_AMOUNT(
                msg.value,
                listing.price
            );
        }

        IERC721 nft = IERC721(_tokenAddress);
        s_proceeds[listing.seller] += msg.value;
        delete s_nftListings[_tokenAddress][_tokenId];
        nft.safeTransferFrom(listing.seller, msg.sender, _tokenId);
        emit NftBought(
            listing.seller,
            msg.sender,
            _tokenAddress,
            msg.value,
            _tokenId
        );
    }

    function cancelListing(
        address _tokenAddress,
        uint _tokenId
    ) external isListed(_tokenAddress, _tokenId) {
        Listings memory listing = s_nftListings[_tokenAddress][_tokenId];
        if (listing.seller != msg.sender) {
            revert NFTMARKETPLACE__UNAUTHORIZED_CANCEL(
                msg.sender,
                listing.seller
            );
        }
        delete s_nftListings[_tokenAddress][_tokenId];
        emit ListingCancelled(_tokenAddress, _tokenId);
    }

    function updateListing(
        address _tokenAddress,
        uint _tokenId,
        uint _price
    ) external isListed(_tokenAddress, _tokenId) {
        if (_price <= 0) {
            revert NFTMARKETPLACE__INVALID_PRICE(_price);
        }
        Listings memory listing = s_nftListings[_tokenAddress][_tokenId];

        if (listing.seller != msg.sender) {
            revert NFTMARKETPLACE__UNAUTHORIZED_UPDATE(
                msg.sender,
                listing.seller
            );
        }
        s_nftListings[_tokenAddress][_tokenId].price = _price;
        emit ListingUpdated(
            _tokenAddress,
            _tokenId,
            listing.price,
            s_nftListings[_tokenAddress][_tokenId].price
        );
    }

    function withdrawProceeds() external {
        uint proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NFTMARKETPLACE__NO_PROCEEDS(msg.sender, proceeds);
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success) {
            revert NFTMARKETPLACE__PROCEEDS_WITHDRAWAL_FAILED(proceeds);
        }
        emit ProceedsWithdrawn(msg.sender, proceeds);
    }

    //getter/view functions

    function getListings(
        address _tokenAddress,
        uint _tokenId
    ) external view returns (Listings memory) {
        return s_nftListings[_tokenAddress][_tokenId];
    }

    function getProceeds(address _seller) external view returns (uint) {
        return s_proceeds[_seller];
    }
}
