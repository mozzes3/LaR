const mongoose = require("mongoose");
const Course = require("../models/Course");
const Review = require("../models/Review");
require("dotenv").config();

const fixReviewCounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // First, let's check all reviews for the problematic course
    const courses = await Course.find({});

    console.log("\n🔍 Analyzing all courses...\n");

    for (const course of courses) {
      console.log(`\n📚 Course: ${course.title}`);
      console.log(`   ID: ${course._id}`);

      // Get ALL reviews (any status)
      const allReviews = await Review.find({ course: course._id });
      console.log(`   Total reviews in DB: ${allReviews.length}`);

      // Show review statuses
      const statusCount = {
        published: 0,
        pending: 0,
        flagged: 0,
        removed: 0,
      };

      allReviews.forEach((review) => {
        statusCount[review.status]++;
        console.log(
          `     - ${review.status}: ${review.rating} stars by ${review.user}`
        );
      });

      console.log(`   Status breakdown:`, statusCount);

      // Get only published reviews
      const publishedReviews = allReviews.filter(
        (r) => r.status === "published"
      );
      console.log(`   Published reviews: ${publishedReviews.length}`);

      // Current course data
      console.log(`   Current course.totalRatings: ${course.totalRatings}`);
      console.log(`   Current course.averageRating: ${course.averageRating}`);

      // Calculate correct values
      let correctTotal = publishedReviews.length;
      let correctAverage = 0;
      let correctDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      if (publishedReviews.length > 0) {
        const sum = publishedReviews.reduce((acc, r) => acc + r.rating, 0);
        correctAverage = sum / publishedReviews.length;

        publishedReviews.forEach((review) => {
          correctDistribution[review.rating]++;
        });
      }

      console.log(`   ✅ Correct totalRatings: ${correctTotal}`);
      console.log(`   ✅ Correct averageRating: ${correctAverage.toFixed(2)}`);
      console.log(`   ✅ Correct distribution:`, correctDistribution);

      // Update if different
      if (
        course.totalRatings !== correctTotal ||
        Math.abs(course.averageRating - correctAverage) > 0.01
      ) {
        console.log(`   🔧 FIXING...`);
        course.totalRatings = correctTotal;
        course.averageRating = correctAverage;
        course.ratingDistribution = correctDistribution;
        await course.save();
        console.log(`   ✅ FIXED!`);
      } else {
        console.log(`   ✓ Already correct, no changes needed`);
      }
    }

    console.log("\n✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

fixReviewCounts();
