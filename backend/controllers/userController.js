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

    const user = await User.findOne({ username })
      .select("-walletAddress -nonce")
      .lean();

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

/**
 * Get instructor's public stats (optimized for profile page)
 */
const getInstructorPublicStats = async (req, res) => {
  try {
    const { username } = req.params;

    // Find instructor
    const instructor = await User.findOne({ username, isInstructor: true });
    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    const Course = require("../models/Course");
    const Purchase = require("../models/Purchase");
    const Review = require("../models/Review");

    // Get only PUBLISHED courses
    const courses = await Course.find({
      instructor: instructor._id,
      status: "published",
    }).select("_id averageRating totalRatings enrollmentCount");

    const courseIds = courses.map((c) => c._id);

    // Calculate stats efficiently with aggregation
    const [purchaseStats, reviewCount] = await Promise.all([
      // Count unique students across all courses
      Purchase.distinct("user", {
        course: { $in: courseIds },
        status: "active",
      }),
      // Count total reviews
      Review.countDocuments({
        course: { $in: courseIds },
        status: "published",
      }),
    ]);

    // Calculate average rating from published courses
    let totalWeightedRating = 0;
    let totalRatingsCount = 0;

    courses.forEach((course) => {
      if (course.averageRating && course.totalRatings) {
        totalWeightedRating += course.averageRating * course.totalRatings;
        totalRatingsCount += course.totalRatings;
      }
    });

    const averageRating =
      totalRatingsCount > 0 ? totalWeightedRating / totalRatingsCount : 0;

    // Total students is unique count
    const totalStudents = purchaseStats.length;

    // Sum total ratings across all courses
    const totalRatings = courses.reduce(
      (sum, c) => sum + (c.totalRatings || 0),
      0
    );

    res.json({
      success: true,
      stats: {
        totalCoursesCreated: courses.length,
        totalStudents,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviewCount,
        totalRatings, // Total number of ratings across all courses
      },
    });
  } catch (error) {
    console.error("Get instructor public stats error:", error);
    res.status(500).json({ error: "Failed to get instructor stats" });
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
    let totalWeightedRating = 0;
    let totalRatingsCount = 0;

    courses.forEach((course) => {
      if (course.averageRating && course.totalRatings) {
        totalWeightedRating += course.averageRating * course.totalRatings;
        totalRatingsCount += course.totalRatings;
      }
    });

    const averageRating =
      totalRatingsCount > 0 ? totalWeightedRating / totalRatingsCount : 0;

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
 * Get instructor earnings history for chart
 */
const getInstructorEarningsHistory = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { period = "30days" } = req.query;

    const instructor = await User.findById(instructorId);
    if (!instructor || !instructor.isInstructor) {
      return res.status(403).json({ error: "Not authorized as instructor" });
    }

    const Course = require("../models/Course");
    const Purchase = require("../models/Purchase");

    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);

    // Calculate date range
    let daysBack = 30;
    if (period === "7days") daysBack = 7;
    else if (period === "30days") daysBack = 30;
    else if (period === "90days") daysBack = 90;
    else if (period === "1year") daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get all purchases within date range
    const purchases = await Purchase.find({
      course: { $in: courseIds },
      status: "active",
      createdAt: { $gte: startDate },
    })
      .populate("course", "price")
      .sort({ createdAt: 1 })
      .lean();

    // Group purchases by date
    const earningsByDate = {};
    purchases.forEach((purchase) => {
      const date = new Date(purchase.createdAt);
      const dateKey = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!earningsByDate[dateKey]) {
        earningsByDate[dateKey] = 0;
      }

      earningsByDate[dateKey] += purchase.course?.price?.usd || 0;
    });

    // Create array with all dates in range (fill missing dates with 0)
    const earningsData = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      earningsData.push({
        date: dateKey,
        earnings: Math.round((earningsByDate[dateKey] || 0) * 100) / 100,
      });
    }

    res.json({
      success: true,
      data: earningsData,
    });
  } catch (error) {
    console.error("Get instructor earnings history error:", error);
    res.status(500).json({ error: "Failed to get earnings history" });
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

/**
 * Get detailed earnings transactions
 */
const getInstructorEarningsTransactions = async (req, res) => {
  try {
    const instructorId = req.userId;

    const instructor = await User.findById(instructorId);
    if (!instructor || !instructor.isInstructor) {
      return res.status(403).json({ error: "Not authorized as instructor" });
    }

    const Course = require("../models/Course");
    const Purchase = require("../models/Purchase");

    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);

    // Get all purchases with full details
    const purchases = await Purchase.find({
      course: { $in: courseIds },
      status: "active",
    })
      .populate("course", "title thumbnail price")
      .populate("user", "username")
      .sort({ createdAt: -1 })
      .lean();

    // Transform purchases into transaction format
    const transactions = purchases.map((purchase) => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const isInEscrow = purchase.createdAt > thirtyDaysAgo;

      const amount = purchase.course?.price?.usd || 0;
      const instructorRevenue = amount * 0.8;
      const platformFee = amount * 0.2;

      return {
        id: purchase._id,
        courseName: purchase.course?.title || "Unknown Course",
        courseThumbnail: purchase.course?.thumbnail || "",
        studentName: purchase.user?.username || "Unknown Student",
        amount: instructorRevenue,
        platformFee: platformFee,
        date: purchase.createdAt,
        status: isInEscrow ? "escrow" : "released",
        transactionHash: purchase.transactionHash || null,
      };
    });

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Get instructor earnings transactions error:", error);
    res.status(500).json({ error: "Failed to get earnings transactions" });
  }
};

