// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/VRFV2WrapperConsumerBase.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

error NotTheOriginalRequester();
error RequestNotFulfilledYet();
error RewardAlreadyClaimed();
error RequestNotFound();

contract Lottery is VRFV2WrapperConsumerBase {
    using SafeERC20 for IERC20;
    IERC20 public immutable token; // test token

    mapping(uint256 => RequestStatus) public s_requests;
    mapping(uint256 => bool) public rewardClaimed;
    uint256[] public requestIds;
    uint256 public lastRequestId;
    uint32 callbackGasLimit = 100_000; // increased
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    event RequestSent(uint256 requestId, address sender);

    event RequestFulfilled(
        uint256 requestId,
        uint256[] randomWords,
        uint256 payment
    );

    event RewardsClaimed(uint256 indexed requestId, uint256 indexed amount);

    struct RequestStatus {
        uint256 paid; // amount paid in link
        uint256 betAmount;
        address requester;
        bool fulfilled; // whether the request has been successfully fulfilled
        uint256[] randomWords;
    }

    constructor(
        address _linkAddress,
        address _wrapperAddress,
        address _token
    ) VRFV2WrapperConsumerBase(_linkAddress, _wrapperAddress) {
        token = IERC20(_token);
    }

    function enterLottery(uint256 amount) external returns (uint256 requestId) {
        token.safeTransferFrom(msg.sender, address(this), amount);

        requestId = requestRandomness(
            callbackGasLimit,
            requestConfirmations,
            numWords
        );

        s_requests[requestId] = RequestStatus({
            paid: VRF_V2_WRAPPER.calculateRequestPrice(callbackGasLimit),
            randomWords: new uint256[](0),
            requester: msg.sender,
            betAmount: amount,
            fulfilled: false
        });

        requestIds.push(requestId);
        lastRequestId = requestId;

        emit RequestSent(requestId, msg.sender);
        return requestId;
    }

    function claimRewards(uint256 _requestId) external {
        RequestStatus storage reqStatus = s_requests[_requestId];
        if(reqStatus.requester != msg.sender) {
            revert NotTheOriginalRequester();
        }
        if(!reqStatus.fulfilled) {
            revert RequestNotFulfilledYet();
        }
        if(rewardClaimed[_requestId]) {
            revert RewardAlreadyClaimed();
        }

        uint256 result = reqStatus.randomWords[0] % 6001;
        uint256 amountToSend; // 0
        if(result < 3000) { // 0 ~ 2999

        } else if (result == 3000) { // 3000
            amountToSend = reqStatus.betAmount;
        } else { // 3001 ~ 6000
            amountToSend = reqStatus.betAmount * 2;
        }
        token.safeTransfer(msg.sender, amountToSend);
        rewardClaimed[_requestId] = true;
        emit RewardsClaimed(_requestId, amountToSend);
    }

    function getRequestStatus(
        uint256 _requestId
    )
        external
        view
        returns (
            uint256 paid,
            bool fulfilled,
            uint256 betAmount,
            address requester,
            uint256[] memory randomWords
        )
    {
        if(s_requests[_requestId].paid == 0) {
            revert RequestNotFound();
        }

        RequestStatus memory request = s_requests[_requestId];
        return (
            request.paid,
            request.fulfilled,
            request.betAmount,
            request.requester,
            request.randomWords
        );
    }

    // ToDo:: check requester won or not? function checkStatus(address) external view returns(bool){...}

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        if(s_requests[_requestId].paid == 0) {
            revert RequestNotFound();
        }

        s_requests[_requestId].fulfilled = true;
        s_requests[_requestId].randomWords = _randomWords;

        emit RequestFulfilled(_requestId, _randomWords, s_requests[_requestId].paid);
    }
}
