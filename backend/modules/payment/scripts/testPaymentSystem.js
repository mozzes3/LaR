require("dotenv").config();
const mongoose = require("mongoose");
const PaymentToken = require("../models/PaymentToken");
const PlatformSettings = require("../models/PlatformSettings");
const { getPaymentService } = require("../services/blockchainService");

async function testPaymentSystem() {
  try {
    console.log("🧪 Testing Payment System...\n");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Database connected\n");

    // Test 1: Check payment token
    console.log("📋 Test 1: Payment Token Configuration");
    const token = await PaymentToken.findOne({
      symbol: "USDC",
      chainId: 11155111,
    });
    if (!token) {
      console.error("❌ USDC Sepolia token not found");
      process.exit(1);
    }
    console.log("✅ Token found:", token.symbol);
    console.log("   Chain:", token.chainName);
    console.log("   Contract:", token.contractAddress);
    console.log("   Escrow:", token.paymentContractAddress);
    console.log("");

    // Test 2: Check platform settings
    console.log("📋 Test 2: Platform Settings");
    const settings = await PlatformSettings.getSettings();
    console.log("✅ Settings loaded");
    console.log(
      "   Platform Fee:",
      settings.defaultPlatformFeePercentage / 100,
      "%"
    );
    console.log(
      "   Instructor Fee:",
      settings.defaultInstructorFeePercentage / 100,
      "%"
    );
    console.log(
      "   Revenue Split:",
      settings.revenueSplitPercentage / 100,
      "%"
    );
    console.log("   Escrow Period:", settings.defaultEscrowPeriod, "days");
    console.log("");

    // Test 3: Check payment mode
    console.log("📋 Test 3: Payment Configuration");
    const paymentMode = process.env.PAYMENT_MODE || "blockchain";
    const awsEnabled = process.env.AWS_SECRETS_ENABLED === "true";
    const activeNetwork = process.env.ACTIVE_NETWORK || "sepolia";

    console.log("✅ Configuration loaded");
    console.log("   Payment Mode:", paymentMode);
    console.log("   AWS Secrets:", awsEnabled ? "Enabled" : "Disabled");
    console.log("   Active Network:", activeNetwork);
    console.log("");

    // Test 4: Initialize payment service (dummy mode only)
    if (paymentMode === "dummy") {
      console.log("📋 Test 4: Payment Service Initialization (Dummy Mode)");
      const paymentService = getPaymentService();
      await paymentService.initialize(token);
      console.log("✅ Payment service initialized successfully");
      console.log("");
    } else {
      console.log("📋 Test 4: Payment Service (Blockchain Mode)");
      console.log("⚠️  Skipping initialization test in blockchain mode");
      console.log("   Requires operator wallet to be configured");
      console.log("");
    }

    console.log("═══════════════════════════════════════");
    console.log("✅ ALL TESTS PASSED");
    console.log("═══════════════════════════════════════");
    console.log("");
    console.log("Next steps:");
    console.log("1. Start backend: npm run dev");
    console.log("2. Test endpoints:");
    console.log("   GET  /api/payment/tokens");
    console.log("   POST /api/payment/calculate");
    console.log("   POST /api/payment/purchase");
    console.log("");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testPaymentSystem();
