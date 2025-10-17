import { useState, useRef } from "react";
import { Upload, FileText, X, Loader, CheckCircle, File } from "lucide-react";
import { uploadApi } from "@services/api";
import toast from "react-hot-toast";

const ResourceUpload = ({ onUploadSuccess, currentResource }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resource, setResource] = useState(currentResource);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Resource must be less than 50MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadApi.uploadResource(file, (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(progress);
      });

      setResource({
        name: file.name,
        url: response.data.url,
        size: file.size,
      });

      toast.success("Resource uploaded successfully!");

      if (onUploadSuccess) {
        onUploadSuccess({
          name: file.name,
          url: response.data.url,
          size: file.size,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload resource");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    setResource(null);
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

  const getFileIcon = (fileName) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();

    if (["pdf"].includes(ext)) return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    if (["ppt", "pptx"].includes(ext)) return "📊";
    if (["zip", "rar"].includes(ext)) return "📦";
    if (["txt"].includes(ext)) return "📃";

    return "📎";
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6">
      {resource ? (
        <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getFileIcon(resource.name)}</div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {resource.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(resource.size)}
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
            Uploading resource...
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
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Upload course resource
          </p>
          <p className="text-sm text-gray-500 mb-4">
            PDF, DOC, XLS, ZIP, etc. Max 50MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
          >
            Choose File
          </button>
        </div>
      )}
    </div>
  );
};

export default ResourceUpload;
