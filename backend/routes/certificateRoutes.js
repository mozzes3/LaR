const express = require("express");
const router = express.Router();
const certificateController = require("../controllers/certificateController");
const { authenticateToken } = require("../middleware/auth");

// Get user's certificates
router.get("/my", authenticateToken, certificateController.getUserCertificates);

// Get single certificate
router.get("/:id", authenticateToken, certificateController.getCertificate);

// Verify certificate by number (public)
router.get(
  "/verify/:certificateNumber",
  certificateController.verifyCertificate
);

// Generate certificate
router.post(
  "/generate",
  authenticateToken,
  certificateController.generateCertificate
);

module.exports = router;
