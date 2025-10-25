const awsAdminService = require("../services/awsAdminService");

const isPaymentAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.walletAddress) {
      return res.status(403).json({
        error: "Access denied. Wallet address required for payment management.",
      });
    }

    const isAdmin = await awsAdminService.isAdminWallet(req.user.walletAddress);

    if (!isAdmin) {
      return res.status(403).json({
        error: "Access denied. Payment management requires admin privileges.",
      });
    }

    next();
  } catch (error) {
    console.error("Payment admin verification error:", error);
    return res.status(500).json({
      error: "Failed to verify admin access",
    });
  }
};

module.exports = { isPaymentAdmin };
