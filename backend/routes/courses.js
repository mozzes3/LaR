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
router.get("/:slug", optionalAuth, courseController.getCourse);

// Instructor routes
router.post("/", authenticate, isInstructor, courseController.createCourse);
router.put("/:slug", authenticate, isInstructor, courseController.updateCourse);
router.delete(
  "/:slug",
  authenticate,
  isInstructor,
  courseController.deleteCourse
);
router.post(
  "/:slug/publish",
  authenticate,
  isInstructor,
  courseController.publishCourse
);
router.get(
  "/instructor/my-courses",
  authenticate,
  isInstructor,
  courseController.getInstructorCourses
);

module.exports = router;
