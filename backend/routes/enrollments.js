const express = require("express");
const router = express.Router();
const { authLimiter, writeLimiter } = require("../middleware/rateLimits");

// Placeholder routes - will implement later
router.post("/enroll", writeLimiter, (req, res) => {
  res.json({ message: "Enrollment coming soon" });
});

router.post("/progress", authLimiter, (req, res) => {
  res.json({ message: "Progress tracking coming soon" });
});

router.post("/:courseId/complete", writeLimiter, (req, res) => {
  res.json({ message: "Course completion coming soon" });
});

router.get("/my", authLimiter, (req, res) => {
  res.json({ enrollments: [] });
});

router.get("/:courseId", authLimiter, (req, res) => {
  res.json({ enrollment: null });
});

module.exports = router;
