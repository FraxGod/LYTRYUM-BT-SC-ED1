// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./CustomToken.sol";
// ToDo:: use AccessControl from OpenZeppelin and create roles: Admin and Validator. Set Admin role as admin role of Validator
// ToDo:: import "@openzeppelin/contracts/access/AccessControl.sol";
contract Bridge {
    using ECDSA for bytes32;

    uint256 public srcChainId;
    uint256 public dstChainId;
    address public validator;
    address public token;

    mapping (bytes32 => bool) swaps;

    event SwapInitialized(
        bytes32 message,
        address sender,
        address recepient,
        uint256 amount,
        uint256 nonce,
        uint256 srcChainId,
        uint256 dstChainId
    );

    event Redeemed(
        bytes32 message,
        address sender,
        address recepient,
        uint256 amount,
        uint256 nonce,
        uint256 srcChainId,
        uint256 dstChainId
    );
    
    constructor(
        address _validator,
        address _token,
        uint256 _srcChainId,
        uint256 _dstChainId
    ) {
        srcChainId = _srcChainId;
        dstChainId = _dstChainId;
        validator = _validator;
        token = _token;
    }

    function swap(address _recipient, uint256 _amount, uint256 _nonce) external {
        require(token != address(0), "Bridge: token has not been define");
        require(_recipient != address(0), "Bridge: recipient address is zero");

        bytes32 message = keccak256(
            abi.encodePacked(
                msg.sender,
                _recipient,
                _amount,
                _nonce,
                srcChainId,
                dstChainId
            )
        );

        require(!swaps[message], "Bridge: swap state is not empty");
        CustomToken(token).burn(msg.sender, _amount);

        emit SwapInitialized(
            message,
            msg.sender,
            _recipient,
            _amount,
            _nonce,
            srcChainId,
            dstChainId
        );
    }

    function redeem(
        address _sender,
        address _recipient,
        uint256 _amount,
        uint256 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external {
        require(token != address(0), "Bridge: token has not been define");
        require(validator != address(0), "Bridge: validator has not been set");

        bytes32 message = keccak256(
            abi.encodePacked(
                _sender,
                _recipient,
                _amount,
                _nonce,
                dstChainId,
                srcChainId
            )
        );

        require(!swaps[message], "Bridge: swap state is not empty");
        require(validator == ECDSA.recover(
            ECDSA.toEthSignedMessageHash(message),
            _v,
            _r,
            _s
        ), "Bridge: wrong validator address");

        swaps[message] = true;

        CustomToken(token).mint(_recipient, _amount);

        emit Redeemed(
            message,
            _sender,
            _recipient,
            _amount,
            _nonce,
            dstChainId,
            srcChainId
        );
    }
}