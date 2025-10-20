const express = require("express");
const router = express.Router();
const { authenticate, optionalAuth } = require("../middleware/auth");
const profCertController = require("../controllers/professionalCertificationController");
const profCertificateController = require("../controllers/professionalCertificateController");

// ===== PROFESSIONAL CERTIFICATIONS (TESTS) =====

router.post("/start-test", authenticate, profCertController.startTestAttempt);
router.post("/submit-test", authenticate, profCertController.submitTestAttempt);

// ===== ATTEMPTS (MUST BE BEFORE /:slug) =====
router.get(
  "/attempts/my-attempts",
  authenticate,
  profCertController.getMyAttempts
);

router.get(
  "/attempts/:attemptId",
  authenticate,
  profCertController.getAttemptDetails
);

// ===== CERTIFICATES (MUST BE BEFORE /:slug) =====
router.get(
  "/certificates/eligible",
  authenticate,
  profCertificateController.getEligibleCertificates
);

router.get(
  "/certificates/my-certificates",
  authenticate,
  profCertificateController.getMyCertificates
);

router.post(
  "/certificates/purchase",
  authenticate,
  profCertificateController.purchaseCertificate
);

router.get(
  "/certificates/verify/:certificateNumber",
  profCertificateController.verifyCertificate
);
router.post("/reset-attempts", authenticate, profCertController.resetAttempts);

// ===== GENERAL ROUTES (/:slug MUST BE LAST) =====
router.get("/", profCertController.getAllCertifications);

router.get("/:slug", optionalAuth, profCertController.getCertificationDetails);

module.exports = router;
