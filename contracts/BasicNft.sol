// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNft is ERC721 {
    uint private s_counter;
    string public constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    constructor() ERC721("DOGGIE", "DG") {}

    function mintNft() external {
        s_counter++;

        uint256 counterId = s_counter;
        _safeMint(msg.sender, counterId);
    }

    function tokenURI(
        uint256 tokenId
    ) public pure override returns (string memory) {
        return TOKEN_URI;
    }

    //getter function
    function getTokenCounter() public view returns (uint) {
        return s_counter;
    }
}
