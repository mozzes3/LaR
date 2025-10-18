const User = require("../models/User");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const { getLevelProgress } = require("../config/levels");
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
    const levelProgress = getLevelProgress(user.totalXP || 0);

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
        experience: user.experience || 0,
        level: levelProgress.currentLevel,
        levelProgress: {
          currentLevel: levelProgress.currentLevel,
          nextLevel: levelProgress.currentLevel + 1,
          currentLevelXP: levelProgress.currentLevelXP,
          nextLevelXP: levelProgress.nextLevelXP,
          xpInCurrentLevel: levelProgress.xpInCurrentLevel,
          xpNeededForNextLevel: levelProgress.xpNeededForNextLevel,
          progressPercentage: levelProgress.progressPercentage,
          isMaxLevel: levelProgress.isMaxLevel,
        },
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

const getAllStudents = async (req, res) => {
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

    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);

    // Get all purchases for instructor's courses
    const purchases = await Purchase.find({
      course: { $in: courseIds },
      status: "active",
    })
      .populate("user", "username avatar email lastLogin")
      .populate("course", "title")
      .lean();

    // Aggregate student data
    const studentMap = new Map();

    purchases.forEach((purchase) => {
      if (!purchase.user) return;

      const userId = purchase.user._id.toString();

      if (!studentMap.has(userId)) {
        studentMap.set(userId, {
          id: userId,
          name: purchase.user.username,
          displayName: purchase.user.displayName || purchase.user.username,
          avatar:
            purchase.user.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${purchase.user.username}`,
          email: purchase.user.email || "No email provided",
          enrolledCourses: 0,
          courseTitles: [],
          totalProgress: 0,
          totalWatchTime: 0,
          lastActive: purchase.user.lastLogin || purchase.lastAccessedAt,
          status: "active",
          completedCourses: 0,
          averageRating: null,
        });
      }

      const student = studentMap.get(userId);
      student.enrolledCourses++;
      student.courseTitles.push(purchase.course?.title || "Unknown Course");
      student.totalProgress += purchase.progress || 0;
      student.totalWatchTime += purchase.totalWatchTime || 0;

      if (purchase.isCompleted) {
        student.completedCourses++;
      }

      // Update last active
      if (
        purchase.lastAccessedAt &&
        new Date(purchase.lastAccessedAt) > new Date(student.lastActive)
      ) {
        student.lastActive = purchase.lastAccessedAt;
      }
    });

    // Calculate averages and format
    const students = Array.from(studentMap.values()).map((student) => {
      student.totalProgress = Math.round(
        student.totalProgress / student.enrolledCourses
      );

      // Determine status based on last active
      const lastActiveDate = new Date(student.lastActive);
      const daysSinceActive = Math.floor(
        (Date.now() - lastActiveDate) / (1000 * 60 * 60 * 24)
      );
      student.status = daysSinceActive > 14 ? "inactive" : "active";

      // Format last active
      if (daysSinceActive === 0) {
        student.lastActive = "Today";
      } else if (daysSinceActive === 1) {
        student.lastActive = "Yesterday";
      } else if (daysSinceActive < 7) {
        student.lastActive = `${daysSinceActive} days ago`;
      } else if (daysSinceActive < 30) {
        student.lastActive = `${Math.floor(daysSinceActive / 7)} weeks ago`;
      } else {
        student.lastActive = lastActiveDate.toLocaleDateString();
      }

      return student;
    });

    // Calculate aggregate stats
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === "active").length;
    const totalCompletedCourses = students.reduce(
      (sum, s) => sum + s.completedCourses,
      0
    );
    const averageProgress =
      totalStudents > 0
        ? Math.round(
            students.reduce((sum, s) => sum + s.totalProgress, 0) /
              totalStudents
          )
        : 0;

    res.json({
      success: true,
      students,
      stats: {
        totalStudents,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        completedStudents: totalCompletedCourses,
        averageProgress,
      },
    });
  } catch (error) {
    console.error("Get all students error:", error);
    res.status(500).json({ error: "Failed to get students" });
  }
};
/**
 * Get student's learning analytics
 */
const getStudentAnalytics = async (req, res) => {
  try {
    const userId = req.userId;

    const Purchase = require("../models/Purchase");
    const Course = require("../models/Course");
    const { getUserAchievements } = require("../services/achievementService");

    // Get all user's purchases
    const purchases = await Purchase.find({
      user: userId,
      status: "active",
    })
      .populate({
        path: "course",
        select: "title slug thumbnail category totalLessons totalDuration",
      })
      .lean();

    // ✅ CRITICAL: Filter out purchases with deleted courses
    const validPurchases = purchases.filter(
      (p) => p.course !== null && p.course !== undefined
    );

    console.log(
      `📊 User ${userId}: ${purchases.length} total purchases, ${validPurchases.length} valid purchases`
    );

    // Calculate stats using ONLY valid purchases
    const totalCourses = validPurchases.length;
    const completedCourses = validPurchases.filter((p) => p.isCompleted).length;
    const inProgressCourses = totalCourses - completedCourses;

    // Total watch time across all courses
    const totalWatchTime = validPurchases.reduce(
      (sum, p) => sum + (p.totalWatchTime || 0),
      0
    );

    // Calculate average progress
    const averageProgress =
      totalCourses > 0
        ? Math.round(
            validPurchases.reduce((sum, p) => sum + (p.progress || 0), 0) /
              totalCourses
          )
        : 0;

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;

    // Sort purchases by lastAccessedAt
    const sortedPurchases = validPurchases
      .filter((p) => p.lastAccessedAt)
      .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt));

    if (sortedPurchases.length > 0) {
      const lastAccessed = new Date(sortedPurchases[0].lastAccessedAt);
      const today = new Date();
      const daysDiff = Math.floor(
        (today - lastAccessed) / (1000 * 60 * 60 * 24)
      );

      currentStreak = daysDiff <= 1 ? daysDiff + 1 : 0;
      longestStreak = currentStreak;
    }

    // Total lessons completed
    const lessonsCompleted = validPurchases.reduce(
      (sum, p) => sum + (p.completedLessons?.length || 0),
      0
    );

    // Total lessons across all courses
    const totalLessons = validPurchases.reduce(
      (sum, p) => sum + (p.course?.totalLessons || 0),
      0
    );

    // Get user data
    const user = await User.findById(userId);
    const levelProgress = getLevelProgress(user.totalXP || 0);

    const allAchievements = getUserAchievements(user);
    const unlockedCount = allAchievements.filter((a) => a.unlocked).length;

    // Weekly activity (last 7 days)
    const weeklyActivity = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];

      weeklyActivity.push({
        day: dayName,
        hours: 0,
        lessons: 0,
      });
    }

    // Course progress breakdown - ONLY valid purchases
    const courseProgress = validPurchases.map((purchase) => ({
      id: purchase.course._id,
      slug: purchase.course.slug,
      title: purchase.course.title,
      thumbnail: purchase.course.thumbnail,
      category: purchase.course.category || "Uncategorized",
      progress: purchase.progress || 0,
      timeSpent: purchase.totalWatchTime || 0,
      lessonsCompleted: purchase.completedLessons?.length || 0,
      totalLessons: purchase.course.totalLessons || 0,
      lastAccessed: purchase.lastAccessedAt
        ? formatTimeAgo(purchase.lastAccessedAt)
        : "Never",
      status: purchase.isCompleted ? "completed" : "in-progress",
    }));

    // Skills (based on course categories) - ONLY valid purchases
    const skillsMap = new Map();
    validPurchases.forEach((purchase) => {
      const category = purchase.course?.category || "General";
      if (!skillsMap.has(category)) {
        skillsMap.set(category, {
          name: category,
          level: 0,
          courses: 0,
          totalProgress: 0,
        });
      }
      const skill = skillsMap.get(category);
      skill.courses++;
      skill.totalProgress += purchase.progress || 0;
      skill.level = Math.round(skill.totalProgress / skill.courses);
    });

    const skills = Array.from(skillsMap.values());

    res.json({
      success: true,
      analytics: {
        stats: {
          totalCourses,
          completedCourses,
          inProgressCourses,
          totalWatchTime,
          averageScore: averageProgress,
          certificatesEarned: user.certificatesEarned || 0,
          currentStreak,
          longestStreak,
          totalXP: user.totalXP || 0,
          level: levelProgress.currentLevel,

          levelProgress: {
            currentLevel: levelProgress.currentLevel,
            nextLevel: levelProgress.currentLevel + 1,
            currentLevelXP: levelProgress.currentLevelXP,
            nextLevelXP: levelProgress.nextLevelXP,
            xpInCurrentLevel: levelProgress.xpInCurrentLevel,
            xpNeededForNextLevel: levelProgress.xpNeededForNextLevel,
            progressPercentage: levelProgress.progressPercentage,
            isMaxLevel: levelProgress.isMaxLevel,
          },
          fdrEarned: user.tokensEarned || 0,
          skillsLearned: skills.length,
          lessonsCompleted,
          totalLessons,
          achievementsUnlocked: unlockedCount,
        },
        weeklyActivity,
        courseProgress,
        skills,
        achievements: allAchievements,
      },
    });
  } catch (error) {
    console.error("❌ Get student analytics error:", error);
    console.error("Error stack:", error.stack);

    // Return empty analytics on error instead of 500
    res.json({
      success: true,
      analytics: {
        stats: {
          totalCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          totalWatchTime: 0,
          averageScore: 0,
          certificatesEarned: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalXP: 0,
          level: 1,
          fdrEarned: 0,
          skillsLearned: 0,
          lessonsCompleted: 0,
          totalLessons: 0,
          achievementsUnlocked: 0,
        },
        weeklyActivity: [],
        courseProgress: [],
        skills: [],
        achievements: [],
      },
    });
  }
};

// Helper function
function formatTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}
module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUserDashboardStats,
  getInstructorDashboardStats,
  getInstructorRecentActivity,
  getAllStudents,
  getStudentAnalytics,
  getStats,
};
