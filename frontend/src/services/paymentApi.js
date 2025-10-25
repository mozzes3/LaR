import api from "./api";

export const paymentApi = {
  getPaymentTokens: () => api.get("/payment/tokens"),
  getTokenPrice: (tokenId) => api.get(`/payment/tokens/${tokenId}/price`),
  calculatePayment: (data) => api.post("/payment/calculate", data),
  processPurchase: (data) => api.post("/payment/purchase", data),
  requestRefund: (purchaseId) => api.post(`/payment/refund`, { purchaseId }),
};

export const getStudentPurchaseHistory = () => {
  return api.get("/purchases/student/history");
};

// Request refund
export const requestRefund = (purchaseId) => {
  return api.post(`/purchases/${purchaseId}/refund`);
};
