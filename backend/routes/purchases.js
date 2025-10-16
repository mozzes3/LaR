const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, purchaseController.purchaseCourse);
router.get("/my-purchases", authenticate, purchaseController.getMyPurchases);
router.get("/:courseId", authenticate, purchaseController.getPurchase);
router.post(
  "/complete-lesson",
  authenticate,
  purchaseController.completeLesson
);

module.exports = router;
