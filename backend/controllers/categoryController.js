const categories = require("../config/categories");

/**
 * Get all categories with subcategories
 */
const getCategories = async (req, res) => {
  try {
    const categoryList = Object.keys(categories).map((key) => ({
      name: key,
      ...categories[key],
    }));

    res.json({
      success: true,
      categories: categoryList,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to get categories" });
  }
};

/**
 * Get subcategories for a specific category
 */
const getSubcategories = async (req, res) => {
  try {
    const { category } = req.params;

    if (!categories[category]) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      success: true,
      subcategories: categories[category].subcategories,
    });
  } catch (error) {
    console.error("Get subcategories error:", error);
    res.status(500).json({ error: "Failed to get subcategories" });
  }
};

module.exports = {
  getCategories,
  getSubcategories,
};
