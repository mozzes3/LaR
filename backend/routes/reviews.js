const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, reviewController.createReview);
router.get("/course/:courseId", reviewController.getCourseReviews);
router.put("/:reviewId", authenticate, reviewController.updateReview);
router.delete("/:reviewId", authenticate, reviewController.deleteReview);
router.post("/:reviewId/vote", authenticate, reviewController.voteReview);

module.exports = router;
