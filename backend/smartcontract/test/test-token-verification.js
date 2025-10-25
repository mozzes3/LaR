const tokenVerificationService = require("../services/tokenVerificationService");
const PaymentToken = require("../models/PaymentToken");

async function testVerification() {
  console.log("🧪 Testing Token Verification System\n");

  // Get a token from database
  const token = await PaymentToken.findOne({ symbol: "USDT" });

  if (!token) {
    console.log("❌ No USDT token found in database");
    return;
  }

  console.log("📋 Testing token:", token.symbol);
  console.log("Contract:", token.contractAddress);
  console.log("Escrow:", token.paymentContractAddress);
  console.log("Chain:", token.chainId, "\n");

  // Test verification
  const result = await tokenVerificationService.verifyTokenAgainstRegistry(
    token
  );

  console.log("Verification Result:");
  console.log("  Verified:", result.verified);
  console.log("  Error:", result.error || "None");
  console.log("  Warning:", result.warning || "None");

  // Test availability
  const availability = await tokenVerificationService.checkTokenAvailability(
    token
  );

  console.log("\nAvailability Checks:");
  console.log("  Database Active:", availability.checks.databaseActive);
  console.log("  Database Enabled:", availability.checks.databaseEnabled);
  console.log("  Registry Verified:", availability.checks.registryVerified);
  console.log("  RPC Connected:", availability.checks.rpcConnected);
  console.log("  Contract Exists:", availability.checks.contractExists);
  console.log("\n  Overall Available:", availability.available);
  console.log("  Reason:", availability.reason || "All checks passed");
}

require("../../config/database")();
testVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
