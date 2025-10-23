// backend/modules/payment/scripts/seedTestToken.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../../.env.development"),
});
const PaymentToken = require("../models/PaymentToken");

async function seedTestToken() {
  try {
    // Debug: Check if env loaded
    console.log("MongoDB URI exists:", !!process.env.MONGODB_URI);

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const result = await PaymentToken.findOneAndUpdate(
      { symbol: "USDC", chainId: 11155111 },
      {
        symbol: "USDC",
        name: "Circle USDC (Testnet)",
        blockchain: "evm",
        chainId: 11155111,
        chainName: "Sepolia",
        contractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        paymentContractAddress: "0xe63e052b7853ddbf80896e00e770be4d02412dd5",
        decimals: 6,
        isActive: true,
        isEnabled: true,
        isStablecoin: true,
        priceOracleType: "fixed",
        fixedUsdPrice: 1.0,
        rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/lkDjfzyweZencyStM6rQ_",
        displayOrder: 1,
      },
      { upsert: true, new: true }
    );

    console.log("✅ USDC token configured");
    console.log("Contract:", result.paymentContractAddress);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

seedTestToken();
