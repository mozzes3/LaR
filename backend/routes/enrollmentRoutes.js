const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");
const { authenticateToken } = require("../middleware/auth");

// Enroll in course
router.post("/enroll", authenticateToken, enrollmentController.enrollCourse);

// Update progress
router.post(
  "/progress",
  authenticateToken,
  enrollmentController.updateProgress
);

// Complete course (auto-generates certificate)
router.post(
  "/:courseId/complete",
  authenticateToken,
  enrollmentController.completeCourse
);

// Get my enrollments
router.get("/my", authenticateToken, enrollmentController.getMyEnrollments);

// Get single enrollment
router.get("/:courseId", authenticateToken, enrollmentController.getEnrollment);

module.exports = router;
