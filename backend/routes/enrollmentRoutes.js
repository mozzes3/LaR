const express = require("express");
const router = express.Router();
const {
  authLimiter,
  writeLimiter,
  criticalLimiter,
} = require("../middleware/rateLimits"); // ✅ ADD THIS
const enrollmentController = require("../controllers/enrollmentController");
const { authenticate } = require("../middleware/auth"); // ✅ CORRECT

// Enroll in course
router.post(
  "/enroll",
  writeLimiter,
  authenticate,
  enrollmentController.enrollCourse
);

// Update progress
router.post(
  "/progress",
  authLimiter,
  authenticate,
  enrollmentController.updateProgress
);

// Complete course (auto-generates certificate)
router.post(
  "/:courseId/complete",
  criticalLimiter,
  authenticate,
  enrollmentController.completeCourse
);

// Get my enrollments
router.get(
  "/my",
  authLimiter,
  authenticateToken,
  enrollmentController.getMyEnrollments
);

// Get single enrollment
router.get(
  "/:courseId",
  authLimiter,
  authenticateToken,
  enrollmentController.getEnrollment
);

module.exports = router;
