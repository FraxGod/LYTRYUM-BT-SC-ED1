// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

/**
 * @dev Interface of the decentralized autonomous organization.
 */
interface IDAO {
    /* -------------------------------------------------- */
    /* --------------------- ERRORS --------------------- */
    /* -------------------------------------------------- */

    /// Reverts if minimum quorum is not reached.
    error InvalidQuorum();

    /// Reverts if proposal time is not ended.
    error InvalidTime();

    /// Reverts if proposal ID is invalid.
    error InvalidProposalId();

    /// Reverts if user trying to withdraw locked tokens.
    error UserTokensLocked();

    /// Reverts if user is already voted in a proposal.
    error AlreadyVoted();

    /// Reverts if trying to vote in finished proposal.
    error InvalidStage();

    /// Reverts if voter without deposit trying to vote.
    error InvalidDeposit();

    /* -------------------------------------------------- */
    /* ---------------------- ENUMS --------------------- */
    /* -------------------------------------------------- */

    enum ProposalStatus {
        UNDEFINED,
        ADDED,
        FINISHED
    }

    /* -------------------------------------------------- */
    /* -------------------- STRUCTS --------------------- */
    /* -------------------------------------------------- */

    struct Proposal {
        address recipient;
        uint96 end;
        uint128 votesFor;
        uint128 votesAgainst;
        bytes callData;
        string description;
        ProposalStatus status;
    }

    struct User {
        uint128 amount;
        uint128 lockedTill;
    }

    /* -------------------------------------------------- */
    /* --------------------- EVENTS --------------------- */
    /* -------------------------------------------------- */

    /**
     * @dev Emits every time proposal is added.
     *
     * @param proposalId Id of the proposal.
     * @param callData Call data for make a call to another contract.
     */
    event AddedProposal(uint256 indexed proposalId, bytes callData);

    /**
     * @dev Emits when some user is voted
     *
     * @param user Address of the user, which want to vote.
     * @param proposalId ID of the proposal, user want to vote
     * @param support Boolean value, represents the user opinion
     */
    event Voted(address indexed user, uint256 indexed proposalId, bool support);

    /**
     * @dev Emits every time proposal is finished.
     *
     * @param proposalId Id of the proposal.
     * @param isAccepted Result of the proposal.
     * @param isSuccessfulCall Result of the call.
     */
    event FinishedProposal(
        uint256 indexed proposalId,
        bool isAccepted,
        bool isSuccessfulCall
    );

    /**
     * @dev Emits when some user deposits any amount of tokens.
     *
     * @param user Address of the user, who deposits
     * @param amount Amount of tokens to deposit
     */
    event Deposited(address indexed user, uint256 amount);

    /**
     * @dev Emits when some user withdraws any amount of tokens.
     *
     * @param user Address of the user, who withdraws
     * @param amount Amount of tokens to withdraw
     */
    event Withdrawed(address indexed user, uint256 amount);

    /* -------------------------------------------------- */
    /* -------------------- FUNCTIONS ------------------- */
    /* -------------------------------------------------- */

    /**
     * @dev Adds the proposal for the voting.
     * NOTE: Anyone can add new proposal
     *
     * @param recipient Address of the contract to call the function with call data
     * @param description Short description of the proposal
     * @param callData Call data for calling the function with call()
     */
    function addProposal(
        address recipient,
        string memory description,
        bytes memory callData
    ) external;

    /**
     * @dev Votes for the particular proposal
     * NOTE: Before voting user should deposit some tokens into DAO
     *
     * @param id Proposal ID you want to vote for
     * @param support Represents your support of this proposal
     */
    function vote(uint256 id, bool support) external;

    /**
     * @dev Finishes the particular proposal
     * @notice Proposal could be finished after duration time
     * @notice Proposal considers successful if enough quorum is used for voting
     */
    function finishProposal(uint256 id) external;

    /**
     * @dev Deposits `amount` of tokens to the DAO
     *
     * @param amount Amount of tokens to deposit
     */
    function deposit(uint256 amount) external;

    /**
     * @dev Withdraws all the tokens from DAO
     *
     * @notice Tokens could be withdrawn only after the longer proposal duration user votes for
     *
     */
    function withdraw() external;

    /**
     * @dev Sets the minimal quorum.
     *
     * @param newQuorum New minimal quorum you want to set.
     * @notice Only admin can call this funciton.
     */
    function setMinimalQuorum(uint256 newQuorum) external;

    /**
     * @dev Sets the debating period for proposals.
     *
     * @param newPeriod New debating period you want to set.
     * @notice Only admin can call this funciton.
     */
    function setDebatingPeriod(uint256 newPeriod) external;

    /**
     * @dev Returns the address of the voting token.
     */
    function asset() external view returns (address);

    /**
     * @dev Returns minimal quorum for the proposals.
     */
    function minimumQuorum() external view returns (uint256);

    /**
     * @dev Returns debating duration for the proposals.
     */
    function debatingDuration() external view returns (uint256);

    /**
     * @dev Returns the amount of the proposals.
     */
    function proposalId() external view returns (uint256);

    /**
     * @dev Returns information about sender
     */
    function getUserInfo() external view returns (User memory);

    /**
     * @dev Returns the voting status of the user
     *
     * @param user Address of the user
     * @param id Proposal ID
     */
    function getVotingStatus(
        address user,
        uint256 id
    ) external view returns (bool);

    /**
     * @dev Returns the proposal
     *
     * @param id ID of the proposal
     */
    function getProposal(uint256 id) external view returns (Proposal memory);
}
