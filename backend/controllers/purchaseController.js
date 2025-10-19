const Purchase = require("../models/Purchase");
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
      .populate("course")
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

module.exports = {
  purchaseCourse,
  getMyPurchases,
  getPurchase,
  completeLesson,
};
