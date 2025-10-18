import { useState, useEffect } from "react";
import { courseApi } from "@services/api";
import { Loader, Play } from "lucide-react";
import toast from "react-hot-toast";

const VideoPlayer = ({ courseSlug, lessonId, lessonTitle }) => {
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);

  useEffect(() => {
    let tokenRefreshInterval;

    const loadVideoUrl = async () => {
      if (!lessonId || !courseSlug) return;

      try {
        setVideoLoading(true);

        console.log(`🎬 Loading video for lesson: ${lessonId}`);

        const response = await courseApi.getLessonVideo(courseSlug, lessonId);

        console.log(
          `✅ Video URL loaded, expires at: ${response.data.expiresAt}`
        );

        setCurrentVideoUrl(response.data.videoUrl);
        setTokenExpiresAt(new Date(response.data.expiresAt));
        setVideoLoading(false);

        const expiresIn = response.data.expiresIn * 1000;
        const refreshTime = Math.max(expiresIn - 5 * 60 * 1000, 60000);

        console.log(
          `🔄 Token will auto-refresh in ${refreshTime / 1000 / 60} minutes`
        );

        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
        }

        tokenRefreshInterval = setInterval(() => {
          console.log(`🔄 Auto-refreshing video token...`);
          loadVideoUrl();
        }, refreshTime);
      } catch (error) {
        console.error("❌ Error loading video:", error);
        toast.error("Failed to load video");
        setVideoLoading(false);
      }
    };

    loadVideoUrl();

    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        console.log(`🧹 Cleaned up token refresh interval`);
      }
    };
  }, [lessonId, courseSlug]);

  return (
    <div className="bg-black aspect-video relative">
      {videoLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg font-medium">Loading video...</p>
            <p className="text-gray-400 text-sm mt-2">
              Generating secure playback URL
            </p>
          </div>
        </div>
      ) : currentVideoUrl ? (
        <>
          <iframe
            key={currentVideoUrl}
            src={currentVideoUrl}
            className="w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={lessonTitle}
          />

          {tokenExpiresAt && (
            <div className="absolute top-2 right-2 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs rounded-lg">
              Session expires: {tokenExpiresAt.toLocaleTimeString()}
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-white text-lg font-medium mb-2">
              Video not available
            </p>
            <p className="text-gray-400 text-sm">
              This lesson doesn't have a video yet
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
