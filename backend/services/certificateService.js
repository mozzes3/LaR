const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const {
  recordCertificateOnChain,
} = require("../blockchain/certificateContract");

const generateCertificate = async (userId, courseId) => {
  const user = await User.findById(userId);
  const course = await Course.findById(courseId).populate("instructor");
  const enrollment = await Enrollment.findOne({ userId, courseId });

  if (!enrollment.completed) {
    throw new Error("Course not completed yet");
  }

  // Check if certificate already exists
  const existingCert = await Certificate.findOne({ userId, courseId });
  if (existingCert) {
    return existingCert;
  }

  // Calculate grade
  const grade = calculateGrade(enrollment.finalScore);

  // Generate unique certificate number
  const certificateNumber = `FA-${new Date().getFullYear()}-${String(
    Math.floor(Math.random() * 999999)
  ).padStart(6, "0")}`;

  // Record on blockchain
  const blockchainHash = await recordCertificateOnChain({
    certificateNumber,
    studentWallet: user.walletAddress,
    courseId: course._id.toString(),
    timestamp: Date.now(),
  });

  // Create certificate with template from course
  const certificate = await Certificate.create({
    userId,
    courseId,
    studentName: user.username,
    studentWallet: user.walletAddress,
    courseTitle: course.title,
    instructor: course.instructor.username,
    completedDate: new Date(),
    certificateNumber,
    grade,
    finalScore: enrollment.finalScore,
    totalHours: course.totalDuration,
    totalLessons: course.lessons.length,
    blockchainHash,
    verificationUrl: `${process.env.FRONTEND_URL}/verify/${certificateNumber}`,
    templateImage: course.certificateTemplate || null, // ← ADD THIS LINE
  });

  return certificate;
};

const calculateGrade = (score) => {
  if (score >= 98) return "Outstanding";
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  return "Pass";
};

module.exports = { generateCertificate, calculateGrade };
