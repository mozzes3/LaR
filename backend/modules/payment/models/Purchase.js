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

    // Payment details
    paymentToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentToken",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    amountInToken: {
      type: String, // Store as string to preserve precision
      required: true,
    },
    priceUSD: {
      type: Number,
      required: true,
    },
    amountInUSD: {
      type: Number, // Alias for compatibility
    },

    // Transaction
    transactionHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    blockchain: {
      type: String,
      enum: ["evm", "solana"],
      required: true,
    },
    blockNumber: Number,
    fromAddress: {
      type: String,
      required: true,
    },
    toAddress: {
      type: String, // NEW - instructor wallet address
    },

    // Fee distribution
    platformFeeAmount: {
      type: String, // In token
      required: true,
    },
    platformAmount: {
      type: String, // Alias for compatibility
    },
    instructorFeeAmount: {
      type: String, // In token
      required: true,
    },
    instructorAmount: {
      type: String, // Alias for compatibility
    },
    revenueSplitAmount: {
      type: String, // In token (20% of platform fee)
      required: true,
    },
    platformFeePercentage: {
      type: Number,
      required: true,
    },
    instructorFeePercentage: {
      type: Number,
      required: true,
    },

    // Escrow status
    escrowId: {
      type: String, // NEW - smart contract escrow ID
      index: true,
    },
    escrowStatus: {
      type: String,
      enum: ["pending", "released", "refunded", "failed", "dummy"], // UPDATED - added 'failed' and 'dummy'
      default: "pending",
      index: true,
    },
    escrowReleaseDate: {
      type: Date,
      required: true,
      index: true,
    },
    escrowReleasedAt: Date,
    escrowReleaseTransactionHash: String,
    escrowCreatedTxHash: String, // NEW - tx hash when escrow created in contract
    escrowReleaseTxHash: String, // NEW - alias for escrowReleaseTransactionHash

    // Refund tracking
    refundEligible: {
      type: Boolean,
      default: true,
      index: true,
    },
    refundRequestedAt: Date,
    refundProcessedAt: Date,
    refundTransactionHash: String,
    refundReason: String,
    refundDenialReason: String,

    // Progress tracking (for refund eligibility)
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalWatchTime: {
      type: Number,
      default: 0, // in seconds
    },
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId,
    },
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

    // Smart contract event data
    smartContractData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Status
    status: {
      type: String,
      enum: ["active", "refunded", "expired", "completed"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
purchaseSchema.index({ user: 1, course: 1 }, { unique: true });
purchaseSchema.index({ user: 1, status: 1 });
purchaseSchema.index({ course: 1, createdAt: -1 });
purchaseSchema.index({ escrowStatus: 1, escrowReleaseDate: 1 });
purchaseSchema.index({ transactionHash: 1 }, { unique: true });
purchaseSchema.index({ refundEligible: 1, status: 1 });

// Pre-save hook to sync alias fields
purchaseSchema.pre("save", function (next) {
  // Sync amountInUSD with priceUSD
  if (this.priceUSD && !this.amountInUSD) {
    this.amountInUSD = this.priceUSD;
  }
  if (this.amountInUSD && !this.priceUSD) {
    this.priceUSD = this.amountInUSD;
  }

  // Sync platformAmount with platformFeeAmount
  if (this.platformFeeAmount && !this.platformAmount) {
    this.platformAmount = this.platformFeeAmount;
  }
  if (this.platformAmount && !this.platformFeeAmount) {
    this.platformFeeAmount = this.platformAmount;
  }

  // Sync instructorAmount with instructorFeeAmount
  if (this.instructorFeeAmount && !this.instructorAmount) {
    this.instructorAmount = this.instructorFeeAmount;
  }
  if (this.instructorAmount && !this.instructorFeeAmount) {
    this.instructorFeeAmount = this.instructorAmount;
  }

  // Sync escrowReleaseTxHash with escrowReleaseTransactionHash
  if (this.escrowReleaseTransactionHash && !this.escrowReleaseTxHash) {
    this.escrowReleaseTxHash = this.escrowReleaseTransactionHash;
  }
  if (this.escrowReleaseTxHash && !this.escrowReleaseTransactionHash) {
    this.escrowReleaseTransactionHash = this.escrowReleaseTxHash;
  }

  next();
});

// Method to check refund eligibility
purchaseSchema.methods.checkRefundEligibility = function () {
  const now = new Date();
  const purchaseDate = this.createdAt;
  const daysSincePurchase = (now - purchaseDate) / (1000 * 60 * 60 * 24);

  // Get course escrow settings
  const escrowPeriodDays = this.escrowReleaseDate
    ? (this.escrowReleaseDate - purchaseDate) / (1000 * 60 * 60 * 24)
    : 14;

  // Check if within refund period
  if (daysSincePurchase > escrowPeriodDays) {
    return {
      eligible: false,
      reason: "Refund period has expired",
    };
  }

  // Check escrow status
  if (this.escrowStatus === "released") {
    return {
      eligible: false,
      reason: "Payment has already been released from escrow",
    };
  }

  if (this.escrowStatus === "refunded") {
    return {
      eligible: false,
      reason: "Payment has already been refunded",
    };
  }

  // Eligibility passed
  return {
    eligible: true,
    reason: null,
  };
};

// Method to calculate escrow release eligibility
purchaseSchema.methods.checkEscrowReleaseEligibility = function (courseData) {
  const now = new Date();
  const purchaseDate = this.createdAt;
  const daysSincePurchase = (now - purchaseDate) / (1000 * 60 * 60 * 24);

  const minDays = courseData.escrowSettings?.refundPeriodDays || 14;
  const minWatchPercentage =
    courseData.escrowSettings?.minWatchPercentage || 20;
  const maxWatchTimeMinutes = courseData.escrowSettings?.maxWatchTime || 30;

  // Condition 1: Minimum days passed
  if (daysSincePurchase >= minDays) {
    return { canRelease: true, reason: "Minimum escrow period completed" };
  }

  // Condition 2: Minimum watch percentage
  if (this.progress >= minWatchPercentage) {
    return {
      canRelease: true,
      reason: `Watched ${this.progress}% of course`,
    };
  }

  // Condition 3: Minimum watch time
  const watchTimeMinutes = this.totalWatchTime / 60;
  if (watchTimeMinutes >= maxWatchTimeMinutes) {
    return {
      canRelease: true,
      reason: `Watched ${watchTimeMinutes.toFixed(0)} minutes`,
    };
  }

  // Condition 4: Course is shorter than threshold, check percentage
  const courseDurationMinutes = courseData.duration || 0;
  if (courseDurationMinutes < maxWatchTimeMinutes) {
    const threshold = 20; // 20% for short courses
    if (this.progress >= threshold) {
      return {
        canRelease: true,
        reason: `Watched ${this.progress}% of short course`,
      };
    }
  }

  return {
    canRelease: false,
    reason: "Escrow conditions not yet met",
  };
};

// Method to mark lesson as completed
purchaseSchema.methods.completeLesson = function (lessonId) {
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
    this.lastAccessedLesson = lessonId;
    this.lastAccessedAt = new Date();
    return this.save();
  }
};

module.exports =
  mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);
