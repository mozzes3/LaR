const cron = require("node-cron");
const Purchase = require("../models/PurchaseNew");
const Course = require("../models/Course");
const PaymentToken = require("../models/PaymentToken");
const { getPaymentService } = require("./paymentBlockchainService");
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
    cron.schedule("0 * * * *", async () => {
      await this.processEligibleEscrows();
    });

    // Also run on startup after 2 minutes
    setTimeout(() => {
      this.processEligibleEscrows();
    }, 120000);

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
        escrowStatus: "pending",
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
        // Additional eligibility check
        const purchaseDoc = await Purchase.findById(purchase._id);
        const eligibility = purchaseDoc.checkEscrowReleaseEligibility(
          purchase.course
        );

        if (!eligibility.canRelease) {
          console.log(
            `⏭️  Skipping purchase ${purchase._id}: ${eligibility.reason}`
          );
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
            // Verify escrow can be released
            const canRelease = await escrowContract.canReleaseEscrow(escrowId);
            if (canRelease) {
              escrowIds.push({
                escrowId,
                purchaseId: purchase._id,
              });
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

      if (purchase.escrowStatus !== "pending") {
        throw new Error("Escrow is not in pending status");
      }

      const eligibility = purchase.checkEscrowReleaseEligibility(
        purchase.course
      );

      if (!eligibility.canRelease) {
        throw new Error(eligibility.reason);
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
