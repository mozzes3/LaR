const express = require("express");
const router = express.Router();
const {
  publicLimiter,
  authLimiter,
  writeLimiter,
} = require("../middleware/rateLimits");
const reviewController = require("../controllers/reviewController");
const { authenticate } = require("../middleware/auth");

// Public reading
router.get(
  "/course/:courseId",
  publicLimiter,
  reviewController.getCourseReviews
);

// Writing reviews (prevent spam)
router.post("/", writeLimiter, authenticate, reviewController.createReview);
router.put(
  "/:reviewId",
  writeLimiter,
  authenticate,
  reviewController.updateReview
);
router.delete(
  "/:reviewId",
  writeLimiter,
  authenticate,
  reviewController.deleteReview
);

// Voting (users might vote on multiple reviews)
router.post(
  "/:reviewId/vote",
  authLimiter,
  authenticate,
  reviewController.voteReview
);

module.exports = router;
