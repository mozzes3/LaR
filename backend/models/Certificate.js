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
    totalHours: { type: Number, required: true },
    totalLessons: { type: Number, required: true },

    verificationUrl: { type: String, required: true },
    skills: [{ type: String }],

    // NFT fields
    nftMinted: {
      type: Boolean,
      default: false,
    },
    nftTokenId: String,
    nftContractAddress: String,
    nftMetadataURI: String,
    nftImageURI: String,
    nftTransactionHash: String,
    nftMintedAt: Date,
    nftMintError: String,
  },
  { timestamps: true }
);

certificateSchema.index({ userId: 1, createdAt: -1 });
certificateSchema.index({ courseId: 1 });
certificateSchema.index({ certificateNumber: 1 }, { unique: true });
certificateSchema.index({ createdAt: -1 });
certificateSchema.index({ nftMinted: 1 });
certificateSchema.index({ nftTokenId: 1 });

module.exports = mongoose.model("Certificate", certificateSchema);
