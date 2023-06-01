// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ICO is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

    struct VestingRule {
        uint256 unlockTime;
        uint256 unlockPercent;
    }

    struct User {
        uint256 claimed;
        uint256 bought;
    }

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public constant PRECISION = 100_000;
    uint256 public immutable startTime; // cliff time
    uint256 public immutable endTime; // cliff time
    uint256 public immutable price;
    uint256 public immutable minAmount;
    uint256 public immutable maxAmount;
    uint256 public goal;
    uint256 public totalTST; // total TestTokens
    uint256 public totalTSTSold;
    uint256 public totalUSDCAccumulated;
    address public immutable usdc;
    address public immutable tst;

    // Merkle tree global var
    bytes32 public merkleRoot;

    VestingRule[] public vesting; // [[1688224892, 10000],[1690816892, 20000],[1693408892, 20000],[1696000892, 50000]]

    mapping (address => User) public users;

    event Participated(uint256 amount, uint256 totalUSDCAccumulated, address indexed sender);
    event Claimed(address indexed user, uint256 amount);

    constructor(
        uint256 _startTime,
        uint256 _endTime,
        address _tst,
        address _usdc,
        uint256 _price,
        uint256 _minAmount,
        uint256 _maxAmount,
        VestingRule[] memory _vesting
    ) {
        startTime = _startTime;
        endTime = _endTime;
        tst = _tst;
        usdc = _usdc;
        price = _price;
        minAmount = _minAmount;
        maxAmount = _maxAmount;
        uint256 totalPercent;

        for(uint256 i; i < _vesting.length; i++) {
            require(_vesting[i].unlockTime > _endTime, "bad unlockTime");

            vesting.push(_vesting[i]);
            totalPercent += _vesting[i].unlockPercent;
        }

        
        require(totalPercent == PRECISION, "bad vesting rules");

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);


    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "not an admin");
        _;
    }

    modifier onlyWhitelisted(bytes32[] calldata merkleProof) {
        //ToDd: complete the requirement: require( {SOME_STATEMENT_HERE}, "invalid merkle proof");
        _;
    }

    function initialize(uint256 _goal) external onlyAdmin {
        require(goal == 0, "already initialized");
        goal = _goal;

        totalTST = (_goal * PRECISION * 10 **IERC20Metadata(tst).decimals()) / (price * 10 **IERC20Metadata(usdc).decimals());
        IERC20Metadata(tst).safeTransferFrom(
            msg.sender,
            address(this),
            totalTST
        );
    }
    
    function setMerkleRoot(bytes32 _merkleRoot) external onlyAdmin {
        merkleRoot = _merkleRoot;
    }

    function toBytes32(address addr) pure internal returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function buyTokenForWhitelistedUsers(
        uint256 _amount,
        bytes32[] calldata merkleProof
    ) external onlyWhitelisted(merkleProof) {
        buyToken(_amount);
    }

    function buyToken(uint256 _amount) public nonReentrant {
        require(block.timestamp > startTime, "too early");
        require(block.timestamp < endTime, "too late");

        require(_amount >= minAmount && users[msg.sender].bought + _amount <= maxAmount, "bad amount");

        uint256 usdcAmount = ((_amount * (10**IERC20Metadata(usdc).decimals()) * price) 
        / (PRECISION * (10**IERC20Metadata(tst).decimals())));

        require(totalUSDCAccumulated + usdcAmount <= goal, "amount too high.");

        totalUSDCAccumulated += usdcAmount;
        users[msg.sender].bought += _amount;
        totalTSTSold += _amount;
        IERC20Metadata(usdc).safeTransferFrom(
            msg.sender,
            address(this),
            usdcAmount
        );

        emit Participated(_amount, totalUSDCAccumulated, msg.sender);
    }

    function withdrawTokens() external {
        require(block.timestamp > endTime, "too early");
        User storage user = users[msg.sender];

        require(user.bought - user.claimed > 0, "nothing to claim");

        uint256 amount = getAvailableAmount(msg.sender);

        user.claimed += amount;

        IERC20Metadata(usdc).safeTransfer(
            msg.sender,
            amount
        );

        emit Claimed(msg.sender, amount);
    }

    function withdrawUSDC() external onlyRole(ADMIN_ROLE) {
        // ToDo:: this
    }

    function getAvailableAmount(address _address)
        public
        view
        returns (uint256)
    {
        User memory user = users[_address];

        require(vesting[0].unlockTime <= block.timestamp, "Time have not came");
        uint256 availablePercent;

        for (uint256 i; i< vesting.length; i++) {
            if(vesting[i].unlockTime <= block.timestamp) {
                availablePercent += vesting[i].unlockPercent;
                continue;
            }
            break;
        }

        return ((user.bought * availablePercent) / PRECISION) - user.claimed;
    }
}
