const Purchase = require("../models/Purchase.DEPRECATED");
const Course = require("../models/Course");
const User = require("../models/User");
const { checkAchievements } = require("../services/achievementService");
const { generateCertificate } = require("../services/certificateService");

// Purchase course with wallet
const purchaseCourse = async (req, res) => {
  try {
    const { courseId, paymentMethod, transactionHash } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.status !== "published") {
      return res
        .status(400)
        .json({ error: "Course not available for purchase" });
    }

    // Check if already purchased
    const existing = await Purchase.findOne({
      user: req.userId,
      course: courseId,
    });

    if (existing) {
      return res.status(400).json({ error: "Already purchased this course" });
    }

    // Calculate revenue split (80% instructor, 20% platform)
    const amount =
      paymentMethod === "fdr" ? course.price.fdr : course.price.usd;
    const instructorRevenue = amount * 0.8;
    const platformFee = amount * 0.2;

    // Create purchase
    const purchase = await Purchase.create({
      user: req.userId,
      course: courseId,
      paymentMethod,
      amount,
      currency: paymentMethod === "fdr" ? "FDR" : "USD",
      transactionHash,
      instructorRevenue,
      platformFee,
      status: "active",
    });

    // Update course stats
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 },
    });

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { coursesEnrolled: 1 },
    });

    // Update instructor stats and revenue
    await User.findByIdAndUpdate(course.instructor, {
      $inc: {
        totalStudents: 1,
        totalRevenue: instructorRevenue,
      },
    });

    res.status(201).json({
      success: true,
      purchase,
      message: "Course purchased successfully",
    });
  } catch (error) {
    console.error("Purchase course error:", error);
    res.status(500).json({ error: "Failed to purchase course" });
  }
};

