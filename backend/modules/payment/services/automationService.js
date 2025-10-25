const cron = require("node-cron");
const Purchase = require("../models/Purchase");
const Course = require("../../../models/Course");
const PaymentToken = require("../models/PaymentToken");
const { getPaymentService } = require("./blockchainService");
const { ethers } = require("ethers");

/**
 * Escrow Release Automation Service
 * Runs every hour to check and release eligible escrows
 */
class EscrowAutomationService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the automation service
   */
  start() {
    console.log("🤖 Starting Escrow Automation Service...");

    // Run every hour
    cron.schedule("*/5 * * * *", async () => {
      await this.processEligibleEscrows();
    });

    // Also run on startup after 2 minutes
    setTimeout(() => {
      this.processEligibleEscrows();
    }, 30000);

    console.log("✅ Escrow Automation Service started");
  }

  /**
   * Process all eligible escrows
   */
  async processEligibleEscrows() {
    if (this.isRunning) {
      console.log("⚠️  Escrow automation already running, skipping...");
      return;
    }

    try {
      this.isRunning = true;
      console.log("🔍 Checking for eligible escrows to release...");

      const now = new Date();

      // Find purchases eligible for escrow release
      const eligiblePurchases = await Purchase.find({
        escrowStatus: "locked",
        status: "active",
        escrowReleaseDate: { $lte: now },
      })
        .populate("course")
        .populate("paymentToken")
        .limit(100)
        .lean();

      if (eligiblePurchases.length === 0) {
        console.log("✅ No escrows eligible for release");
        return;
      }

      console.log(
        `📦 Found ${eligiblePurchases.length} escrows eligible for release`
      );

      // Group by blockchain and payment token
      const groupedByChain = {};

      for (const purchase of eligiblePurchases) {
        // Skip if no escrow ID
        if (!purchase.escrowId) {
          console.log(`⏭️  Skipping purchase ${purchase._id}: No escrow ID`);
          continue;
        }

        const key = `${purchase.blockchain}_${purchase.paymentToken.chainId}`;

        if (!groupedByChain[key]) {
          groupedByChain[key] = {
            blockchain: purchase.blockchain,
            chainId: purchase.paymentToken.chainId,
            paymentToken: purchase.paymentToken,
            purchases: [],
          };
        }

        groupedByChain[key].purchases.push(purchase);
      }

      // Process each chain
      for (const [key, group] of Object.entries(groupedByChain)) {
        await this.processChainEscrows(group);
      }

      console.log("✅ Escrow automation completed");
    } catch (error) {
      console.error("❌ Escrow automation error:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process escrows for a specific blockchain
   */
  async processChainEscrows(group) {
    try {
      console.log(
        `\n🔗 Processing ${group.purchases.length} escrows on ${group.blockchain} (Chain ID: ${group.chainId})`
      );

      const paymentService = getPaymentService();
      await paymentService.initialize(group.paymentToken);

      const escrowContract = paymentService.getEscrowContract(
        group.blockchain,
        group.chainId
      );

      // Get escrow IDs from smart contract
      const escrowIds = [];

      for (const purchase of group.purchases) {
        try {
          const courseIdBytes32 = ethers.id(purchase.course._id.toString());
          const escrowId = await escrowContract.studentCourseEscrow(
            purchase.fromAddress,
            courseIdBytes32
          );
          if (escrowId !== ethers.ZeroHash) {
            // Get escrow data and verify it can be released
            try {
              const escrowData = await escrowContract.getEscrow(escrowId);

              const canRelease =
                !escrowData.isReleased &&
                !escrowData.isRefunded &&
                Date.now() / 1000 >= Number(escrowData.releaseDate);

              if (canRelease) {
                console.log(`   ✅ Escrow ${escrowId} is eligible for release`);
                escrowIds.push({
                  escrowId,
                  purchaseId: purchase._id,
                });
              } else {
                console.log(
                  `   ⏭️  Escrow ${escrowId} not yet eligible (release: ${new Date(
                    Number(escrowData.releaseDate) * 1000
                  )})`
                );
              }
            } catch (err) {
              console.error(
                `   ❌ Error checking escrow ${escrowId}:`,
                err.message
              );
            }
          }
        } catch (error) {
          console.error(
            `Failed to get escrow ID for purchase ${purchase._id}:`,
            error.message
          );
        }
      }

      if (escrowIds.length === 0) {
        console.log("No valid escrows to release on this chain");
        return;
      }

      console.log(`✅ Found ${escrowIds.length} valid escrows to release`);

      // Batch release escrows (max 20 at a time for gas optimization)
      const batchSize = 20;

      for (let i = 0; i < escrowIds.length; i += batchSize) {
        const batch = escrowIds.slice(i, i + batchSize);
        const batchEscrowIds = batch.map((item) => item.escrowId);

        try {
          console.log(`📤 Releasing batch of ${batch.length} escrows...`);

          const result = await paymentService.batchReleaseEscrows(
            batchEscrowIds,
            group.blockchain,
            group.chainId
          );

          console.log(`✅ Batch released: ${result.transactionHash}`);

          // Update database
          for (const item of batch) {
            await Purchase.findByIdAndUpdate(item.purchaseId, {
              escrowStatus: "released",
              escrowReleasedAt: new Date(),
              escrowReleaseTransactionHash: result.transactionHash,
              refundEligible: false,
            });
          }
        } catch (error) {
          console.error("❌ Failed to release batch:", error);

          // Fall back to individual releases
          for (const item of batch) {
            try {
              const result = await paymentService.releaseEscrow({
                escrowId: item.escrowId,
                blockchain: group.blockchain,
                chainId: group.chainId,
              });

              await Purchase.findByIdAndUpdate(item.purchaseId, {
                escrowStatus: "released",
                escrowReleasedAt: new Date(),
                escrowReleaseTransactionHash: result.transactionHash,
                refundEligible: false,
              });

              console.log(
                `✅ Individual release for purchase ${item.purchaseId}`
              );
            } catch (individualError) {
              console.error(
                `❌ Failed to release purchase ${item.purchaseId}:`,
                individualError
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to process chain escrows:`, error);
    }
  }

  /**
   * Manually trigger escrow release for a specific purchase
   */
  async releaseSpecificEscrow(purchaseId) {
    try {
      const purchase = await Purchase.findById(purchaseId)
        .populate("course")
        .populate("paymentToken");

      if (!purchase) {
        throw new Error("Purchase not found");
      }

      if (purchase.escrowStatus !== "locked") {
        throw new Error("Escrow is not in locked status");
      }
      if (purchase.escrowStatus !== "locked") {
        throw new Error("Escrow is not in locked status");
      }

      if (new Date() < purchase.escrowReleaseDate) {
        throw new Error("Escrow release date has not passed");
      }
      const paymentService = getPaymentService();
      await paymentService.initialize(purchase.paymentToken);

      const escrowContract = paymentService.getEscrowContract(
        purchase.blockchain,
        purchase.paymentToken.chainId
      );

      const courseIdBytes32 = ethers.id(purchase.course._id.toString());
      const escrowId = await escrowContract.studentCourseEscrow(
        purchase.fromAddress,
        courseIdBytes32
      );

      if (escrowId === ethers.ZeroHash) {
        throw new Error("Escrow not found on blockchain");
      }

      const result = await paymentService.releaseEscrow({
        escrowId,
        blockchain: purchase.blockchain,
        chainId: purchase.paymentToken.chainId,
      });

      purchase.escrowStatus = "released";
      purchase.escrowReleasedAt = new Date();
      purchase.escrowReleaseTransactionHash = result.transactionHash;
      purchase.refundEligible = false;

      await purchase.save();

      return {
        success: true,
        transactionHash: result.transactionHash,
      };
    } catch (error) {
      console.error("Manual escrow release error:", error);
      throw error;
    }
  }
}

// Singleton instance
let automationServiceInstance = null;

function getEscrowAutomationService() {
  if (!automationServiceInstance) {
    automationServiceInstance = new EscrowAutomationService();
  }
  return automationServiceInstance;
}

module.exports = {
  EscrowAutomationService,
  getEscrowAutomationService,
};
