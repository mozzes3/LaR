const mongoose = require("mongoose");

// CRITICAL: Delete existing model to prevent cache issues
delete mongoose.connection.models.Purchase;
delete mongoose.models.Purchase;

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

    // NEW Payment System Fields (OPTIONAL for backward compatibility)
    paymentToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentToken",
    },
    amountInToken: String,
    amountInUSD: Number,
    platformAmount: String,
    instructorAmount: String,
    revenueSplitAmount: String,
    platformFeePercentage: Number,
    instructorFeePercentage: Number,

    // OLD Payment System Fields (OPTIONAL for backward compatibility)
    paymentMethod: {
      type: String,
      enum: ["fdr", "usdt", "usdc", "eth", "crypto"],
    },
    amount: Number,
    currency: {
      type: String,
      enum: ["USD", "FDR"],
    },
    instructorRevenue: Number,
    platformFee: Number,
    cashbackAmount: {
      type: Number,
      default: 0,
    },
    cashbackClaimed: {
      type: Boolean,
      default: false,
    },

    // Transaction
    transactionHash: {
      type: String,
      index: true,
    },
    blockchain: {
      type: String,
      enum: ["evm", "solana"],
    },
    blockNumber: Number,
    fromAddress: String,
    toAddress: String,

    // Escrow
    escrowId: String,
    escrowStatus: {
      type: String,
      enum: ["pending", "released", "refunded", "failed", "dummy", "locked"],
      default: "pending",
      index: true,
    },
    escrowReleaseDate: Date,
    escrowReleasedAt: Date,
    escrowCreatedTxHash: String,
    escrowReleaseTxHash: String,

    // Refund
    refundEligible: {
      type: Boolean,
      default: true,
    },
    grantedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    grantReason: String,
    refundRequestedAt: Date,
    refundProcessedAt: Date,
    refundTransactionHash: String,
    refundReason: String,

    // Progress
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalWatchTime: {
      type: Number,
      default: 0,
    },
    completedLessons: [mongoose.Schema.Types.ObjectId],
    lastAccessedLesson: mongoose.Schema.Types.ObjectId,
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
      enum: [
        "pending",
        "active",
        "refunded",
        "expired",
        "escrow_released",
        "disputed",
        "failed",
        "revoked",
      ],
      default: "active",
      index: true,
    },
    revokedAt: Date,
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    revokeReason: String,
    refundedAt: Date,
    experienceEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
purchaseSchema.index({ user: 1, course: 1 });
purchaseSchema.index({ user: 1, status: 1 });
purchaseSchema.index({ course: 1, createdAt: -1 });
purchaseSchema.index({ escrowStatus: 1, escrowReleaseDate: 1 });
purchaseSchema.index({ transactionHash: 1 });
purchaseSchema.index({ user: 1, isCompleted: 1 });
purchaseSchema.index({ course: 1, isCompleted: 1 });
purchaseSchema.index({ lastAccessedAt: -1 });
purchaseSchema.index({ status: 1, createdAt: -1 });
purchaseSchema.index({ course: 1, status: 1 });

// Method: Check refund eligibility
purchaseSchema.methods.checkRefundEligibility = function () {
  const now = new Date();
  const daysSincePurchase = (now - this.createdAt) / (1000 * 60 * 60 * 24);
  const escrowPeriodDays = this.escrowReleaseDate
    ? (this.escrowReleaseDate - this.createdAt) / (1000 * 60 * 60 * 24)
    : 14;

  if (daysSincePurchase > escrowPeriodDays) {
    return { eligible: false, reason: "Refund period has expired" };
  }
  if (this.escrowStatus === "released") {
    return { eligible: false, reason: "Payment already released" };
  }
  if (this.escrowStatus === "refunded") {
    return { eligible: false, reason: "Already refunded" };
  }
  return { eligible: true };
};

// Method: Mark lesson as completed
purchaseSchema.methods.completeLesson = function (lessonId) {
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
    this.lastAccessedLesson = lessonId;
    this.lastAccessedAt = new Date();
  }
  return this.save();
};

// CRITICAL: Force create with specific collection name
const Purchase = mongoose.model("Purchase", purchaseSchema, "purchases");

module.exports = Purchase;
