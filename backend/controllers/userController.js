const User = require("../models/User");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select("-__v");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If viewing own profile, include private data
    const isOwnProfile =
      req.userId && req.userId.toString() === user._id.toString();

    const profileData = {
      id: user._id,
      username: user.username,
      walletAddress: isOwnProfile ? user.walletAddress : undefined,
      bio: user.bio,
      avatar: user.avatar,
      level: user.level,
      experience: user.experience,
      role: user.role,
      isInstructor: user.isInstructor,
      instructorVerified: user.instructorVerified,
      instructorBio: user.instructorBio,
      expertise: user.expertise,
      socialLinks: user.socialLinks,
      totalCoursesCreated: user.totalCoursesCreated,
      totalStudents: user.totalStudents,
      averageRating: user.averageRating,
      coursesEnrolled: user.coursesEnrolled,
      coursesCompleted: user.coursesCompleted,
      certificatesEarned: user.certificatesEarned,
      createdAt: user.createdAt,
    };

    res.json({ user: profileData });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { username, bio, socialLinks } = req.body;

    const user = await User.findById(req.userId);

    // Update username (check if available)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
      user.username = username;
    }

    // Update bio
    if (bio !== undefined) {
      user.bio = bio;
    }

    // Update social links
    if (socialLinks) {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks,
      };
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        bio: user.bio,
        socialLinks: user.socialLinks,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

/**
 * Upload avatar
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const user = await User.findById(req.userId);

    // Process image with sharp
    const filename = `avatar-${user._id}-${Date.now()}.jpg`;
    const filepath = path.join(__dirname, "../uploads/avatars", filename);

    // Ensure directory exists
    await fs.mkdir(path.join(__dirname, "../uploads/avatars"), {
      recursive: true,
    });

    // Resize and optimize image
    await sharp(req.file.buffer)
      .resize(200, 200, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 90 })
      .toFile(filepath);

    // Delete old avatar if exists
    if (user.avatar) {
      const oldPath = path.join(
        __dirname,
        "../uploads/avatars",
        path.basename(user.avatar)
      );
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.log("Old avatar not found or already deleted");
      }
    }

    // Update user avatar URL
    user.avatar = `/uploads/avatars/${filename}`;
    await user.save();

    res.json({
      success: true,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
};

/**
 * Get user stats
 */
const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const stats = {
      level: user.level,
      experience: user.experience,
      learningPoints: user.learningPoints,
      coursesEnrolled: user.coursesEnrolled,
      coursesCompleted: user.coursesCompleted,
      certificatesEarned: user.certificatesEarned,
      fdrBalance: user.fdrBalance,
    };

    // If instructor, add instructor stats
    if (user.isInstructor) {
      stats.instructor = {
        totalCoursesCreated: user.totalCoursesCreated,
        totalStudents: user.totalStudents,
        averageRating: user.averageRating,
        totalRevenue: user.totalRevenue,
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getStats,
};
