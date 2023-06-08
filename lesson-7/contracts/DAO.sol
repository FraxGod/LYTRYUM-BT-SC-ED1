// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import {IDAO, IERC20} from "./interfaces/IDAO.sol";
import {AccessControl, IERC165} from "@openzeppelin/contracts/access/AccessControl.sol";

contract DAO is IDAO, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public constant PROPORTION = 100;
    address private _asset;
    uint256 private _proposalId;
    uint256 private _minimumQuorum;
    uint256 private _debatingDuration;
    mapping(uint256 => Proposal) private _proposals;
    mapping(address => User) private _users;
    mapping(address => mapping(uint256 => bool)) private _voted;

    modifier validateId(uint256 id) {
        if (_proposals[id].end == 0) {
            revert InvalidProposalId();
        }

        _;
    }

    modifier atStage(ProposalStatus status, uint256 id) {
        if (_proposals[id].status != status) {
            revert InvalidStage();
        }

        _;
    }

    modifier isVoted(uint256 id) {
        if (_voted[msg.sender][id]) {
            revert AlreadyVoted();
        }

        _;
    }

    constructor(
        address asset_,
        uint256 minimumQuorum_,
        uint256 debatingDuration_
    ) {
        _asset = asset_;
        _debatingDuration = debatingDuration_;

        uint256 totalSupply = IERC20(_asset).totalSupply();
        _minimumQuorum = (minimumQuorum_ * totalSupply) / PROPORTION;

        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addProposal(
        address recipient,
        string memory description,
        bytes memory callData
    ) external onlyRole(ADMIN_ROLE) {
        Proposal storage proposal = _proposals[_proposalId];
        proposal.recipient = recipient;
        proposal.description = description;
        proposal.callData = callData;
        proposal.end = uint96(block.timestamp + _debatingDuration);
        proposal.status = ProposalStatus.ADDED;

        emit AddedProposal(_proposalId, callData);

        _proposalId++;
    }

    function vote(
        uint256 id,
        bool support
    ) external validateId(id) isVoted(id) atStage(ProposalStatus.ADDED, id) {
        Proposal storage proposal = _proposals[id];
        User storage user = _users[msg.sender];

        if (user.amount == 0) {
            revert InvalidDeposit();
        }

        if (proposal.end <= block.timestamp) {
            revert InvalidTime();
        }

        if (support) {
            proposal.votesFor += uint128(user.amount);
        } else {
            proposal.votesAgainst += uint128(user.amount);
        }

        if (user.lockedTill < proposal.end) {
            user.lockedTill = proposal.end;
        }

        _voted[msg.sender][id] = true;

        emit Voted(msg.sender, id, support);
    }

    function finishProposal(
        uint256 id
    ) external validateId(id) atStage(ProposalStatus.ADDED, id) {
        Proposal storage proposal = _proposals[id];

        if (block.timestamp < proposal.end) {
            revert InvalidTime();
        } else {
            if (proposal.votesFor + proposal.votesAgainst < _minimumQuorum) {
                revert InvalidQuorum();
            } else {
                bool isAccepted;
                bool isSuccessfulCall;

                if (proposal.votesFor > proposal.votesAgainst) {
                    isAccepted = true;

                    (isSuccessfulCall, ) = proposal.recipient.call(
                        proposal.callData
                    );
                }

                proposal.status = ProposalStatus.FINISHED;
                emit FinishedProposal(id, isAccepted, isSuccessfulCall);
            }
        }
    }

    function deposit(uint256 amount) external {
        _deposit(msg.sender, amount);

        User storage user = _users[msg.sender];
        user.amount += uint128(amount);

        emit Deposited(msg.sender, amount);
    }

    // ToDo:: change to `withdraw(uint256 amount)` logic
    function withdraw() external {
        User storage user = _users[msg.sender];
        if (block.timestamp < user.lockedTill) {
            revert UserTokensLocked();
        }

        uint256 amount = user.amount;
        user.amount = 0;
        _withdraw(msg.sender, amount);

        emit Withdrawed(msg.sender, amount);
    }

    function setMinimalQuorum(uint256 newQuorum) external onlyRole(ADMIN_ROLE) {
        _minimumQuorum = (newQuorum * IERC20(_asset).totalSupply()) / PROPORTION;
    }

    function setDebatingPeriod(
        uint256 newPeriod
    ) external onlyRole(ADMIN_ROLE) {
        _debatingDuration = newPeriod;
    }

    function asset() external view returns (address) {
        return _asset;
    }

    function minimumQuorum() external view returns (uint256) {
        return _minimumQuorum;
    }

    function debatingDuration() external view returns (uint256) {
        return _debatingDuration;
    }

    function proposalId() external view returns (uint256) {
        return _proposalId;
    }


    function getUserInfo() external view returns (User memory) {
        return _users[msg.sender];
    }

    function getVotingStatus(
        address user,
        uint256 id
    ) external view returns (bool) {
        return _voted[user][id];
    }

    function getProposal(uint256 id) external view returns (Proposal memory) {
        return _proposals[id];
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IDAO).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    function _deposit(address sender, uint256 amount) internal {
        IERC20(_asset).transferFrom(sender, address(this), amount);
    }

    function _withdraw(address recipient, uint256 amount) internal {
        IERC20(_asset).transfer(recipient, amount);
    }
}
