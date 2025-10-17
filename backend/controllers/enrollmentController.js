const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { generateCertificate } = require("../services/certificateService");

// Enroll in a course
exports.enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId,
    });

    res.json({ message: "Enrolled successfully", enrollment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update lesson progress
exports.updateProgress = async (req, res) => {
  try {
    const { courseId, lessonId, watchTime } = req.body;

    const enrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    // Add lesson to completed if not already there
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    // Update watch time
    enrollment.watchTime += watchTime || 0;

    // Calculate progress
    const course = await Course.findById(courseId);
    const totalLessons = course.lessons.length;
    const completedCount = enrollment.completedLessons.length;
    enrollment.progress = Math.round((completedCount / totalLessons) * 100);

    // Update last accessed lesson
    enrollment.lastAccessedLesson = lessonId;

    await enrollment.save();

    res.json({ enrollment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark course as complete and generate certificate
exports.completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    if (enrollment.completed) {
      return res.status(400).json({ error: "Course already completed" });
    }

    // Mark as complete
    enrollment.completed = true;
    enrollment.completedDate = new Date();
    enrollment.progress = 100;

    // Calculate final score (you can customize this logic)
    enrollment.finalScore = enrollment.finalScore || 85; // Default if no quizzes

    await enrollment.save();

    // Auto-generate certificate
    const certificate = await generateCertificate(req.user.id, courseId);

    res.json({
      message: "Course completed! Certificate generated.",
      enrollment,
      certificate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's enrollments
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user.id })
      .populate("courseId")
      .sort({ enrolledDate: -1 });

    res.json({ enrollments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single enrollment details
exports.getEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId,
    }).populate("courseId");

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    res.json({ enrollment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
