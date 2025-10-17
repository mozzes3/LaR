const Purchase = require("../models/Purchase");
const Course = require("../models/Course");
const User = require("../models/User");

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
          "title slug thumbnail instructor totalLessons totalDuration averageRating",
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

    // IMPORTANT: Populate course to get totalLessons
    const purchase = await Purchase.findById(purchaseId).populate("course");

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    if (purchase.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Add lesson to completed if not already there
    if (!purchase.completedLessons.includes(lessonId)) {
      purchase.completedLessons.push(lessonId);
    }

    purchase.lastAccessedLesson = lessonId;
    purchase.lastAccessedAt = new Date();

    // Calculate progress using the populated course
    const totalLessons = purchase.course.totalLessons || 0;
    const completedCount = purchase.completedLessons.length;

    console.log("📊 Progress calculation:");
    console.log("  - Total lessons:", totalLessons);
    console.log("  - Completed lessons:", completedCount);

    if (totalLessons > 0) {
      purchase.progress = Math.min(
        100,
        Math.round((completedCount / totalLessons) * 100)
      );
    } else {
      purchase.progress = 0;
    }

    console.log("  - Calculated progress:", purchase.progress);

    // Check if course is completed
    if (purchase.progress === 100 && !purchase.isCompleted) {
      purchase.isCompleted = true;
      purchase.completedAt = new Date();

      // Update user stats
      await User.findByIdAndUpdate(req.userId, {
        $inc: { coursesCompleted: 1, certificatesEarned: 1 },
      });
    }

    await purchase.save();

    console.log("✅ Progress saved:", purchase.progress);

    res.json({ success: true, purchase });
  } catch (error) {
    console.error("Complete lesson error:", error);
    res.status(500).json({ error: "Failed to complete lesson" });
  }
};

module.exports = {
  purchaseCourse,
  getMyPurchases,
  getPurchase,
  completeLesson,
};
