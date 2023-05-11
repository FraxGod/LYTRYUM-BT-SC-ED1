// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    address public owner;
    uint256 public tokenAmount;

    event Minted(address _owner, uint256 _tokenId); 

    constructor() ERC721("Test Nft", "TNFT") {
        owner = msg.sender;
    }

    function mint(address _owner, string memory _tokenURI) external {
        _mint(_owner, tokenAmount);
        _setTokenURI(tokenAmount, _tokenURI);

        emit Minted(_owner, tokenAmount);

        tokenAmount++;
    }
}