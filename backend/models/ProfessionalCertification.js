// backend/models/ProfessionalCertification.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["multiple-choice", "true-false"],
    required: true,
  },
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ],
  correctAnswer: String, // For true-false
  points: {
    type: Number,
    default: 1,
  },
  explanation: String, // Show after answering
  order: Number,
});

const professionalCertificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subcategories: [String], // CHANGED: Now array instead of single subcategory
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    tags: [String],

    // Questions
    questions: [questionSchema],
    totalQuestions: {
      type: Number,
      default: 0,
    },
    questionsPerTest: {
      // NEW: How many questions to show per test
      type: Number,
      required: true,
      default: 10,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },

    // Test settings
    duration: {
      type: Number, // in minutes
      required: true,
      default: 60,
    },
    passingScore: {
      type: Number, // percentage
      default: 70,
      min: 0,
      max: 100,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },

    // Certificate pricing
    certificatePrice: {
      usd: {
        type: Number,
        required: true,
        default: 5,
      },
    },
    discountPrice: {
      usd: Number,
    },
    discountEndDate: Date,

    // Security settings
    allowCopyPaste: {
      type: Boolean,
      default: false,
    },
    allowTabSwitch: {
      type: Boolean,
      default: false,
    },
    tabSwitchWarnings: {
      type: Number,
      default: 2, // Cancel after 2 warnings
    },
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    shuffleOptions: {
      type: Boolean,
      default: true,
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    // Statistics
    totalAttempts: {
      type: Number,
      default: 0,
    },
    totalPassed: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },

    publishedAt: Date,
  },
  { timestamps: true }
);

// Indexes
professionalCertificationSchema.index({ slug: 1 });
professionalCertificationSchema.index({ category: 1, status: 1 });
professionalCertificationSchema.index({ status: 1, publishedAt: -1 });

// Update totals before saving
professionalCertificationSchema.pre("save", function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalQuestions = this.questions.length;
    this.totalPoints = this.questions.reduce(
      (sum, q) => sum + (q.points || 1),
      0
    );
  }
  next();
});

module.exports = mongoose.model(
  "ProfessionalCertification",
  professionalCertificationSchema
);
