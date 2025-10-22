// backend/routes/adminProfessionalCertifications.js
const express = require("express");
const router = express.Router();
const { adminLimiter, expensiveLimiter } = require("../middleware/rateLimits");
const { authenticate, isAdmin } = require("../middleware/auth");
const { hasPermission } = require("../middleware/permission");
const adminProfCertController = require("../controllers/adminProfessionalCertificationController");

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// ===== DASHBOARD =====
router.get(
  "/dashboard/stats",
  expensiveLimiter,
  adminProfCertController.getDashboardStats
);

// ===== CERTIFICATIONS MANAGEMENT =====

/**
 * @route   GET /api/admin/professional-certifications
 * @desc    Get all certifications (admin)
 * @access  Admin
 */
router.get("/", adminLimiter, adminProfCertController.getAllCertifications);

/**
 * @route   GET /api/admin/professional-certifications/:id
 * @desc    Get certification details
 * @access  Admin
 */
router.get(
  "/:id",
  adminLimiter,
  adminProfCertController.getCertificationDetails
);

/**
 * @route   POST /api/admin/professional-certifications
 * @desc    Create new certification
 * @access  Admin (with permission)
 */
router.post(
  "/",
  adminLimiter,
  hasPermission("certifications", "create"),
  adminProfCertController.createCertification
);

/**
 * @route   PUT /api/admin/professional-certifications/:id
 * @desc    Update certification
 * @access  Admin (with permission)
 */
router.put(
  "/:id",
  adminLimiter,
  hasPermission("certifications", "update"),
  adminProfCertController.updateCertification
);

/**
 * @route   DELETE /api/admin/professional-certifications/:id
 * @desc    Delete certification
 * @access  Admin (with permission)
 */
router.delete(
  "/:id",
  adminLimiter,
  hasPermission("certifications", "delete"),
  adminProfCertController.deleteCertification
);

/**
 * @route   PUT /api/admin/professional-certifications/:id/status
 * @desc    Update certification status
 * @access  Admin (with permission)
 */
router.put(
  "/:id/status",
  adminLimiter,
  hasPermission("certifications", "update"),
  adminProfCertController.updateStatus
);

// ===== ATTEMPTS =====

/**
 * @route   GET /api/admin/professional-certifications/:id/attempts
 * @desc    Get all attempts for a certification
 * @access  Admin
 */
router.get(
  "/:id/attempts",
  expensiveLimiter,
  adminProfCertController.getCertificationAttempts
);

// ===== CERTIFICATES =====

/**
 * @route   GET /api/admin/professional-certifications/certificates/all
 * @desc    Get all issued certificates
 * @access  Admin
 */
router.get(
  "/certificates/all",
  expensiveLimiter,
  adminProfCertController.getAllCertificates
);

/**
 * @route   POST /api/admin/professional-certifications/certificates/:id/revoke
 * @desc    Revoke a certificate
 * @access  Admin (with permission)
 */
router.post(
  "/certificates/:id/revoke",
  adminLimiter,
  hasPermission("certifications", "delete"),
  adminProfCertController.revokeCertificate
);

module.exports = router;
