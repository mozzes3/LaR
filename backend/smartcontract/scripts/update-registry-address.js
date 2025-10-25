const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const PaymentToken = require("../../modules/payment/models/PaymentToken");

async function updateRegistryAddress() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🔧 Updating TokenRegistry address in database...\n");

    const token = await PaymentToken.findOne({
      symbol: "USDC",
      chainId: 11155111,
    });

    if (!token) {
      console.error("❌ USDC token not found");
      process.exit(1);
    }

    console.log("📋 Current configuration:");
    console.log("   Token:", token.symbol);
    console.log("   Escrow:", token.paymentContractAddress);
    console.log("   OLD Registry:", token.registryAddress || "NOT SET");

    // Get the new registry address from .env
    const newRegistryAddress = process.env.TOKEN_REGISTRY_ADDRESS;

    if (!newRegistryAddress) {
      console.error("\n❌ TOKEN_REGISTRY_ADDRESS not found in .env!");
      console.error("   Please add it to backend/.env:");
      console.error("   TOKEN_REGISTRY_ADDRESS=0xYourNewRegistryAddress");
      process.exit(1);
    }

    token.registryAddress = newRegistryAddress;
    await token.save();

    console.log("\n📋 NEW configuration:");
    console.log("   NEW Registry:", token.registryAddress);
    console.log("\n✅ Registry address updated!");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed:", error.message);
    process.exit(1);
  }
}

updateRegistryAddress();
