class VideoSessionManager {
  constructor() {
    this.SESSION_KEY_PREFIX = "video_session_";
    this.SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  }

  /**
   * Get session key for a course
   */
  getSessionKey(courseId) {
    return `${this.SESSION_KEY_PREFIX}${courseId}`;
  }

  /**
   * Store session in localStorage
   */
  storeSession(courseId, sessionData) {
    try {
      const key = this.getSessionKey(courseId);
      const data = {
        sessionToken: sessionData.sessionToken,
        expiresAt: sessionData.expiresAt,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ Stored video session for course: ${courseId}`);

      return data;
    } catch (error) {
      console.error("Failed to store session:", error);
      return null;
    }
  }

  /**
   * Get session from localStorage
   */
  getSession(courseId) {
    try {
      const key = this.getSessionKey(courseId);
      const data = localStorage.getItem(key);

      if (!data) {
        console.log(`ℹ️ No cached session found for course: ${courseId}`);
        return null;
      }

      const session = JSON.parse(data);

      // Check if expired
      if (new Date(session.expiresAt) <= new Date()) {
        console.log(`⏰ Session expired for course: ${courseId}`);
        this.clearSession(courseId);
        return null;
      }

      console.log(`✅ Found valid cached session for course: ${courseId}`);
      return session;
    } catch (error) {
      console.error("Failed to get session:", error);
      return null;
    }
  }

  /**
   * Clear session from localStorage
   */
  clearSession(courseId) {
    try {
      const key = this.getSessionKey(courseId);
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared session for course: ${courseId}`);
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
  }

  /**
   * Clear all expired sessions (cleanup)
   */
  clearExpiredSessions() {
    try {
      const keys = Object.keys(localStorage);
      let cleared = 0;

      keys.forEach((key) => {
        if (key.startsWith(this.SESSION_KEY_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            const session = JSON.parse(data);
            if (new Date(session.expiresAt) <= new Date()) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        }
      });

      if (cleared > 0) {
        console.log(`🧹 Cleared ${cleared} expired sessions`);
      }
    } catch (error) {
      console.error("Failed to clear expired sessions:", error);
    }
  }

  /**
   * Get time until session expires (in seconds)
   */
  getTimeUntilExpiry(courseId) {
    const session = this.getSession(courseId);
    if (!session) return 0;

    const expiresAt = new Date(session.expiresAt);
    const now = new Date();
    const diffMs = expiresAt - now;

    return Math.max(0, Math.floor(diffMs / 1000));
  }
}

export default new VideoSessionManager();
