// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title CoursePaymentEscrow
 * @dev Secure escrow system for course payments with time-locked releases.
 * SECURITY: Only operator can release/refund. No arbitrary withdrawals allowed.
 * Added public student claimRefund after extended window for trust minimization.
 */
contract CoursePaymentEscrow is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public immutable paymentToken;
    address public immutable platformWallet;
    address public immutable revenueWallet;

    uint256 public platformFeePercentage; // Basis points (e.g., 2000 = 20%)
    uint256 public revenueSplitPercentage; // Basis points of platform fee
    uint256 public minEscrowPeriodDays;
    uint256 public refundGracePeriodDays; // Additional days after releaseDate for student claimRefund if unreleased

    uint256 public totalLockedFunds;
    uint256 public totalReleasedFunds;

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

    mapping(bytes32 => Escrow) public escrows;
    mapping(address => mapping(bytes32 => bytes32)) public studentCourseEscrow;
    mapping(address => bytes32[]) public instructorEscrows;
    mapping(address => bytes32[]) public studentEscrows;

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
        address indexed instructor,
        uint256 instructorAmount,
        uint256 platformAmount,
        uint256 revenueAmount
    );
    event EscrowRefunded(
        bytes32 indexed escrowId,
        address indexed student,
        uint256 amount
    );
    event FeeUpdated(uint256 newFee);
    event RevenueSplitUpdated(uint256 newPercentage);
    event MinEscrowPeriodUpdated(uint256 newMinDays);
    event RefundGracePeriodUpdated(uint256 newGraceDays);

    // Custom Errors
    error InvalidAddress();
    error InvalidAmount();
    error InvalidFeePercentage();
    error InvalidEscrowPeriod();
    error EscrowNotFound();
    error EscrowAlreadyReleased();
    error EscrowAlreadyRefunded();
    error EscrowNotReleasable();
    error EscrowAlreadyExists();
    error Unauthorized();
    error RefundWindowNotOpen();

    constructor(
        address _paymentToken,
        address _platformWallet,
        address _revenueWallet,
        uint256 _platformFeePercentage,
        uint256 _revenueSplitPercentage,
        uint256 _minEscrowPeriodDays,
        uint256 _refundGracePeriodDays
    ) {
        if (_paymentToken == address(0) || _platformWallet == address(0) || _revenueWallet == address(0))
            revert InvalidAddress();
        if (_platformFeePercentage > 10000 || _revenueSplitPercentage > 10000)
            revert InvalidFeePercentage();

        paymentToken = IERC20(_paymentToken);
        platformWallet = _platformWallet;
        revenueWallet = _revenueWallet;
        platformFeePercentage = _platformFeePercentage;
        revenueSplitPercentage = _revenueSplitPercentage;
        minEscrowPeriodDays = _minEscrowPeriodDays;
        refundGracePeriodDays = _refundGracePeriodDays;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Create escrow by pulling tokens from student
     * SAFE: Student must approve first, backend calls this
     */
    function createEscrowFromApproval(
        address student,
        address instructor,
        uint256 amount,
        bytes32 courseId,
        uint256 escrowPeriodDays,
        uint256 customPlatformFee
    ) external nonReentrant whenNotPaused onlyRole(OPERATOR_ROLE) returns (bytes32) {
        if (student == address(0) || instructor == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (escrowPeriodDays < minEscrowPeriodDays) revert InvalidEscrowPeriod();
        if (customPlatformFee > 10000) revert InvalidFeePercentage();

        // Check for existing active escrow
        bytes32 existingEscrowId = studentCourseEscrow[student][courseId];
        if (existingEscrowId != bytes32(0)) {
            if (!escrows[existingEscrowId].isReleased && !escrows[existingEscrowId].isRefunded) revert EscrowAlreadyExists();
        }

        // Generate unique escrow ID
        bytes32 escrowId = keccak256(
            abi.encodePacked(student, instructor, courseId, block.timestamp, amount)
        );

        // Create escrow storage reference and populate fields inline to minimize stack usage
        Escrow storage newEscrow = escrows[escrowId];
        newEscrow.student = student;
        newEscrow.instructor = instructor;
        newEscrow.totalAmount = amount;
        newEscrow.createdAt = block.timestamp;
        newEscrow.courseId = courseId;
        newEscrow.isReleased = false;
        newEscrow.isRefunded = false;

        // Compute and assign fees/release date inline to reduce local variables
        uint256 platformFee = (amount * (customPlatformFee > 0 ? customPlatformFee : platformFeePercentage)) / 10000;
        newEscrow.platformFee = platformFee;
        newEscrow.instructorFee = amount - platformFee;
        newEscrow.revenueSplitAmount = (platformFee * revenueSplitPercentage) / 10000;
        newEscrow.releaseDate = block.timestamp + (escrowPeriodDays * 1 days);

        // Track escrows
        studentCourseEscrow[student][courseId] = escrowId;
        studentEscrows[student].push(escrowId);
        instructorEscrows[instructor].push(escrowId);
        totalLockedFunds += amount;

        // Pull tokens from student
        paymentToken.safeTransferFrom(student, address(this), amount);

        emit PaymentReceived(escrowId, student, instructor, amount, courseId);

        return escrowId;
    }

    /**
     * @dev Release escrow - ONLY OPERATOR CAN CALL
     * SECURITY: Instructor CANNOT self-release
     */
    function releaseEscrow(bytes32 escrowId)
        external
        nonReentrant
        whenNotPaused
        onlyRole(OPERATOR_ROLE) // ← ONLY OPERATOR!
    {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.totalAmount == 0) revert EscrowNotFound();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (escrow.isRefunded) revert EscrowAlreadyRefunded();
        if (block.timestamp < escrow.releaseDate) revert EscrowNotReleasable();

        escrow.isReleased = true;
        totalLockedFunds -= escrow.totalAmount;
        totalReleasedFunds += escrow.totalAmount;

        // Transfer to instructor
        paymentToken.safeTransfer(escrow.instructor, escrow.instructorFee);

        // Transfer platform fee
        uint256 netPlatformFee = escrow.platformFee - escrow.revenueSplitAmount;
        paymentToken.safeTransfer(platformWallet, netPlatformFee);

        // Transfer revenue split if any
        if (escrow.revenueSplitAmount > 0) {
            paymentToken.safeTransfer(revenueWallet, escrow.revenueSplitAmount);
        }

        emit EscrowReleased(
            escrowId,
            escrow.instructor,
            escrow.instructorFee,
            netPlatformFee,
            escrow.revenueSplitAmount
        );
    }

    /**
     * @dev Batch release - ONLY OPERATOR
     */
    function batchReleaseEscrows(bytes32[] calldata escrowIds)
        external
        nonReentrant
        whenNotPaused
        onlyRole(OPERATOR_ROLE)
    {
        for (uint256 i = 0; i < escrowIds.length; i++) {
            bytes32 escrowId = escrowIds[i];
            Escrow storage escrow = escrows[escrowId];
            if (escrow.totalAmount == 0 ||
                escrow.isReleased ||
                escrow.isRefunded ||
                block.timestamp < escrow.releaseDate) {
                continue;
            }
            escrow.isReleased = true;
            totalLockedFunds -= escrow.totalAmount;
            totalReleasedFunds += escrow.totalAmount;
            paymentToken.safeTransfer(escrow.instructor, escrow.instructorFee);

            uint256 netPlatformFee = escrow.platformFee - escrow.revenueSplitAmount;
            paymentToken.safeTransfer(platformWallet, netPlatformFee);

            if (escrow.revenueSplitAmount > 0) {
                paymentToken.safeTransfer(revenueWallet, escrow.revenueSplitAmount);
            }
            emit EscrowReleased(
                escrowId,
                escrow.instructor,
                escrow.instructorFee,
                netPlatformFee,
                escrow.revenueSplitAmount
            );
        }
    }

    /**
     * @dev Operator refund - ONLY OPERATOR, before releaseDate
     */
    function refundEscrow(bytes32 escrowId)
        external
        nonReentrant
        whenNotPaused
        onlyRole(OPERATOR_ROLE) // ← ONLY OPERATOR!
    {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.totalAmount == 0) revert EscrowNotFound();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (escrow.isRefunded) revert EscrowAlreadyRefunded();
        if (block.timestamp >= escrow.releaseDate) revert EscrowNotReleasable();

        escrow.isRefunded = true;
        totalLockedFunds -= escrow.totalAmount;
        paymentToken.safeTransfer(escrow.student, escrow.totalAmount);
        emit EscrowRefunded(escrowId, escrow.student, escrow.totalAmount);
    }

    /**
     * @dev Public student claim refund - After releaseDate + refundGracePeriodDays, if not released
     * Callable only by the student, for trust minimization if operator fails to act.
     */
    function claimRefund(bytes32 escrowId)
        external
        nonReentrant
        whenNotPaused
    {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.totalAmount == 0) revert EscrowNotFound();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (escrow.isRefunded) revert EscrowAlreadyRefunded();
        if (msg.sender != escrow.student) revert Unauthorized();

        uint256 refundWindowStart = escrow.releaseDate + (refundGracePeriodDays * 1 days);
        if (block.timestamp < refundWindowStart) revert RefundWindowNotOpen();

        escrow.isRefunded = true;
        totalLockedFunds -= escrow.totalAmount;
        paymentToken.safeTransfer(escrow.student, escrow.totalAmount);
        emit EscrowRefunded(escrowId, escrow.student, escrow.totalAmount);
    }

    /**
     * @dev Get escrow details
     */
    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    /**
     * @dev Get student escrows with pagination
     */
    function getStudentEscrows(address student, uint256 offset, uint256 limit)
        external
        view
        returns (bytes32[] memory)
    {
        bytes32[] storage ids = studentEscrows[student];
        uint256 total = ids.length;
        if (offset >= total) return new bytes32[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = ids[i];
        }
        return result;
    }

    /**
     * @dev Get instructor escrows with pagination
     */
    function getInstructorEscrows(address instructor, uint256 offset, uint256 limit)
        external
        view
        returns (bytes32[] memory)
    {
        bytes32[] storage ids = instructorEscrows[instructor];
        uint256 total = ids.length;
        if (offset >= total) return new bytes32[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = ids[i];
        }
        return result;
    }

    /**
     * @dev Update platform fee (admin only)
     */
    function updatePlatformFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFee > 10000) revert InvalidFeePercentage();
        platformFeePercentage = newFee;
        emit FeeUpdated(newFee);
    }

    /**
     * @dev Update revenue split (admin only)
     */
    function updateRevenueSplit(uint256 newPercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newPercentage > 10000) revert InvalidFeePercentage();
        revenueSplitPercentage = newPercentage;
        emit RevenueSplitUpdated(newPercentage);
    }

    /**
     * @dev Update min escrow period (admin only)
     */
    function updateMinEscrowPeriod(uint256 newMinDays) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // if (newMinDays == 0) revert InvalidEscrowPeriod();
        minEscrowPeriodDays = newMinDays;
        emit MinEscrowPeriodUpdated(newMinDays);
    }

    /**
     * @dev Update refund grace period (admin only)
     */
    function updateRefundGracePeriod(uint256 newGraceDays) external onlyRole(DEFAULT_ADMIN_ROLE) {
        refundGracePeriodDays = newGraceDays;
        emit RefundGracePeriodUpdated(newGraceDays);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Renounce admin role (for decentralization)
     */
    function renounceAdmin() external onlyRole(DEFAULT_ADMIN_ROLE) {
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Renounce operator role
     */
    function renounceOperator() external onlyRole(OPERATOR_ROLE) {
        renounceRole(OPERATOR_ROLE, msg.sender);
    }

    /**
     * @dev Renounce pauser role
     */
    function renouncePauser() external onlyRole(PAUSER_ROLE) {
        renounceRole(PAUSER_ROLE, msg.sender);
    }

    // ❌ REMOVED emergencyWithdraw - NO ARBITRARY WITHDRAWALS!
    // Funds can ONLY leave through releaseEscrow, refundEscrow, or claimRefund
}