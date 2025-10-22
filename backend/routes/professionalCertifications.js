const express = require("express");
const router = express.Router();
const {
  publicLimiter,
  browsingLimiter,
  authLimiter,
  criticalLimiter,
} = require("../middleware/rateLimits");
const { authenticate, optionalAuth } = require("../middleware/auth");
const profCertController = require("../controllers/professionalCertificationController");

// Public browsing
router.get("/", browsingLimiter, profCertController.getAllCertifications);
router.get(
  "/:slug",
  browsingLimiter,
  optionalAuth,
  profCertController.getCertificationDetails
);

// ⚠️ CRITICAL: Test operations (expensive, prevent cheating)
router.post(
  "/start-test",
  criticalLimiter,
  authenticate,
  profCertController.startTestAttempt
);
router.post(
  "/submit-test",
  criticalLimiter,
  authenticate,
  profCertController.submitTestAttempt
);
router.post(
  "/reset-attempts",
  criticalLimiter,
  authenticate,
  profCertController.resetAttempts
);

// Reading attempts
router.get(
  "/attempts/my-attempts",
  authLimiter,
  authenticate,
  profCertController.getMyAttempts
);
router.get(
  "/attempts/:attemptId",
  authLimiter,
  authenticate,
  profCertController.getAttemptDetails
);

// Certificate operations
router.get(
  "/certificates/eligible",
  authLimiter,
  authenticate,
  profCertController.getEligibleCertificates
);
router.get(
  "/certificates/my-certificates",
  authLimiter,
  authenticate,
  profCertController.getMyCertificates
);
router.get(
  "/certificates/verify/:certificateNumber",
  publicLimiter,
  profCertController.verifyCertificate
);

// ⚠️ CRITICAL: Purchase certificate (payment)
router.post(
  "/certificates/purchase",
  criticalLimiter,
  authenticate,
  profCertController.purchaseCertificate
);

module.exports = router;
