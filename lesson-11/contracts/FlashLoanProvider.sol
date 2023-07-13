// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IArbitrageExecutor.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract FlashLoanProvider is ReentrancyGuard {
    uint256 public immutable totalFee;

    // uint256 protocolFee;

    constructor(uint256 _totalFee) {
        totalFee = _totalFee;
    }

    /**
     * @dev emitted when a flashloan is executed
     * @param _target the address of the flashLoanReceiver
     * @param _reserve the address of the reserve
     * @param _amount the amount requested
     * @param _totalFee the total fee on the amount
     * @param _timestamp the timestamp of the action
     **/
    event FlashLoan(
        address indexed _target,
        address indexed _reserve,
        uint256 _amount,
        uint256 _totalFee,
        uint256 _timestamp
    );

    /**
     * @dev allows smartcontracts to access the liquidity of the pool within one transaction,
     * as long as the amount taken plus a fee is returned. NOTE There are security concerns for developers of flashloan receiver contracts
     * that must be kept into consideration. For further details please visit https://developers.aave.com
     * @param _receiver The address of the contract receiving the funds. The receiver should implement the IFlashLoanReceiver interface.
     * @param _token the address of the principal reserve
     * @param _amount the amount requested for this flashloan
     **/
    function flashLoan(
        address _receiver,
        address _token,
        uint256 _amount,
        bytes memory _params
    ) public nonReentrant {
        //check that the reserve has enough available liquidity
        //we avoid using the getAvailableLiquidity() function in LendingPoolCore to save gas
        uint256 availableLiquidityBefore = IERC20(_token).balanceOf(
            address(this)
        );

        require(
            availableLiquidityBefore >= _amount,
            "There is not enough liquidity available to borrow"
        );

        //calculate amount fee
        uint256 amountFee = (_amount * (totalFee)) / (10000);

        //protocol fee is the part of the amountFee reserved for the protocol - the rest goes to depositors
        // uint256 protocolAmountFee = (amountFee * protocolFee) / (10000);
        require(
            amountFee > 0,
            "The requested amount is too small for a flashLoan."
        );

        //get the FlashLoanReceiver instance
        IArbitrageExecutor receiver = IArbitrageExecutor(_receiver);

        // address payable userPayable = address(uint160(_receiver));

        //transfer funds to the receiver
        IERC20(_token).transfer(_receiver, _amount);
        // core.transferToUser(_token, userPayable, _amount);

        //execute action of the receiver
        receiver.executeOperation(_token, _amount, amountFee, _params);
        //check that the actual balance of the core contract includes the returned amount
        uint256 availableLiquidityAfter = IERC20(_token).balanceOf(
            address(this)
        );

        require(
            availableLiquidityAfter == availableLiquidityBefore + amountFee,
            "The actual balance of the protocol is inconsistent"
        );

        emit FlashLoan(_receiver, _token, _amount, amountFee, block.timestamp);
    }
}