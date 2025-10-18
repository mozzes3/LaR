import { X, Download, Share2, ExternalLink, Lock, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { certificateApi } from "@services/api";

const CertificateViewModal = ({ certificate, onClose, onShare }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [signedImageUrl, setSignedImageUrl] = useState(null);
  const [loadingToken, setLoadingToken] = useState(true);

  // Fetch signed URL on mount
  useEffect(() => {
    setSignedImageUrl(certificate.templateImage);
    setLoadingToken(false);
  }, [certificate.templateImage]);

  const handleDownload = async () => {
    try {
      if (!signedImageUrl) {
        toast.error("Certificate not ready for download");
        return;
      }

      // Fetch the image as blob using signed URL
      const response = await fetch(signedImageUrl);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate.certificateNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Certificate downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download certificate");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(certificate.verificationUrl);
    toast.success("Verification link copied!");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border-2 border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {certificate.courseTitle}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Lock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {certificate.certificateNumber}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={handleDownload}
                  disabled={!signedImageUrl}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onShare(certificate)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Certificate Image */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              {(loadingToken || !imageLoaded) && (
                <div className="absolute inset-0 flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">
                      {loadingToken
                        ? "Loading certificate..."
                        : "Rendering image..."}
                    </p>
                  </div>
                </div>
              )}
              {signedImageUrl && (
                <img
                  src={signedImageUrl}
                  alt={certificate.courseTitle}
                  className={`w-full h-auto transition-opacity duration-300 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    console.error("❌ Image failed to load");
                    console.error("Image URL:", signedImageUrl);
                    console.error("Error event:", e);
                    setImageLoaded(true);
                    toast.error("Failed to load certificate image");
                  }}
                />
              )}
            </div>

            {/* Certificate Details */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Completed Date</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {new Date(certificate.completedDate).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Grade</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {certificate.grade} - {certificate.finalScore}%
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Instructor</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {certificate.instructor}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Total Hours</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {certificate.totalHours}h ({certificate.totalLessons} lessons)
                </p>
              </div>
            </div>

            {/* Verification */}
            <div className="mt-6 p-4 bg-gradient-to-br from-primary-400/10 to-purple-500/10 border-2 border-primary-400/30 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white mb-1">
                    Blockchain Verified
                  </p>
                  <p className="text-xs text-gray-500">
                    This certificate is permanently recorded on the blockchain
                  </p>
                </div>
                <div className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-bold rounded-lg border border-green-500/30">
                  VERIFIED
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={certificate.verificationUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-primary-400 text-black rounded-lg hover:bg-primary-500 transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() =>
                    window.open(certificate.verificationUrl, "_blank")
                  }
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-primary-400 text-primary-400 rounded-lg font-medium hover:bg-primary-400 hover:text-black transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Verify on Blockchain</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-medium hover:border-primary-400 transition"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                disabled={!signedImageUrl}
                className="px-6 py-2 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Download Certificate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CertificateViewModal;
