const PaymentToken = require("../models/PaymentToken");
const PlatformSettings = require("../models/PlatformSettings");
const InstructorFeeSettings = require("../models/InstructorFeeSettings");
const AdminAuditLog = require("../models/AdminAuditLog");
const User = require("../../../models/User");

/**
 * Get all payment tokens (admin)
 */
const getPaymentTokensAdmin = async (req, res) => {
  try {
    const tokens = await PaymentToken.find().sort({ displayOrder: 1 });

    res.json({
      success: true,
      tokens,
    });
  } catch (error) {
    console.error("Get payment tokens admin error:", error);
    res.status(500).json({ error: "Failed to get payment tokens" });
  }
};

/**
 * Create payment token
 */
const createPaymentToken = async (req, res) => {
  try {
    const tokenData = req.body;

    // Validate required fields
    const requiredFields = [
      "symbol",
      "name",
      "blockchain",
      "chainId",
      "chainName",
      "rpcUrl",
      "explorerUrl",
      "contractAddress",
      "paymentContractAddress",
      "decimals",
      "priceOracleType",
    ];

    for (const field of requiredFields) {
      if (!tokenData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const token = new PaymentToken(tokenData);
    await token.save();

    console.log("✅ Payment token created:", token.symbol);

    res.json({
      success: true,
      message: "Payment token created successfully",
      token,
    });
  } catch (error) {
    console.error("Create payment token error:", error);
    res.status(500).json({ error: "Failed to create payment token" });
  }
};

/**
 * Update payment token
 */
const updatePaymentToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const updates = req.body;

    const token = await PaymentToken.findByIdAndUpdate(tokenId, updates, {
      new: true,
      runValidators: true,
    });

    if (!token) {
      return res.status(404).json({ error: "Payment token not found" });
    }

    console.log("✅ Payment token updated:", token.symbol);

    res.json({
      success: true,
      message: "Payment token updated successfully",
      token,
    });
  } catch (error) {
    console.error("Update payment token error:", error);
    res.status(500).json({ error: "Failed to update payment token" });
  }
};

/**
 * Delete payment token
 */
const deletePaymentToken = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const token = await PaymentToken.findByIdAndDelete(tokenId);

    if (!token) {
      return res.status(404).json({ error: "Payment token not found" });
    }

    console.log("✅ Payment token deleted:", token.symbol);

    res.json({
      success: true,
      message: "Payment token deleted successfully",
    });
  } catch (error) {
    console.error("Delete payment token error:", error);
    res.status(500).json({ error: "Failed to delete payment token" });
  }
};

/**
 * Get platform settings
 */
const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get platform settings error:", error);
    res.status(500).json({ error: "Failed to get platform settings" });
  }
};

/**
 * Update platform settings
 */
const updatePlatformSettings = async (req, res) => {
  try {
    const updates = req.body;

    const settings = await PlatformSettings.updateSettings(updates);

    console.log("✅ Platform settings updated");

    res.json({
      success: true,
      message: "Platform settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update platform settings error:", error);
    res.status(500).json({ error: "Failed to update platform settings" });
  }
};

/**
 * Get instructor fee settings
 */
const getInstructorFeeSettings = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const settings = await InstructorFeeSettings.findOne({
      instructor: instructorId,
    }).populate("instructor", "username displayName");

    const effectiveFees = await InstructorFeeSettings.getEffectiveFees(
      instructorId
    );

    res.json({
      success: true,
      settings,
      effectiveFees,
    });
  } catch (error) {
    console.error("Get instructor fee settings error:", error);
    res.status(500).json({ error: "Failed to get instructor fee settings" });
  }
};

/**
 * Update instructor fee settings
 */
const updateInstructorFeeSettings = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const updates = req.body;
    const adminId = req.userId;

    // Verify instructor exists
    const instructor = await User.findById(instructorId);
    if (!instructor || !instructor.isInstructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    let settings = await InstructorFeeSettings.findOne({
      instructor: instructorId,
    });

    if (!settings) {
      settings = new InstructorFeeSettings({
        instructor: instructorId,
        ...updates,
        updatedBy: adminId,
      });
    } else {
      Object.assign(settings, updates);
      settings.updatedBy = adminId;
    }

    await settings.save();

    console.log("✅ Instructor fee settings updated for:", instructor.username);

    res.json({
      success: true,
      message: "Instructor fee settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update instructor fee settings error:", error);
    res.status(500).json({
      error: "Failed to update instructor fee settings",
    });
  }
};

