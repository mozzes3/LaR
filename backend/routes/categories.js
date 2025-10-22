const express = require("express");
const router = express.Router();
const { browsingLimiter } = require("../middleware/rateLimits");
const categoryController = require("../controllers/categoryController");

/**
 * @route   GET /api/categories
 * @desc    Get all categories with subcategories
 * @access  Public
 */
router.get("/", browsingLimiter, categoryController.getCategories);

/**
 * @route   GET /api/categories/:category/subcategories
 * @desc    Get subcategories for a category
 * @access  Public
 */
router.get(
  "/:category/subcategories",
  browsingLimiter,
  categoryController.getSubcategories
);

module.exports = router;
