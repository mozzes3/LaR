const validator = require("validator");

/**
 * Sanitize and validate input to prevent injection attacks
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize string fields
    const sanitizeString = (str) => {
      if (typeof str !== "string") return str;

      // Remove any HTML tags (XSS prevention)
      str = validator.escape(str);

      // Remove null bytes (SQL injection prevention)
      str = str.replace(/\0/g, "");

      return str;
    };

    // Sanitize body
    if (req.body && typeof req.body === "object") {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === "string") {
          req.body[key] = sanitizeString(req.body[key]);
        }
      });
    }

    // Sanitize query params
    if (req.query && typeof req.query === "object") {
      Object.keys(req.query).forEach((key) => {
        if (typeof req.query[key] === "string") {
          req.query[key] = sanitizeString(req.query[key]);
        }
      });
    }

    next();
  } catch (error) {
    console.error("Sanitization error:", error);
    res.status(500).json({ error: "Input validation failed" });
  }
};

module.exports = { sanitizeInput };
