const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  verifyWalletSignature,
  generateSignMessage,
  generateNonce,
} = require("../utils/verifyWallet");

// Redis client - initialized in server.js and passed via app.locals
let redisClient = null;

// Fallback to Map if Redis not available
const nonceMapFallback = new Map();

/**
 * Initialize Redis client (called from server.js)
 */
const initRedis = (client) => {
  redisClient = client;
};

/**
 * Store nonce (Redis or Map fallback)
 */
const storeNonce = async (address, data) => {
  if (redisClient?.isReady) {
    await redisClient.setEx(
      `nonce:${address}`,
      300, // 5 minutes TTL
      JSON.stringify(data)
    );
  } else {
    nonceMapFallback.set(address, data);
    // Clean up old nonces from Map
    setTimeout(() => {
      for (const [addr, storedData] of nonceMapFallback.entries()) {
        if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
          nonceMapFallback.delete(addr);
        }
      }
    }, 5 * 60 * 1000);
  }
};

/**
 * Get nonce (Redis or Map fallback)
 */
const getNonceData = async (address) => {
  if (redisClient?.isReady) {
    const data = await redisClient.get(`nonce:${address}`);
    return data ? JSON.parse(data) : null;
  } else {
    return nonceMapFallback.get(address) || null;
  }
};

/**
 * Delete nonce (Redis or Map fallback)
 */
const deleteNonce = async (address) => {
  if (redisClient?.isReady) {
    await redisClient.del(`nonce:${address}`);
  } else {
    nonceMapFallback.delete(address);
  }
};

/**
 * Generate nonce for wallet authentication
 */
const getNonce = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address required" });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address format" });
    }

    // Generate nonce
    const nonce = generateNonce();
    const message = generateSignMessage(walletAddress.toLowerCase(), nonce);

    // Store nonce with timestamp
    await storeNonce(walletAddress.toLowerCase(), {
      nonce,
      message,
      timestamp: Date.now(),
    });

    res.json({
      nonce,
      message,
      expiresIn: 300, // 5 minutes
    });
  } catch (error) {
    console.error("Get nonce error:", error);
    res.status(500).json({ error: "Failed to generate nonce" });
  }
};

/**
 * Verify wallet signature and login/register user
 */
const verifyAndLogin = async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({
        error: "Wallet address and signature required",
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Get stored nonce
    const storedData = await getNonceData(normalizedAddress);

    if (!storedData) {
      return res.status(400).json({
        error: "Nonce not found or expired. Please request a new nonce.",
      });
    }

    // Check nonce expiration (5 minutes)
    if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
      await deleteNonce(normalizedAddress);
      return res.status(400).json({
        error: "Nonce expired. Please request a new nonce.",
      });
    }

    // Verify signature
    const isValid = await verifyWalletSignature(
      normalizedAddress,
      signature,
      storedData.message
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Delete used nonce
    await deleteNonce(normalizedAddress);

    // Find or create user
    let user = await User.findOne({ walletAddress: normalizedAddress });
    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;

      // Generate unique username
      const randomSuffix = Math.floor(Math.random() * 10000);
      const username = `lizard${randomSuffix}`;

      user = await User.create({
        walletAddress: normalizedAddress,
        username,
        role: "student",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token - SHORT LIVED (15 minutes)
    const accessToken = jwt.sign(
      {
        userId: user._id,
        walletAddress: user.walletAddress,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Generate refresh token (7 days)
    const refreshToken = jwt.sign(
      {
        userId: user._id,
        type: "refresh",
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      isNewUser,
      token: accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatar,
        role: user.role,
        isInstructor: user.isInstructor,
        level: user.level,
        experience: user.experience,
        bio: user.bio,
        socialLinks: user.socialLinks,
      },
    });
  } catch (error) {
    console.error("Verify and login error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== "refresh") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive || user.isBanned) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user._id,
        walletAddress: user.walletAddress,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      success: true,
      token: accessToken,
      expiresIn: 900,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Refresh token expired" });
    }
    console.error("Refresh token error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

/**
 * Get current authenticated user
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v").lean(); // ✅ OPTIMIZATION

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName || user.username,
        walletAddress: user.walletAddress,
        avatar: user.avatar,
        bio: user.bio,
        email: user.email,
        socialLinks: user.socialLinks,
        isInstructor: user.isInstructor,
        instructorVerified: user.instructorVerified,
        role: user.role,
        level: user.level,
        experience: user.experience,
        totalXP: user.totalXP,
        currentStreak: user.currentStreak,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can blacklist the token if needed (requires Redis)

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

module.exports = {
  getNonce,
  verifyAndLogin,
  refreshAccessToken,
  getMe,
  logout,
  initRedis, // Export for initialization
};
