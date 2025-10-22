const express = require("express");
const router = express.Router();
const {
  publicLimiter,
  authLimiter,
  writeLimiter,
} = require("../middleware/rateLimits");
const {
  getCourseQuestions,
  createQuestion,
  replyToQuestion,
  deleteQuestion,
} = require("../controllers/questionController");
const { authenticate } = require("../middleware/auth");

// Get all questions for a course
router.get("/course/:courseId", publicLimiter, getCourseQuestions);

// Create a new question (authenticated students)
router.post("/", writeLimiter, authenticate, createQuestion);

// Reply to a question (authenticated instructors only)
router.post("/:questionId/reply", writeLimiter, authenticate, replyToQuestion);

// Delete a question (only student who asked or instructor)
router.delete("/:questionId", authLimiter, authenticate, deleteQuestion);

module.exports = router;
