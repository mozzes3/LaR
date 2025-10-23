const mongoose = require("mongoose");

const paymentTokenSchema = new mongoose.Schema(
  {
    // Token identification
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true, // URL or base64
    },

    // Blockchain configuration
    blockchain: {
      type: String,
      enum: ["evm", "solana"],
      required: true,
    },
    chainId: {
      type: Number,
      required: true,
    },
    chainName: {
      type: String,
      required: true,
    },
    rpcUrl: {
      type: String,
      required: true,
    },
    explorerUrl: {
      type: String,
      required: true,
    },

    // Token contract details
    contractAddress: {
      type: String,
      required: true,
      index: true,
    },
    decimals: {
      type: Number,
      required: true,
      default: 18,
    },
    isNative: {
      type: Boolean,
      default: false, // true for ETH, BNB, etc.
    },

    // Payment contract addresses
    paymentContractAddress: {
      type: String,
      required: true,
      index: true,
    },

    // Price oracle configuration
    isStablecoin: {
      type: Boolean,
      default: false,
    },
    priceOracleType: {
      type: String,
      enum: ["coingecko", "chainlink", "fixed"],
      required: true,
    },
    coingeckoId: {
      type: String, // e.g., "ethereum", "tether"
    },
    chainlinkPriceFeed: {
      type: String, // Chainlink price feed contract address
    },
    fixedUsdPrice: {
      type: Number, // For stablecoins: 1.0
      default: 1.0,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },

    // Display settings
    displayOrder: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#000000",
    },
    badge: {
      type: String, // e.g., "Platform Token", "Most Popular"
    },

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentTokenSchema.index({ blockchain: 1, isActive: 1 });
paymentTokenSchema.index({ isActive: 1, displayOrder: 1 });
paymentTokenSchema.index({ chainId: 1, contractAddress: 1 });

module.exports = mongoose.model("PaymentToken", paymentTokenSchema);
