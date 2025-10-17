const express = require("express");
const router = express.Router();

// Placeholder routes - will implement later
router.post("/enroll", (req, res) => {
  res.json({ message: "Enrollment coming soon" });
});

router.post("/progress", (req, res) => {
  res.json({ message: "Progress tracking coming soon" });
});

router.post("/:courseId/complete", (req, res) => {
  res.json({ message: "Course completion coming soon" });
});

router.get("/my", (req, res) => {
  res.json({ enrollments: [] });
});

router.get("/:courseId", (req, res) => {
  res.json({ enrollment: null });
});

module.exports = router;
