const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, isAdmin } = require("../middleware/auth");
const { hasPermission, isSuperAdmin } = require("../middleware/permission");

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// ===== DASHBOARD =====
router.get("/dashboard/stats", adminController.getAdminDashboardStats);

// ===== ROLE MANAGEMENT =====
router.get("/roles", adminController.getAllRoles);
router.post(
  "/roles",
  hasPermission("roles", "create"),
  adminController.createRole
);
router.put(
  "/roles/:roleId",
  hasPermission("roles", "update"),
  adminController.updateRole
);
router.delete(
  "/roles/:roleId",
  hasPermission("roles", "delete"),
  adminController.deleteRole
);

// ===== USER MANAGEMENT =====
router.get("/users", adminController.getAllUsers);
router.get("/users/:userId", adminController.getUserDetails);
router.post(
  "/users/:userId/assign-role",
  hasPermission("users", "update"),
  adminController.assignRole
);
router.put(
  "/users/:userId/permissions",
  hasPermission("users", "update"),
  adminController.updateUserPermissions
);
router.post(
  "/users/:userId/toggle-ban",
  hasPermission("users", "update"),
  adminController.toggleUserBan
);
router.post(
  "/users/:userId/make-super-admin",
  isSuperAdmin,
  adminController.makeSuperAdmin
);

// ===== COURSE MANAGEMENT =====
router.get("/courses", adminController.getAllCoursesAdmin);
router.put(
  "/courses/:courseId/status",
  hasPermission("courses", "update"),
  adminController.updateCourseStatus
);
router.delete(
  "/courses/:courseId",
  hasPermission("courses", "delete"),
  adminController.deleteCourse
);

// ===== REVIEW MANAGEMENT =====
router.get("/reviews", adminController.getAllReviewsAdmin);
router.put(
  "/reviews/:reviewId/status",
  hasPermission("reviews", "update"),
  adminController.updateReviewStatus
);
router.delete(
  "/reviews/:reviewId",
  hasPermission("reviews", "delete"),
  adminController.deleteReview
);

// ===== INSTRUCTOR APPLICATIONS =====
router.get("/applications", adminController.getAllApplications);
router.post(
  "/applications/:id/approve",
  hasPermission("applications", "approve"),
  adminController.approveApplication
);
router.post(
  "/applications/:id/pause",
  hasPermission("applications", "approve"),
  adminController.pauseApplication
);
router.post(
  "/applications/:id/reject",
  hasPermission("applications", "approve"),
  adminController.rejectApplication
);
router.delete(
  "/applications/:id",
  hasPermission("applications", "delete"),
  adminController.deleteApplication
);

// ===== PURCHASES =====
router.get("/purchases", adminController.getAllPurchases);

module.exports = router;
