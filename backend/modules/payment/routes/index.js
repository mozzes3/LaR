const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../../../middleware/auth");
const {
  authLimiter,
  criticalLimiter,
  readLimiter,
} = require("../../../middleware/rateLimits");

console.log("readLimiter:", readLimiter);
console.log("authLimiter:", authLimiter);
console.log("criticalLimiter:", criticalLimiter);

console.log("Payment Controller:", paymentController);
console.log(
  "getPaymentTokens exists?",
  typeof paymentController.getPaymentTokens
);

/**
 * PUBLIC ROUTES
 */

// Get available payment tokens
// Rate limit: 60 requests per minute (general read)
router.get("/tokens", readLimiter, paymentController.getPaymentTokens);

// Get token price (called frequently for price updates)
// Rate limit: 60 requests per minute
router.get(
  "/tokens/:tokenId/price",
  readLimiter,
  paymentController.getTokenPrice
);

/**
 * AUTHENTICATED ROUTES
 */

// Calculate payment details before purchase
// Rate limit: 20 requests per minute (auth level)
router.post(
  "/calculate",
  protect,
  authLimiter,
  paymentController.calculatePayment
);

// Process purchase (CRITICAL - most secure)
// Rate limit: 5 requests per 5 minutes
router.post(
  "/purchase",
  protect,
  criticalLimiter,
  paymentController.processPurchase
);

// Request refund (CRITICAL - most secure)
// Rate limit: 5 requests per 5 minutes
router.post(
  "/refund",
  protect,
  criticalLimiter,
  paymentController.requestRefund
);

module.exports = router;
