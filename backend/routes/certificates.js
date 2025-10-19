// backend/routes/certificateRoutes.js
const express = require("express");
const router = express.Router();
const {
  getUserCertificates,
  getCertificate,
  verifyCertificate,
  generateCertificateManual,
  getCertificateImageToken,
} = require("../controllers/certificateController");
const { authenticate } = require("../middleware/auth");

// Get user's certificates (protected)
router.get("/my", authenticate, getUserCertificates);

// Get certificate image token (protected)
router.get("/:id/image-token", authenticate, getCertificateImageToken);

// Get single certificate (protected)
router.get("/:id", authenticate, getCertificate);

// Verify certificate by number (PUBLIC - no auth)
router.get("/verify/:certificateNumber", verifyCertificate);

// Generate certificate manually (protected - for testing)
router.post("/generate", authenticate, generateCertificateManual);

module.exports = router;
