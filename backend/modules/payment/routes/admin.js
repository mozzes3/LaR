const express = require("express");
const router = express.Router();
const adminPaymentController = require("../controllers/adminController"); // ✅ Keep this
const { authenticate, isAdmin } = require("../../../middleware/auth");
const {
  writeLimiter,
  adminLimiter,
} = require("../../../middleware/rateLimits");

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

/**
 * PAYMENT TOKEN MANAGEMENT
 */
router.get("/tokens", adminPaymentController.getPaymentTokensAdmin);
router.post("/tokens", writeLimiter, adminPaymentController.createPaymentToken);
router.put(
  "/tokens/:tokenId",
  writeLimiter,
  adminPaymentController.updatePaymentToken
);
router.delete(
  "/tokens/:tokenId",
  writeLimiter,
  adminPaymentController.deletePaymentToken
);

/**
 * PLATFORM SETTINGS
 */
router.get("/settings", adminPaymentController.getPlatformSettings);
router.put(
  "/settings",
  writeLimiter,
  adminPaymentController.updatePlatformSettings
);

/**
 * INSTRUCTOR FEE SETTINGS
 */
router.get(
  "/instructor-fees",
  adminPaymentController.getAllInstructorFeeSettings
);
router.get(
  "/instructor-fees/:instructorId",
  adminPaymentController.getInstructorFeeSettings
);
router.put(
  "/instructor-fees/:instructorId",
  writeLimiter,
  adminPaymentController.updateInstructorFeeSettings
);

/**
 * ESCROW MANAGEMENT (NEW)
 */
router.get("/escrows", adminLimiter, adminPaymentController.getAllEscrows);
router.post(
  "/escrows/:escrowId/release",
  adminLimiter,
  adminPaymentController.manualReleaseEscrow
);
router.post(
  "/escrows/:escrowId/refund",
  adminLimiter,
  adminPaymentController.manualRefundEscrow
);

/**
 * COURSE ACCESS MANAGEMENT (NEW)
 */
router.post(
  "/users/:userId/courses/:courseId/grant",
  adminLimiter,
  adminPaymentController.grantFreeCourseAccess
);
router.delete(
  "/users/:userId/courses/:courseId/access",
  adminLimiter,
  adminPaymentController.removeCourseAccess
);
router.get(
  "/users/:userId/purchases",
  adminLimiter,
  adminPaymentController.getUserPurchases
);

/**
 * AUDIT LOGS (NEW)
 */
router.get("/audit-logs", adminLimiter, adminPaymentController.getAuditLogs);

module.exports = router;
