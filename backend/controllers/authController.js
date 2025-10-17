const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  verifyWalletSignature,
  generateSignMessage,
  generateNonce,
} = require("../utils/verifyWallet");

// Temporary storage for nonces (in production, use Redis)
const nonceStore = new Map();

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

    // Store nonce temporarily (expires in 5 minutes)
    nonceStore.set(walletAddress.toLowerCase(), {
      nonce,
      message,
      timestamp: Date.now(),
    });

    // Clean up old nonces (older than 5 minutes)
    for (const [address, data] of nonceStore.entries()) {
      if (Date.now() - data.timestamp > 5 * 60 * 1000) {
        nonceStore.delete(address);
      }
    }

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
    const storedData = nonceStore.get(normalizedAddress);

    if (!storedData) {
      return res.status(400).json({
        error: "Nonce not found or expired. Please request a new nonce.",
      });
    }

    // Check nonce expiration (5 minutes)
    if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
      nonceStore.delete(normalizedAddress);
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
    nonceStore.delete(normalizedAddress);

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

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        walletAddress: user.walletAddress,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      isNewUser,
      token,
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
        bio: user.bio, // ← ADD THIS TOO
        socialLinks: user.socialLinks,
      },
    });
  } catch (error) {
    console.error("Verify and login error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Get current authenticated user
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName || user.username, // ← ADD THIS
        walletAddress: user.walletAddress,
        avatar: user.avatar,
        bio: user.bio,
        email: user.email,
        socialLinks: user.socialLinks,
        isInstructor: user.isInstructor,
        instructorVerified: user.instructorVerified,
        instructorBio: user.instructorBio,
        expertise: user.expertise,
        badge: user.badge,
        level: user.level,
        experience: user.experience,
        coursesEnrolled: user.coursesEnrolled,
        coursesCompleted: user.coursesCompleted,
        certificatesEarned: user.certificatesEarned,
        learningPoints: user.learningPoints,
        totalStudents: user.totalStudents,
        totalCoursesCreated: user.totalCoursesCreated,
        averageRating: user.averageRating,
        role: user.role,
        lastUsernameChange: user.lastUsernameChange,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

/**
 * Logout (client-side token removal, but we can blacklist token if needed)
 */
const logout = async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, client will just remove the token
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};

module.exports = {
  getNonce,
  verifyAndLogin,
  getMe,
  logout,
};
