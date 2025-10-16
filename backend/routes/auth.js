const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

/**
 * @route   POST /api/auth/nonce
 * @desc    Get nonce for wallet signature
 * @access  Public
 */
router.post("/nonce", authController.getNonce);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify signature and login/register
 * @access  Public
 */
router.post("/verify", authController.verifyAndLogin);

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
