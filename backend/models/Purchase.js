const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    // Payment details
    paymentMethod: {
      type: String,
      enum: ["fdr", "usd", "crypto"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["USD", "FDR"],
      required: true,
    },

    // Transaction
    transactionHash: String, // For blockchain transactions
    paymentId: String, // For Stripe or other payment processors

    // Instructor revenue
    instructorRevenue: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },

    // Cashback (if paid with USD)
    cashbackAmount: {
      type: Number,
      default: 0,
    },
    cashbackClaimed: {
      type: Boolean,
      default: false,
    },

    // Progress tracking
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId,
    },
    lastAccessedAt: Date,

    // Completion
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateId: String,

    // Status
    status: {
      type: String,
      enum: ["active", "refunded", "expired"],
      default: "active",
    },
    refundedAt: Date,
    refundReason: String,

    // Experience earned
    experienceEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
purchaseSchema.index({ user: 1, course: 1 }, { unique: true });
purchaseSchema.index({ user: 1, status: 1 });
purchaseSchema.index({ course: 1, isCompleted: 1 });

// Mark lesson as completed
purchaseSchema.methods.completeLesson = function (lessonId) {
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
    this.lastAccessedLesson = lessonId;
    this.lastAccessedAt = new Date();

    // Calculate progress (you'll need to get total lessons from course)
    // This is a placeholder - actual calculation should include course data
    return this.save();
  }
};

module.exports = mongoose.model("Purchase", purchaseSchema);
