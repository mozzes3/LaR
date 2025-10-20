// backend/models/ProfessionalCertificate.js
const mongoose = require("mongoose");

const professionalCertificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    certificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProfessionalCertification",
      required: true,
      index: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CertificationAttempt",
      required: true,
    },

    // Certificate details
    certificateNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    certificateType: {
      type: String,
      default: "Professional Certificate of Competency",
    },

    // Student info
    studentName: {
      type: String,
      required: true,
    },
    studentWallet: {
      type: String,
      required: true,
    },

    // Certification info
    certificationTitle: {
      type: String,
      required: true,
    },
    category: String,
    level: String,

    // Test results
    score: {
      type: Number,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    totalQuestions: Number,
    correctAnswers: Number,
    testDuration: Number, // minutes
    completedDate: {
      type: Date,
      required: true,
    },
    attemptNumber: Number,

    // Certificate image
    templateImage: String, // Bunny CDN URL

    // Blockchain verification
    blockchainHash: {
      type: String,
      index: true,
    },
    blockchainExplorerUrl: String,
    blockchainBlock: Number,
    blockchainNetwork: {
      type: String,
      default: "polygon",
    },
    blockchainVerified: {
      type: Boolean,
      default: false,
    },
    blockchainVerifiedAt: Date,

    // Verification
    verificationUrl: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String,
      unique: true,
    },

    // Payment
    paid: {
      type: Boolean,
      default: false,
      required: true,
    },
    paymentAmount: Number,
    paymentCurrency: {
      type: String,
      default: "USD",
    },
    paymentMethod: String,
    paymentId: String,
    paidAt: Date,

    // Status
    status: {
      type: String,
      enum: ["pending-payment", "active", "revoked"],
      default: "pending-payment",
    },
    revokedAt: Date,
    revokedReason: String,

    // Validity
    issuedDate: {
      type: Date,
      required: true,
    },
    expiryDate: Date, // Optional: some certs don't expire
    isValid: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for performance
professionalCertificateSchema.index({ userId: 1, createdAt: -1 });
professionalCertificateSchema.index({ certificationId: 1, createdAt: -1 });
professionalCertificateSchema.index({ certificateNumber: 1 }, { unique: true });
professionalCertificateSchema.index({ verificationCode: 1 }, { unique: true });
professionalCertificateSchema.index({ blockchainHash: 1 });
professionalCertificateSchema.index({ status: 1, paid: 1 });
professionalCertificateSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  "ProfessionalCertificate",
  professionalCertificateSchema
);
