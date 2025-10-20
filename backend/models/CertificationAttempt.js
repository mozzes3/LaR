// backend/models/CertificationAttempt.js
const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  answer: String, // Selected option text or true/false
  isCorrect: Boolean,
  points: Number,
  timeSpent: Number, // seconds spent on this question
});

const certificationAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    certification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProfessionalCertification",
      required: true,
      index: true,
    },

    // Attempt details
    attemptNumber: {
      type: Number,
      required: true,
    },

    // Answers
    answers: [answerSchema],

    // Scoring
    totalQuestions: Number,
    correctAnswers: Number,
    incorrectAnswers: Number,
    unansweredQuestions: Number,
    score: Number, // percentage
    totalPoints: Number,
    earnedPoints: Number,
    passed: Boolean,

    // Timing
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: Date,
    duration: Number, // actual time taken in seconds
    timeRemaining: Number, // seconds remaining when submitted

    // Anti-cheat security tracking
    tabSwitches: {
      type: Number,
      default: 0,
    },
    tabSwitchTimestamps: [Date],
    copyAttempts: {
      type: Number,
      default: 0,
    },
    pasteAttempts: {
      type: Number,
      default: 0,
    },
    rightClickAttempts: {
      type: Number,
      default: 0,
    },
    devToolsDetected: {
      type: Boolean,
      default: false,
    },
    suspiciousActivity: [
      {
        type: String,
        timestamp: Date,
        action: String,
      },
    ],
    cancelled: {
      type: Boolean,
      default: false,
    },
    cancelReason: String,

    // Browser fingerprint for security
    fingerprint: {
      userAgent: String,
      screenResolution: String,
      timezone: String,
      language: String,
      ip: String, // Hashed for privacy
    },

    // Certificate
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProfessionalCertificate",
    },
    certificatePaid: {
      type: Boolean,
      default: false,
    },
    certificatePaymentId: String,
    certificatePaidAt: Date,

    // Status
    status: {
      type: String,
      enum: ["in-progress", "completed", "cancelled", "expired"],
      default: "in-progress",
    },
  },
  { timestamps: true }
);

// Compound indexes for performance
certificationAttemptSchema.index({ user: 1, certification: 1 });
certificationAttemptSchema.index({ user: 1, status: 1 });
certificationAttemptSchema.index({ certification: 1, passed: 1 });
certificationAttemptSchema.index({ createdAt: -1 });

// Auto-expire in-progress attempts after time limit
certificationAttemptSchema.index(
  {
    startedAt: 1,
  },
  {
    expireAfterSeconds: 7200, // 2 hours max
  }
);

module.exports = mongoose.model(
  "CertificationAttempt",
  certificationAttemptSchema
);