/**
 * Get detailed student information
 */
const getStudentDetails = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { studentId } = req.params;

    // Verify instructor
    const instructor = await User.findById(instructorId);
    if (!instructor || !instructor.isInstructor) {
      return res.status(403).json({ error: "Not authorized as instructor" });
    }

    const Course = require("../models/Course");
    const Purchase = require("../models/Purchase");

    // Get instructor's courses
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);

    // Get student's purchases for instructor's courses
    const purchases = await Purchase.find({
      user: studentId,
      course: { $in: courseIds },
      status: "active",
    })
      .populate("course", "title thumbnail price totalLessons")
      .lean();

    if (purchases.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Get student info
    const student = await User.findById(studentId).select(
      "username displayName avatar email lastLogin, createdAt"
    );

    // Calculate stats
    const totalSpent = purchases.reduce(
      (sum, p) => sum + (p.course?.price?.usd || 0),
      0
    );
    const totalWatchTime = purchases.reduce(
      (sum, p) => sum + (p.totalWatchTime || 0),
      0
    );
    const averageProgress =
      purchases.length > 0
        ? Math.round(
            purchases.reduce((sum, p) => sum + (p.progress || 0), 0) /
              purchases.length
          )
        : 0;

    // Course progress details
    const courseProgress = purchases.map((purchase) => {
      const completedLessons = purchase.completedLessons?.length || 0;
      const totalLessons = purchase.course?.totalLessons || 0;
      const timeSpent = purchase.totalWatchTime || 0;

      return {
        id: purchase.course._id,
        title: purchase.course.title,
        thumbnail: purchase.course.thumbnail,
        progress: purchase.progress || 0,
        completedLessons,
        totalLessons,
        lastAccessed: purchase.lastAccessedAt
          ? formatTimeAgo(purchase.lastAccessedAt)
          : "Never",
        timeSpent: Math.floor(timeSpent / 60), // Convert to minutes
        status: purchase.isCompleted ? "completed" : "in-progress",
        completedDate: purchase.completedAt
          ? new Date(purchase.completedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : null,
        certificateIssued: purchase.certificateIssued || false,
      };
    });

    // Recent activity
    const recentActivity = [];

    purchases.forEach((purchase) => {
      if (purchase.isCompleted && purchase.completedAt) {
        recentActivity.push({
          type: "completion",
          text: `Completed ${purchase.course.title}`,
          time: formatTimeAgo(purchase.completedAt),
          date: purchase.completedAt,
        });
      }
      if (purchase.certificateIssued) {
        recentActivity.push({
          type: "certificate",
          text: `Earned certificate for ${purchase.course.title}`,
          time: formatTimeAgo(purchase.completedAt || purchase.createdAt),
          date: purchase.completedAt || purchase.createdAt,
        });
      }
      recentActivity.push({
        type: "purchase",
        text: `Enrolled in ${purchase.course.title}`,
        time: formatTimeAgo(purchase.createdAt),
        date: purchase.createdAt,
      });
    });

    // Sort by date (most recent first)
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      studentDetails: {
        id: student._id,
        name: student.username,
        displayName: student.displayName || student.username,
        avatar:
          student.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`,
        email: student.email || "No email provided",
        lastActive: student.lastLogin
          ? formatTimeAgo(student.lastLogin)
          : "Never",
        joinedDate: new Date(student.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        totalSpent: Math.round(totalSpent),
        coursesEnrolled: purchases.length,
        coursesCompleted: purchases.filter((p) => p.isCompleted).length,
        averageProgress,
        totalWatchTime: Math.floor(totalWatchTime / 60), // In minutes
        loginStreak: calculateLoginStreak(student, purchases), // ← ADD THIS
        courseProgress,
        courseProgress,
        recentActivity: recentActivity.slice(0, 10), // Last 10 activities
        status: "active",
      },
    });
  } catch (error) {
    console.error("Get student details error:", error);
    res.status(500).json({ error: "Failed to get student details" });
  }
};

// Helper function to calculate login streak
function calculateLoginStreak(user, purchases) {
  // Get all unique activity dates from purchases
  const activityDates = new Set();

  purchases.forEach((purchase) => {
    // Add purchase date
    if (purchase.createdAt) {
      const date = new Date(purchase.createdAt);
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.getTime());
    }

    // Add last accessed date
    if (purchase.lastAccessedAt) {
      const date = new Date(purchase.lastAccessedAt);
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.getTime());
    }

    // Add completed date
    if (purchase.completedAt) {
      const date = new Date(purchase.completedAt);
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.getTime());
    }
  });

  // Add last login date
  if (user.lastLogin) {
    const date = new Date(user.lastLogin);
    date.setHours(0, 0, 0, 0);
    activityDates.add(date.getTime());
  }

  if (activityDates.size === 0) return 0;

  // Sort dates in descending order (most recent first)
  const sortedDates = Array.from(activityDates).sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayTime = yesterday.getTime();

  // Check if there's activity today or yesterday
  const mostRecentActivity = sortedDates[0];
  if (
    mostRecentActivity !== todayTime &&
    mostRecentActivity !== yesterdayTime
  ) {
    return 0; // Streak broken - no activity today or yesterday
  }

  // Count consecutive days
  let streak = 0;
  let expectedDate = todayTime;

  for (const activityTime of sortedDates) {
    if (activityTime === expectedDate) {
      streak++;
      expectedDate -= 24 * 60 * 60 * 1000; // Go back one day
    } else if (activityTime < expectedDate) {
      break; // Gap found, streak ends
    }
  }

  return streak;
}

const getPaymentWallets = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "paymentWallets isInstructor"
    );

    if (!user || !user.isInstructor) {
      return res
        .status(403)
        .json({ error: "Only instructors can manage payment wallets" });
    }

    res.json({
      success: true,
      wallets: user.paymentWallets || [],
    });
  } catch (error) {
    console.error("Get payment wallets error:", error);
    res.status(500).json({ error: "Failed to get payment wallets" });
  }
};

const addPaymentWallet = async (req, res) => {
  try {
    const { blockchain, address, label } = req.body;

    if (!blockchain || !address) {
      return res.status(400).json({ error: "Blockchain and address required" });
    }

    const user = await User.findById(req.userId);

    if (!user || !user.isInstructor) {
      return res
        .status(403)
        .json({ error: "Only instructors can add payment wallets" });
    }

    if (!user.paymentWallets) {
      user.paymentWallets = [];
    }

    const normalizedAddress = address.toLowerCase();
    const existingWallet = user.paymentWallets.find(
      (w) =>
        w.address.toLowerCase() === normalizedAddress &&
        w.blockchain === blockchain
    );

    if (existingWallet) {
      return res.status(400).json({ error: "Wallet already added" });
    }

    // Validate address format
    if (blockchain === "evm" && !normalizedAddress.match(/^0x[a-f0-9]{40}$/)) {
      return res.status(400).json({ error: "Invalid EVM address format" });
    }

    if (
      blockchain === "solana" &&
      (address.length < 32 || address.length > 44)
    ) {
      return res.status(400).json({ error: "Invalid Solana address format" });
    }

    if (
      blockchain === "bitcoin" &&
      (address.length < 26 || address.length > 62)
    ) {
      return res.status(400).json({ error: "Invalid Bitcoin address format" });
    }

    user.paymentWallets.push({
      blockchain,
      address,
      label: label || `${blockchain.toUpperCase()} Wallet`,
      isPrimary: user.paymentWallets.length === 0,
      addedAt: new Date(),
    });

    await user.save();

    res.json({
      success: true,
      message: "Wallet added successfully",
      wallet: user.paymentWallets[user.paymentWallets.length - 1],
    });
  } catch (error) {
    console.error("Add wallet error:", error);
    res.status(500).json({ error: "Failed to add wallet" });
  }
};

const removePaymentWallet = async (req, res) => {
  try {
    const { walletId } = req.params;
    const user = await User.findById(req.userId);

    if (!user || !user.isInstructor) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!user.paymentWallets || user.paymentWallets.length === 0) {
      return res.status(400).json({ error: "No wallets found" });
    }

    const wallet = user.paymentWallets.id(walletId);
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const wasPrimary = wallet.isPrimary;
    user.paymentWallets.pull(walletId);

    if (wasPrimary && user.paymentWallets.length > 0) {
      user.paymentWallets[0].isPrimary = true;
    }

    await user.save();

    res.json({
      success: true,
      message: "Wallet removed successfully",
    });
  } catch (error) {
    console.error("Remove wallet error:", error);
    res.status(500).json({ error: "Failed to remove wallet" });
  }
};

const setPrimaryWallet = async (req, res) => {
  try {
    const { walletId } = req.body;
    const user = await User.findById(req.userId);

    if (!user || !user.isInstructor) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!user.paymentWallets || user.paymentWallets.length === 0) {
      return res.status(400).json({ error: "No wallets found" });
    }

    user.paymentWallets.forEach((w) => (w.isPrimary = false));

    const wallet = user.paymentWallets.id(walletId);
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    wallet.isPrimary = true;
    await user.save();

    res.json({
      success: true,
      message: "Primary wallet updated",
    });
  } catch (error) {
    console.error("Set primary wallet error:", error);
    res.status(500).json({ error: "Failed to set primary wallet" });
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
  getInstructorEarningsHistory,
  getAllStudents,
  getStudentAnalytics,
  getInstructorPublicStats,
  getInstructorEarningsTransactions,
  getStudentDetails,
  getStats,
  getPaymentWallets,
  addPaymentWallet,
  removePaymentWallet,
  setPrimaryWallet,
};
