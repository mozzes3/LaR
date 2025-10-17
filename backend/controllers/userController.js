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

    const user = await User.findOne({ username }).select(
      "-walletAddress -nonce"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName || user.username, // ← ADD THIS
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
        createdAt: user.createdAt,
        lastUsernameChange: user.lastUsernameChange,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const {
      username,
      displayName,
      bio,
      socialLinks,
      instructorBio,
      expertise,
    } = req.body;

    console.log("📝 Received update request:");
    console.log("- displayName:", displayName);
    console.log("- bio:", bio);
    console.log("- username:", username);

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update displayName (can change anytime)
    if (displayName !== undefined) {
      console.log(
        "✏️ Updating displayName from",
        user.displayName,
        "to",
        displayName
      );
      user.displayName = displayName;
    }

    // Update username (30-day limit)
    if (username && username !== user.username) {
      // Check if 30 days have passed since last change
      if (user.lastUsernameChange) {
        const daysSinceChange = Math.floor(
          (Date.now() - user.lastUsernameChange) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceChange < 30) {
          return res.status(400).json({
            error: `You can change your username again in ${
              30 - daysSinceChange
            } days`,
          });
        }
      }

      // Check if username is available
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ error: "Username already taken" });
      }

      user.username = username;
      user.lastUsernameChange = new Date();
    }

    // Update bio
    if (bio !== undefined) {
      user.bio = bio;
    }

    // Update instructor bio
    if (instructorBio !== undefined) {
      user.instructorBio = instructorBio;
    }

    // Update expertise
    if (expertise !== undefined) {
      user.expertise = expertise;
    }

    // Update social links
    if (socialLinks) {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks,
      };
    }

    await user.save();

    console.log("✅ User saved successfully");
    console.log("📦 Saved displayName:", user.displayName);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        instructorBio: user.instructorBio,
        expertise: user.expertise,
        socialLinks: user.socialLinks,
        lastUsernameChange: user.lastUsernameChange,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user with basic stats
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all purchases for detailed stats
    const Purchase = require("../models/Purchase");
    const purchases = await Purchase.find({ user: userId })
      .populate("course", "totalDuration")
      .lean();

    // Calculate total watch time (in minutes)
    let totalWatchTimeMinutes = 0;
    purchases.forEach((purchase) => {
      if (purchase.course?.totalDuration && purchase.progress) {
        const watchedSeconds =
          (purchase.course.totalDuration * purchase.progress) / 100;
        totalWatchTimeMinutes += Math.floor(watchedSeconds / 60);
      }
    });

    // Calculate streak (simplified - you can improve this later)
    const lastLogin = user.lastLogin;
    const now = new Date();
    const diffDays = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
    const currentStreak = diffDays <= 1 ? user.currentStreak || 1 : 0;

    // Get completed courses count
    const completedCount = purchases.filter((p) => p.isCompleted).length;

    res.json({
      success: true,
      stats: {
        totalCourses: purchases.length,
        completedCourses: completedCount,
        inProgressCourses: purchases.length - completedCount,
        totalWatchTimeMinutes,
        certificatesEarned: user.certificatesEarned || completedCount,
        currentStreak,
        fdrEarned: user.fdrBalance || 0,
        level: user.level || 1,
        experience: user.experience || 0,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      error: "Failed to get dashboard stats",
      details: error.message,
    });
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
 * Get instructor dashboard stats
 */
const getInstructorDashboardStats = async (req, res) => {
  try {
    const instructorId = req.userId;

    // Verify user is an instructor
    const instructor = await User.findById(instructorId);
    if (!instructor || !instructor.isInstructor) {
      return res.status(403).json({ error: "Not authorized as instructor" });
    }

    // Get all instructor's courses
    const Course = require("../models/Course");
    const Purchase = require("../models/Purchase");
    const Review = require("../models/Review");

    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);

    // Get all purchases for instructor's courses
    const purchases = await Purchase.find({
      course: { $in: courseIds },
      status: "active",
    }).populate("course", "price");

    // Calculate earnings
    let totalEarnings = 0;
    let pendingEarnings = 0;
    purchases.forEach((purchase) => {
      const amount = purchase.course?.price?.usd || 0;
      totalEarnings += amount;
      // Simulate escrow period (purchases within last 30 days are pending)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (purchase.createdAt > thirtyDaysAgo) {
        pendingEarnings += amount;
      }
    });

    const availableToWithdraw = totalEarnings - pendingEarnings;

    // Get total students (unique users who purchased)
    const totalStudents = new Set(purchases.map((p) => p.user.toString())).size;

    // Get average rating across all courses
    const totalRating = courses.reduce(
      (sum, course) => sum + (course.averageRating || 0),
      0
    );
    const averageRating = courses.length > 0 ? totalRating / courses.length : 0;

    // Get total reviews
    const totalReviews = await Review.countDocuments({
      course: { $in: courseIds },
    });

    res.json({
      success: true,
      stats: {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        pendingEarnings: Math.round(pendingEarnings * 100) / 100,
        availableToWithdraw: Math.round(availableToWithdraw * 100) / 100,
        totalStudents,
        totalCourses: courses.length,
        publishedCourses: courses.filter((c) => c.status === "published")
          .length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
      },
    });
  } catch (error) {
    console.error("Get instructor dashboard stats error:", error);
    res.status(500).json({ error: "Failed to get dashboard stats" });
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

/**
 * Get instructor recent activity
 */
const getInstructorRecentActivity = async (req, res) => {
  try {
    const instructorId = req.userId;
    const limit = parseInt(req.query.limit) || 10;

    const Course = require("../models/Course");
    const Purchase = require("../models/Purchase");
    const Review = require("../models/Review");

    // Get instructor's course IDs
    const courses = await Course.find({ instructor: instructorId }).select(
      "_id title"
    );
    const courseIds = courses.map((c) => c._id);

    // Get recent purchases
    const recentPurchases = await Purchase.find({
      course: { $in: courseIds },
      status: "active",
    })
      .populate("user", "username")
      .populate("course", "title price")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get recent reviews
    const recentReviews = await Review.find({
      course: { $in: courseIds },
    })
      .populate("user", "username")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get recent completions
    const recentCompletions = await Purchase.find({
      course: { $in: courseIds },
      isCompleted: true,
    })
      .populate("user", "username")
      .populate("course", "title")
      .sort({ completedAt: -1 })
      .limit(limit)
      .lean();

    // Combine and sort all activities
    const activities = [
      ...recentPurchases.map((p) => ({
        type: "purchase",
        student: p.user?.username || "Unknown",
        course: p.course?.title || "Unknown Course",
        amount: p.course?.price?.usd || 0,
        time: p.createdAt,
      })),
      ...recentReviews.map((r) => ({
        type: "review",
        student: r.user?.username || "Unknown",
        course: r.course?.title || "Unknown Course",
        rating: r.rating,
        time: r.createdAt,
      })),
      ...recentCompletions.map((c) => ({
        type: "completion",
        student: c.user?.username || "Unknown",
        course: c.course?.title || "Unknown Course",
        time: c.completedAt || c.updatedAt,
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit);

    // Format time to "X hours/days ago"
    const formatTime = (date) => {
      const now = new Date();
      const diff = now - new Date(date);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (hours < 1) return "Just now";
      if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
      return new Date(date).toLocaleDateString();
    };

    const formattedActivities = activities.map((a) => ({
      ...a,
      time: formatTime(a.time),
    }));

    res.json({
      success: true,
      activities: formattedActivities,
    });
  } catch (error) {
    console.error("Get instructor recent activity error:", error);
    res.status(500).json({ error: "Failed to get recent activity" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUserDashboardStats,
  getInstructorDashboardStats,
  getInstructorRecentActivity,

  getStats,
};
