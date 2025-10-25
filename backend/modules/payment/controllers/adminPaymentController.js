const Purchase = require("../models/Purchase");
const Course = require("../../../models/Course");
const User = require("../../../models/User");
const { getPaymentService } = require("../services/blockchainService");
const AdminAuditLog = require("../models/AdminAuditLog");

/**
 * Get all escrows with filters
 */
exports.getAllEscrows = async (req, res) => {
  try {
    const { status, blockchain, page = 1, limit = 50 } = req.query;

    const query = {};

    if (status) {
      query.escrowStatus = status;
    }

    if (blockchain) {
      query.blockchain = blockchain;
    }

    const escrows = await Purchase.find(query)
      .populate("user", "name email username")
      .populate("course", "title slug")
      .populate("paymentToken", "name symbol decimals")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Purchase.countDocuments(query);

    // Calculate refund eligibility for each
    const escrowsWithDetails = escrows.map((escrow) => {
      const now = new Date();
      const releaseDate = new Date(escrow.escrowReleaseDate);
      const canRelease = now >= releaseDate && escrow.escrowStatus === "locked";
      const canRefund = now < releaseDate && escrow.escrowStatus === "locked";

      return {
        ...escrow,
        canRelease,
        canRefund,
        daysUntilRelease: Math.max(
          0,
          Math.ceil((releaseDate - now) / (1000 * 60 * 60 * 24))
        ),
      };
    });

    res.json({
      success: true,
      escrows: escrowsWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all escrows error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch escrows" });
  }
};

/**
 * Manually release escrow (admin override)
 */
exports.manualReleaseEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    console.log("🔓 Admin manual release:", { escrowId, adminId, reason });

    // Find purchase
    const purchase = await Purchase.findOne({ escrowId })
      .populate("paymentToken")
      .populate("user", "name email")
      .populate("course", "title");

    if (!purchase) {
      return res
        .status(404)
        .json({ success: false, error: "Escrow not found" });
    }

    if (purchase.escrowStatus === "released") {
      return res
        .status(400)
        .json({ success: false, error: "Already released" });
    }

    // Initialize payment service
    const paymentService = getPaymentService();
    await paymentService.initialize(purchase.paymentToken);

    // Release on blockchain
    const result = await paymentService.releaseEscrow({
      escrowId: purchase.escrowId,
    });

    // Update database
    purchase.escrowStatus = "released";
    purchase.escrowReleasedAt = new Date();
    purchase.escrowReleaseTransactionHash = result.transactionHash;
    await purchase.save();

    // Log admin action
    await AdminAuditLog.create({
      admin: adminId,
      action: "manual_escrow_release",
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

    console.log("✅ Manual release successful");

    res.json({
      success: true,
      message: "Escrow released successfully",
      transactionHash: result.transactionHash,
    });
  } catch (error) {
    console.error("Manual release error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Manually refund escrow (admin override)
 */
exports.manualRefundEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    console.log("💸 Admin manual refund:", { escrowId, adminId, reason });

    // Find purchase
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

    // Initialize payment service
    const paymentService = getPaymentService();
    await paymentService.initialize(purchase.paymentToken);

    // Refund on blockchain
    const result = await paymentService.refundEscrow({
      escrowId: purchase.escrowId,
    });

    // Update database
    purchase.status = "refunded";
    purchase.escrowStatus = "refunded";
    purchase.refundedAt = new Date();
    purchase.refundTransactionHash = result.transactionHash;
    await purchase.save();

    // Log admin action
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
 * Grant free course access to user
 */
exports.grantFreeCourseAccess = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    console.log("🎁 Admin granting free access:", {
      userId,
      courseId,
      adminId,
      reason,
    });

    // Validate user and course
    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    // Check if already purchased
    const existing = await Purchase.findOne({
      user: userId,
      course: courseId,
      status: { $in: ["active", "completed"] },
    });

    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: "User already has access" });
    }

    // Create free purchase record
    const purchase = await Purchase.create({
      user: userId,
      course: courseId,
      amountInUSD: 0,
      amountInToken: "0",
      transactionHash: "admin_granted",
      blockchain: "admin",
      fromAddress: "0x0000000000000000000000000000000000000000",
      toAddress: course.instructor,
      platformAmount: "0",
      instructorAmount: "0",
      revenueSplitAmount: "0",
      platformFeePercentage: 0,
      instructorFeePercentage: 0,
      escrowStatus: "released",
      status: "active",
      refundEligible: false,
    });

    // Log admin action
    await AdminAuditLog.create({
      admin: adminId,
      action: "grant_free_course_access",
      targetType: "Purchase",
      targetId: purchase._id,
      details: {
        userId,
        courseId,
        userName: user.name,
        userEmail: user.email,
        courseTitle: course.title,
        reason,
      },
      ipAddress: req.ip,
    });

    console.log("✅ Free access granted");

    res.json({
      success: true,
      message: "Free course access granted",
      purchase: {
        _id: purchase._id,
        user: user.name,
        course: course.title,
      },
    });
  } catch (error) {
    console.error("Grant free access error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Remove course access from user
 */
exports.removeCourseAccess = async (req, res) => {
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

    // Find purchase
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

    // Update purchase to revoked
    purchase.status = "revoked";
    purchase.revokedAt = new Date();
    purchase.revokedBy = adminId;
    purchase.revokeReason = reason;
    await purchase.save();

    // Log admin action
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
 * Get user's purchases (for admin view)
 */
exports.getUserPurchases = async (req, res) => {
  try {
    const { userId } = req.params;

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
 * Get audit logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, admin } = req.query;

    const query = {};
    if (action) query.action = action;
    if (admin) query.admin = admin;

    const logs = await AdminAuditLog.find(query)
      .populate("admin", "name email username")
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
