import {
  X,
  Download,
  Share2,
  ExternalLink,
  Lock,
  Copy,
  CheckCircle,
  Trophy,
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
    console.log("🔍 nftMinted:", certificate.nftMinted);
    console.log("🔍 nftTransactionHash:", certificate.nftTransactionHash);
    console.log("🔍 blockchainHash:", certificate.blockchainHash);

    const imageUrl =
      certificate.nftImageURI ||
      certificate.templateImage ||
      certificate.certificateUrl;
    console.log("🖼️ Loading certificate image:", imageUrl);
    setSignedImageUrl(imageUrl);
    setLoadingToken(false);
  }, [certificate]);

  // NFT transaction hash (both types use this now)
  const nftTxHash =
    certificate.nftTransactionHash || certificate.blockchainHash;
  const explorerUrl = nftTxHash
    ? `https://shannon-explorer.somnia.network/tx/${nftTxHash}`
    : null;

  // Format hours for completion certificates
  const formatHours = (totalHours) => {
    if (!totalHours) return "N/A";

    // Handle if totalHours is in seconds (large number)
    let hours, minutes;
    if (totalHours > 100) {
      // Likely in seconds, convert to hours
      hours = Math.floor(totalHours / 3600);
      minutes = Math.round((totalHours % 3600) / 60);
    } else {
      // Already in hours
      hours = Math.floor(totalHours);
      minutes = Math.round((totalHours - hours) * 60);
    }

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return "< 1m";
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
    if (nftTxHash) {
      navigator.clipboard.writeText(nftTxHash);
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
                  {certificate.nftMinted && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full font-semibold border border-purple-500/30 flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      NFT
                    </span>
                  )}
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
              // Professional Competency Certificate Details (KEEP grade/score)
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
              // Course Completion Certificate Details (NO grade/score)
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Total Hours</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatHours(certificate.totalHours)}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">
                    Lessons Completed
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {certificate.totalLessons} lessons
                  </p>
                </div>
              </div>
            )}

            {/* NFT Verification Section */}
            {(certificate.nftMinted || nftTxHash || certificate.nftTokenId) && (
              <div className="mt-6 p-4 bg-gradient-to-br from-primary-400/10 to-purple-500/10 border-2 border-primary-400/30 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary-400" />
                      NFT Certificate
                    </p>
                    <p className="text-xs text-gray-500">
                      Certificate NFT minted on blockchain
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>

                <div className="space-y-2">
                  {nftTxHash && (
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">
                          Transaction Hash
                        </p>
                        <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                          {nftTxHash}
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
                  )}

                  {certificate.nftMetadataURI && (
                    <button
                      onClick={() =>
                        window.open(certificate.nftMetadataURI, "_blank")
                      }
                      className="w-full py-2 text-xs font-semibold text-primary-400 hover:text-primary-500 flex items-center justify-center gap-1 hover:bg-primary-400/5 rounded-lg transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View NFT Metadata
                    </button>
                  )}

                  <button
                    onClick={handleViewOnBlockchain}
                    disabled={!nftTxHash}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-primary-400 text-primary-400 rounded-lg font-medium hover:bg-primary-400 hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View NFT on Explorer</span>
                  </button>
                </div>
              </div>
            )}

            {/* If NFT not minted */}
            {!certificate.nftMinted &&
              !nftTxHash &&
              !certificate.nftTokenId && (
                <div className="mt-6 p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                    Certificate not yet minted as NFT
                  </p>
                </div>
              )}
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
