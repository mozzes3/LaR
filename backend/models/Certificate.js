const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
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
    templateImage: {
      type: String,
      default: null,
    },
    studentName: { type: String, required: true },
    studentWallet: { type: String, required: true },
    courseTitle: { type: String, required: true },
    instructor: { type: String, required: true },
    completedDate: { type: Date, required: true },
    certificateNumber: { type: String, unique: true, required: true },
    grade: { type: String, required: true },
    finalScore: { type: Number, required: true },
    totalHours: { type: Number, required: true },
    totalLessons: { type: Number, required: true },
    blockchainHash: { type: String, required: true },
    verificationUrl: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
