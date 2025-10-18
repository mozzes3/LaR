const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

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
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin" && !req.user.isSuperAdmin) {
    return res.status(403).json({
      error: "Access denied. Admin privileges required.",
    });
  }
  next();
};

/**
 * Optional authentication - attach user if token exists, but don't fail
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId)
        .populate("roleRef")
        .populate("customPermissions");

      if (user && user.isActive && !user.isBanned) {
        req.user = user;
        req.userId = user._id;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};

module.exports = {
  authenticate,
  isInstructor,
  isAdmin,
  optionalAuth,
};