// Get user's purchased courses
const getMyPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({
      user: req.userId,
      status: "active",
    })
      .populate({
        path: "course",
        select:
          "title slug thumbnail instructor totalLessons totalDuration averageRating sections",
        populate: {
          path: "instructor",
          select: "username avatar",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ purchases });
  } catch (error) {
    console.error("Get purchases error:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
};

// Get single purchase details
const getPurchase = async (req, res) => {
  try {
    const { courseId } = req.params;

    const purchase = await Purchase.findOne({
      user: req.userId,
      course: courseId,
    })
      .populate({
        path: "course",
        select:
          "title slug thumbnail instructor sections totalLessons totalDuration",
        populate: {
          path: "instructor",
          select: "username avatar instructorVerified",
        },
      })
      .lean();

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    res.json({ purchase });
  } catch (error) {
    console.error("Get purchase error:", error);
    res.status(500).json({ error: "Failed to fetch purchase" });
  }
};

// Mark lesson as completed
// Replace ONLY the completeLesson function in purchaseController.js

const completeLesson = async (req, res) => {
  try {
    const { purchaseId, lessonId } = req.body;

    console.log("📊 Complete lesson request:", { purchaseId, lessonId });
    console.log("🔑 User ID from token:", req.userId);

    const purchase = await Purchase.findById(purchaseId).populate("course");

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // Fix: Ensure both are strings
    const purchaseUserId = purchase.user.toString();
    const requestUserId = req.userId.toString();

    console.log("👤 Purchase user ID:", purchaseUserId);
    console.log("🔑 Request user ID:", requestUserId);
    console.log("🔍 User IDs match:", purchaseUserId === requestUserId);

    if (purchaseUserId !== requestUserId) {
      console.error("❌ User ID mismatch!");
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check if lesson already completed
    if (purchase.completedLessons.includes(lessonId)) {
      return res.status(400).json({ error: "Lesson already completed" });
    }

    // Add lesson to completed array
    purchase.completedLessons.push(lessonId);

    // Get the lesson duration
    const course = purchase.course;
    let lessonDuration = 0;

    // Handle both 'sections' and 'modules' naming
    const courseSections = course.sections || course.modules || [];

    for (const section of courseSections) {
      const lesson = section.lessons?.find(
        (l) => l._id.toString() === lessonId.toString()
      );
      if (lesson) {
        lessonDuration = lesson.duration || 0;
        break;
      }
    }

    // Update total time spent
    purchase.totalWatchTime = (purchase.totalWatchTime || 0) + lessonDuration;
    console.log(
      `⏱️ Added ${lessonDuration}s (lesson duration). Total: ${purchase.totalWatchTime}s`
    );

    // Calculate progress
    const totalLessons = courseSections.reduce(
      (acc, section) => acc + (section.lessons?.length || 0),
      0
    );
    const completedCount = purchase.completedLessons.length;
    const calculatedProgress = Math.round(
      (completedCount / totalLessons) * 100
    );

    purchase.progress = calculatedProgress;

    // Check if course is completed
    const isCompleted = completedCount === totalLessons;
    if (isCompleted && !purchase.isCompleted) {
      purchase.isCompleted = true;
      purchase.completedAt = new Date();
      console.log("🎓 Course completed!");
    }

    console.log("📊 Progress calculation:");
    console.log("  - Total lessons:", totalLessons);
    console.log("  - Completed lessons:", completedCount);
    console.log("  - Calculated progress:", calculatedProgress);

    // Save purchase FIRST
    await purchase.save();
    console.log("✅ Lesson marked complete");

    // Variable to store certificate
    let certificateData = null;

    // Generate certificate if completed
    if (purchase.isCompleted && purchase.progress === 100) {
      try {
        console.log("🎖️ Generating certificate...");
        const certificate = await generateCertificate(
          req.userId,
          purchase.course._id
        );

        if (certificate) {
          certificateData = certificate;
          console.log(
            `✅ Certificate generated: ${certificate.certificateNumber}`
          );
          console.log(`📜 Certificate ID: ${certificate._id}`);
        }
      } catch (certError) {
        console.error("❌ Error generating certificate:", certError);
        // Continue without certificate - don't fail the whole request
      }
    }

    // Check achievements AFTER saving
    const newAchievements = await checkAchievements(req.userId);

    // Refresh user data to get updated level
    const updatedUser = await User.findById(req.userId).select("level totalXP");

    console.log(
      `📊 User stats: Level ${updatedUser.level}, ${updatedUser.totalXP} XP`
    );

    // Return response with certificate if available
    res.json({
      success: true,
      purchase,
      certificate: certificateData, // ✅ RETURN CERTIFICATE
      newAchievements,
      levelInfo: {
        level: updatedUser.level,
        totalXP: updatedUser.totalXP,
      },
    });
  } catch (error) {
    console.error("Complete lesson error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to complete lesson" });
    }
  }
};

/**
 * Calculate refund eligibility for a purchase
 */
function calculateRefundEligibility(purchase) {
  // Can't refund if already completed, refunded, or released
  if (purchase.status === "completed") {
    return {
      eligible: false,
      reason: "Course already completed",
      daysLeft: 0,
      hoursLeft: 0,
      progressLimit: false,
    };
  }

  if (purchase.status === "refunded") {
    return {
      eligible: false,
      reason: "Already refunded",
      daysLeft: 0,
      hoursLeft: 0,
      progressLimit: false,
    };
  }

  if (purchase.escrowStatus === "released") {
    return {
      eligible: false,
      reason: "Payment already released to instructor",
      daysLeft: 0,
      hoursLeft: 0,
      progressLimit: false,
    };
  }

  // Check if within time window (before escrow release)
  const now = new Date();
  const releaseDate = new Date(purchase.escrowReleaseDate);
  const timeLeft = releaseDate - now;

  if (timeLeft <= 0) {
    return {
      eligible: false,
      reason: "Refund period expired",
      daysLeft: 0,
      hoursLeft: 0,
      progressLimit: false,
    };
  }

  // Check progress limit (e.g., can't refund if >20% completed)
  const PROGRESS_LIMIT = 20; // 20%
  if (purchase.progress > PROGRESS_LIMIT) {
    return {
      eligible: false,
      reason: `Cannot refund after completing ${PROGRESS_LIMIT}% of course`,
      daysLeft: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
      hoursLeft: Math.floor(timeLeft / (1000 * 60 * 60)),
      progressLimit: true,
      currentProgress: purchase.progress,
      maxProgress: PROGRESS_LIMIT,
    };
  }

  // Eligible for refund
  return {
    eligible: true,
    reason: "Eligible for full refund",
    daysLeft: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
    hoursLeft: Math.floor(timeLeft / (1000 * 60 * 60)),
    progressLimit: false,
    currentProgress: purchase.progress,
    maxProgress: PROGRESS_LIMIT,
  };
}

