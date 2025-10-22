import { useState, useEffect, useCallback } from "react";
import { courseApi } from "@services/api";
import videoSessionManager from "@services/videoSessionManager";
import { Loader, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const VideoPlayer = ({ courseSlug, courseId, lessonId, lessonTitle }) => {
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Initialize or refresh session
   */
  const initializeSession = useCallback(async () => {
    try {
      console.log(`🔐 Initializing video session for course: ${courseId}`);

      // Always create fresh session (more reliable, prevents stale cache issues)
      videoSessionManager.clearSession(courseId);

      console.log(`📡 Creating new video session...`);
      const response = await courseApi.createVideoSession(courseSlug);

      const session = videoSessionManager.storeSession(courseId, {
        sessionToken: response.data.sessionToken,
        expiresAt: response.data.expiresAt,
      });

      setSessionToken(session.sessionToken);
      setSessionExpiresAt(new Date(session.expiresAt));

      return session.sessionToken;
    } catch (error) {
      console.error("❌ Session initialization failed:", error);
      toast.error("Failed to initialize video session");
      setError("Session initialization failed");
      throw error;
    }
  }, [courseId, courseSlug]);

  /**
   * Load video URL for current lesson
   */
  const loadVideoUrl = useCallback(
    async (token) => {
      if (!lessonId || !token) return;

      try {
        setVideoLoading(true);
        setError(null);

        console.log(`🎬 Loading video for lesson: ${lessonId}`);
        console.log(`🎬 Fetching video with token:`, token);

        const response = await courseApi.getLessonVideoWithSession(
          courseSlug,
          lessonId,
          token
        );

        console.log(`✅ Video URL loaded`);
        setCurrentVideoUrl(response.data.videoUrl);
        setVideoLoading(false);
      } catch (error) {
        console.error("❌ Error loading video:", error);
        setError("Failed to load video");
        toast.error("Failed to load video");
        setVideoLoading(false);

        // Only retry once to avoid infinite loop
        if (!error._retried) {
          try {
            const newToken = await initializeSession();
            const retryError = new Error();
            retryError._retried = true; // Mark to prevent infinite retry
            await loadVideoUrl(newToken);
            return;
          } catch (refreshError) {
            console.error("❌ Session refresh failed:", refreshError);
          }
        }

        setError("Failed to load video");
        toast.error("Failed to load video");
        setVideoLoading(false);
      }
    },
    [courseSlug, lessonId, courseId, initializeSession]
  );

  /**
   * Handle session refresh before expiry
   */
  useEffect(() => {
    if (!sessionExpiresAt) return;

    const timeUntilExpiry = sessionExpiresAt - new Date();
    const refreshBeforeExpiry = 5 * 60 * 1000; // Refresh 5 min before expiry

    if (timeUntilExpiry <= refreshBeforeExpiry) {
      console.log(`⏰ Session expiring soon, refreshing...`);
      videoSessionManager.clearSession(courseId);
      initializeSession().then((token) => {
        if (token) loadVideoUrl(token);
      });
      return;
    }

    // Set timer to refresh before expiry
    const refreshTimer = setTimeout(() => {
      console.log(`🔄 Auto-refreshing session...`);
      videoSessionManager.clearSession(courseId);
      initializeSession().then((token) => {
        if (token) loadVideoUrl(token);
      });
    }, timeUntilExpiry - refreshBeforeExpiry);

    return () => clearTimeout(refreshTimer);
  }, [sessionExpiresAt, courseId, initializeSession, loadVideoUrl]);

  /**
   * Initialize on mount or lesson change
   */
  useEffect(() => {
    const init = async () => {
      try {
        const token = await initializeSession();
        await loadVideoUrl(token);
      } catch (error) {
        console.error("Initialization failed:", error);
      }
    };

    init();

    // Cleanup expired sessions on mount
    videoSessionManager.clearExpiredSessions();
  }, [lessonId, initializeSession, loadVideoUrl]);

  /**
   * Manual refresh handler
   */
  const handleRefresh = async () => {
    videoSessionManager.clearSession(courseId);
    setSessionToken(null);
    const token = await initializeSession();
    await loadVideoUrl(token);
  };

  return (
    <div className="bg-black aspect-video relative">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center p-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-white text-lg font-medium mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      ) : videoLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <Loader className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Loading video...</p>
            <p className="text-gray-400 text-sm mt-2">
              {sessionToken
                ? "Generating playback URL"
                : "Creating secure session"}
            </p>
          </div>
        </div>
      ) : currentVideoUrl ? (
        <iframe
          src={currentVideoUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={lessonTitle}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <p className="text-gray-400">No video available</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
