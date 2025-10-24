require("dotenv").config();
const mongoose = require("mongoose");
const PlatformSettings = require("../models/PlatformSettings");

const DEFAULT_SETTINGS = {
  defaultPlatformFeePercentage: 2000, // 20.00%
  defaultInstructorFeePercentage: 8000, // 80.00%
  revenueSplitPercentage: 2000, // 20% of platform fee goes to revenue split wallet
  defaultEscrowPeriod: 14, // days
  platformTreasuryWallet:
    process.env.OPERATOR_WALLET_ADDRESS ||
    "0x91f1C7Fb8Ae71556241ED141f1797E1FDc8942a5",
  revenueSplitWallet:
    process.env.OPERATOR_WALLET_ADDRESS ||
    "0x91f1C7Fb8Ae71556241ED141f1797E1FDc8942a5", // Will use multi-sig later
};

async function seedPlatformSettings() {
  try {
    console.log("🌱 Seeding platform settings...");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");

    const existing = await PlatformSettings.findOne();

    if (existing) {
      console.log("⚠️  Platform settings already exist, updating...");
      await PlatformSettings.findByIdAndUpdate(existing._id, DEFAULT_SETTINGS);
      console.log("✅ Settings updated");
    } else {
      await PlatformSettings.create(DEFAULT_SETTINGS);
      console.log("✅ Platform settings created");
    }

    console.log("\n📋 Settings:");
    console.log(
      "   Platform Fee:",
      DEFAULT_SETTINGS.defaultPlatformFeePercentage / 100,
      "%"
    );
    console.log(
      "   Instructor Fee:",
      DEFAULT_SETTINGS.defaultInstructorFeePercentage / 100,
      "%"
    );
    console.log(
      "   Revenue Split:",
      DEFAULT_SETTINGS.revenueSplitPercentage / 100,
      "%"
    );
    console.log(
      "   Escrow Period:",
      DEFAULT_SETTINGS.defaultEscrowPeriod,
      "days"
    );

    await mongoose.disconnect();
    console.log("\n✅ Seed completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedPlatformSettings();
