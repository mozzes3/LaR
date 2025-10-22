const express = require("express");
const router = express.Router();
const { adminLimiter, expensiveLimiter } = require("../middleware/rateLimits");
const { enforcePaginationLimits } = require("../middleware/paginationLimits");
const adminController = require("../controllers/adminController");
const { authenticate, isAdmin } = require("../middleware/auth");
const { hasPermission, isSuperAdmin } = require("../middleware/permission");

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);
router.use(enforcePaginationLimits);
// ===== DASHBOARD (Expensive) =====
router.get(
  "/dashboard/stats",
  expensiveLimiter,
  adminController.getAdminDashboardStats
);

// ===== ROLE MANAGEMENT =====
router.get("/roles", adminLimiter, adminController.getAllRoles);
router.post(
  "/roles",
  adminLimiter,
  hasPermission("roles", "create"),
  adminController.createRole
);
router.put(
  "/roles/:roleId",
  adminLimiter,
  hasPermission("roles", "update"),
  adminController.updateRole
);
router.delete(
  "/roles/:roleId",
  adminLimiter,
  hasPermission("roles", "delete"),
  adminController.deleteRole
);

// ===== USER MANAGEMENT (Expensive reads) =====
router.get("/users", expensiveLimiter, adminController.getAllUsers);
router.get("/users/:userId", adminLimiter, adminController.getUserDetails);
router.post(
  "/users/:userId/assign-role",
  adminLimiter,
  hasPermission("users", "update"),
  adminController.assignRole
);
router.put(
  "/users/:userId/permissions",
  adminLimiter,
  hasPermission("users", "update"),
  adminController.updateUserPermissions
);
router.post(
  "/users/:userId/toggle-ban",
  adminLimiter,
  hasPermission("users", "update"),
  adminController.toggleUserBan
);
router.post(
  "/users/:userId/make-super-admin",
  adminLimiter,
  isSuperAdmin,
  adminController.makeSuperAdmin
);
router.put(
  "/users/:userId/details",
  adminLimiter,
  hasPermission("users", "update"),
  adminController.updateUserDetails
);
router.post(
  "/users/:userId/toggle-instructor",
  adminLimiter,
  hasPermission("users", "update"),
  adminController.toggleInstructorStatus
);

// ===== COURSE MANAGEMENT (Expensive) =====
router.get("/courses", expensiveLimiter, adminController.getAllCoursesAdmin);
router.put(
  "/courses/:courseId/status",
  adminLimiter,
  hasPermission("courses", "update"),
  adminController.updateCourseStatus
);
router.delete(
  "/courses/:courseId",
  adminLimiter,
  hasPermission("courses", "delete"),
  adminController.deleteCourse
);

// ===== REVIEW MANAGEMENT (Expensive) =====
router.get("/reviews", expensiveLimiter, adminController.getAllReviewsAdmin);
router.put(
  "/reviews/:reviewId/status",
  adminLimiter,
  hasPermission("reviews", "update"),
  adminController.updateReviewStatus
);
router.delete(
  "/reviews/:reviewId",
  adminLimiter,
  hasPermission("reviews", "delete"),
  adminController.deleteReview
);

// ===== APPLICATIONS (Expensive) =====
router.get(
  "/applications",
  expensiveLimiter,
  adminController.getAllApplications
);
router.post(
  "/applications/:id/approve",
  adminLimiter,
  hasPermission("applications", "approve"),
  adminController.approveApplication
);
router.post(
  "/applications/:id/pause",
  adminLimiter,
  hasPermission("applications", "approve"),
  adminController.pauseApplication
);
router.post(
  "/applications/:id/reject",
  adminLimiter,
  hasPermission("applications", "approve"),
  adminController.rejectApplication
);
router.delete(
  "/applications/:id",
  adminLimiter,
  hasPermission("applications", "delete"),
  adminController.deleteApplication
);

// ===== PURCHASES (Expensive) =====
router.get("/purchases", expensiveLimiter, adminController.getAllPurchases);

module.exports = router;
