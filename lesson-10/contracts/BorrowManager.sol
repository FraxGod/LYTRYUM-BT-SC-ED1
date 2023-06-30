// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import {IDAO, IERC20} from "./interfaces/IDAO.sol";
import {IAaveV3Router} from "./interfaces/IAaveV3Router.sol";
import {ISwapRouter} from "./interfaces/IUniswapV3SwapRouter.sol";

/**
 * Sample contract to manage borrowed value in our flow.
 * Basically, we want to swap our borrowed tokens to tokenToBuyVotes and then enter the proposal.
 */
contract BorrowManager {
    address immutable dao;
    address immutable swapRouter;
    address immutable tokenToBuyVotes;

    event SwapExecuted(
        uint256 indexed amountOut,
        address indexed to,
        bytes _path
    );

    /**
     * @param _dao address of the DAO.
     * @param _swapRouter address of the UniswapV3 swap router.
     * @param _tokenToBuyVotes address of the tokenToBuyVotes.
     */
    constructor(address _dao, address _swapRouter, address _tokenToBuyVotes) {
        dao = _dao;
        swapRouter = _swapRouter;
        tokenToBuyVotes = _tokenToBuyVotes;
    }
 

    /**
     * Function that executes swap from our borrowed asset to tokenToBuyVotes.
     * @param _asset address of asset that we are using as tokenIn.
     * @param _amountIn amount of tokenIn.
     * @param _minAmountOut min desired amount of tokens out from the swap.
     */
    function swapToTokensToBuyVotes(
        address _asset,
        uint256 _amountIn,
        uint256 _minAmountOut,
        uint24 _poolFee
    ) external {
        bytes memory _path = abi.encodePacked(
            _asset,
            _poolFee,
            tokenToBuyVotes
        );
        executeSwap(_asset, _amountIn, _minAmountOut, _path);
    }

    /**
     * Function that deposit tokenToBuyVotes to DAO and participate in proposal.
     * @param _amount of tokens to deposit in DAO.
     * @param _id id of proposal that we will partcipate in.
     * @param _decision for/against boolean flag for proposal.
     */
    function depositAndVote(
        uint256 _amount,
        uint256 _id,
        bool _decision
    ) external {

    }

    /**
     * Sample function to execute generic swap on UniswapV3
     * @param _asset address of asset that we are using as tokenIn.
     * @param _amountIn amount of tokenIn.
     * @param _minAmountOut min desired amount of tokens out from the swap.
     * @param _path hashed path of swap.
     */
    function executeSwap(
        address _asset,
        uint256 _amountIn,
        uint256 _minAmountOut,
        bytes memory _path
    ) public {
        IERC20(_asset).transferFrom(msg.sender, address(this), _amountIn);

        IERC20(_asset).approve(swapRouter, _amountIn);
        ISwapRouter.ExactInputParams memory params = ISwapRouter
        .ExactInputParams({
            path: _path,
            recipient: msg.sender,
            deadline: block.timestamp,
            amountIn: _amountIn,
            amountOutMinimum: _minAmountOut
        });

        uint256 amountOut = ISwapRouter(swapRouter).exactInput(params);

        emit SwapExecuted(amountOut, msg.sender, _path);
    }
}
