const crypto = require("crypto");
const VideoSession = require("../models/VideoSession.js");
const Course = require("../models/Course");
const Purchase = require("../models/Purchase.DEPRECATED.js");

class VideoSessionService {
  /**
   * Generate a secure session token
   */
  generateSessionToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Create or refresh video session for a course
   */
  async createSession(userId, courseId, ipAddress, userAgent) {
    try {
      // Validate access
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }

      // Check if instructor or purchased
      const isInstructor = course.instructor.toString() === userId.toString();
      const hasPurchased = await Purchase.exists({
        user: userId,
        course: courseId,
        status: "active",
      });

      if (!isInstructor && !hasPurchased) {
        throw new Error("Access denied: Purchase required");
      }

      // Invalidate any existing active sessions for this user+course
      await VideoSession.updateMany(
        { user: userId, course: courseId, isActive: true },
        { isActive: false }
      );

      // Collect all video IDs from course
      const videoIds = [];
      course.sections.forEach((section) => {
        section.lessons.forEach((lesson) => {
          if (lesson.videoId) {
            videoIds.push(lesson.videoId);
          }
        });
      });

      // Create new session - 4 hours for students, 8 hours for instructors
      const sessionDuration = isInstructor
        ? 8 * 60 * 60 * 1000
        : 4 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + sessionDuration);
      const sessionToken = this.generateSessionToken();

      const session = await VideoSession.create({
        user: userId,
        course: courseId,
        sessionToken,
        expiresAt,
        ipAddress,
        userAgent,
        videoIds,
        isActive: true,
      });

      console.log(
        `✅ Created video session: ${sessionToken.substring(
          0,
          10
        )}... expires at ${expiresAt}`
      );

      return {
        sessionToken,
        expiresAt,
        expiresIn: Math.floor(sessionDuration / 1000),
      };
    } catch (error) {
      console.error("❌ Create session error:", error);
      throw error;
    }
  }

  /**
   * Validate session token
   */
  async validateSession(sessionToken, userId, courseId, ipAddress) {
    try {
      const session = await VideoSession.findOne({
        sessionToken,
        user: userId,
        course: courseId,
        isActive: true,
      });

      if (!session) {
        throw new Error("Invalid session");
      }

      // Check expiration
      if (new Date() > session.expiresAt) {
        session.isActive = false;
        await session.save();
        throw new Error("Session expired");
      }

      // Security: Check IP address (optional - can be too strict)
      // if (session.ipAddress !== ipAddress) {
      //   throw new Error("IP address mismatch");
      // }

      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionToken) {
    try {
      await VideoSession.updateOne({ sessionToken }, { isActive: false });
      console.log(
        `✅ Invalidated session: ${sessionToken.substring(0, 10)}...`
      );
    } catch (error) {
      console.error("❌ Invalidate session error:", error);
    }
  }

  /**
   * Clean up expired sessions (run via cron)
   */
  async cleanupExpiredSessions() {
    try {
      const result = await VideoSession.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      console.log(`🧹 Cleaned up ${result.deletedCount} expired sessions`);
      return result.deletedCount;
    } catch (error) {
      console.error("❌ Cleanup error:", error);
      return 0;
    }
  }
}

module.exports = new VideoSessionService();
