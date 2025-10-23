const express = require("express");
const router = express.Router();
const adminPaymentController = require("../controllers/adminController");
const { protect, adminOnly } = require("../../..middleware/auth");
const { writeLimiter } = require("../../..middleware/rateLimits");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

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

module.exports = router;
