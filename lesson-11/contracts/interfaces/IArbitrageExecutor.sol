// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IArbitrageExecutor {
    function executeOperation(
        address _reserve,
        uint256 _amount,
        uint256 _fee,
        bytes calldata _params
    ) external;
}
