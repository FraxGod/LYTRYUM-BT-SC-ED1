// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CustomToken is ERC20 {
    constructor() ERC20("CustomToken", "CTK") {
        _mint(msg.sender, 1_000_000 ether);
    }
}