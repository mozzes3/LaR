const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const courseController = require("../controllers/courseController");
const previewCacheService = require("../services/previewCacheService");
const {
  authenticate,
  isInstructor,
  optionalAuth,
} = require("../middleware/auth");
const {
  publicLimiter,
  browsingLimiter,
  authLimiter,
  writeLimiter,
  expensiveLimiter,
  videoLimiter,
  searchLimiter,
  previewLimiter,
} = require("../middleware/rateLimits");

const Course = require("../models/Course");
const Purchase = require("../models/Purchase");
const bunnyService = require("../services/bunnyService");
const videoSessionService = require("../services/videoSessionService");

/**
 * @route   POST /api/courses/:slug/video-session
 * @desc    Create video session for entire course
 * @access  Private (Must own course or be instructor)
 */
router.post(
  "/:slug/video-session",
  videoLimiter,
  authenticate,
  async (req, res) => {
    try {
      const { slug } = req.params;
      const userId = req.userId;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"] || "unknown";

      console.log(`🎬 Video session request: ${slug}, user: ${userId}`);

      // Get course
      const course = await Course.findOne({ slug }).select(
        "_id instructor sections"
      );

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Create session
      const session = await videoSessionService.createSession(
        userId,
        course._id,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        expiresIn: session.expiresIn,
      });
    } catch (error) {
      console.error("❌ Video session error:", error);

      if (error.message.includes("Access denied")) {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to create video session" });
    }
  }
);

/**
 * @route   POST /api/courses/:slug/sync-video-durations
 * @desc    Sync video durations from Bunny
 * @access  Private (Instructor only)
 */
router.post(
  "/:slug/sync-video-durations",
  videoLimiter,
  authenticate,
  async (req, res) => {
    try {
      const { slug } = req.params;

      const course = await Course.findOne({ slug });

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Check if user is the instructor
      if (course.instructor.toString() !== req.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      console.log(`🔄 Syncing video durations for course: ${course.title}`);

      let updatedCount = 0;

      // Loop through all sections and lessons
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          if (lesson.videoId) {
            try {
              const videoInfo = await bunnyService.getVideoInfo(lesson.videoId);

              if (videoInfo.duration > 0) {
                lesson.duration = videoInfo.duration;
                updatedCount++;
                console.log(
                  `✅ Updated "${lesson.title}": ${videoInfo.duration}s`
                );
              }
            } catch (error) {
              console.error(
                `❌ Failed to get duration for ${lesson.title}:`,
                error.message
              );
            }
          }
        }
      }

      await course.save();

      console.log(`✅ Updated ${updatedCount} video durations`);

      res.json({
        success: true,
        message: `Updated ${updatedCount} video durations`,
        updatedCount,
      });
    } catch (error) {
      console.error("Sync durations error:", error);
      res.status(500).json({ error: "Failed to sync video durations" });
    }
  }
);

// PUBLIC: Get all courses
router.get("/", searchLimiter, optionalAuth, courseController.getCourses);

// INSTRUCTOR ROUTES - Put ALL specific routes BEFORE /:username
/**
 * @route   GET /api/courses/instructor/my-courses
 * @desc    Get instructor's own courses (basic)
 * @access  Private (Instructor only)
 */
router.get(
  "/instructor/my-courses",
  authLimiter,
  authenticate,
  isInstructor,
  courseController.getInstructorCourses
);

/**
 * @route   GET /api/courses/instructor/my-courses-stats
 * @desc    Get instructor's courses with statistics
 * @access  Private (Instructor only)
 */
router.get(
  "/instructor/my-courses-stats",
  authLimiter,
  authenticate,
  isInstructor,
  courseController.getInstructorCoursesWithStats
);

/**
 * @route   GET /api/courses/instructor/:username
 * @desc    Get courses by instructor username (MUST BE AFTER SPECIFIC ROUTES)
 * @access  Public
 */
router.get(
  "/instructor/:username",
  publicLimiter,
  courseController.getCoursesByInstructor
);

