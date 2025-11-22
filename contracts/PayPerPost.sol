// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PayPerPost
 * @dev Escrow contract that receives x402 payments and tracks creator earnings
 * @notice x402 sends USDC directly to this contract, we just track and allow withdrawals
 */
contract PayPerPost is Ownable, Pausable, ReentrancyGuard {
    // ============ State Variables ============

    IERC20 public immutable usdcToken;
    address public platformWallet;
    uint256 public platformFeePercentage; // Basis points (100 = 1%)

    // Mapping: creator => total earnings
    mapping(address => uint256) public creatorEarnings;

    // Mapping: creator => total withdrawn
    mapping(address => uint256) public creatorWithdrawn;

    // Mapping: postId => creator address
    mapping(string => address) public postCreators;

    // Mapping: postId => total earnings
    mapping(string => uint256) public postEarnings;

    // ============ Events ============

    event PostRegistered(
        string indexed postId,
        address indexed creator,
        uint256 timestamp
    );

    event PaymentReceived(
        string indexed postId,
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    event WithdrawalMade(
        address indexed creator,
        uint256 grossAmount,
        uint256 platformFee,
        uint256 netAmount,
        uint256 timestamp
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformWalletUpdated(address oldWallet, address newWallet);

    // ============ Errors ============

    error InvalidAddress();
    error InvalidPostId();
    error PostAlreadyRegistered();
    error InsufficientEarnings();
    error TransferFailed();
    error InvalidFeePercentage();

    // ============ Constructor ============

    /**
     * @dev Initialize contract with USDC token address
     * @param _usdcToken Address of USDC token on Base Sepolia
     * @param _platformWallet Address to receive platform fees
     * @param _platformFeePercentage Initial platform fee (100 = 1%)
     */
    constructor(
        address _usdcToken,
        address _platformWallet,
        uint256 _platformFeePercentage
    ) {
        if (_usdcToken == address(0)) revert InvalidAddress();
        if (_platformWallet == address(0)) revert InvalidAddress();
        if (_platformFeePercentage > 1000) revert InvalidFeePercentage(); // Max 10%

        usdcToken = IERC20(_usdcToken);
        platformWallet = _platformWallet;
        platformFeePercentage = _platformFeePercentage;
    }

    // ============ Post Registration (Public) ============

    /**
     * @dev Register a post with creator (called by frontend when post is created)
     * @param postId Unique identifier for the post
     * @param creator Address of the content creator
     */
    function registerPost(string calldata postId, address creator)
        external
        whenNotPaused
    {
        if (bytes(postId).length == 0) revert InvalidPostId();
        if (creator == address(0)) revert InvalidAddress();
        if (postCreators[postId] != address(0)) revert PostAlreadyRegistered();

        postCreators[postId] = creator;

        emit PostRegistered(postId, creator, block.timestamp);
    }

    // ============ Payment Recording (Called by Backend) ============

    /**
     * @dev Record a payment (called by backend after x402 payment detected)
     * @param postId The post that was paid for
     * @param amount USDC amount received (in token decimals, e.g., 50000 = $0.05)
     * @notice x402 has already transferred USDC to this contract
     */
    function recordPayment(string calldata postId, uint256 amount)
        external
        onlyOwner
        whenNotPaused
    {
        address creator = postCreators[postId];
        if (creator == address(0)) revert InvalidPostId();

        // Update earnings tracking
        creatorEarnings[creator] += amount;
        postEarnings[postId] += amount;

        emit PaymentReceived(postId, creator, amount, block.timestamp);
    }

    // ============ Withdrawal (Gas Sponsored) ============

    /**
     * @dev Creator withdraws available earnings with 1% platform fee
     * @notice Gas is sponsored by Coinbase Paymaster
     */
    function withdraw() external whenNotPaused nonReentrant {
        uint256 totalEarnings = creatorEarnings[msg.sender];
        uint256 alreadyWithdrawn = creatorWithdrawn[msg.sender];
        uint256 availableEarnings = totalEarnings - alreadyWithdrawn;

        if (availableEarnings == 0) revert InsufficientEarnings();

        // Calculate platform fee (1% = 100 basis points)
        uint256 platformFee = (availableEarnings * platformFeePercentage) / 10000;
        uint256 netAmount = availableEarnings - platformFee;

        // Update withdrawn amount before transfers (CEI pattern)
        creatorWithdrawn[msg.sender] = totalEarnings;

        // Transfer platform fee
        if (platformFee > 0) {
            bool feeSuccess = usdcToken.transfer(platformWallet, platformFee);
            if (!feeSuccess) revert TransferFailed();
        }

        // Transfer net amount to creator
        bool success = usdcToken.transfer(msg.sender, netAmount);
        if (!success) revert TransferFailed();

        emit WithdrawalMade(
            msg.sender,
            availableEarnings,
            platformFee,
            netAmount,
            block.timestamp
        );
    }

    // ============ View Functions ============

    /**
     * @dev Get creator's withdrawal info
     * @param creator Creator address
     * @return total Total earnings
     * @return withdrawn Total withdrawn
     * @return available Available to withdraw
     */
    function getCreatorStats(address creator)
        external
        view
        returns (
            uint256 total,
            uint256 withdrawn,
            uint256 available
        )
    {
        total = creatorEarnings[creator];
        withdrawn = creatorWithdrawn[creator];
        available = total - withdrawn;
    }

    /**
     * @dev Get post earnings
     * @param postId Post identifier
     * @return Total earnings for this post
     */
    function getPostEarnings(string calldata postId)
        external
        view
        returns (uint256)
    {
        return postEarnings[postId];
    }

    /**
     * @dev Check if post is registered
     * @param postId Post identifier
     * @return bool Whether post is registered
     */
    function isPostRegistered(string calldata postId)
        external
        view
        returns (bool)
    {
        return postCreators[postId] != address(0);
    }

    /**
     * @dev Get creator for a post
     * @param postId Post identifier
     * @return Creator address
     */
    function getPostCreator(string calldata postId)
        external
        view
        returns (address)
    {
        return postCreators[postId];
    }

    // ============ Admin Functions ============

    /**
     * @dev Update platform fee percentage
     * @param newFeePercentage New fee in basis points (100 = 1%)
     */
    function updatePlatformFee(uint256 newFeePercentage) external onlyOwner {
        if (newFeePercentage > 1000) revert InvalidFeePercentage(); // Max 10%
        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = newFeePercentage;
        emit PlatformFeeUpdated(oldFee, newFeePercentage);
    }

    /**
     * @dev Update platform wallet address
     * @param newPlatformWallet New platform wallet
     */
    function updatePlatformWallet(address newPlatformWallet) external onlyOwner {
        if (newPlatformWallet == address(0)) revert InvalidAddress();
        address oldWallet = platformWallet;
        platformWallet = newPlatformWallet;
        emit PlatformWalletUpdated(oldWallet, newPlatformWallet);
    }

    /**
     * @dev Pause the contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw USDC (only when paused, only owner)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner whenPaused {
        bool success = usdcToken.transfer(owner(), amount);
        if (!success) revert TransferFailed();
    }
}
