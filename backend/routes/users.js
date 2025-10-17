const express = require("express");
const router = express.Router();
const multer = require("multer");
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");

// Multer config for avatar upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

/**
 * @route   GET /api/users/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get(
  "/dashboard/stats",
  authenticate,
  userController.getUserDashboardStats
); // ← ADD THIS

/**
 * @route   GET /api/users/stats/me
 * @desc    Get own stats
 * @access  Private
 */
router.get("/stats/me", authenticate, userController.getStats);

/**
 * @route   GET /api/users/:username
 * @desc    Get user profile
 * @access  Public
 */
router.get("/:username", userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update own profile
 * @access  Private
 */
router.put("/profile", authenticate, userController.updateProfile);

/**
 * @route   POST /api/users/avatar
 * @desc    Upload avatar
 * @access  Private
 */
router.post(
  "/avatar",
  authenticate,
  upload.single("avatar"),
  userController.uploadAvatar
);

/**
 * @route   GET /api/users/instructor/dashboard-stats
 * @desc    Get instructor dashboard statistics
 * @access  Private (Instructor only)
 */
router.get(
  "/instructor/dashboard-stats",
  authenticate,
  userController.getInstructorDashboardStats
);

/**
 * @route   GET /api/users/instructor/recent-activity
 * @desc    Get instructor recent activity
 * @access  Private (Instructor only)
 */
router.get(
  "/instructor/recent-activity",
  authenticate,
  userController.getInstructorRecentActivity
);

/**
 * @route   GET /api/users/instructor/profile
 * @desc    Get instructor's own profile with stats
 * @access  Private (Instructor only)
 */

module.exports = router;
