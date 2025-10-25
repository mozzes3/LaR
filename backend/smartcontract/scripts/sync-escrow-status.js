const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const { ethers } = require("ethers");
const Purchase = require("../../modules/payment/models/Purchase");
const PaymentToken = require("../../modules/payment/models/PaymentToken");

const ESCROW_ABI = [
  "function getEscrow(bytes32 escrowId) view returns (tuple(address student, address instructor, uint256 totalAmount, uint256 platformFee, uint256 instructorFee, uint256 revenueSplitAmount, uint256 releaseDate, bool isReleased, bool isRefunded, uint256 createdAt, bytes32 courseId))",
];

async function syncEscrowStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔍 Syncing escrow status from blockchain...");

    // Find all locked escrows
    const lockedPurchases = await Purchase.find({
      escrowStatus: "locked",
      escrowId: { $exists: true, $ne: null },
    }).populate("paymentToken");

    console.log(`📊 Found ${lockedPurchases.length} locked escrow(s) to check`);

    for (const purchase of lockedPurchases) {
      try {
        console.log(`\n🔍 Checking escrow: ${purchase.escrowId}`);

        const token = purchase.paymentToken;

        // Setup provider and contract
        const provider = new ethers.JsonRpcProvider(token.rpcUrl);
        const escrowContract = new ethers.Contract(
          token.paymentContractAddress,
          ESCROW_ABI,
          provider
        );

        // Get escrow from blockchain
        const escrowData = await escrowContract.getEscrow(purchase.escrowId);

        console.log(`   isReleased: ${escrowData.isReleased}`);
        console.log(`   isRefunded: ${escrowData.isRefunded}`);

        // Update database if status changed
        if (escrowData.isReleased) {
          await Purchase.findByIdAndUpdate(purchase._id, {
            escrowStatus: "released",
            status: "active",
          });
          console.log(`   ✅ Updated to RELEASED`);
        } else if (escrowData.isRefunded) {
          await Purchase.findByIdAndUpdate(purchase._id, {
            escrowStatus: "refunded",
            status: "refunded",
          });
          console.log(`   ✅ Updated to REFUNDED`);
        } else {
          console.log(`   ℹ️  Still locked`);
        }
      } catch (err) {
        console.error(
          `   ❌ Error checking escrow ${purchase.escrowId}:`,
          err.message
        );
      }
    }

    console.log("\n✅ Sync complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
}

syncEscrowStatus();