/**
 * Get all instructor fee settings
 */
const getAllInstructorFeeSettings = async (req, res) => {
  try {
    const settings = await InstructorFeeSettings.find()
      .populate("instructor", "username displayName email")
      .populate("updatedBy", "username")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get all instructor fee settings error:", error);
    res.status(500).json({ error: "Failed to get instructor fee settings" });
  }
};

/**
 * ============================================
 * ESCROW MANAGEMENT
 * ============================================
 */

/**
 * Get all escrows with filters
 */
const getAllEscrows = async (req, res) => {
  try {
    const { page = 1, limit = 20, escrowStatus, status } = req.query;

    const Purchase = require("../../../models/Purchase");
    const query = {};

    if (escrowStatus) query.escrowStatus = escrowStatus;
    if (status) query.status = status;

    const escrows = await Purchase.find(query)
      .populate("user", "username email walletAddress")
      .populate("course", "title slug thumbnail")
      .populate("paymentToken", "symbol name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Purchase.countDocuments(query);

    res.json({
      success: true,
      escrows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get escrows error:", error);
    res.status(500).json({ error: "Failed to fetch escrows" });
  }
};

/**
 * Manually release escrow
 */
const manualReleaseEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { reason, signature, signerAddress } = req.body;
    const adminId = req.userId;

    console.log("🔓 Admin manual release:", {
      escrowId,
      adminId,
      reason,
      signerAddress,
    });

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Reason is required",
      });
    }

    // ✅ SECURITY: Require wallet signature
    if (!signature || !signerAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet signature required for security",
      });
    }

    // GET ADMIN USER - FIND THIS SECTION AND REPLACE IT
    if (!signature || !signerAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet signature required for security",
      });
    }

    // ← REPLACE FROM HERE
    const User = require("../../../models/User");
    const admin = await User.findById(adminId);

    if (!admin) {
      return res.status(403).json({
        success: false,
        error: "Admin not found",
      });
    }

    // ✅ DEBUG: Log addresses being compared
    console.log("🔍 Signature verification:");
    console.log("   Signer address:", signerAddress);
    console.log("   Admin stored wallet:", admin.walletAddress);
    console.log("   Admin email:", admin.email);

    // ✅ FLEXIBLE: If admin doesn't have wallet stored, update it
    if (!admin.walletAddress) {
      console.log("⚠️ Admin has no stored wallet, updating...");
      admin.walletAddress = signerAddress;
      await admin.save();
    }

    // ✅ SECURITY: Verify signature matches admin's wallet
    if (signerAddress.toLowerCase() !== admin.walletAddress.toLowerCase()) {
      console.error("❌ Wallet mismatch!");
      console.error("   Expected:", admin.walletAddress.toLowerCase());
      console.error("   Got:", signerAddress.toLowerCase());

      return res.status(403).json({
        success: false,
        error: `Signature must be from your registered wallet: ${admin.walletAddress}`,
        details: {
          registeredWallet: admin.walletAddress,
          attemptedWallet: signerAddress,
        },
      });
    }

    // ✅ SECURITY: Verify the signature is valid
    const ethers = require("ethers");
    const message = `Release escrow ${escrowId}\nReason: ${reason}\nTimestamp: ${Date.now()}`;

    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      console.log("🔐 Recovered address from signature:", recoveredAddress);

      if (recoveredAddress.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error("Invalid signature");
      }
    } catch (err) {
      console.error("❌ Signature verification failed:", err.message);
      return res.status(403).json({
        success: false,
        error: "Invalid wallet signature",
      });
    }

    console.log("✅ Signature verified for admin:", admin.email);

    // Find the purchase by escrowId
    const Purchase = require("../models/Purchase");
    const purchase = await Purchase.findOne({ escrowId })
      .populate("user", "name email")
      .populate("course", "title")
      .populate("paymentToken");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Escrow not found",
      });
    }

    // Check if already released
    if (purchase.escrowStatus === "released") {
      return res.status(400).json({
        success: false,
        error: "Escrow already released",
      });
    }

    // Check if already refunded
    if (purchase.escrowStatus === "refunded") {
      return res.status(400).json({
        success: false,
        error: "Cannot release - escrow was refunded",
      });
    }

    // ✅ SECURITY: Check amount threshold (require super admin for large amounts)
    const LARGE_AMOUNT_THRESHOLD = 1000; // $1000 USD
    if (purchase.amountInUSD > LARGE_AMOUNT_THRESHOLD && !admin.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: `Only super admins can release escrows over $${LARGE_AMOUNT_THRESHOLD}`,
      });
    }

    // Get blockchain service
    const PaymentBlockchainService = require("../services/blockchainService");
    const blockchainService = new PaymentBlockchainService(
      purchase.blockchain,
      purchase.paymentToken.chainId
    );

    // Release escrow on blockchain
    console.log(`🔓 Releasing escrow: ${purchase.transactionHash}`);
    const releaseResult = await blockchainService.releaseEscrow(
      purchase.escrowId,
      purchase.paymentToken.contractAddress
    );

    // Update purchase status
    purchase.escrowStatus = "released";
    purchase.escrowReleasedTxHash = releaseResult.transactionHash;
    purchase.escrowReleasedAt = new Date();
    purchase.escrowReleasedBy = adminId;
    purchase.escrowReleaseReason = reason;
    purchase.escrowReleaseSignature = signature; // Store signature
    purchase.status = "completed";
    await purchase.save();

    // Create audit log
    const AdminAuditLog = require("../models/AdminAuditLog");
    await AdminAuditLog.create({
      admin: adminId,
      action: "manual_escrow_release",
      targetType: "Purchase",
      targetId: purchase._id,
      details: {
        escrowId: purchase.escrowId,
        transactionHash: releaseResult.transactionHash,
        userName: purchase.user.name,
        courseTitle: purchase.course.title,
        amount: purchase.amountInUSD,
        reason,
        signerAddress,
        signature, // Log the signature for audit
      },
      ipAddress: req.ip,
    });

    console.log("✅ Escrow released successfully with signature verification");

    res.json({
      success: true,
      message: "Escrow released successfully",
      transactionHash: releaseResult.transactionHash,
    });
  } catch (error) {
    console.error("Manual release error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to release escrow",
    });
  }
};

