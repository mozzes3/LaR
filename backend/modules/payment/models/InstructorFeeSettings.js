const mongoose = require("mongoose");

const instructorFeeSettingsSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Custom fee percentages (overrides platform defaults)
    customPlatformFeePercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    customInstructorFeePercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Whether to use custom fees
    useCustomFees: {
      type: Boolean,
      default: false,
    },

    // Notes for admins
    adminNotes: {
      type: String,
      maxlength: 500,
    },

    // Payment wallets per blockchain (where instructor receives funds)
    paymentWallets: {
      type: Map,
      of: String, // key: blockchain (evm, solana), value: wallet address
      default: new Map(),
    },

    // Last updated by admin
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get effective fee percentages for an instructor
instructorFeeSettingsSchema.statics.getEffectiveFees = async function (
  instructorId
) {
  const PlatformSettings = require("./PlatformSettings");
  const platformSettings = await PlatformSettings.getSettings();

  const customSettings = await this.findOne({ instructor: instructorId });

  if (customSettings && customSettings.useCustomFees) {
    return {
      platformFeePercentage:
        customSettings.customPlatformFeePercentage ??
        platformSettings.defaultPlatformFeePercentage,
      instructorFeePercentage:
        customSettings.customInstructorFeePercentage ??
        platformSettings.defaultInstructorFeePercentage,
      isCustom: true,
    };
  }

  return {
    platformFeePercentage: platformSettings.defaultPlatformFeePercentage,
    instructorFeePercentage: platformSettings.defaultInstructorFeePercentage,
    isCustom: false,
  };
};

module.exports = mongoose.model(
  "InstructorFeeSettings",
  instructorFeeSettingsSchema
);
