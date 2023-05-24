// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// ToDo:: use AccessControl from OpenZeppelin and create roles: Admin, Minter and Burner. Set Admin role as admin role of Minter and Burner
// ToDo:: import "@openzeppelin/contracts/access/AccessControl.sol";
contract CustomToken is ERC20, ERC20Burnable, Ownable {
    address public burner;
    address public minter;
    constructor() ERC20("CustomToken", "CTK") {
        _mint(msg.sender, 1000 ether);
    }

    function mint(address to, uint256 amount) public {
        require(msg.sender == minter, "Only minter can mint");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public {
        require(msg.sender == burner, "Only burner can burn");
        _burn(from, amount);
    }

    function setBurner(address _burner) external onlyOwner {
        burner = _burner;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }
}