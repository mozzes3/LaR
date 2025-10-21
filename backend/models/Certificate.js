// backend/models/Certificate.js
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

    // Blockchain verification fields
    blockchainHash: {
      type: String,
      required: true,
      index: true,
    },
    blockchainExplorerUrl: {
      type: String,
      required: true,
    },
    blockchainBlock: {
      type: Number,
    },
    blockchainNetwork: {
      type: String,
      default: "Somnia",
    },

    verificationUrl: { type: String, required: true },
    skills: [{ type: String }],
  },
  { timestamps: true }
);

certificateSchema.index({ userId: 1, createdAt: -1 });
certificateSchema.index({ courseId: 1 });
certificateSchema.index({ certificateNumber: 1 }, { unique: true });
certificateSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Certificate", certificateSchema);
