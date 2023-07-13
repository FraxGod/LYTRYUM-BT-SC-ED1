// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IFlashLoanProvider {
    function flashLoan(
        address _receiver,
        address _token,
        uint256 _amount,
        bytes memory _params
    ) external;
}
