const express = require("express");
const router = express.Router();
const {
  getCourseQuestions,
  createQuestion,
  replyToQuestion,
  deleteQuestion,
} = require("../controllers/questionController");
const { authenticate } = require("../middleware/auth");

// Get all questions for a course
router.get("/course/:courseId", getCourseQuestions);

// Create a new question (authenticated students)
router.post("/", authenticate, createQuestion);

// Reply to a question (authenticated instructors only)
router.post("/:questionId/reply", authenticate, replyToQuestion);

// Delete a question (only student who asked or instructor)
router.delete("/:questionId", authenticate, deleteQuestion);

module.exports = router;
