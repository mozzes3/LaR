import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, X, Loader } from "lucide-react";
import { uploadApi } from "@services/api";
import toast from "react-hot-toast";

const ThumbnailUpload = ({ currentThumbnail, onUploadSuccess, error }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentThumbnail);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const response = await uploadApi.uploadThumbnail(file);
      toast.success("Thumbnail uploaded!");
      if (onUploadSuccess) {
        onUploadSuccess(response.data.url);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload thumbnail");
      setPreview(currentThumbnail);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (onUploadSuccess) {
      onUploadSuccess(null);
    }
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
        Course Thumbnail *
      </label>
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
          error ? "border-red-500" : "border-gray-300 dark:border-gray-700"
        } ${uploading ? "opacity-50" : ""}`}
      >
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Thumbnail preview"
              className="max-h-64 rounded-lg"
            />
            {!uploading && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <Loader className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div>
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Upload course thumbnail (16:9 ratio recommended)
            </p>
            <p className="text-sm text-gray-500 mb-4">
              JPG, PNG or GIF. Max 5MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-block px-6 py-3 bg-primary-400 text-black rounded-xl font-bold cursor-pointer hover:bg-primary-500 transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Choose Image"}
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default ThumbnailUpload;
