import {
  X,
  Download,
  Share2,
  ExternalLink,
  Lock,
  Copy,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const CertificateViewModal = ({ certificate, onClose, onShare }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [signedImageUrl, setSignedImageUrl] = useState(null);
  const [loadingToken, setLoadingToken] = useState(true);
  // Detect certificate type
  const isCompetency =
    certificate.certificationTitle || certificate.certificationId;

  useEffect(() => {
    console.log("🔍 Full certificate object:", certificate);
    console.log("🔍 Available fields:", Object.keys(certificate));
    console.log("🔍 blockchainVerified:", certificate.blockchainVerified);
    console.log("🔍 blockchainHash:", certificate.nftTransactionHash);
    console.log("🔍 nftMinted:", certificate.nftMinted);
    console.log("🔍 nftTransactionHash:", certificate.nftTransactionHash);

    const imageUrl =
      certificate.nftImageURI ||
      certificate.templateImage ||
      certificate.certificateUrl;
    console.log("🖼️ Loading certificate image:", imageUrl);
    setSignedImageUrl(imageUrl);
    setLoadingToken(false);
  }, [certificate]);
  const txHash = certificate.blockchainHash || certificate.nftTransactionHash;
  const explorerUrl =
    certificate.blockchainExplorerUrl ||
    (txHash ? `https://shannon-explorer.somnia.network/tx/${txHash}` : null);
  // Format duration helper
  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else if (minutes > 0) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    } else {
      return `${secs}s`;
    }
  };

  // Format hours for completion certificates
  const formatHours = (totalHours) => {
    if (!totalHours) return "N/A";

    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const handleDownload = async () => {
    try {
      if (!signedImageUrl) {
        toast.error("Certificate not ready for download");
        return;
      }

      const response = await fetch(signedImageUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate.certificateNumber}.webp`;
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

  const handleCopyHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      toast.success("Transaction hash copied!");
    }
  };

  const handleViewOnBlockchain = () => {
    if (certificate.nftTokenId && certificate.nftContractAddress) {
      const nftUrl = `https://shannon-explorer.somnia.network/token/${certificate.nftContractAddress}/instance/${certificate.nftTokenId}`;
      window.open(nftUrl, "_blank");
    } else if (explorerUrl) {
      window.open(explorerUrl, "_blank");
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border-2 border-gray-200 dark:border-gray-800">
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {isCompetency
                    ? certificate.certificationTitle ||
                      certificate.certificationId?.title
                    : certificate.courseTitle}
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

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              {(loadingToken || !imageLoaded) && (
                <div className="absolute inset-0 flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">
                      {loadingToken
                        ? "Loading certificate..."
                        : "Loading image..."}
                    </p>
                  </div>
                </div>
              )}

              {signedImageUrl && (
                <img
                  src={signedImageUrl}
                  alt="Certificate"
                  className={`w-full h-auto ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  } transition-opacity duration-300`}
                  onLoad={() => {
                    console.log("✅ Certificate image loaded successfully");
                    setImageLoaded(true);
                  }}
                  onError={(e) => {
                    console.error("❌ Image load error:", e);
                    console.error("Failed URL:", signedImageUrl);
                    toast.error("Failed to load certificate image");
                  }}
                />
              )}
            </div>

            {/* Certificate Details */}
            {isCompetency ? (
              // Professional Competency Certificate Details
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Grade</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {certificate.grade}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Score</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {certificate.score}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Correct Answers</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {certificate.correctAnswers}/{certificate.totalQuestions}
                  </p>
                </div>
              </div>
            ) : (
              // Course Completion Certificate Details
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Grade</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {certificate.grade}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Score</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {certificate.finalScore}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Course Duration</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatHours(certificate.totalHours)} (
                    {certificate.totalLessons} lessons)
                  </p>
                </div>
              </div>
            )}

            {/* Blockchain Verification Section */}
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
                {txHash && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>

              {txHash && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        Transaction Hash
                      </p>
                      <p className="text-xs font-mono text-gray-900 dark:text-white truncate">
                        {txHash}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyHash}
                      className="ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      title="Copy hash"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <button
                    onClick={handleViewOnBlockchain}
                    disabled={!txHash}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-primary-400 text-primary-400 rounded-lg font-medium hover:bg-primary-400 hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View NFT on Explorer</span>
                  </button>
                </div>
              )}

              {!txHash && (
                <p className="text-sm text-gray-500 text-center">
                  Blockchain verification pending...
                </p>
              )}
            </div>

            {/* Verification URL */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Verification URL</p>
                  <p className="text-xs font-mono text-gray-900 dark:text-white truncate">
                    {certificate.verificationUrl}
                  </p>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Copy verification link"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

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
