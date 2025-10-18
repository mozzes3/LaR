const Purchase = require("../models/Purchase");
const Course = require("../models/Course");
const User = require("../models/User");
const { checkAchievements } = require("../services/achievementService");
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
          "title slug thumbnail instructor totalLessons totalDuration averageRating sections", // ✅ ADD 'sections'
        populate: {
          path: "instructor",
          select: "username avatar",
        },
      })
      .sort({ createdAt: -1 });

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
    }).populate("course");

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
const completeLesson = async (req, res) => {
  try {
    const { purchaseId, lessonId } = req.body;

    console.log("📊 Complete lesson request:", { purchaseId, lessonId });
    console.log("🔑 User ID from token:", req.userId);

    const purchase = await Purchase.findById(purchaseId).populate("course");

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    console.log("👤 Purchase user ID:", purchase.user.toString());
    console.log("🔍 User IDs match:", purchase.user.toString() === req.userId);

    // Fix: Convert both to strings for comparison
    if (purchase.user.toString() !== req.userId.toString()) {
      console.error("❌ User ID mismatch!");
      return res.status(403).json({ error: "Not authorized" });
    }

    // Check if lesson already completed
    if (purchase.completedLessons.includes(lessonId)) {
      return res.json({
        success: true,
        message: "Lesson already completed",
        purchase,
        newAchievements: [],
      });
    }

    // Add to completed lessons
    purchase.completedLessons.push(lessonId);

    // Find lesson duration
    let lessonDuration = 0;
    for (const section of purchase.course.sections) {
      const lesson = section.lessons.find((l) => l._id.toString() === lessonId);
      if (lesson) {
        lessonDuration = lesson.duration || 0;
        break;
      }
    }

    // Update watch time
    purchase.totalWatchTime = (purchase.totalWatchTime || 0) + lessonDuration;
    console.log(
      `⏱️ Added ${lessonDuration}s (lesson duration). Total: ${purchase.totalWatchTime}s`
    );

    // Calculate progress
    const totalLessons = purchase.course.sections.reduce(
      (sum, section) => sum + section.lessons.length,
      0
    );
    const completedCount = purchase.completedLessons.length;
    purchase.progress = Math.round((completedCount / totalLessons) * 100);

    console.log("📊 Progress calculation:");
    console.log(`  - Total lessons: ${totalLessons}`);
    console.log(`  - Completed lessons: ${completedCount}`);
    console.log(`  - Calculated progress: ${purchase.progress}`);

    // Check if course is completed
    if (purchase.progress === 100 && !purchase.isCompleted) {
      purchase.isCompleted = true;
      purchase.completedAt = new Date();

      // Update user stats
      await User.findByIdAndUpdate(req.userId, {
        $inc: { coursesCompleted: 1, certificatesEarned: 1 },
      });

      console.log("🎓 Course completed!");
    }

    // Save purchase FIRST
    await purchase.save();
    console.log("✅ Lesson marked complete");
    console.log("✅ Total watch time:", purchase.totalWatchTime);

    // Check achievements AFTER saving
    const { checkAchievements } = require("../services/achievementService");
    const newAchievements = await checkAchievements(req.userId);

    // Send response ONLY ONCE at the end
    res.json({
      success: true,
      purchase,
      newAchievements,
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
