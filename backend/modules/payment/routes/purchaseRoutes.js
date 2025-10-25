const express = require("express");
const router = express.Router();
const { authenticate } = require("../../../middleware/auth");
const purchaseController = require("../controllers/purchaseController");
const {
  readLimiter,
  criticalLimiter,
} = require("../../../middleware/rateLimiter");

// GET student purchase history (read operation)
router.get(
  "/student/history",
  authenticate,
  readLimiter, // ✅ Using your existing limiter
  purchaseController.getStudentPurchaseHistory
);

// POST request refund (critical operation)
router.post(
  "/:purchaseId/refund",
  authenticate,
  criticalLimiter, // ✅ Using your existing limiter (5 req/5min)
  purchaseController.requestRefund
);

module.exports = router;
