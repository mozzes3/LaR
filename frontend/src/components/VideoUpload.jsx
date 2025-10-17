import { useState, useRef } from "react";
import { Upload, Video, X, Loader, CheckCircle } from "lucide-react";
import { uploadApi } from "@services/api";
import toast from "react-hot-toast";

const VideoUpload = ({ lessonTitle, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    // Max 500MB
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video size must be less than 200MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadApi.uploadVideo(
        file,
        { title: lessonTitle || "Untitled Lesson" },
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      );

      setVideoInfo({
        videoId: response.data.videoId,
        libraryId: response.data.libraryId,
      });

      toast.success("Video uploaded and processing!");

      if (onUploadSuccess) {
        onUploadSuccess({
          videoId: response.data.videoId,
          libraryId: response.data.libraryId,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload video");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    setVideoInfo(null);
    if (onUploadSuccess) {
      onUploadSuccess(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6">
      {videoInfo ? (
        <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                Video uploaded successfully
              </p>
              <p className="text-sm text-gray-500">
                Video ID: {videoInfo.videoId}
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
      ) : uploading ? (
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-3" />
          <p className="font-bold text-gray-900 dark:text-white mb-2">
            Uploading video...
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-primary-400 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{uploadProgress}%</p>
        </div>
      ) : (
        <div className="text-center">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Upload lesson video
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
    </div>
  );
};

export default VideoUpload;
