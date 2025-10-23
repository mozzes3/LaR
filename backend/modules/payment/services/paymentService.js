// backend/modules/payment/services/paymentService.js

class PaymentService {
  constructor() {
    this.mode = process.env.PAYMENT_MODE || "dummy";
    console.log(`Payment service running in ${this.mode} mode`);
  }

  async processPurchase(params) {
    if (this.mode === "dummy") {
      return this.processDummyPurchase(params);
    } else {
      return this.processBlockchainPurchase(params);
    }
  }

  async processDummyPurchase(params) {
    // For development - instant success
    return {
      success: true,
      transactionHash: `dummy_${Date.now()}_${Math.random()}`,
      escrowId: `dummy_escrow_${params.courseId}`,
      mode: "dummy",
    };
  }

  async processBlockchainPurchase(params) {
    // Real blockchain - we'll implement this next
    // For now, just structure
    throw new Error("Blockchain payment not yet implemented");
  }
}
