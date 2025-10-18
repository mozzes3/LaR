const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const courseController = require("../controllers/courseController");
const {
  authenticate,
  isInstructor,
  optionalAuth,
} = require("../middleware/auth");

const Course = require("../models/Course");
const Purchase = require("../models/Purchase");
const bunnyService = require("../services/bunnyService");

const videoUrlLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  message: "Too many video requests",
  standardHeaders: true,
  handler: (req, res) => {
    console.log(`🚨 Rate limit hit by ${req.ip}`);
    res.status(429).json({ error: "Too many requests" });
  },
});

/**
 * @route   POST /api/courses/:slug/sync-video-durations
 * @desc    Sync video durations from Bunny
 * @access  Private (Instructor only)
 */
router.post("/:slug/sync-video-durations", authenticate, async (req, res) => {
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
});

// PUBLIC: Get all courses
router.get("/", optionalAuth, courseController.getCourses);

// INSTRUCTOR ROUTES - Put ALL specific routes BEFORE /:username
/**
 * @route   GET /api/courses/instructor/my-courses
 * @desc    Get instructor's own courses (basic)
 * @access  Private (Instructor only)
 */
router.get(
  "/instructor/my-courses",
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
  authenticate,
  isInstructor,
  courseController.getInstructorCoursesWithStats
);

/**
 * @route   GET /api/courses/instructor/:username
 * @desc    Get courses by instructor username (MUST BE AFTER SPECIFIC ROUTES)
 * @access  Public
 */
router.get("/instructor/:username", courseController.getCoursesByInstructor);

// OTHER INSTRUCTOR ROUTES
router.post("/", authenticate, isInstructor, courseController.createCourse);
router.post(
  "/:slug/publish",
  authenticate,
  isInstructor,
  courseController.publishCourse
);
router.put("/:slug", authenticate, isInstructor, courseController.updateCourse);
router.delete(
  "/:slug",
  authenticate,
  isInstructor,
  courseController.deleteCourse
);

/**
 * @route   GET /api/courses/:slug/lessons/:lessonId/video
 * @desc    Get signed video URL for a lesson
 * @access  Private (Must own course or be instructor)
 */

/**
 * @route   GET /api/courses/:slug/lessons/:lessonId/video
 * @desc    Get signed video URL for a lesson (with user fingerprinting)
 * @access  Private (Must own course or be instructor)
 */
router.get(
  "/:slug/lessons/:lessonId/video",
  authenticate,
  videoUrlLimiter,
  async (req, res) => {
    try {
      const { slug, lessonId } = req.params;

      console.log(
        `🎬 Video URL request: ${slug}, lesson: ${lessonId}, user: ${req.userId}`
      );

      // Get course
      const course = await Course.findOne({ slug }).populate(
        "instructor",
        "name username avatar"
      );

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Find the lesson
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

      console.log(
        `📹 Found lesson: ${lesson.title}, videoId: ${lesson.videoId}`
      );

      if (!lesson.videoId) {
        return res
          .status(404)
          .json({ error: "Video not found for this lesson" });
      }

      // Check if user has access
      const isInstructor = course.instructor._id.toString() === req.userId;
      const isPreview = lesson.isPreview;
      const hasPurchased = await Purchase.exists({
        user: req.userId,
        course: course._id,
        status: "active", // ← Add this check
      });

      if (!hasPurchased && !isInstructor && !isPreview) {
        return res.status(403).json({ error: "Purchase required" });
      }
      const hasAccess = isInstructor || isPreview || hasPurchased;

      console.log(
        `🔐 Access check: instructor=${isInstructor}, preview=${isPreview}, purchased=${hasPurchased}`
      );

      if (!hasAccess) {
        return res
          .status(403)
          .json({ error: "You don't have access to this lesson" });
      }

      // Different expiry times based on lesson type
      const previewExpiry = 14400; // 4 hours for preview
      const paidExpiry = 1800; // 30 minutes for paid lessons (shorter!)
      const instructorExpiry = 28800; // 8 hours for instructors

      let expiryTime;
      if (isInstructor) {
        expiryTime = instructorExpiry;
      } else if (isPreview) {
        expiryTime = previewExpiry;
      } else {
        expiryTime = paidExpiry; // Paid students get SHORT expiry
      }

      console.log(
        `⏱️ Token expiry: ${expiryTime} seconds (${expiryTime / 60} minutes)`
      );

      // Generate signed URL

      const signedUrl = bunnyService.generateVideoUrl(
        lesson.videoId,
        expiryTime
      );

      // Log access for security monitoring
      console.log(
        `✅ Video access granted: user=${req.userId}, lesson=${lessonId}, expires=${expiryTime}s`
      );

      res.json({
        success: true,
        videoUrl: signedUrl,
        expiresIn: expiryTime,
        expiresAt: new Date(Date.now() + expiryTime * 1000).toISOString(),
        // Don't send these to client, just for logging
        // userId: req.userId,
        // lessonId: lessonId,
      });
    } catch (error) {
      console.error("Get video URL error:", error);
      res.status(500).json({ error: "Failed to get video URL" });
    }
  }
);

// In backend/routes/courses.js - Add this BEFORE other routes

// Dynamic route - KEEP THIS LAST
router.get("/:slug", optionalAuth, courseController.getCourse);

module.exports = router;
