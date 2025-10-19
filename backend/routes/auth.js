const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// ✅ SECURITY: Rate limit auth endpoints
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 50, // 5 attempts per IP
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/nonce
 * @desc    Get nonce for wallet signature
 * @access  Public
 */
router.post("/nonce", authLimiter, authController.getNonce);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify signature and login/register
 * @access  Public
 */
router.post("/verify", authLimiter, authController.verifyAndLogin);

router.post("/refresh", authLimiter, authController.refreshAccessToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", authenticate, authController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", authenticate, authController.logout);

module.exports = router;
