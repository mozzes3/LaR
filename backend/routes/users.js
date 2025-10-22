const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  publicLimiter,
  browsingLimiter,
  authLimiter,
  writeLimiter,
  expensiveLimiter,
  uploadLimiter,
} = require("../middleware/rateLimits");
const userController = require("../controllers/userController");

const { enforcePaginationLimits } = require("../middleware/paginationLimits");
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

// Payment wallet management (instructor only)
router.get(
  "/payment-wallets",
  authLimiter,
  authenticate,
  userController.getPaymentWallets
);
router.post(
  "/payment-wallets",
  writeLimiter,
  authenticate,
  userController.addPaymentWallet
);
router.delete(
  "/payment-wallets/:walletId",
  writeLimiter,
  authenticate,
  userController.removePaymentWallet
);
router.post(
  "/payment-wallets/set-primary",
  writeLimiter,
  authenticate,
  userController.setPrimaryWallet
);
/**
/**
 * @route   GET /api/users/analytics
 * @desc    Get student's learning analytics
 * @access  Private
 */
router.get(
  "/analytics",
  expensiveLimiter,
  authenticate,
  userController.getStudentAnalytics
);

/**
 * @route   GET /api/users/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get(
  "/dashboard/stats",
  authLimiter,
  authenticate,
  userController.getUserDashboardStats
); // ← ADD THIS
router.get(
  "/dashboard/complete",
  authLimiter,
  authenticate,
  userController.getStudentDashboard
);
/**
 * @route   GET /api/users/stats/me
 * @desc    Get own stats
 * @access  Private
 */
router.get("/stats/me", authLimiter, authenticate, userController.getStats);

/**
 * @route   GET /api/users/:username/complete
 * @desc    Get complete profile data in single call
 * @access  Public (auth optional)
 */
router.get(
  "/:username/complete",
  authLimiter,
  async (req, res, next) => {
    // Optional auth - attach userId if token exists
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
      } catch (err) {
        // Token invalid/expired - continue as public
      }
    }
    next();
  },
  userController.getProfileComplete
);

/**
 * @route   GET /api/users/:username
 * @desc    Get user profile
 * @access  Public
 */
router.get("/:username", browsingLimiter, userController.getProfile);

/**
 * @route   GET /api/users/instructor/:username/stats
 * @desc    Get instructor's public statistics
 * @access  Public
 */
router.get(
  "/instructor/:username/stats",
  publicLimiter,
  userController.getInstructorPublicStats
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update own profile
 * @access  Private
 */
router.put(
  "/profile",
  writeLimiter,
  authenticate,
  userController.updateProfile
);

/**
 * @route   POST /api/users/avatar
 * @desc    Upload avatar
 * @access  Private
 */
router.post(
  "/avatar",
  uploadLimiter,
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
  expensiveLimiter,
  authenticate,
  userController.getInstructorDashboardStats
);

router.get(
  "/instructor/earnings-history",
  expensiveLimiter,
  authenticate,
  userController.getInstructorEarningsHistory
);

router.get(
  "/instructor/earnings-transactions",
  expensiveLimiter,
  authenticate,
  userController.getInstructorEarningsTransactions
);

/**
 * @route   GET /api/users/instructor/recent-activity
 * @desc    Get instructor recent activity
 * @access  Private (Instructor only)
 */
router.get(
  "/instructor/recent-activity",
  authLimiter,
  authenticate,
  userController.getInstructorRecentActivity
);

router.get(
  "/instructor/students/:studentId",
  authLimiter,
  authenticate,
  userController.getStudentDetails
);

/**
 * @route   GET /api/users/instructor/all-students
 * @desc    Get all students across all instructor's courses
 * @access  Private (Instructor only)
 */
router.get(
  "/instructor/all-students",
  enforcePaginationLimits,
  expensiveLimiter,
  authenticate,
  userController.getAllStudents
);
router.get(
  "/instructor/dashboard/complete",
  authLimiter,
  authenticate,
  userController.getInstructorDashboardComplete
);
router.get(
  "/instructor/:username/complete",
  browsingLimiter,
  userController.getInstructorProfileComplete
);

/**
 * @route   GET /api/users/instructor/earnings/complete
 * @desc    Get instructor earnings stats + transactions in one call
 * @access  Private (Instructor only)
 */
router.get(
  "/instructor/earnings-complete",
  expensiveLimiter,
  authenticate,
  userController.getInstructorEarningsComplete
);
module.exports = router;
