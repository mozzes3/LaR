import { useState, useRef } from "react";
import { Upload, Camera, Loader, X } from "lucide-react";
import { uploadApi } from "@services/api";
import toast from "react-hot-toast";

const AvatarUpload = ({ currentAvatar, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentAvatar);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Image size must be less than 1MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const response = await uploadApi.uploadAvatar(file);
      toast.success("Avatar updated successfully!");
      if (onUploadSuccess) {
        onUploadSuccess(response.data.url);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload avatar");
      setPreview(currentAvatar); // Revert preview
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <img
          src={
            preview || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`
          }
          alt="Avatar"
          className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-800"
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <div>
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
          className="px-4 py-2 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition disabled:opacity-50 flex items-center space-x-2"
        >
          <Camera className="w-4 h-4" />
          <span>{uploading ? "Uploading..." : "Change Avatar"}</span>
        </button>
        <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. 1MB.</p>
      </div>
    </div>
  );
};

export default AvatarUpload;
