// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./NFT.sol";

contract Marketplace {
    address public nftErc721;
    address public nftErc1155;
    address public owner;

    uint256 public totalItems;
    uint256 public totalAuctions;

    struct MarkerplaceItem {
        uint256 itemId;
        uint256 tokenId;
        uint256 price;
        uint256 amount;
        address payable owner;
        bool isAvailable;
        bool isInAuction;
        // ToDo:: var differ erc721 and erc1155
    }

    struct AuctionItem {
        uint256 maxBidderAmount;
        uint256 bidsAmount;
        address payable maxBidder;
        // ToDo:: Add deadline
    }

    mapping (uint256 => MarkerplaceItem) public markerplaceItems;
    mapping (uint256 => AuctionItem) public auctionItems;

    event ItemListed (
        uint256 itemId,
        uint256 tokenId,
        uint256 price,
        uint256 amount,
        address indexed owner
    );

    event ItemBought (
        uint256 itemId,
        uint256 tokenId,
        uint256 price,
        uint256 amount,
        address indexed owner,
        address indexed seller
    );

    event ItemUnlisted (
        uint256 itemId,
        uint256 tokenId,
        uint256 price,
        uint256 amount,
        address indexed owner
    );

    event AuctionCreated(
        uint256 itemId,
        uint256 tokenId,
        uint256 price,
        uint256 amount,
        address indexed owner
    );

    event NewBid (
        uint256 itemId,
        address indexed maxBidder,
        uint256 maxBidderAmount
    );

    event AuctionFinished (
        uint256 itemId,
        uint256 tokenId,
        uint256 price,
        uint256 amount,
        address indexed owner,
        address indexed seller
    );

    event AuctionCanceled (
        uint256 itemId,
        uint256 tokenId,
        uint256 amount,
        address indexed owner
    );

    constructor(address _nftErc721, address _nftErc1155) {
        owner = msg.sender;
        nftErc721 = _nftErc721;
        nftErc1155 = _nftErc1155;
    }

    function createItem(string memory _itemUri, uint256 _price) public returns(uint256) {
        uint256 itemId = totalItems;
        totalItems++;
        // ToDo:: logic to differ erc721 and erc1155
        uint256 tokeId = NFT(nftErc721).mint(msg.sender, _itemUri);
        markerplaceItems[itemId] = MarkerplaceItem(
            itemId,
            tokeId,
            _price,
            1, //ToDo:: Change logic for erc1155
            payable(msg.sender),
            true,
            false
        );

        emit ItemListed(
            itemId,
            tokeId,
            _price,
            1,
            msg.sender
        );

        return itemId;
    }

    function listItem(uint256 _itemId, uint256 _price) public {
        MarkerplaceItem storage marketplaceItem = markerplaceItems[_itemId];

        require(marketplaceItem.owner == msg.sender, "You are not an owner of this item");
        require(!marketplaceItem.isInAuction, "Item already listed on auction!");

        marketplaceItem.isAvailable = true;
        marketplaceItem.price = _price;

        emit ItemListed(
            _itemId,
            marketplaceItem.tokenId,
            _price,
            1,
            marketplaceItem.owner
        );
    }

    function buyItem(uint256 _itemId) public payable {
        MarkerplaceItem storage marketplaceItem = markerplaceItems[_itemId];

        require(msg.value >= marketplaceItem.price, "Not enough Matic has been provided");
        require(marketplaceItem.isAvailable, "The item is not avaible");

        if(msg.value > marketplaceItem.price) {
            payable(msg.sender).transfer(msg.value - marketplaceItem.price);
        }

        marketplaceItem.owner.transfer(marketplaceItem.price);
        NFT(nftErc721).safeTransferFrom(marketplaceItem.owner, msg.sender, marketplaceItem.tokenId);
        address lastOwner = marketplaceItem.owner;
        marketplaceItem.isAvailable = false;
        marketplaceItem.owner = payable(msg.sender);

        emit ItemBought(
            _itemId,
            marketplaceItem.tokenId,
            marketplaceItem.price,
            1,
            marketplaceItem.owner,
            lastOwner
        );
    }

    function cancel(uint256 _itemId) public {
        MarkerplaceItem storage marketplaceItem = markerplaceItems[_itemId];

        require(msg.sender == marketplaceItem.owner, "You are not an owner of this item");
        marketplaceItem.isAvailable = false;

        emit ItemUnlisted(
            _itemId,
            marketplaceItem.tokenId,
            marketplaceItem.price,
            1,
            marketplaceItem.owner
        );
    }

    function listItemOnAuction(uint256 _itemId, uint256 _price) public {
        MarkerplaceItem storage marketplaceItem = markerplaceItems[_itemId];

        require(marketplaceItem.owner == msg.sender, "You are not an owner of this item");
        require(!marketplaceItem.isAvailable, "Item already listed on sale!");

        marketplaceItem.isInAuction = true;
        marketplaceItem.price = _price;

        // ToDo::Add deadline

        emit AuctionCreated(
            _itemId,
            marketplaceItem.tokenId,
            _price,
            1,
            marketplaceItem.owner
        );
    }

    function makeBid(uint256 _itemId) public payable {
        MarkerplaceItem storage marketplaceItem = markerplaceItems[_itemId];
        AuctionItem storage auction = auctionItems[_itemId];

        require(marketplaceItem.isInAuction, "Item is not in auction!");
        require(msg.value > marketplaceItem.price, "Not enough Matic has been provided");
        require(msg.value > auction.maxBidderAmount, "You have to provide more than max bidder");

        address payable lastMaxBidder = auction.maxBidder;
        uint256 lastMaxBidderAmount = auction.maxBidderAmount;

        auction.maxBidder = payable(msg.sender);
        auction.maxBidderAmount = msg.value;
        auction.bidsAmount++;

        if(lastMaxBidder != address(0)) {
            lastMaxBidder.transfer(lastMaxBidderAmount);
        }

        emit NewBid(_itemId, msg.sender, msg.value);
    }

    function finishAuction(uint256 _itemId) public {
        MarkerplaceItem storage marketplaceItem = markerplaceItems[_itemId];
        AuctionItem storage auction = auctionItems[_itemId];

        require(marketplaceItem.isInAuction, "Item is not in auction!");
        require(marketplaceItem.owner == msg.sender, "You are not an owner of this item");
        require(auction.bidsAmount > 0, "Too few bidders");

        marketplaceItem.isInAuction = false;
        marketplaceItem.owner = auction.maxBidder;

        payable(msg.sender).transfer(auction.maxBidderAmount);
        NFT(nftErc721).safeTransferFrom(msg.sender, auction.maxBidder, marketplaceItem.tokenId);

        emit AuctionFinished (
            _itemId,
            marketplaceItem.tokenId,
            auction.maxBidderAmount,
            1,
            marketplaceItem.owner,
            msg.sender
        );
    }

    function cancelAuction(uint256 _itemId) public {
        MarkerplaceItem storage marketplaceItem = markerplaceItems[_itemId];
        AuctionItem storage auction = auctionItems[_itemId];

        require(marketplaceItem.isInAuction, "Item is not in auction!");
        require((marketplaceItem.owner == msg.sender) || (owner == msg.sender), "You are not an owner of this item or owner of this contract");
        
        marketplaceItem.isInAuction = false;

        if(auction.maxBidder != address(0)) {
            auction.maxBidder.transfer(auction.maxBidderAmount);
        }

        emit AuctionCanceled(
            _itemId,
            marketplaceItem.tokenId,
            1,
            marketplaceItem.owner
        );
    }
}