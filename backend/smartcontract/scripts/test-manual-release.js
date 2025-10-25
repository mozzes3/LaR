const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const {
  getEscrowAutomationService,
} = require("../../modules/payment/services/automationService");

async function manualRelease() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("🔓 Manually triggering escrow release...\n");

  const service = getEscrowAutomationService();
  await service.processEligibleEscrows();

  console.log("\n✅ Done!");
  process.exit(0);
}

manualRelease();
