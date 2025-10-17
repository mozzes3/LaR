require("dotenv").config();
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Purchase = require("../models/Purchase");
const Course = require("../models/Course");
const User = require("../models/User");
const connectDB = require("../config/database");

const seedReviews = async () => {
  try {
    await connectDB();
    console.log("🌱 Seeding reviews...");

    // Clear existing reviews
    await Review.deleteMany({});
    console.log("🗑️  Cleared existing reviews");

    // Get all active purchases with populated course and user
    const purchases = await Purchase.find({ status: "active" })
      .populate("course")
      .populate("user");

    console.log(`📦 Found ${purchases.length} purchases`);

    // Filter out purchases with null course or user
    const validPurchases = purchases.filter((p) => p.course && p.user);

    console.log(`✅ ${validPurchases.length} valid purchases`);

    if (validPurchases.length === 0) {
      console.log("❌ No valid purchases found. Purchase a course first.");
      process.exit(1);
    }

    // Sample reviews data
    const sampleReviews = [
      {
        rating: 5,
        title: "Amazing course!",
        comment:
          "This course exceeded my expectations. The instructor explains everything clearly and the content is very practical.",
        contentQuality: 5,
        instructorQuality: 5,
        valueForMoney: 5,
      },
      {
        rating: 4,
        title: "Great content, could use more examples",
        comment:
          "Overall a solid course. Would love to see more real-world examples in future updates.",
        contentQuality: 4,
        instructorQuality: 5,
        valueForMoney: 4,
      },
      {
        rating: 5,
        title: "Best investment I've made!",
        comment:
          "Learned so much in just a few weeks. Highly recommend to anyone serious about Web3.",
        contentQuality: 5,
        instructorQuality: 5,
        valueForMoney: 5,
      },
    ];

    // Create reviews for valid purchases
    const reviews = [];
    for (
      let i = 0;
      i < Math.min(validPurchases.length, sampleReviews.length);
      i++
    ) {
      const purchase = validPurchases[i];
      const reviewData = sampleReviews[i];

      try {
        const review = await Review.create({
          user: purchase.user._id,
          course: purchase.course._id,
          purchase: purchase._id,
          ...reviewData,
        });

        reviews.push(review);

        // Update course rating
        const course = await Course.findById(purchase.course._id);
        if (course) {
          course.updateRating(reviewData.rating);
          await course.save();
        }

        console.log(
          `✅ Review created for "${purchase.course.title}" by ${purchase.user.username}`
        );
      } catch (error) {
        console.error(
          `❌ Error creating review for purchase ${purchase._id}:`,
          error.message
        );
      }
    }

    console.log(`🎉 ${reviews.length} reviews created successfully!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedReviews();
