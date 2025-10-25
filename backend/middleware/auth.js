const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // ✅ READ TOKEN FROM COOKIE INSTEAD OF HEADER
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ error: "No authentication token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId)
      .populate("roleRef")
      .populate("customPermissions");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "Account is banned" });
    }

    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(401).json({ error: "Authentication failed" });
  }
};
/**
 * Optional authentication - attach user if token exists, but don't fail
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      req.userId = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (user && user.isActive && !user.isBanned) {
      req.userId = user._id;
      req.user = user;
    } else {
      req.userId = null;
    }

    next();
  } catch (error) {
    req.userId = null;
    next();
  }
};

/**
 * Check if user is an instructor
 */
const isInstructor = (req, res, next) => {
  if (!req.user.isInstructor || !req.user.instructorVerified) {
    return res.status(403).json({
      error: "Access denied. Instructor verification required.",
    });
  }
  next();
};

/**
 * Check if user is admin or moderator
 */
const isAdmin = async (req, res, next) => {
  try {
    const user = req.user;

    // SuperAdmin always has access
    if (user.isSuperAdmin) {
      req.userRole = "superadmin";
      return next();
    }

    // Legacy admin check
    if (user.role === "admin") {
      req.userRole = "admin";
      return next();
    }

    // Check if user has admin or moderator roleRef
    if (user.roleRef) {
      const Role = require("../models/Role");
      const role = await Role.findById(user.roleRef);

      if (role && role.isActive) {
        // Allow admin, moderator, or any role with "moderator" in name
        if (
          role.name === "admin" ||
          role.name === "moderator" ||
          role.name.includes("moderator")
        ) {
          req.userRole = role.name;
          return next();
        }
      }
    }

    return res.status(403).json({
      error: "Access denied. Admin/Moderator privileges required.",
    });
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({ error: "Failed to verify access" });
  }
};

/**
 * Check if user has admin/moderator access (legacy OR AWS verified)
 */
const hasAdminAccess = async (req, res, next) => {
  try {
    const user = req.user;

    // SuperAdmin always has access
    if (user.isSuperAdmin) {
      req.userRole = "superadmin";
      return next();
    }

    // Check if user has admin role
    if (user.role === "admin") {
      // Verify wallet in AWS
      const awsModeratorService = require("../services/awsModeratorService");
      const walletRole = await awsModeratorService.getWalletRole(
        user.walletAddress
      );

      if (walletRole) {
        req.userRole = walletRole;
        return next();
      }
    }

    // Check if user has moderator role ref
    if (user.roleRef) {
      const Role = require("../models/Role");
      const role = await Role.findById(user.roleRef);

      if (
        role &&
        role.isActive &&
        (role.name === "admin" || role.name === "moderator")
      ) {
        // Verify wallet in AWS
        const awsModeratorService = require("../services/awsModeratorService");
        const walletRole = await awsModeratorService.getWalletRole(
          user.walletAddress
        );

        if (walletRole) {
          req.userRole = walletRole;
          return next();
        }
      }
    }

    return res.status(403).json({
      error: "Access denied. Admin/Moderator privileges required.",
    });
  } catch (error) {
    console.error("Admin access check error:", error);
    return res.status(500).json({ error: "Failed to verify access" });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  isInstructor,
  isAdmin,
  hasAdminAccess, // ADD THIS
};
