const Review = require("../models/Review");
const Course = require("../models/Course");
const Purchase = require("../models/Purchase");

// Create review
const createReview = async (req, res) => {
  try {
    const {
      courseId,
      rating,
      title,
      comment,
      contentQuality,
      instructorQuality,
      valueForMoney,
    } = req.body;

    // Check if user purchased the course
    const purchase = await Purchase.findOne({
      user: req.userId,
      course: courseId,
      status: "active",
    });

    if (!purchase) {
      return res
        .status(403)
        .json({ error: "You must purchase this course to review it" });
    }

    // Check if already reviewed
    const existing = await Review.findOne({
      user: req.userId,
      course: courseId,
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this course" });
    }

    const review = await Review.create({
      user: req.userId,
      course: courseId,
      purchase: purchase._id,
      rating,
      title,
      comment,
      contentQuality,
      instructorQuality,
      valueForMoney,
      status: "pending", // ← Explicitly set to pending
    });

    // DO NOT update course rating until review is published
    // Only update when admin approves the review

    res.status(201).json({
      success: true,
      review,
      message: "Review submitted for moderation", // ← Let user know
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

// Get course reviews
const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, sort = "helpful" } = req.query;

    let sortOption = {};
    switch (sort) {
      case "helpful":
        sortOption = { helpfulCount: -1 };
        break;
      case "recent":
        sortOption = { createdAt: -1 };
        break;
      case "rating-high":
        sortOption = { rating: -1 };
        break;
      case "rating-low":
        sortOption = { rating: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const reviews = await Review.find({
      course: courseId,
      status: "published",
    })
      .populate("user", "username avatar level")
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments({
      course: courseId,
      status: "published",
    });

    res.json({
      reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const oldRating = review.rating;

    review.rating = rating;
    review.title = title;
    review.comment = comment;
    review.isEdited = true;
    review.editedAt = new Date();
    await review.save();

    // Update course rating
    const course = await Course.findById(review.course);
    course.updateRating(rating, oldRating);
    await course.save();

    res.json({ success: true, review });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await review.deleteOne();

    // Update course rating
    const course = await Course.findById(review.course);
    course.updateRating(null, review.rating);
    await course.save();

    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
};

// Vote helpful/not helpful
const voteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { vote } = req.body; // 'helpful' or 'not-helpful'

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if already voted
    const existingVote = review.helpfulVotes.find(
      (v) => v.user.toString() === req.userId.toString()
    );

    if (existingVote) {
      // Update existing vote
      if (existingVote.vote === "helpful") review.helpfulCount--;
      if (existingVote.vote === "not-helpful") review.notHelpfulCount--;

      existingVote.vote = vote;

      if (vote === "helpful") review.helpfulCount++;
      if (vote === "not-helpful") review.notHelpfulCount++;
    } else {
      // New vote
      review.helpfulVotes.push({ user: req.userId, vote });

      if (vote === "helpful") review.helpfulCount++;
      if (vote === "not-helpful") review.notHelpfulCount++;
    }

    await review.save();

    res.json({ success: true, review });
  } catch (error) {
    console.error("Vote review error:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
};

module.exports = {
  createReview,
  getCourseReviews,
  updateReview,
  deleteReview,
  voteReview,
};
