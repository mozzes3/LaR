import { useState, useRef, useEffect } from "react";
import { Video, X, Play } from "lucide-react";
import toast from "react-hot-toast";

const VideoUploadDraft = ({
  lessonTitle,
  currentFile,
  currentVideoUrl,
  onFileSelect,
}) => {
  const [videoFile, setVideoFile] = useState(currentFile);
  const [hasExistingVideo, setHasExistingVideo] = useState(!!currentVideoUrl);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setVideoFile(currentFile);
    setHasExistingVideo(!!currentVideoUrl && !currentFile);
  }, [currentFile, currentVideoUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      toast.error("Video size must be less than 200MB");
      return;
    }

    setVideoFile(file);
    setHasExistingVideo(false);
    onFileSelect(file);
    toast.success("Video selected! Will upload when you publish.");
  };

  const handleRemove = () => {
    setVideoFile(null);
    setHasExistingVideo(false);
    onFileSelect(null);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6">
      {videoFile ? (
        // NEW FILE SELECTED
        <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <Video className="w-6 h-6 text-blue-500" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {videoFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {(videoFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-xs text-orange-500 mt-1">
                ⚠️ Will upload when you publish
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : hasExistingVideo ? (
        // EXISTING VIDEO FROM DATABASE
        <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <Play className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                Video Uploaded
              </p>
              <p className="text-sm text-gray-500">
                {lessonTitle || "Lesson video"}
              </p>
              <p className="text-xs text-green-500 mt-1">
                ✅ Already uploaded to CDN
              </p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            Replace Video
          </button>
        </div>
      ) : (
        // NO VIDEO
        <div className="text-center">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Select lesson video
          </p>
          <p className="text-sm text-gray-500 mb-4">
            MP4, MOV, or AVI. Max 200MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
          >
            Choose Video
          </button>
        </div>
      )}
      {/* Hidden input for replace button */}
      {hasExistingVideo && (
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}
    </div>
  );
};

export default VideoUploadDraft;
