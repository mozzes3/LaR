// backend/routes/professionalCertifications.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const profCertController = require("../controllers/professionalCertificationController");
const profCertificateController = require("../controllers/professionalCertificateController");

// ===== PROFESSIONAL CERTIFICATIONS (TESTS) =====

/**
 * @route   POST /api/professional-certifications/start-test
 * @desc    Start a new test attempt
 * @access  Private
 */
router.post("/start-test", authenticate, profCertController.startTestAttempt);

/**
 * @route   POST /api/professional-certifications/track-security
 * @desc    Track security events (tab switch, copy, etc)
 * @access  Private
 */
router.post(
  "/track-security",
  authenticate,
  profCertController.trackSecurityEvent
);

/**
 * @route   POST /api/professional-certifications/submit-test
 * @desc    Submit test answers and get results
 * @access  Private
 */
router.post("/submit-test", authenticate, profCertController.submitTestAttempt);

/**
 * @route   GET /api/professional-certifications
 * @desc    Get all published professional certifications
 * @access  Public
 */
router.get("/", profCertController.getAllCertifications);

/**
 * @route   GET /api/professional-certifications/:slug
 * @desc    Get certification details (without questions)
 * @access  Public (but shows user-specific data if authenticated)
 */
router.get("/:slug", profCertController.getCertificationDetails);

// ===== TEST TAKING =====

/**
 * @route   POST /api/professional-certifications/track-security
 * @desc    Track security events (tab switch, copy, etc)
 * @access  Private
 */
router.post(
  "/track-security",
  authenticate,
  profCertController.trackSecurityEvent
);

// ===== ATTEMPTS =====

/**
 * @route   GET /api/professional-certifications/attempts/my-attempts
 * @desc    Get user's attempt history
 * @access  Private
 */
router.get(
  "/attempts/my-attempts",
  authenticate,
  profCertController.getMyAttempts
);

/**
 * @route   GET /api/professional-certifications/attempts/:attemptId
 * @desc    Get attempt details with answers (review)
 * @access  Private
 */
router.get(
  "/attempts/:attemptId",
  authenticate,
  profCertController.getAttemptDetails
);

// ===== CERTIFICATES =====

/**
 * @route   GET /api/professional-certifications/certificates/eligible
 * @desc    Get user's eligible certificates (passed tests)
 * @access  Private
 */
router.get(
  "/certificates/eligible",
  authenticate,
  profCertificateController.getEligibleCertificates
);

/**
 * @route   GET /api/professional-certifications/certificates/my-certificates
 * @desc    Get user's purchased certificates
 * @access  Private
 */
router.get(
  "/certificates/my-certificates",
  authenticate,
  profCertificateController.getMyCertificates
);

/**
 * @route   POST /api/professional-certifications/certificates/purchase
 * @desc    Purchase certificate
 * @access  Private
 */
router.post(
  "/certificates/purchase",
  authenticate,
  profCertificateController.purchaseCertificate
);

/**
 * @route   GET /api/professional-certifications/certificates/verify/:certificateNumber
 * @desc    Verify certificate (public)
 * @access  Public
 */
router.get(
  "/certificates/verify/:certificateNumber",
  profCertificateController.verifyCertificate
);

module.exports = router;
