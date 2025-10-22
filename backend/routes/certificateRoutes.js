// backend/routes/certificateRoutes.js
const express = require("express");
const router = express.Router();
const {
  publicLimiter,
  authLimiter,
  criticalLimiter,
} = require("../middleware/rateLimits");
const certificateController = require("../controllers/certificateController");
const { authenticate } = require("../middleware/auth");

// Get user's certificates (protected)
router.get(
  "/my",
  authLimiter,
  authenticate,
  certificateController.getUserCertificates
);

// ✅ ADD THIS - MUST BE BEFORE /:id
router.get(
  "/all",
  authLimiter,
  authenticate,
  certificateController.getAllMyCertificates
);

// Get certificate image token (protected)
router.get(
  "/:id/image-token",
  authLimiter,
  authenticate,
  certificateController.getCertificateImageToken
);

// Get single certificate (protected)
router.get(
  "/:id",
  authLimiter,
  authenticate,
  certificateController.getCertificate
);

// Verify certificate by number (PUBLIC - no auth)
router.get(
  "/verify/:certificateNumber",
  publicLimiter,
  certificateController.verifyCertificate
);

// Generate certificate manually (protected - for testing)
router.post(
  "/generate",
  criticalLimiter,
  authenticate,
  certificateController.generateCertificateManual
);

module.exports = router;
