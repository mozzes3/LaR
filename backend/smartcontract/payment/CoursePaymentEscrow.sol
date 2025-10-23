// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CoursePaymentEscrow
 * @dev Military-grade secure escrow system for course payments
 * @notice This contract holds payments in escrow until release conditions are met
 */
contract CoursePaymentEscrow is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // Payment token (USDT, USDC, etc.)
    IERC20 public immutable paymentToken;
    
    // Platform addresses
    address public platformWallet;
    address public revenueSplitWallet;
    
    // Fee percentages (in basis points: 2000 = 20%)
    uint256 public platformFeePercentage;
    uint256 public revenueSplitPercentage; // Percentage of platform fee
    
    // Escrow structure
    struct Escrow {
        address student;
        address instructor;
        uint256 totalAmount;
        uint256 platformFee;
        uint256 instructorFee;
        uint256 revenueSplitAmount;
        uint256 releaseDate;
        bool isReleased;
        bool isRefunded;
        uint256 createdAt;
        bytes32 courseId;
    }
    
    // Mapping: transaction hash => escrow
    mapping(bytes32 => Escrow) public escrows;
    
    // Mapping: student => course => escrow ID
    mapping(address => mapping(bytes32 => bytes32)) public studentCourseEscrow;
    
    // Track total locked funds
    uint256 public totalLockedFunds;
    
    // Events
    event PaymentReceived(
        bytes32 indexed escrowId,
        address indexed student,
        address indexed instructor,
        uint256 amount,
        bytes32 courseId
    );
    
    event EscrowReleased(
        bytes32 indexed escrowId,
        address indexed student,
        address indexed instructor,
        uint256 instructorAmount,
        uint256 platformAmount,
        uint256 revenueSplitAmount
    );
    
    event RefundProcessed(
        bytes32 indexed escrowId,
        address indexed student,
        uint256 amount
    );
    
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event RevenueSplitWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event FeePercentageUpdated(uint256 newPlatformFee, uint256 newRevenueSplit);
    
    // Errors
    error EscrowNotFound();
    error EscrowAlreadyExists();
    error EscrowAlreadyReleased();
    error EscrowAlreadyRefunded();
    error ReleaseTimeNotReached();
    error InvalidAddress();
    error InvalidFeePercentage();
    error InvalidAmount();
    error TransferFailed();
    error Unauthorized();
    
    /**
     * @dev Constructor
     * @param _paymentToken Address of the ERC20 token (USDT, USDC, etc.)
     * @param _platformWallet Address to receive platform fees
     * @param _revenueSplitWallet Address to receive revenue split
     * @param _platformFeePercentage Platform fee in basis points (2000 = 20%)
     * @param _revenueSplitPercentage Revenue split percentage (2000 = 20% of platform fee)
     */
    constructor(
        address _paymentToken,
        address _platformWallet,
        address _revenueSplitWallet,
        uint256 _platformFeePercentage,
        uint256 _revenueSplitPercentage
    ) {
        if (_paymentToken == address(0)) revert InvalidAddress();
        if (_platformWallet == address(0)) revert InvalidAddress();
        if (_revenueSplitWallet == address(0)) revert InvalidAddress();
        if (_platformFeePercentage > 10000) revert InvalidFeePercentage(); // Max 100%
        if (_revenueSplitPercentage > 10000) revert InvalidFeePercentage(); // Max 100%
        
        paymentToken = IERC20(_paymentToken);
        platformWallet = _platformWallet;
        revenueSplitWallet = _revenueSplitWallet;
        platformFeePercentage = _platformFeePercentage;
        revenueSplitPercentage = _revenueSplitPercentage;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Create escrow payment
     * @param student Address of the student
     * @param instructor Address of the instructor
     * @param amount Total payment amount
     * @param courseId Unique course identifier
     * @param escrowPeriodDays Number of days for escrow
     * @param customPlatformFee Custom platform fee percentage (0 to use default)
     * @return escrowId Unique escrow identifier
     */
    function createEscrowPayment(
        address student,
        address instructor,
        uint256 amount,
        bytes32 courseId,
        uint256 escrowPeriodDays,
        uint256 customPlatformFee
    ) external nonReentrant whenNotPaused onlyRole(OPERATOR_ROLE) returns (bytes32) {
        if (student == address(0) || instructor == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (escrowPeriodDays == 0 || escrowPeriodDays > 365) revert InvalidAmount();
        
        // Generate unique escrow ID
        bytes32 escrowId = keccak256(
            abi.encodePacked(student, courseId, block.timestamp, block.number)
        );
        
        // Check for duplicate escrow
        if (escrows[escrowId].totalAmount != 0) revert EscrowAlreadyExists();
        if (studentCourseEscrow[student][courseId] != bytes32(0)) revert EscrowAlreadyExists();
        
        // Calculate fees
        uint256 effectivePlatformFee = customPlatformFee > 0 ? customPlatformFee : platformFeePercentage;
        uint256 platformFee = (amount * effectivePlatformFee) / 10000;
        uint256 instructorFee = amount - platformFee;
        uint256 revenueSplit = (platformFee * revenueSplitPercentage) / 10000;
        
        // Calculate release date
        uint256 releaseDate = block.timestamp + (escrowPeriodDays * 1 days);
        
        // Create escrow
        escrows[escrowId] = Escrow({
            student: student,
            instructor: instructor,
            totalAmount: amount,
            platformFee: platformFee,
            instructorFee: instructorFee,
            revenueSplitAmount: revenueSplit,
            releaseDate: releaseDate,
            isReleased: false,
            isRefunded: false,
            createdAt: block.timestamp,
            courseId: courseId
        });
        
        // Map student + course to escrow ID
        studentCourseEscrow[student][courseId] = escrowId;
        
        // Update total locked funds
        totalLockedFunds += amount;
        
        // Transfer tokens from student to contract
        paymentToken.safeTransferFrom(student, address(this), amount);
        
        emit PaymentReceived(escrowId, student, instructor, amount, courseId);
        
        return escrowId;
    }
    
    /**
     * @dev Release escrow to instructor and platform
     * @param escrowId Unique escrow identifier
     */
    function releaseEscrow(bytes32 escrowId) external nonReentrant whenNotPaused onlyRole(OPERATOR_ROLE) {
        Escrow storage escrow = escrows[escrowId];
        
        if (escrow.totalAmount == 0) revert EscrowNotFound();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (escrow.isRefunded) revert EscrowAlreadyRefunded();
        if (block.timestamp < escrow.releaseDate) revert ReleaseTimeNotReached();
        
        // Mark as released
        escrow.isReleased = true;
        
        // Update total locked funds
        totalLockedFunds -= escrow.totalAmount;
        
        // Calculate split amounts
        uint256 platformNetFee = escrow.platformFee - escrow.revenueSplitAmount;
        
        // Transfer funds
        paymentToken.safeTransfer(escrow.instructor, escrow.instructorFee);
        paymentToken.safeTransfer(platformWallet, platformNetFee);
        paymentToken.safeTransfer(revenueSplitWallet, escrow.revenueSplitAmount);
        
        emit EscrowReleased(
            escrowId,
            escrow.student,
            escrow.instructor,
            escrow.instructorFee,
            platformNetFee,
            escrow.revenueSplitAmount
        );
    }
    
    /**
     * @dev Process refund to student
     * @param escrowId Unique escrow identifier
     */
    function processRefund(bytes32 escrowId) external nonReentrant whenNotPaused onlyRole(OPERATOR_ROLE) {
        Escrow storage escrow = escrows[escrowId];
        
        if (escrow.totalAmount == 0) revert EscrowNotFound();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (escrow.isRefunded) revert EscrowAlreadyRefunded();
        
        // Mark as refunded
        escrow.isRefunded = true;
        
        // Update total locked funds
        totalLockedFunds -= escrow.totalAmount;
        
        // Refund full amount to student
        paymentToken.safeTransfer(escrow.student, escrow.totalAmount);
        
        emit RefundProcessed(escrowId, escrow.student, escrow.totalAmount);
    }
    
    /**
     * @dev Batch release escrows
     * @param escrowIds Array of escrow IDs to release
     */
    function batchReleaseEscrows(bytes32[] calldata escrowIds) external nonReentrant whenNotPaused onlyRole(OPERATOR_ROLE) {
        for (uint256 i = 0; i < escrowIds.length; i++) {
            bytes32 escrowId = escrowIds[i];
            Escrow storage escrow = escrows[escrowId];
            
            if (escrow.totalAmount == 0) continue;
            if (escrow.isReleased || escrow.isRefunded) continue;
            if (block.timestamp < escrow.releaseDate) continue;
            
            // Mark as released
            escrow.isReleased = true;
            totalLockedFunds -= escrow.totalAmount;
            
            // Calculate split amounts
            uint256 platformNetFee = escrow.platformFee - escrow.revenueSplitAmount;
            
            // Transfer funds
            paymentToken.safeTransfer(escrow.instructor, escrow.instructorFee);
            paymentToken.safeTransfer(platformWallet, platformNetFee);
            paymentToken.safeTransfer(revenueSplitWallet, escrow.revenueSplitAmount);
            
            emit EscrowReleased(
                escrowId,
                escrow.student,
                escrow.instructor,
                escrow.instructorFee,
                platformNetFee,
                escrow.revenueSplitAmount
            );
        }
    }
    
    /**
     * @dev Update platform wallet
     * @param newWallet New platform wallet address
     */
    function updatePlatformWallet(address newWallet) external onlyRole(ADMIN_ROLE) {
        if (newWallet == address(0)) revert InvalidAddress();
        address oldWallet = platformWallet;
        platformWallet = newWallet;
        emit PlatformWalletUpdated(oldWallet, newWallet);
    }
    
    /**
     * @dev Update revenue split wallet
     * @param newWallet New revenue split wallet address
     */
    function updateRevenueSplitWallet(address newWallet) external onlyRole(ADMIN_ROLE) {
        if (newWallet == address(0)) revert InvalidAddress();
        address oldWallet = revenueSplitWallet;
        revenueSplitWallet = newWallet;
        emit RevenueSplitWalletUpdated(oldWallet, newWallet);
    }
    
    /**
     * @dev Update fee percentages
     * @param newPlatformFee New platform fee percentage
     * @param newRevenueSplit New revenue split percentage
     */
    function updateFeePercentages(uint256 newPlatformFee, uint256 newRevenueSplit) external onlyRole(ADMIN_ROLE) {
        if (newPlatformFee > 10000) revert InvalidFeePercentage();
        if (newRevenueSplit > 10000) revert InvalidFeePercentage();
        
        platformFeePercentage = newPlatformFee;
        revenueSplitPercentage = newRevenueSplit;
        
        emit FeePercentageUpdated(newPlatformFee, newRevenueSplit);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Get escrow details
     * @param escrowId Escrow identifier
     */
    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
    
    /**
     * @dev Check if escrow can be released
     * @param escrowId Escrow identifier
     */
    function canReleaseEscrow(bytes32 escrowId) external view returns (bool) {
        Escrow memory escrow = escrows[escrowId];
        return !escrow.isReleased && !escrow.isRefunded && block.timestamp >= escrow.releaseDate;
    }
}
