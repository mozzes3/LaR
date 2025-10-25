import api from "./api";

export const paymentApi = {
  // Get all available payment tokens
  getPaymentTokens: () => api.get("/payment/tokens"),

  // Get specific token price (for non-stablecoins)
  getTokenPrice: (tokenId) => api.get(`/payment/tokens/${tokenId}/price`),

  // Calculate payment details before purchase
  calculatePayment: (data) => api.post("/payment/calculate", data),

  // Process purchase
  processPurchase: (data) => api.post("/payment/purchase", data),

  // Request refund
  requestRefund: (purchaseId) => api.post(`/payment/refund`, { purchaseId }),
};
