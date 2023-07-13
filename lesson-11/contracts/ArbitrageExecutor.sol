// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "./interfaces/IFlashLoanProvider.sol";
import "./interfaces/IUniswapV3Router.sol";
// import "hardhat/console.sol";

/**
 * Contract that makes flashloan and execute arbitrage on two UniswapV3 pools
 */
contract ArbitrageExecutor is Ownable {
    using SafeERC20 for IERC20;

    // Address of flashloan provider(lender).
    address immutable flashLoanProvider;
    address immutable uniswapV3Router;
    address immutable uniswapV3Factory;

    constructor(
        address _provider,
        address _uniswapV3Router,
        address _uniswapV3Factory
    ) {
        flashLoanProvider = _provider;
        uniswapV3Router = _uniswapV3Router;
        uniswapV3Factory = _uniswapV3Factory;
    }

    /**
     * This function is called after your contract has received the flash loaned amount by the flashloan provider.
     * @param _tokenA borrowed asset.
     * @param _amount amount of borrowed asset.
     * @param _fee fee of flashloan provider.
     * @param _params encoded params that includes:
     * 1. address tokenB - second token in pool pair.
     * 2. uint24 poolFee1 - fee of first pool for arbitrage.
     * 3. uint24 poolFee2 - fee of second pool for arbitrage.
     * 4. address recipient - recipient of amountOut from swap.
     * 5. uint256 amountIn - amountIn to swap.
     */
    function executeOperation(
        address _tokenA,
        uint256 _amount,
        uint256 _fee,
        bytes calldata _params
    ) external {
        require(
            _amount <= IERC20(_tokenA).balanceOf(address(this)),
            "Invalid balance, was the flashLoan successful?"
        );

        //
        // Your logic goes here.
        // !! Ensure that *this contract* has enough of `_token` funds to payback the `_fee` !!
        //
        (
            address tokenB,
            uint24 poolFee1,
            uint24 poolFee2,
            address recipient,
            uint256 amountIn
        ) = abi.decode(_params, (address, uint24, uint24, address, uint256));
        {
            // Arbitrage
            IERC20(_tokenA).approve(address(uniswapV3Router), _amount);
            IUniswapV3Router.ExactInputSingleParams
                memory params = IUniswapV3Router.ExactInputSingleParams({
                    tokenIn: _tokenA,
                    tokenOut: tokenB,
                    fee: poolFee1,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });

            uint256 tokenBAmountOut = IUniswapV3Router(uniswapV3Router)
                .exactInputSingle(params);

            IERC20(tokenB).approve(address(uniswapV3Router), tokenBAmountOut);

            params = IUniswapV3Router.ExactInputSingleParams({
                tokenIn: tokenB,
                tokenOut: _tokenA,
                fee: poolFee2,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: tokenBAmountOut,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
            IUniswapV3Router(uniswapV3Router).exactInputSingle(params);
        }
        uint totalDebt = _amount + (_fee);
        IERC20(_tokenA).safeTransfer(flashLoanProvider, totalDebt);
        IERC20(_tokenA).safeTransfer(
            recipient,
            IERC20(_tokenA).balanceOf(address(this))
        );
    }

    /**
     * Function that calls flashloan on FlashloanProvider contract.
     * @param _asset borrowed asset.
     * @param _amount amount to borrow.
     * @param _data params for executeOperation callback function.
     */
    function flashloan(
        address _asset,
        uint256 _amount,
        bytes memory _data
    ) public onlyOwner {
        IFlashLoanProvider provider = IFlashLoanProvider(flashLoanProvider);
        provider.flashLoan(address(this), _asset, _amount, _data);
    }

    /**
     * This function calculates current price of the token in the pool.
     * @param _tokenIn first token in pair.
     * @param _tokenOut second token in pair.
     * @param _fee fee of the pool.
     */
    function getPrice(
        address _tokenIn,
        address _tokenOut,
        uint24 _fee
    ) external view returns (uint256 price) {
        IUniswapV3Pool pool = IUniswapV3Pool(
            IUniswapV3Factory(uniswapV3Factory).getPool(
                _tokenIn,
                _tokenOut,
                _fee
            )
        );
        (uint160 sqrtPriceX96, , , , , , ) = pool.slot0();
        return
            (uint256(sqrtPriceX96) * uint256(sqrtPriceX96) * (1e18)) >>
            (96 * 2);
    }
}
