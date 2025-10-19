// backend/routes/certificateRoutes.js
const express = require("express");
const router = express.Router();
const certificateController = require("../controllers/certificateController");
const { authenticate } = require("../middleware/auth");

// Get user's certificates (protected)
router.get("/my", authenticate, certificateController.getUserCertificates);

// Get certificate image token (protected)
router.get(
  "/:id/image-token",
  authenticate,
  certificateController.getCertificateImageToken
);

// Get single certificate (protected)
router.get("/:id", authenticate, certificateController.getCertificate);

// Verify certificate by number (PUBLIC - no auth)
router.get(
  "/verify/:certificateNumber",
  certificateController.verifyCertificate
);

// Generate certificate manually (protected - for testing)
router.post(
  "/generate",
  authenticate,
  certificateController.generateCertificateManual
);

module.exports = router;
