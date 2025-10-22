const enforcePaginationLimits = (req, res, next) => {
  const MAX_LIMIT = 100; // Maximum items per page
  const DEFAULT_LIMIT = 20;

  if (req.query.limit) {
    const requestedLimit = parseInt(req.query.limit);

    if (requestedLimit > MAX_LIMIT) {
      req.query.limit = MAX_LIMIT;
      console.warn(`⚠️  Limit capped: ${requestedLimit} → ${MAX_LIMIT}`);
    } else if (requestedLimit < 1) {
      req.query.limit = DEFAULT_LIMIT;
    }
  }

  if (req.query.page) {
    const page = parseInt(req.query.page);
    if (page < 1 || isNaN(page)) {
      req.query.page = 1;
    }
  }

  next();
};

module.exports = { enforcePaginationLimits };
