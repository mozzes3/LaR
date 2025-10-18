const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

/**
 * @route   GET /api/categories
 * @desc    Get all categories with subcategories
 * @access  Public
 */
router.get("/", categoryController.getCategories);

/**
 * @route   GET /api/categories/:category/subcategories
 * @desc    Get subcategories for a category
 * @access  Public
 */
router.get("/:category/subcategories", categoryController.getSubcategories);

module.exports = router;
