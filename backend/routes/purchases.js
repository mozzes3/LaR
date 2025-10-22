const express = require("express");
const router = express.Router();
const {
  authLimiter,
  criticalLimiter,
  expensiveLimiter,
} = require("../middleware/rateLimits");
const purchaseController = require("../controllers/purchaseController");
const { authenticate } = require("../middleware/auth");

router.post(
  "/",
  criticalLimiter,
  authenticate,
  purchaseController.purchaseCourse
);
router.get(
  "/my-purchases",
  expensiveLimiter,
  authenticate,
  purchaseController.getMyPurchases
);
router.get(
  "/:courseId",
  authLimiter,
  authenticate,
  purchaseController.getPurchase
);
router.post(
  "/complete-lesson",
  authLimiter,
  authenticate,
  purchaseController.completeLesson
);

module.exports = router;
