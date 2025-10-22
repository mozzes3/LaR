// backend/routes/certificateRoutes.js
const express = require("express");
const router = express.Router();
const {
  publicLimiter,
  authLimiter,
  criticalLimiter,
} = require("../middleware/rateLimits");
const {
  getUserCertificates,
  getCertificate,
  verifyCertificate,
  generateCertificateManual,
  getCertificateImageToken,
  getAllMyCertificates, // ✅ ADD THIS
} = require("../controllers/certificateController");
const { authenticate } = require("../middleware/auth");

// Get user's certificates (protected)
router.get("/my", authLimiter, authenticate, getUserCertificates);

// ✅ MUST BE BEFORE /:id
router.get("/all", authLimiter, authenticate, getAllMyCertificates);

// Get certificate image token (protected)
router.get(
  "/:id/image-token",
  authLimiter,
  authenticate,
  getCertificateImageToken
);

// Get single certificate (protected)
router.get("/:id", authLimiter, authenticate, getCertificate);

// Verify certificate by number (PUBLIC - no auth)
router.get("/verify/:certificateNumber", publicLimiter, verifyCertificate);

// Generate certificate manually (protected - for testing)
router.post(
  "/generate",
  criticalLimiter,
  authenticate,
  generateCertificateManual
);

module.exports = router;
