const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructorController");
const { authenticate, isAdmin } = require("../middleware/auth");

// User routes
router.post("/apply", authenticate, instructorController.applyInstructor);
router.get(
  "/my-application",
  authenticate,
  instructorController.getMyApplication
);

// Admin routes
router.get(
  "/applications",
  authenticate,
  isAdmin,
  instructorController.getAllApplications
);
router.post(
  "/applications/:id/approve",
  authenticate,
  isAdmin,
  instructorController.approveApplication
);
router.post(
  "/applications/:id/reject",
  authenticate,
  isAdmin,
  instructorController.rejectApplication
);

module.exports = router;
