const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  authEndpointLimiter,
  authLimiter,
} = require("../middleware/rateLimits");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// ✅ SECURITY: Rate limit auth endpoints

/**
 * @route   POST /api/auth/nonce
 * @desc    Get nonce for wallet signature
 * @access  Public
 */
router.post("/nonce", authEndpointLimiter, authController.getNonce);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify signature and login/register
 * @access  Public
 */
router.post("/verify", authEndpointLimiter, authController.verifyAndLogin);

router.post("/refresh", authEndpointLimiter, authController.refreshAccessToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", authLimiter, authenticate, authController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", authenticate, authLimiter, authController.logout);

module.exports = router;
