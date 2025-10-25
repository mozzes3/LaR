require("dotenv").config({
  path: require("path").join(__dirname, "../../../.env"),
});
const mongoose = require("mongoose");
const PaymentToken = require("../models/PaymentToken");

async function addRegistryAddress() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    const registryAddress = process.env.TOKEN_REGISTRY_ADDRESS_SEPOLIA;

    if (!registryAddress) {
      console.error("❌ TOKEN_REGISTRY_ADDRESS_SEPOLIA not found in .env");
      process.exit(1);
    }

    console.log("🔧 Registry address:", registryAddress);

    // Update all Sepolia tokens
    const result = await PaymentToken.updateMany(
      { chainId: 11155111 }, // Sepolia
      { $set: { registryContractAddress: registryAddress } }
    );

    console.log(`✅ Updated ${result.modifiedCount} tokens`);

    // Verify
    const tokens = await PaymentToken.find({ chainId: 11155111 });
    console.log("\n📋 Updated tokens:");
    tokens.forEach((token) => {
      console.log(`  ${token.symbol}: ${token.registryContractAddress}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addRegistryAddress();
