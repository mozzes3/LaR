const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const profCertController = require("../controllers/professionalCertificationController");

// Public routes
router.get("/", profCertController.getAllCertifications);
router.get("/:slug", profCertController.getCertificationDetails);

// Protected routes
router.post("/start-test", authenticate, profCertController.startTestAttempt);
router.post("/submit-test", authenticate, profCertController.submitTestAttempt);
router.get(
  "/attempts/my-attempts",
  authenticate,
  profCertController.getMyAttempts
);
router.get(
  "/attempts/:attemptId",
  authenticate,
  profCertController.getAttemptDetails
);
router.post("/reset-attempts", authenticate, profCertController.resetAttempts);

// Certificate routes
router.post("/certificates/purchase", authenticate, (req, res, next) => {
  console.log("✅ Certificate purchase route hit");
  profCertController.purchaseCertificate(req, res, next);
});
router.get(
  "/certificates/eligible",
  authenticate,
  profCertController.getEligibleCertificates
);
router.get(
  "/certificates/my-certificates",
  authenticate,
  profCertController.getMyCertificates
);
router.get(
  "/certificates/verify/:certificateNumber",
  profCertController.verifyCertificate
);

module.exports = router;
