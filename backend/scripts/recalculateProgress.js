require("dotenv").config();
const mongoose = require("mongoose");
const Purchase = require("../models/Purchase");
const Course = require("../models/Course"); // ✅ ADD THIS LINE
const connectDB = require("../config/database");

const recalculateProgress = async () => {
  try {
    await connectDB();

    console.log("🔧 Recalculating progress for all purchases...");

    const purchases = await Purchase.find({ status: "active" }).populate(
      "course"
    );

    let updated = 0;

    for (const purchase of purchases) {
      if (!purchase.course) {
        console.log(`⚠️ Skipping purchase ${purchase._id} - no course found`);
        continue;
      }

      const totalLessons = purchase.course.totalLessons || 0;
      const completedCount = purchase.completedLessons.length;

      const oldProgress = purchase.progress;

      if (totalLessons > 0) {
        purchase.progress = Math.round((completedCount / totalLessons) * 100);
      } else {
        purchase.progress = 0;
      }

      if (purchase.progress === 100 && !purchase.isCompleted) {
        purchase.isCompleted = true;
        purchase.completedAt = new Date();
      }

      await purchase.save();

      console.log(
        `✅ ${purchase.course.title}: ${completedCount}/${totalLessons} = ${purchase.progress}% (was ${oldProgress}%)`
      );
      updated++;
    }

    console.log(`\n🎉 Updated ${updated} purchases!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

recalculateProgress();