/**
 * Manually refund escrow
 */
const manualRefundEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    console.log("💸 Admin manual refund:", { escrowId, adminId, reason });

    const Purchase = require("../models/Purchase");
    const AdminAuditLog = require("../models/AdminAuditLog");
    const { getPaymentService } = require("../services/blockchainService");

    const purchase = await Purchase.findOne({ escrowId })
      .populate("paymentToken")
      .populate("user", "name email")
      .populate("course", "title");

    if (!purchase) {
      return res
        .status(404)
        .json({ success: false, error: "Escrow not found" });
    }

    if (purchase.escrowStatus === "refunded") {
      return res
        .status(400)
        .json({ success: false, error: "Already refunded" });
    }

    if (purchase.escrowStatus === "released") {
      return res
        .status(400)
        .json({ success: false, error: "Already released, cannot refund" });
    }

    const paymentService = getPaymentService();
    await paymentService.initialize(purchase.paymentToken);

    const result = await paymentService.refundEscrow({
      escrowId: purchase.escrowId,
    });

    purchase.status = "refunded";
    purchase.escrowStatus = "refunded";
    purchase.refundedAt = new Date();
    purchase.refundTransactionHash = result.transactionHash;
    await purchase.save();

    await AdminAuditLog.create({
      admin: adminId,
      action: "manual_escrow_refund",
      targetType: "Purchase",
      targetId: purchase._id,
      details: {
        escrowId,
        purchaseId: purchase._id,
        userId: purchase.user._id,
        courseId: purchase.course._id,
        transactionHash: result.transactionHash,
        reason,
      },
      ipAddress: req.ip,
    });

    console.log("✅ Manual refund successful");

    res.json({
      success: true,
      message: "Escrow refunded successfully",
      transactionHash: result.transactionHash,
    });
  } catch (error) {
    console.error("Manual refund error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ============================================
 * COURSE ACCESS MANAGEMENT
 * ============================================
 */

/**
 * Grant free course access
 */
const grantFreeCourseAccess = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    console.log("🎁 Admin granting free access:", {
      userId,
      courseId,
      adminId,
      reason,
    });

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Reason is required",
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Validate course exists
    const Course = require("../../../models/Course");
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    // Check if user already has active/completed access
    const Purchase = require("../models/Purchase");
    const existingPurchase = await Purchase.findOne({
      user: userId,
      course: courseId,
      status: { $in: ["active", "completed"] },
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        error: "User already has access to this course",
      });
    }

    // Get first available payment token (for schema requirement)
    const PaymentToken = require("../models/PaymentToken");
    const defaultToken = await PaymentToken.findOne({ isActive: true });

    if (!defaultToken) {
      return res.status(500).json({
        success: false,
        error: "No active payment token found in system",
      });
    }

    // Create purchase record with admin grant flag
    const purchase = await Purchase.create({
      user: userId,
      course: courseId,
      paymentToken: defaultToken._id, // Required by schema
      amountInToken: "0",
      amountInUSD: 0,
      transactionHash: `admin_grant_${Date.now()}`,
      blockchain: defaultToken.blockchain, // Use default token's blockchain
      fromAddress: "0x0000000000000000000000000000000000000000",
      toAddress: "0x0000000000000000000000000000000000000000",
      platformAmount: "0",
      instructorAmount: "0",
      revenueSplitAmount: "0",
      platformFeePercentage: 0,
      instructorFeePercentage: 0,
      escrowStatus: "released", // No escrow for free grants
      escrowReleaseDate: new Date(), // Set to now (already released)
      escrowId: 0,
      escrowCreatedTxHash: `admin_grant_${Date.now()}`,
      refundEligible: false, // Cannot refund free grants
      status: "active",
      grantedByAdmin: adminId, // Track who granted it
      grantReason: reason, // Track why it was granted
    });

    // Create audit log
    await AdminAuditLog.create({
      admin: adminId,
      action: "grant_free_course_access",
      targetModel: "Purchase",
      targetType: "Purchase",
      targetId: purchase._id,
      details: {
        userId,
        userName: user.name,
        courseId,
        courseTitle: course.title,
        reason,
      },
      ipAddress: req.ip,
    });

    console.log("✅ Free course access granted successfully");

    res.json({
      success: true,
      message: "Free course access granted successfully",
      purchase: {
        _id: purchase._id,
        course: course.title,
        user: user.name,
        status: purchase.status,
      },
    });
  } catch (error) {
    console.error("Grant free access error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to grant course access",
    });
  }
};

