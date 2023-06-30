// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import {IDAO, IERC20} from "./interfaces/IDAO.sol";
import {IAaveV3Pool} from "./interfaces/IAaveV3Pool.sol";

/**
 * Simple router for AaveV3 pool contract that provides functionality to supply, borrow, repay or withdraw value to/from pool.
 */
contract AaveV3Router {
    constructor() {}

    event Supplied(
        address indexed _asset,
        uint256 indexed _amount,
        address _onBehalfOf,
        uint16 _referralCode
    );

    event Borrowed(
        address indexed _asset,
        uint256 indexed _amount,
        address _onBehalfOf,
        uint16 _referralCode,
        uint256 _interestRateMode
    );

    event Repaid(
        address indexed _asset,
        uint256 indexed _amount,
        address _onBehalfOf,
        uint256 _interestRateMode,
        uint256 _repaidValue
    );

    event Withdrawed(address indexed _asset, uint256 indexed _amount);

    /**
     * Function that supply value to Aave's V3 pool.
     * @param _aavePool address of aaveV3 pool.
     * @param _asset address of asset that we will provide as the collateral.
     * @param _amount amount of asset that we want to supply.
     * @param _onBehalfOf address of user that will connect to this collateral and will get interest.
     * @param _referralCode code used to register the integrator originating the operation, for potential rewards.
     *   0 if the action is executed directly by the user, without any middle-man
     */
    function supply(
        address _aavePool,
        address _asset,
        uint256 _amount,
        address _onBehalfOf,
        uint16 _referralCode
    ) external {
        IERC20(_asset).transferFrom(msg.sender, address(this), _amount);

        IERC20(_asset).approve(_aavePool, _amount);
        IAaveV3Pool(_aavePool).supply(
            _asset,
            _amount,
            _onBehalfOf,
            _referralCode
        );

        emit Supplied(_asset, _amount, _onBehalfOf, _referralCode);
    }

    /**
     * Function that borrow assets from Aave's V3 pool.
     * @param _aavePool address of aaveV3 pool.
     * @param _interestRateMode The interest rate mode at which the user wants to borrow: 1 for Stable, 2 for Variable.
     * @param _asset address of asset that we want to borrow.
     * @param _amount amount of asset that we want to borrow.
     * @param _onBehalfOf the address of the user who will receive the debt. Should be the address of the borrower itself
     * calling the function if he wants to borrow against his own collateral, or the address of the credit delegator
     * if he has been given credit delegation allowance.
     * @param _referralCode refferal code.
     */
    function borrow(
        address _aavePool,
        uint256 _interestRateMode,
        address _asset,
        uint256 _amount,
        address _onBehalfOf,
        uint16 _referralCode
    ) external {
        IAaveV3Pool(_aavePool).borrow(
            _asset,
            _amount,
            _interestRateMode,
            _referralCode,
            _onBehalfOf // msg.sender
        );

        IERC20(_asset).transfer(msg.sender, _amount);

        emit Borrowed(
            _asset,
            _amount,
            _onBehalfOf,
            _referralCode,
            _interestRateMode
        );
    }

    /**
     * Function that repay asset to Aave's V3 pool.
     * @param _aavePool address of aaveV3 pool.
     * @param _asset address of asset that we want to repay.
     * @param _amount amount of asset that we want to repay.
     * @param _interestRateMode The interest rate mode at which the user wants to borrow: 1 for Stable, 2 for Variable.
     * @param _onBehalfOf the address of the user who will get his debt reduced/removed. Should be the address of the
     * user calling the function if he wants to reduce/remove his own debt, or the address of any other
     * other borrower whose debt should be removed.
     */
    function repay(
        address _aavePool,
        address _asset,
        uint256 _amount,
        uint256 _interestRateMode,
        address _onBehalfOf
    ) external returns (uint256 _repaid) {
        IERC20(_asset).transferFrom(msg.sender, address(this), _amount);

        IERC20(_asset).approve(_aavePool, _amount);
        _repaid = IAaveV3Pool(_aavePool).repay(
            _asset,
            _amount,
            _interestRateMode, 
            _onBehalfOf
        );

        emit Repaid(
            _asset,
            _amount,
            _onBehalfOf,
            _interestRateMode,
            _repaid
        );
    }

    /**
     * Function that withdraw asset from Aave's V3 pool.
     * @param _aavePool address of aaveV3 pool.
     * @param _aToken address of aToken that we will provide.
     * @param _asset address of asset that we want to withdraw.
     * @param _amount amount of asset that we want to withdraw.
     */
    function withdraw(
        address _aavePool,
        address _aToken,
        address _asset,
        uint256 _amount
    ) external {
        IERC20(_aToken).transferFrom(msg.sender, address(this), _amount);

        IERC20(_aToken).approve(_aavePool, _amount);

        IAaveV3Pool(_aavePool).withdraw(
            _asset,
            _amount,
            msg.sender
        );

        emit Withdrawed(_asset, _amount);
    }
}
