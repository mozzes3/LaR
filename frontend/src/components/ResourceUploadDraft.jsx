import { useState, useRef, useEffect } from "react";
import { FileText, X, File, Download } from "lucide-react";
import toast from "react-hot-toast";

const ResourceUploadDraft = ({
  currentFile,
  currentResource,
  onFileSelect,
}) => {
  const [resourceFile, setResourceFile] = useState(currentFile);
  const [hasExistingResource, setHasExistingResource] = useState(
    !!currentResource
  );
  const fileInputRef = useRef(null);

  useEffect(() => {
    setResourceFile(currentFile);
    setHasExistingResource(!!currentResource && !currentFile);
  }, [currentFile, currentResource]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      toast.error("Resource must be less than 10MB");
      return;
    }

    setResourceFile(file);
    setHasExistingResource(false);
    onFileSelect(file);
    toast.success("Resource selected! Will upload when you publish.");
  };

  const handleRemove = () => {
    setResourceFile(null);
    setHasExistingResource(false);
    onFileSelect(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext)) return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx", "ppt", "pptx"].includes(ext)) return "📊";
    if (["zip", "rar"].includes(ext)) return "📦";
    if (["txt"].includes(ext)) return "📃";
    return "📎";
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6">
      {resourceFile ? (
        // NEW FILE SELECTED
        <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getFileIcon(resourceFile.name)}</div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {resourceFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(resourceFile.size)}
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
      ) : hasExistingResource ? (
        // EXISTING RESOURCE FROM DATABASE
        <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {getFileIcon(currentResource.title || currentResource.url)}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {currentResource.title || "Resource"}
              </p>
              <p className="text-xs text-green-500 mt-1">✅ Already uploaded</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={currentResource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-green-500/10 text-green-500 rounded-lg transition"
              title="Download Resource"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        // NO RESOURCE
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Select course resource
          </p>
          <p className="text-sm text-gray-500 mb-4">
            PDF, DOC, XLS, ZIP, TXT. Max 10MB.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
          >
            Choose File
          </button>
        </div>
      )}
      {/* Hidden input for both "Choose" and "Replace" buttons */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ResourceUploadDraft;
