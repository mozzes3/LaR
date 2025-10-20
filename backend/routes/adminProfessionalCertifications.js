// backend/routes/adminProfessionalCertifications.js
const express = require("express");
const router = express.Router();
const { authenticate, isAdmin } = require("../middleware/auth");
const { hasPermission } = require("../middleware/permission");
const adminProfCertController = require("../controllers/adminProfessionalCertificationController");

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// ===== DASHBOARD =====
router.get("/dashboard/stats", adminProfCertController.getDashboardStats);

// ===== CERTIFICATIONS MANAGEMENT =====

/**
 * @route   GET /api/admin/professional-certifications
 * @desc    Get all certifications (admin)
 * @access  Admin
 */
router.get("/", adminProfCertController.getAllCertifications);

/**
 * @route   GET /api/admin/professional-certifications/:id
 * @desc    Get certification details
 * @access  Admin
 */
router.get("/:id", adminProfCertController.getCertificationDetails);

/**
 * @route   POST /api/admin/professional-certifications
 * @desc    Create new certification
 * @access  Admin (with permission)
 */
router.post(
  "/",
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
  hasPermission("certifications", "update"),
  adminProfCertController.updateStatus
);

// ===== ATTEMPTS =====

/**
 * @route   GET /api/admin/professional-certifications/:id/attempts
 * @desc    Get all attempts for a certification
 * @access  Admin
 */
router.get("/:id/attempts", adminProfCertController.getCertificationAttempts);

// ===== CERTIFICATES =====

/**
 * @route   GET /api/admin/professional-certifications/certificates/all
 * @desc    Get all issued certificates
 * @access  Admin
 */
router.get("/certificates/all", adminProfCertController.getAllCertificates);

/**
 * @route   POST /api/admin/professional-certifications/certificates/:id/revoke
 * @desc    Revoke a certificate
 * @access  Admin (with permission)
 */
router.post(
  "/certificates/:id/revoke",
  hasPermission("certifications", "delete"),
  adminProfCertController.revokeCertificate
);

module.exports = router;
