const awsModeratorService = require("../services/awsModeratorService");

/**
 * Verify user has proper AWS wallet verification for admin actions
 * SuperAdmin bypass this check
 */
const verifyAdminAccess = async (req, res, next) => {
  try {
    const user = req.user;

    // SuperAdmin always has access
    if (user.isSuperAdmin) {
      req.userRole = "superadmin";
      return next();
    }

    // Check AWS wallet verification
    if (!user.walletAddress) {
      return res.status(403).json({
        error: "Access denied",
        message: "Wallet address required for admin access",
      });
    }

    const walletRole = await awsModeratorService.getWalletRole(
      user.walletAddress
    );

    if (!walletRole) {
      return res.status(403).json({
        error: "Access denied",
        message: "Your wallet is not authorized for admin access",
      });
    }

    // Attach role to request
    req.userRole = walletRole;
    next();
  } catch (error) {
    console.error("Admin access verification error:", error);
    return res.status(500).json({
      error: "Failed to verify admin access",
    });
  }
};

/**
 * Require admin role (not moderator)
 */
const requireAdmin = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.isSuperAdmin) {
      req.userRole = "superadmin";
      return next();
    }

    if (!user.walletAddress) {
      return res.status(403).json({
        error: "Access denied",
        message: "Admin access required",
      });
    }

    const isAdmin = await awsModeratorService.isAdminWallet(user.walletAddress);

    if (!isAdmin) {
      return res.status(403).json({
        error: "Access denied",
        message: "Admin privileges required",
      });
    }

    req.userRole = "admin";
    next();
  } catch (error) {
    console.error("Admin requirement error:", error);
    return res.status(500).json({
      error: "Failed to verify admin access",
    });
  }
};

module.exports = {
  verifyAdminAccess,
  requireAdmin,
};
