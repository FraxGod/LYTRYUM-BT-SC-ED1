// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import {IDAO, IERC20} from "./interfaces/IDAO.sol";
import {AccessControl, IERC165} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Decentralized autonomous organization
 * @author Galas' Danil
 * @notice This is a simple realization of DAO with delegation mechanism
 */
contract DAO is IDAO, AccessControl {
    /**
     * @dev Role for creating proposals.
     */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /**
     * @dev Precision for the calculations.
     */
    uint256 public constant PROPORTION = 100;

    /**
     * @dev Address of the voting token.
     */
    address private _asset;

    /**
     * @dev Proposal's ID.
     */
    uint256 private _proposalId;

    /**
     * @dev Percent of the minimal allowed quorum.
     */
    uint256 private _minimumQuorum;

    /**
     * @dev Proposal's duration.
     */
    uint256 private _debatingDuration;

    /**
     * @dev Proposal information by ID.
     */
    mapping(uint256 => Proposal) private _proposals;

    /**
     * @dev User information by address.
     */
    mapping(address => User) private _users;

    /**
     * @dev Information about voting accounts for a proposal.
     */
    mapping(address => mapping(uint256 => bool)) private _voted;

    /**
     * @dev Checks if proposal is exist.
     * @param id Proposal id you want to check
     */
    modifier validateId(uint256 id) {
        if (_proposals[id].end == 0) {
            revert InvalidProposalId();
        }

        _;
    }

    /**
     * @dev Check is stage is equal to provided.
     *
     * @param status Required stage
     * @param id Proposal ID
     */
    modifier atStage(ProposalStatus status, uint256 id) {
        if (_proposals[id].status != status) {
            revert InvalidStage();
        }

        _;
    }

    /**
     * @dev Provide guard from multiple voting or delegating
     */
    modifier isVoted(uint256 id) {
        if (_voted[msg.sender][id]) {
            revert AlreadyVoted();
        }

        _;
    }

    /**
     * @dev Sets {_asset}, {minimumQuorum} and {debatingDuration},
     * Adds 3 selectors - for setting {minimumQuorum} and {debatingDuration}
     * and for adding new selectors
     */
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

    /**
     * @dev See {IDAO-addProposal}.
     */
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

    /**
     * @dev See {IDAO-vote}.
     */
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

    /**
     * @dev See {IDAO-finishProposal}.
     */
    function finishProposal(
        uint256 id
    ) external validateId(id) atStage(ProposalStatus.ADDED, id) {
        Proposal storage proposal = _proposals[id];

        if (block.timestamp < proposal.end) {
            revert InvalidTime();
        } else {
            bool isAccepted;
            bool isSuccessfulCall;
            if (
                proposal.votesFor + proposal.votesAgainst < _minimumQuorum
            ) {} else {
                if (proposal.votesFor > proposal.votesAgainst) {
                    isAccepted = true;

                    (isSuccessfulCall, ) = proposal.recipient.call(
                        proposal.callData
                    );
                }

                proposal.status = ProposalStatus.FINISHED;
            }
            emit FinishedProposal(id, isAccepted, isSuccessfulCall);
        }
    }

    /**
     * @dev See {IDAO-deposit}.
     */
    function deposit(uint256 amount) external {
        _deposit(msg.sender, amount);

        User storage user = _users[msg.sender];
        user.amount += uint128(amount);

        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev See {IDAO-withdraw}.
     *
     */
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

    /**
     * @dev See {IDAO-setMinimalQuorum}.
     */
    function setMinimalQuorum(uint256 newQuorum) external onlyRole(ADMIN_ROLE) {
        _minimumQuorum = (newQuorum * IERC20(_asset).totalSupply()) / 100;
    }

    /**
     * @dev See {IDAO-setDebatingPeriod}.
     */
    function setDebatingPeriod(
        uint256 newPeriod
    ) external onlyRole(ADMIN_ROLE) {
        _debatingDuration = newPeriod;
    }

    /**
     * @dev See {IDAO-asset}.
     */
    function asset() external view returns (address) {
        return _asset;
    }

    /**
     * @dev See {IDAO-minimumQuorum}.
     */
    function minimumQuorum() external view returns (uint256) {
        return _minimumQuorum;
    }

    /**
     * @dev See {IDAO-debatingDuration}.
     */
    function debatingDuration() external view returns (uint256) {
        return _debatingDuration;
    }

    /**
     * @dev See {IDAO-proposalId}.
     */
    function proposalId() external view returns (uint256) {
        return _proposalId;
    }

    /**
     * @dev See {IDAO-getUserInfo}.
     */
    function getUserInfo() external view returns (User memory) {
        return _users[msg.sender];
    }

    /**
     * @dev See {IDAO-getVotingStatus}.
     */
    function getVotingStatus(
        address user,
        uint256 id
    ) external view returns (bool) {
        return _voted[user][id];
    }

    /**
     * @dev See {IDAO-getProposal}.
     */
    function getProposal(uint256 id) external view returns (Proposal memory) {
        return _proposals[id];
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
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