// OTHER INSTRUCTOR ROUTES
router.post(
  "/",
  writeLimiter,
  authenticate,
  isInstructor,
  courseController.createCourse
);
router.post(
  "/:slug/publish",
  writeLimiter,
  authenticate,
  isInstructor,
  courseController.publishCourse
);
router.put(
  "/:slug",
  writeLimiter,
  authenticate,
  isInstructor,
  courseController.updateCourse
);
router.delete(
  "/:slug",
  writeLimiter,
  authenticate,
  isInstructor,
  courseController.deleteCourse
);

router.get(
  "/instructor/analytics/all",
  expensiveLimiter,
  authenticate,
  isInstructor,
  courseController.getAllCoursesAnalytics
);

router.get(
  "/instructor/analytics/:courseId",
  expensiveLimiter,
  authenticate,
  isInstructor,
  courseController.getCourseAnalytics
);
/**
 * @route   GET /api/courses/:slug/lessons/:lessonId/video
 * @desc    Get signed video URL using session token
 * @access  Private (Must have valid session)
 */
router.get(
  "/:slug/lessons/:lessonId/video",
  videoLimiter,
  authenticate,
  async (req, res) => {
    try {
      const { slug, lessonId } = req.params;
      const { sessionToken } = req.query;
      const userId = req.userId;
      const ipAddress = req.ip || req.connection.remoteAddress;

      if (!sessionToken) {
        return res.status(400).json({ error: "Session token required" });
      }

      console.log(`🎬 Video URL request: ${slug}, lesson: ${lessonId}`);

      // Get course
      const course = await Course.findOne({ slug }).select(
        "_id instructor sections"
      );

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const session = await videoSessionService.validateSession(
        sessionToken,
        userId,
        course._id,
        ipAddress
      );

      // Find lesson
      let lesson = null;
      for (const section of course.sections) {
        const foundLesson = section.lessons.find(
          (l) => l._id.toString() === lessonId
        );
        if (foundLesson) {
          lesson = foundLesson;
          break;
        }
      }

      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      if (!lesson.videoId) {
        return res
          .status(404)
          .json({ error: "Video not found for this lesson" });
      }

      // ✅ NEW: Check cache for preview videos (doesn't affect non-preview)
      if (lesson.isPreview) {
        const cachedUrl = previewCacheService.get(course._id, lessonId);
        if (cachedUrl) {
          console.log(`✅ Using cached preview URL`);
          return res.json({
            success: true,
            videoUrl: cachedUrl,
            expiresIn: 300,
            expiresAt: new Date(Date.now() + 300 * 1000),
          });
        }
      }

      // Verify video is in session (security check)
      if (!session.videoIds.includes(lesson.videoId)) {
        return res.status(403).json({ error: "Video not in session" });
      }

      // Generate signed URL with remaining session time
      const videoTokenExpiry = 30 * 60; // 30 minutes in seconds
      const signedUrl = bunnyService.generateVideoUrl(
        lesson.videoId,
        videoTokenExpiry
      );

      // ✅ NEW: Cache preview video URLs (doesn't affect non-preview)
      if (lesson.isPreview) {
        previewCacheService.set(course._id, lessonId, signedUrl);
        console.log(`💾 Cached preview URL for 5 minutes`);
      }

      console.log(`✅ Video URL generated, expires in ${videoTokenExpiry}s`);

      res.json({
        success: true,
        videoUrl: signedUrl,
        expiresIn: videoTokenExpiry,
        expiresAt: new Date(Date.now() + videoTokenExpiry * 1000),
      });
    } catch (error) {
      console.error("❌ Get video URL error:", error);

      if (
        error.message.includes("Invalid session") ||
        error.message.includes("Session expired")
      ) {
        return res.status(401).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to get video URL" });
    }
  }
);

router.get(
  "/:slug/lessons/:lessonId/preview",
  previewLimiter,
  authenticate,
  async (req, res, next) => {
    // Forward to main video route
    req.url = req.url.replace("/preview", "/video");
    next("route");
  }
);

// In backend/routes/courses.js - Add this BEFORE other routes

// Dynamic route - KEEP THIS LAST
router.get("/:slug", browsingLimiter, optionalAuth, courseController.getCourse);

module.exports = router;
