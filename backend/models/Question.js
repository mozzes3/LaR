// backend/models/Question.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lesson: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["unanswered", "answered"],
      default: "unanswered",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
