const express = require("express");
const router = express.Router();
const adminPaymentController = require("../controllers/adminController"); // ✅ Keep this
const { authenticate } = require("../../../middleware/auth");
const { isPaymentAdmin } = require("../../../middleware/paymentAdmin");
const {
  writeLimiter,
  adminLimiter,
  paymentAdminLimiter,
  paymentAdminReadLimiter,
  paymentAdminDeleteLimiter,
} = require("../../../middleware/rateLimits");
const {
  validateTokenCreation,
  validateTokenUpdate,
  validateSettingsUpdate,
} = require("../../../middleware/paymentAdminValidation");
const { auditLog } = require("../../../middleware/paymentAdminAudit");

// All routes require admin authentication
router.use(authenticate);
router.use(isPaymentAdmin);
router.use(auditLog);
/**
 * PAYMENT TOKEN MANAGEMENT
 */
router.get(
  "/tokens",
  paymentAdminReadLimiter,
  adminPaymentController.getPaymentTokensAdmin
);
router.post(
  "/tokens",
  paymentAdminLimiter,
  validateTokenCreation,
  adminPaymentController.createPaymentToken
);
router.put(
  "/tokens/:tokenId",
  paymentAdminLimiter,
  adminPaymentController.updatePaymentToken
);
router.delete(
  "/tokens/:tokenId",
  paymentAdminDeleteLimiter, // 3 per HOUR
  validateTokenUpdate,
  adminPaymentController.deletePaymentToken
);

/**
 * PLATFORM SETTINGS
 */
router.get(
  "/settings",
  paymentAdminReadLimiter,
  adminPaymentController.getPlatformSettings
);
router.put(
  "/settings",
  paymentAdminReadLimiter, // 20/min
  adminPaymentController.updatePlatformSettings
);

/**
 * INSTRUCTOR FEE SETTINGS
 */
router.get(
  "/instructor-fees",
  paymentAdminReadLimiter,
  adminPaymentController.getAllInstructorFeeSettings
);
router.get(
  "/instructor-fees/:instructorId",
  paymentAdminReadLimiter,
  adminPaymentController.getInstructorFeeSettings
);
router.put(
  "/instructor-fees/:instructorId",
  paymentAdminLimiter,
  adminPaymentController.updateInstructorFeeSettings
);

/**
 * ESCROW MANAGEMENT (NEW)
 */
router.get(
  "/escrows",
  paymentAdminLimiter,
  adminPaymentController.getAllEscrows
);
router.post(
  "/escrows/:escrowId/release",
  paymentAdminLimiter,
  adminPaymentController.manualReleaseEscrow
);
router.post(
  "/escrows/:escrowId/refund",
  paymentAdminLimiter,
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
