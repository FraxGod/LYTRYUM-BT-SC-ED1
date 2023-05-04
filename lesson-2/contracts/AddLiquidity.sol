//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IUniswap.sol";

contract AddLiquidity {
    address public constant ROUTER = 0x2F99d5E6c40B00661517eC9bad07d153113ea9a5;
    address public constant FACTORY = 0x14C2E78E9e4F5aAc73c8488c31ad3dBb2F59A234;
    address public constant WETH = 0xE3510E2a7171d6E8B1CA31DD6f1a49986146a3F3;

    event LiquidityAdded(address tokenA, address tokenB, address sender, address pair);

    function AddLiquidityToTokens(address _tokenA, address _tokenB, uint _amountADesired, uint _amountBDesired) public {
        IERC20(_tokenA).transferFrom(msg.sender, address(this), _amountADesired); // approve(0x..., )
        IERC20(_tokenB).transferFrom(msg.sender, address(this), _amountBDesired);

        IERC20(_tokenA).approve(ROUTER, _amountADesired);
        IERC20(_tokenB).approve(ROUTER, _amountBDesired);
        
        (uint256 amountA, uint256 amountB, uint256 liquidity) = IUniswapV2Router(ROUTER).addLiquidity(_tokenA, _tokenB, _amountADesired, _amountBDesired, 0, 0, msg.sender, block.timestamp);

        address pair = IUniswapV2Factory(FACTORY).getPair(_tokenA, _tokenB);

        emit LiquidityAdded(_tokenA, _tokenB, msg.sender, pair);
    }
}