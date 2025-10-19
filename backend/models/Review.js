const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
    },

    // Rating & Review
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Detailed ratings
    contentQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    instructorQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Helpful votes
    helpfulCount: {
      type: Number,
      default: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulVotes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        vote: {
          type: String,
          enum: ["helpful", "not-helpful"],
        },
      },
    ],

    // Instructor response
    instructorResponse: {
      comment: String,
      respondedAt: Date,
    },

    // Status
    status: {
      type: String,
      enum: ["published", "pending", "flagged", "removed"],
      default: "pending",
    },
    flagReason: String,

    // Edited
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index - one review per user per course
reviewSchema.index({ user: 1, course: 1 }, { unique: true });
reviewSchema.index({ course: 1, rating: -1 });
reviewSchema.index({ course: 1, helpfulCount: -1 });

module.exports = mongoose.model("Review", reviewSchema);
