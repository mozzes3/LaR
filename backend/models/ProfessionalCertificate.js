// backend/models/ProfessionalCertificate.js
const mongoose = require("mongoose");

const professionalCertificateSchema = new mongoose.Schema(
  {
    // Certificate identification
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    certificateType: {
      type: String,
      default: "Professional Certificate of Competency",
    },

    // Student information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentWallet: {
      type: String,
      default: "N/A",
    },

    // Certification information
    certificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProfessionalCertification",
      required: true,
    },
    certificationTitle: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subcategories: [String],
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },

    // Test results
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },

    // Dates
    completedDate: {
      type: Date,
      required: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },

    // Verification
    verificationUrl: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
    },

    // Blockchain (existing system)
    blockchainVerified: {
      type: Boolean,
      default: false,
    },
    blockchainTransactionHash: String,
    blockchainRecordedAt: Date,

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

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
professionalCertificateSchema.index({ userId: 1, issuedDate: -1 });
professionalCertificateSchema.index({ certificationId: 1 });
professionalCertificateSchema.index({ status: 1 });
professionalCertificateSchema.index({ nftMinted: 1 });
professionalCertificateSchema.index({ nftTokenId: 1 });

module.exports = mongoose.model(
  "ProfessionalCertificate",
  professionalCertificateSchema
);