/**
 * Get student purchase history with refund eligibility
 */
const getStudentPurchaseHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("📚 Fetching purchase history for user:", userId);

    // Fetch all purchases with populated data
    const purchases = await Purchase.find({ user: userId })
      .populate({
        path: "course",
        select:
          "title slug thumbnail price duration totalLessons instructor status",
        populate: {
          path: "instructor",
          select: "name username avatar",
        },
      })
      .populate({
        path: "paymentToken",
        select: "name symbol decimals chainId blockchain",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${purchases.length} purchase(s)`);

    // Calculate refund eligibility for each purchase
    const purchasesWithEligibility = purchases.map((purchase) => {
      const refundEligibility = calculateRefundEligibility(purchase);

      return {
        _id: purchase._id,
        course: purchase.course,
        paymentToken: purchase.paymentToken,
        amountInToken: purchase.amountInToken,
        amountInUSD: purchase.amountInUSD,
        status: purchase.status,
        escrowStatus: purchase.escrowStatus,
        purchaseDate: purchase.createdAt,
        progress: purchase.progress,
        completedLessons: purchase.completedLessons,
        totalWatchTime: purchase.totalWatchTime,
        isCompleted: purchase.isCompleted,
        escrowReleaseDate: purchase.escrowReleaseDate,
        escrowReleasedAt: purchase.escrowReleasedAt,
        refundEligibility,
      };
    });

    res.json({
      success: true,
      purchases: purchasesWithEligibility,
    });
  } catch (error) {
    console.error("❌ Get purchase history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch purchase history",
    });
  }
};
/**
 * Request refund for a purchase
 */
const requestRefund = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const userId = req.user._id;

    console.log("💸 Refund request:", { purchaseId, userId });

    // Find purchase
    const purchase = await Purchase.findOne({
      _id: purchaseId,
      user: userId,
    })
      .populate("course")
      .populate("paymentToken");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase not found",
      });
    }

    // Check eligibility
    const eligibility = calculateRefundEligibility(purchase);

    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        error: eligibility.reason,
        eligibility,
      });
    }

    // Check if escrow exists
    if (!purchase.escrowId) {
      return res.status(400).json({
        success: false,
        error: "No escrow found for this purchase",
      });
    }

    console.log("✅ Refund eligible, processing...");

    // Initialize payment service
    const paymentService = getPaymentService();
    await paymentService.initialize(purchase.paymentToken);

    // Refund escrow on blockchain
    console.log("🔐 Calling refundEscrow on blockchain...");
    const result = await paymentService.refundEscrow({
      escrowId: purchase.escrowId,
      blockchain: purchase.blockchain,
      chainId: purchase.paymentToken.chainId,
    });

    console.log("✅ Blockchain refund successful:", result.transactionHash);

    // Update purchase status
    purchase.status = "refunded";
    purchase.escrowStatus = "refunded";
    purchase.refundedAt = new Date();
    purchase.refundTransactionHash = result.transactionHash;
    purchase.refundEligible = false;
    await purchase.save();

    console.log("✅ Purchase updated to refunded status");

    res.json({
      success: true,
      message: "Refund processed successfully",
      transactionHash: result.transactionHash,
      purchase: {
        _id: purchase._id,
        status: purchase.status,
        escrowStatus: purchase.escrowStatus,
        refundedAt: purchase.refundedAt,
      },
    });
  } catch (error) {
    console.error("❌ Refund error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process refund",
    });
  }
};

module.exports = {
  purchaseCourse,
  getMyPurchases,
  getPurchase,
  completeLesson,
  getStudentPurchaseHistory,
  requestRefund,
};
