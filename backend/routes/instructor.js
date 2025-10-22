const express = require("express");
const router = express.Router();
const {
  authLimiter,
  writeLimiter,
  adminLimiter,
} = require("../middleware/rateLimits");
const { enforcePaginationLimits } = require("../middleware/paginationLimits");
const instructorController = require("../controllers/instructorController");

const { authenticate, isAdmin } = require("../middleware/auth");

// User routes
// User routes
router.post(
  "/apply",
  enforcePaginationLimits,
  writeLimiter,
  authenticate,
  instructorController.applyInstructor
);
router.get(
  "/my-application",
  enforcePaginationLimits,
  authLimiter,
  authenticate,
  instructorController.getMyApplication
);

// Admin routes (higher limits)
router.get(
  "/applications",
  adminLimiter,
  authenticate,
  isAdmin,
  instructorController.getAllApplications
);
router.post(
  "/applications/:id/approve",
  adminLimiter,
  authenticate,
  isAdmin,
  instructorController.approveApplication
);
router.post(
  "/applications/:id/reject",
  adminLimiter,
  authenticate,
  isAdmin,
  instructorController.rejectApplication
);

module.exports = router;
