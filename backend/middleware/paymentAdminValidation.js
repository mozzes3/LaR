const { body, param, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

const validateTokenCreation = [
  body("symbol").trim().notEmpty().isLength({ max: 10 }),
  body("name").trim().notEmpty().isLength({ max: 50 }),
  body("contractAddress").trim().isLength({ min: 42, max: 42 }),
  body("paymentContractAddress").trim().isLength({ min: 42, max: 42 }),
  body("chainId").isInt({ min: 1 }),
  body("decimals").isInt({ min: 0, max: 18 }),
  handleValidationErrors,
];

const validateTokenUpdate = [
  param("tokenId").isMongoId(),
  handleValidationErrors,
];

const validateSettingsUpdate = [
  body("defaultPlatformFeePercentage").optional().isInt({ min: 0, max: 10000 }),
  body("defaultInstructorFeePercentage")
    .optional()
    .isInt({ min: 0, max: 10000 }),
  handleValidationErrors,
];

module.exports = {
  validateTokenCreation,
  validateTokenUpdate,
  validateSettingsUpdate,
};
