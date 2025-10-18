const achievements = require("../config/achievements");
const User = require("../models/User");
const Purchase = require("../models/Purchase");

/**
 * Check and unlock achievements for a user
 */
const checkAchievements = async (userId, userData = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    // Get user's purchase data if not provided
    if (!userData) {
      const purchases = await Purchase.find({ user: userId, status: "active" })
        .populate("course", "category")
        .lean();

      const lessonsCompleted = purchases.reduce(
        (sum, p) => sum + (p.completedLessons?.length || 0),
        0
      );
      const totalWatchTime = purchases.reduce(
        (sum, p) => sum + (p.totalWatchTime || 0),
        0
      );
      const completedCourses = purchases.filter((p) => p.isCompleted).length;

      userData = {
        lessonsCompleted,
        totalWatchTime,
        completedCourses,
        coursesEnrolled: purchases.length,
        coursesPurchased: purchases.length,
        certificatesEarned: user.certificatesEarned || 0,
        currentStreak: user.currentStreak || 0,
        reviewsWritten: user.reviewsWritten || 0,
        purchases,
      };
    }

    const unlockedIds = user.unlockedAchievements.map((a) => a.achievementId);
    const newlyUnlocked = [];

    for (const achievement of achievements) {
      // Skip if already unlocked
      if (unlockedIds.includes(achievement.id)) continue;

      // Check if achievement condition is met
      if (checkCondition(achievement.condition, userData, user)) {
        // Unlock achievement
        user.unlockedAchievements.push({
          achievementId: achievement.id,
          unlockedAt: new Date(),
          xpEarned: achievement.xpReward,
          fdrEarned: achievement.fdrReward,
        });

        // Award XP and FDR
        user.totalXP = (user.totalXP || 0) + achievement.xpReward;
        user.tokensEarned = (user.tokensEarned || 0) + achievement.fdrReward;

        newlyUnlocked.push(achievement);

        console.log(
          `🏆 Achievement unlocked: ${achievement.title} for user ${userId}`
        );
      }
    }

    if (newlyUnlocked.length > 0) {
      await user.save();
    }

    return newlyUnlocked;
  } catch (error) {
    console.error("Check achievements error:", error);
    return [];
  }
};

/**
 * Check if achievement condition is met
 */
const checkCondition = (condition, userData, user) => {
  switch (condition.type) {
    case "lessonsCompleted":
      return userData.lessonsCompleted >= condition.value;

    case "completedCourses":
      return userData.completedCourses >= condition.value;

    case "coursesEnrolled":
      return userData.coursesEnrolled >= condition.value;

    case "coursesPurchased":
      return userData.coursesPurchased >= condition.value;

    case "totalWatchTime":
      return userData.totalWatchTime >= condition.value;

    case "currentStreak":
      return userData.currentStreak >= condition.value;

    case "certificatesEarned":
      return userData.certificatesEarned >= condition.value;

    case "reviewsWritten":
      return userData.reviewsWritten >= condition.value;

    case "perfectCourses":
      const perfectCount =
        userData.purchases?.filter((p) => p.progress === 100).length || 0;
      return perfectCount >= condition.value;

    case "web3CoursesCompleted":
      const web3Categories = [
        "Web3",
        "Blockchain",
        "DeFi",
        "NFT",
        "Smart Contracts",
        "Crypto",
      ];
      const web3Count =
        userData.purchases?.filter(
          (p) => p.isCompleted && web3Categories.includes(p.course?.category)
        ).length || 0;
      return web3Count >= condition.value;

    case "categoryCompleted":
      const categoryCount =
        userData.purchases?.filter(
          (p) => p.isCompleted && p.course?.category === condition.category
        ).length || 0;
      return categoryCount >= (condition.count || 1);

    case "uniqueCategories":
      const categories = new Set(
        userData.purchases
          ?.filter((p) => p.isCompleted)
          .map((p) => p.course?.category)
          .filter(Boolean)
      );
      return categories.size >= condition.value;

    case "joinedBefore":
      return new Date(user.createdAt) < new Date(condition.date);

    case "profileComplete":
      return user.bio && user.avatar;

    default:
      return false;
  }
};

/**
 * Get user's achievement progress
 */
const getUserAchievements = (user) => {
  const unlockedIds = user.unlockedAchievements.map((a) => a.achievementId);

  return achievements.map((achievement) => {
    const unlocked = unlockedIds.includes(achievement.id);
    const unlockedData = user.unlockedAchievements.find(
      (a) => a.achievementId === achievement.id
    );

    return {
      ...achievement,
      unlocked,
      unlockedAt: unlockedData?.unlockedAt || null,
    };
  });
};

module.exports = {
  checkAchievements,
  getUserAchievements,
};
