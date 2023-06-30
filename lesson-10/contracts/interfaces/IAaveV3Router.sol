// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAaveV3Router {
    function supply(
        address _aavePool,
        address _asset,
        uint256 _amount,
        address _onBehalfOf,
        uint16 _referralCode
    ) external;

    function borrow(
        address _aavePool,
        address _aTokens,
        uint256 _interestRateMode,
        address _asset,
        uint256 _amount,
        address _onBehalfOf,
        uint16 _referralCode
    ) external;

    function withdraw(
        address _aavePool,
        address _aTokens,
        address _asset,
        uint256 _amount
    ) external;
}
