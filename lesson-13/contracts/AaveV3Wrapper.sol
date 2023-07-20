// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IAToken} from "@aave/core-v3/contracts/interfaces/IAToken.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";

error AmountExceedsMax();
error NotSupportedAsset();
error ZeroShares();
error ZeroAssets();

/**
 * Sample contract based on ERC4626 that wraps AaveV3Pool
 */
contract AaveV3Wrapper is ERC4626 {
    using Math for uint256;
    using SafeERC20 for IERC20;

    // Address of AaveV3 pool address provider.
    IPoolAddressesProvider public immutable poolAddressProvider;

    // Address of AaveV3Pool.
    IPool public immutable aavePool;

    // Address of AaveV3 aToken(wrapped token)/
    IAToken public immutable aToken;

    /**
     * @param _underlying Address of underlying token that will be wrapped to aToken.
     * @param _poolAddressProvider Address of Aave's V3 pool addresses provider.
     */
    constructor(
        address _underlying,
        IPoolAddressesProvider _poolAddressProvider
    ) ERC20("ERC4626Mock", "E4626M") ERC4626(IERC20(_underlying)) {
        poolAddressProvider = _poolAddressProvider;
        aavePool = IPool(poolAddressProvider.getPool());

        address aTokenAddress = aavePool.getReserveData(address(_underlying)).aTokenAddress;

        if(aTokenAddress == address(0)) {
            revert NotSupportedAsset();
        }

        aToken = IAToken(aTokenAddress);

        IERC20(asset()).approve(address(aavePool), type(uint256).max);
    }

    /**
     * @notice Funciton that returns amount of accumulated tokens with interest.
     */
    function totalAssets() public view override(ERC4626) returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    /**
     * @notice Function that deposits given amount of asset and send shares to receiver.
     * @param amount of deposited asset.
     * @param receiver address of the receiver.
     */
    function deposit(
        uint256 amount,
        address receiver
    ) public override(ERC4626) returns (uint256) {
       uint256 shares = super.previewDeposit(amount);
       if(shares == 0) {
        revert ZeroShares();
       }

       _deposit(_convertToAssets(shares, Math.Rounding.Up), shares, receiver);
       return shares;
    }

    /**
     * @notice Function that mints given amount of shares and send it to receiver.
     * @param shares amount of shares to mint.
     * @param receiver address of the receiver.
     */
    function mint(
        uint256 shares,
        address receiver
    ) public override(ERC4626) returns (uint256) {
       uint256 amount = super.previewMint(shares);
       _deposit(amount, shares, receiver);

       return amount;
    }

    /**
     * @notice Function that withdraws given amount of asset, send it to receiver and
     * burn corresponding to it amount of shares.
     * @param amount of withdrawn asset.
     * @param receiver address of the receiver.
     * @param owner of shares.
     */
    function withdraw(
        uint256 amount,
        address receiver,
        address owner
    ) public override(ERC4626) returns (uint256) {
        if(amount > maxWithdraw(owner)) {
            revert AmountExceedsMax();
        }

        uint256 shares = super.previewWithdraw(amount);
        _withdraw(msg.sender, owner, amount, shares, receiver);

        return shares;
    }

    /**
     * @notice Function that redeems given amount of shares and send corresponding
     * to it amount of assets to receiver.
     * @param shares of withdrawn asset.
     * @param receiver address of the receiver.
     * @param owner of shares.
     */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override(ERC4626) returns (uint256) {
        if(shares > maxRedeem(owner)) {
            revert AmountExceedsMax();
        }

        uint256 amount = super.previewRedeem(shares);

        if(amount == 0) {
            revert ZeroAssets();
        }

        _withdraw(msg.sender, owner, amount, shares, receiver);
        return amount;
    }

    function _deposit(
        uint256 amount,
        uint256 shares,
        address receiver
    ) private {
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), amount);
        aavePool.supply(asset(), amount, address(this), 0);

        _mint(receiver, shares);

        emit Deposit(msg.sender, receiver, amount, shares);
    }

    function _withdraw(
        address caller,
        address owner,
        uint256 amount,
        uint256 shares,
        address receiver
    ) private {
        if(caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        _burn(owner, shares);

        aavePool.withdraw(address(asset()), amount, receiver);

        emit Withdraw(caller, receiver, owner, amount, shares);
    }
}
