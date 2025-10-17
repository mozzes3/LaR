require("dotenv").config();
const mongoose = require("mongoose");
const Purchase = require("../models/Purchase");
const Course = require("../models/Course");
const User = require("../models/User");
const connectDB = require("../config/database");

const seedPurchases = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding test purchases...");

    // Find test user (your wallet address)
    const testUser = await User.findOne({
      walletAddress: "0x1234567890123456789012345678901234567890", // Replace with your actual wallet
    });

    if (!testUser) {
      console.log(
        "❌ Test user not found. Create a user first by connecting wallet."
      );
      process.exit(1);
    }

    // Get all published courses
    const courses = await Course.find({ status: "published" });

    if (courses.length === 0) {
      console.log("❌ No courses found. Run seedCourses.js first.");
      process.exit(1);
    }

    // Clear existing purchases for test user
    await Purchase.deleteMany({ user: testUser._id });

    // Create purchases for all courses
    const purchases = [];
    for (const course of courses) {
      purchases.push({
        user: testUser._id,
        course: course._id,
        paymentMethod: "fdr",
        amount: course.price.usd,
        currency: "FDR",
        instructorRevenue: course.price.usd * 0.8,
        platformFee: course.price.usd * 0.2,
        progress: Math.floor(Math.random() * 100), // Random progress
        completedLessons: [],
        lastAccessedAt: new Date(),
        status: "active",
      });
    }

    await Purchase.insertMany(purchases);

    console.log(`✅ Created ${purchases.length} test purchases`);
    console.log("🎉 Seeding complete!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedPurchases();
