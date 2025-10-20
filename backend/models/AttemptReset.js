const mongoose = require("mongoose");

const attemptResetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    certification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProfessionalCertification",
      required: true,
      index: true,
    },
    paymentAmount: {
      type: Number,
      required: true,
    },
    paymentCurrency: {
      type: String,
      default: "USD",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "evm", "solana"],
      required: true,
    },
    paymentId: String,
    transactionHash: String,
    resetDate: {
      type: Date,
      default: Date.now,
    },
    attemptsResetCount: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

attemptResetSchema.index({ user: 1, certification: 1 });

module.exports = mongoose.model("AttemptReset", attemptResetSchema);
