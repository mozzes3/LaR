const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
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
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    timestamp: {
      type: Number,
      default: 0, // Video timestamp in seconds where note was taken
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
noteSchema.index({ user: 1, course: 1, lesson: 1 });

module.exports = mongoose.model("Note", noteSchema);
