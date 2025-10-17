import { useState, useRef } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import toast from "react-hot-toast";

const ThumbnailUploadDraft = ({
  currentFile,
  currentPreview,
  onFileSelect,
  error,
}) => {
  const [preview, setPreview] = useState(currentPreview);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
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

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      onFileSelect(file, reader.result); // Pass both file and preview
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onFileSelect(null, null);
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
        Course Thumbnail *
      </label>
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
          error ? "border-red-500" : "border-gray-300 dark:border-gray-700"
        }`}
      >
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Thumbnail preview"
              className="max-h-64 rounded-lg"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mt-2 text-xs text-gray-500">
              📁 {currentFile?.name || "Selected"} (
              {(currentFile?.size / 1024 / 1024).toFixed(2)} MB)
            </div>
            <div className="mt-1 text-xs text-orange-500">
              ⚠️ Will upload when you publish the course
            </div>
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
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-block px-6 py-3 bg-primary-400 text-black rounded-xl font-bold cursor-pointer hover:bg-primary-500 transition"
            >
              Choose Image
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default ThumbnailUploadDraft;