/**
 * Remove course access
 */
const removeCourseAccess = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    console.log("🚫 Admin removing access:", {
      userId,
      courseId,
      adminId,
      reason,
    });

    const Purchase = require("../models/Purchase");
    const AdminAuditLog = require("../models/AdminAuditLog");

    const purchase = await Purchase.findOne({
      user: userId,
      course: courseId,
      status: { $in: ["active", "completed"] },
    })
      .populate("user", "name email")
      .populate("course", "title");

    if (!purchase) {
      return res
        .status(404)
        .json({ success: false, error: "Access not found" });
    }

    purchase.status = "revoked";
    purchase.revokedAt = new Date();
    purchase.revokedBy = adminId;
    purchase.revokeReason = reason;
    await purchase.save();

    await AdminAuditLog.create({
      admin: adminId,
      action: "remove_course_access",
      targetType: "Purchase",
      targetId: purchase._id,
      details: {
        userId,
        courseId,
        userName: purchase.user.name,
        userEmail: purchase.user.email,
        courseTitle: purchase.course.title,
        reason,
      },
      ipAddress: req.ip,
    });

    console.log("✅ Access removed");

    res.json({
      success: true,
      message: "Course access removed",
    });
  } catch (error) {
    console.error("Remove access error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get user purchases for admin
 */
const getUserPurchases = async (req, res) => {
  try {
    const { userId } = req.params;

    const Purchase = require("../models/Purchase");

    const purchases = await Purchase.find({ user: userId })
      .populate("course", "title slug thumbnail")
      .populate("paymentToken", "name symbol")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error("Get user purchases error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch purchases" });
  }
};

/**
 * ============================================
 * AUDIT LOGS
 * ============================================
 */

/**
 * Get audit logs
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, admin } = req.query;

    const AdminAuditLog = require("../models/AdminAuditLog");

    const query = {};
    if (action) query.action = action;
    if (admin) query.admin = admin;

    const logs = await AdminAuditLog.find(query)
      .populate("admin")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await AdminAuditLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch logs" });
  }
};

module.exports = {
  // Existing exports
  getPaymentTokensAdmin,
  createPaymentToken,
  updatePaymentToken,
  deletePaymentToken,
  getPlatformSettings,
  updatePlatformSettings,
  getAllInstructorFeeSettings,
  getInstructorFeeSettings,
  updateInstructorFeeSettings,

  // NEW - Make sure ALL these are here:
  getAllEscrows,
  manualReleaseEscrow,
  manualRefundEscrow,
  grantFreeCourseAccess,
  removeCourseAccess,
  getUserPurchases,
  getAuditLogs, // ← THIS MUST BE HERE
};
