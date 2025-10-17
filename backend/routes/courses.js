const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const {
  authenticate,
  isInstructor,
  optionalAuth,
} = require("../middleware/auth");

// Public routes
router.get("/", optionalAuth, courseController.getCourses);

// Instructor routes - MOVE THESE BEFORE /:slug
router.get(
  "/instructor/my-courses", // ← Move this BEFORE /:slug
  authenticate,
  isInstructor,
  courseController.getInstructorCourses
);
router.post("/", authenticate, isInstructor, courseController.createCourse);
router.post(
  "/:slug/publish",
  authenticate,
  isInstructor,
  courseController.publishCourse
);
router.put("/:slug", authenticate, isInstructor, courseController.updateCourse);
router.delete(
  "/:slug",
  authenticate,
  isInstructor,
  courseController.deleteCourse
);

// Dynamic route - KEEP THIS LAST
router.get("/:slug", optionalAuth, courseController.getCourse); // ← This should be last

module.exports = router;
