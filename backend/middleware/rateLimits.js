const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redis = require("redis");

// Create Redis client
let redisClient;
let useRedis = false;

async function initializeRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log("⚠️  Redis unavailable, using memory store");
            return new Error("Redis unavailable");
          }
          return retries * 1000;
        },
      },
    });

    redisClient.on("error", (err) => {
      useRedis = false;
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected for rate limiting");
      useRedis = true;
    });

    await redisClient.connect();
    useRedis = true;
  } catch (error) {
    console.log("⚠️  Using memory store (Redis unavailable)");
    useRedis = false;
  }
}

initializeRedis().catch(() => {
  useRedis = false;
});

// Helper function to create rate limiter
function createLimiter(options) {
  const config = {
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: options.message || "Too many requests, please try again later",
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
  };

  if (useRedis && redisClient?.isReady) {
    config.store = new RedisStore({
      client: redisClient,
      prefix: options.prefix || "rl:",
    });
  }

  return rateLimit(config);
}

// ========================================
// TIER 1: BROWSING (Very Generous)
// User navigating through pages quickly
// ========================================
const browsingLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute = 1.6 req/sec
  prefix: "rl:browse:",
  message: "Slow down! Too many page loads.",
});

// ========================================
// TIER 2: PUBLIC READ (Generous)
// Anonymous users browsing courses, profiles
// ========================================
const publicLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 60, // 60 requests per minute = 1 req/sec
  prefix: "rl:public:",
  message: "Too many requests from this IP, please try again later",
});

// ========================================
// TIER 3: AUTHENTICATED READ (Generous)
// Logged-in users reading data
// ========================================
const authLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 120, // 120 requests per minute = 2 req/sec
  prefix: "rl:auth:",
  message: "Too many requests, please slow down",
});

// ========================================
// TIER 4: WRITE OPERATIONS (Moderate)
// Creating/updating content
// ========================================
const writeLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 writes per minute
  prefix: "rl:write:",
  message: "Too many write operations, please wait",
});

// ========================================
// TIER 5: EXPENSIVE QUERIES (Restrictive)
// Heavy database operations, analytics
// ========================================
const expensiveLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 20, // 20 queries per minute
  prefix: "rl:expensive:",
  message: "Too many database queries, please slow down",
});

// ========================================
// TIER 6: VIDEO OPERATIONS (Moderate)
// Video URLs, streaming sessions
// ========================================
const videoLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 video requests per minute (user can skip around)
  prefix: "rl:video:",
  message: "Too many video requests, please wait",
});

// ========================================
// TIER 7: FILE UPLOADS (Very Restrictive)
// Large file uploads
// ========================================
const uploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes
  prefix: "rl:upload:",
  message: "Upload limit reached, please wait before uploading more files",
});

// ========================================
// TIER 8: AUTHENTICATION (Moderate)
// Login, signup, token refresh
// ========================================
const authEndpointLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  prefix: "rl:auth-endpoint:",
  message: "Too many authentication attempts, please try again later",
  skipSuccessfulRequests: true, // Don't count successful logins
});

// ========================================
// TIER 9: CRITICAL OPERATIONS (Very Restrictive)
// Payments, purchases, certificates
// ========================================
const criticalLimiter = createLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 critical operations per 5 minutes
  prefix: "rl:critical:",
  message: "Too many critical operations, please wait",
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// ========================================
// TIER 10: ADMIN OPERATIONS (Generous for admins)
// Admin dashboard, management
// ========================================
const adminLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 200, // Admins need higher limits
  prefix: "rl:admin:",
  message: "Too many admin requests",
});

// ========================================
// TIER 11: SEARCH/FILTER (Moderate)
// Search queries, filtering
// ========================================
const searchLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 40, // 40 searches per minute (typing in search box)
  prefix: "rl:search:",
  message: "Too many search requests",
});

// Add after other limiters
const previewLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
  message: "Too many preview requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip limiting for instructors and purchasers
    return false; // Apply to everyone for previews
  },
});

module.exports = {
  browsingLimiter,
  publicLimiter,
  authLimiter,
  writeLimiter,
  expensiveLimiter,
  videoLimiter,
  uploadLimiter,
  authEndpointLimiter,
  criticalLimiter,
  adminLimiter,
  searchLimiter,
  redisClient,
  previewLimiter,
};
