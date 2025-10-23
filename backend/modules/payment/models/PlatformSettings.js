const mongoose = require("mongoose");

const platformSettingsSchema = new mongoose.Schema(
  {
    // Fee settings
    defaultPlatformFeePercentage: {
      type: Number,
      required: true,
      default: 20, // 20%
      min: 0,
      max: 100,
    },
    defaultInstructorFeePercentage: {
      type: Number,
      required: true,
      default: 80, // 80%
      min: 0,
      max: 100,
    },

    // Revenue split wallet (20% of platform fee goes here)
    revenueSplitPercentage: {
      type: Number,
      required: true,
      default: 20, // 20% of platform fee
      min: 0,
      max: 100,
    },

    // Escrow settings
    defaultEscrowPeriodDays: {
      type: Number,
      required: true,
      default: 14,
      min: 1,
      max: 90,
    },
    defaultMinWatchPercentage: {
      type: Number,
      required: true,
      default: 20,
      min: 0,
      max: 100,
    },
    defaultMaxWatchTimeMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 5,
      max: 1440,
    },

    // Revenue split wallet addresses (per blockchain)
    revenueSplitWallets: {
      type: Map,
      of: String, // key: blockchain (evm, solana), value: wallet address
      default: new Map(),
    },

    // Platform operational wallets (per blockchain)
    platformWallets: {
      type: Map,
      of: String, // key: blockchain (evm, solana), value: wallet address
      default: new Map(),
    },

    // Singleton pattern - only one settings document
    _id: {
      type: String,
      default: "platform_settings",
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get or create settings
platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById("platform_settings");
  if (!settings) {
    settings = await this.create({ _id: "platform_settings" });
  }
  return settings;
};

// Static method to update settings
platformSettingsSchema.statics.updateSettings = async function (updates) {
  const settings = await this.getSettings();
  Object.assign(settings, updates);
  await settings.save();
  return settings;
};

module.exports = mongoose.model("PlatformSettings", platformSettingsSchema);
