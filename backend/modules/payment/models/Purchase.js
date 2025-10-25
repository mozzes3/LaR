const mongoose = require("mongoose");

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

    // NEW PAYMENT SYSTEM FIELDS
    paymentToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentToken",
      required: false, // Made optional for backward compatibility
    },
    amountInToken: {
      type: String,
      required: false,
    },
    amountInUSD: {
      type: Number,
      required: false,
    },

    // Transaction
    transactionHash: {
      type: String,
      required: false, // Made optional for backward compatibility
      index: true,
      sparse: true, // Allow multiple null values
    },
    blockchain: {
      type: String,
      enum: ["evm", "solana"],
      required: false,
    },
    blockNumber: Number,
    fromAddress: {
      type: String,
      required: false,
    },
    toAddress: String,

    // Fee distribution (new system)
    platformAmount: {
      type: String,
      required: false,
    },
    instructorAmount: {
      type: String,
      required: false,
    },
    revenueSplitAmount: {
      type: String,
      required: false,
    },
    platformFeePercentage: {
      type: Number,
      required: false,
    },
    instructorFeePercentage: {
      type: Number,
      required: false,
    },

    // Escrow
    escrowId: String,
    escrowStatus: {
      type: String,
      enum: ["pending", "released", "refunded", "failed", "dummy", "locked"],
      default: "pending",
      index: true,
    },
    escrowReleaseDate: {
      type: Date,
      required: false, // Made optional for backward compatibility
    },
    escrowReleasedAt: Date,
    escrowReleasedBy: String, // Wallet address that released
    escrowReleaseReason: String,
    escrowReleaseSignature: String,
    escrowCreatedTxHash: String,
    escrowReleaseTxHash: String,

    // Refund
    refundEligible: {
      type: Boolean,
      default: true,
    },
    refundRequestedAt: Date,
    refundProcessedAt: Date,
    refundTransactionHash: String,
    refundReason: String,
    refundedAt: Date,

    // Admin grant tracking
    grantedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    grantReason: {
      type: String,
      default: null,
    },

    // OLD PAYMENT SYSTEM FIELDS (for backward compatibility)
    paymentMethod: {
      type: String,
      enum: ["fdr", "usdt", "usdc", "eth", "stripe", "crypto", "free"],
      required: false,
    },
    amount: {
      type: Number,
      required: false,
    },
    currency: {
      type: String,
      enum: ["USD", "FDR", "USDC", "USDT"],
      required: false,
    },
    instructorRevenue: {
      type: Number,
      required: false,
    },
    platformFee: {
      type: Number,
      required: false,
    },
    paymentId: String, // For Stripe
    cashbackAmount: {
      type: Number,
      default: 0,
    },
    cashbackClaimed: {
      type: Boolean,
      default: false,
    },

    // Progress tracking
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

    // Experience earned
    experienceEarned: {
      type: Number,
      default: 0,
    },

    // Status
    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "refunded",
        "escrow_released",
        "disputed",
        "failed",
        "revoked",
        "expired",
        "completed",
      ],
      default: "pending",
      index: true,
    },
    revokedAt: Date,
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    revokeReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
purchaseSchema.index({ user: 1, course: 1 });
purchaseSchema.index({ user: 1, status: 1 });
purchaseSchema.index({ user: 1, isCompleted: 1 });
purchaseSchema.index({ course: 1, isCompleted: 1 });
purchaseSchema.index({ course: 1, createdAt: -1 });
purchaseSchema.index({ course: 1, status: 1 });
purchaseSchema.index({ lastAccessedAt: -1 });
purchaseSchema.index({ status: 1, createdAt: -1 });
purchaseSchema.index({ escrowStatus: 1, escrowReleaseDate: 1 });
purchaseSchema.index({ transactionHash: 1 }, { sparse: true });

// Mark lesson as completed (from old model)
purchaseSchema.methods.completeLesson = function (lessonId) {
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
    this.lastAccessedLesson = lessonId;
    this.lastAccessedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Refund eligibility check
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

module.exports =
  mongoose.models.PaymentPurchase ||
  mongoose.model("PaymentPurchase", purchaseSchema, "purchases");
