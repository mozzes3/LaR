const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrolledDate: {
      type: Date,
      default: Date.now,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedDate: {
      type: Date,
    },
    progress: {
      type: Number,
      default: 0,
    }, // 0-100
    finalScore: {
      type: Number,
    },
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId,
    },
    watchTime: {
      type: Number,
      default: 0,
    }, // in minutes
  },
  { timestamps: true }
);

// Prevent duplicate enrollments
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
