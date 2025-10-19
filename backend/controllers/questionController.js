const Question = require("../models/Question");
const Course = require("../models/Course");

/**
 * Get all questions for a course
 */
const getCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;

    const questions = await Question.find({ course: courseId })
      .populate("student", "username avatar")
      .populate("replies.user", "username avatar isInstructor")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({ error: "Failed to get questions" });
  }
};

/**
 * Create a new question
 */
const createQuestion = async (req, res) => {
  try {
    const { courseId, lesson, question } = req.body;
    const studentId = req.userId;

    if (!courseId || !lesson || !question) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const newQuestion = await Question.create({
      course: courseId,
      student: studentId,
      lesson,
      question,
    });

    const populatedQuestion = await Question.findById(newQuestion._id)
      .populate("student", "username avatar")
      .populate("replies.user", "username avatar isInstructor");

    res.status(201).json({
      success: true,
      question: populatedQuestion,
    });
  } catch (error) {
    console.error("Create question error:", error);
    res.status(500).json({ error: "Failed to create question" });
  }
};

/**
 * Reply to a question (instructor only)
 */
const replyToQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    console.log("💬 Reply attempt:", { questionId, userId });

    if (!text) {
      return res.status(400).json({ error: "Reply text is required" });
    }

    const question = await Question.findById(questionId).populate({
      path: "course",
      select: "instructor title",
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    console.log("📚 Question course:", question.course);
    console.log("👨‍🏫 Course instructor:", question.course.instructor);

    // Handle both populated and string instructor
    const instructorId = question.course.instructor._id
      ? question.course.instructor._id.toString()
      : question.course.instructor.toString();

    console.log("🔍 Comparing:", { instructorId, userId });

    // Check if user is the instructor of this course
    if (instructorId !== userId.toString()) {
      console.log("❌ Not authorized - not the instructor");
      return res
        .status(403)
        .json({ error: "Only the course instructor can reply to questions" });
    }

    question.replies.push({
      user: userId,
      text,
    });

    question.status = "answered";
    await question.save();

    const updatedQuestion = await Question.findById(questionId)
      .populate("student", "username avatar")
      .populate("replies.user", "username avatar isInstructor");

    console.log("✅ Reply added successfully");

    res.json({
      success: true,
      question: updatedQuestion,
    });
  } catch (error) {
    console.error("Reply to question error:", error);
    res.status(500).json({ error: "Failed to reply to question" });
  }
};
/**
 * Delete a question
 */
const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.userId;

    const question = await Question.findById(questionId).populate(
      "course",
      "instructor"
    );
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Check if user is the student who asked or the instructor
    const isStudent = question.student.toString() === userId;
    const isInstructor = question.course.instructor.toString() === userId;

    if (!isStudent && !isInstructor) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this question" });
    }

    await question.deleteOne();

    res.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({ error: "Failed to delete question" });
  }
};

module.exports = {
  getCourseQuestions,
  createQuestion,
  replyToQuestion,
  deleteQuestion,
};
