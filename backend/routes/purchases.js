const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, purchaseController.purchaseCourse);
router.get("/my-purchases", authenticate, purchaseController.getMyPurchases);
router.get("/:courseId", authenticate, purchaseController.getPurchase);
/**
 * @route   POST /api/purchases/complete-lesson
 * @desc    Mark a lesson as complete
 * @access  Private
 */
router.post("/complete-lesson", authenticate, async (req, res) => {
  try {
    const { purchaseId, lessonId, watchTime } = req.body;

    console.log(
      `✅ Complete lesson request: ${lessonId}, watchTime: ${watchTime}s`
    );

    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    if (purchase.user.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Add lesson to completed if not already there
    if (!purchase.completedLessons.includes(lessonId)) {
      purchase.completedLessons.push(lessonId);
    }

    // Update watch time
    if (watchTime) {
      purchase.totalWatchTime = (purchase.totalWatchTime || 0) + watchTime;
    }

    // Calculate progress
    const course = await Course.findById(purchase.course);
    const totalLessons = course.sections.reduce(
      (total, section) => total + section.lessons.length,
      0
    );

    purchase.progress = Math.round(
      (purchase.completedLessons.length / totalLessons) * 100
    );

    purchase.lastAccessedAt = new Date();

    await purchase.save();

    console.log(`✅ Lesson completed. Progress: ${purchase.progress}%`);

    res.json({
      success: true,
      purchase: {
        progress: purchase.progress,
        completedLessons: purchase.completedLessons,
        totalWatchTime: purchase.totalWatchTime,
      },
    });
  } catch (error) {
    console.error("Complete lesson error:", error);
    res.status(500).json({ error: "Failed to complete lesson" });
  }
});

module.exports = router;
