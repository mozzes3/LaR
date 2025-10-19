import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import CertificateViewModal from "@components/CertificateViewModal";
import {
  Award,
  Download,
  Share2,
  ExternalLink,
  Calendar,
  CheckCircle,
  Star,
  Trophy,
  Search,
  Filter,
  Copy,
  Twitter,
  Linkedin,
  Facebook,
  X,
  Sparkles,
  Eye,
  Lock,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { certificateApi } from "@services/api";
import { useWallet } from "@contexts/WalletContext";

const CertificatesPage = () => {
  const navigate = useNavigate();
  const { user } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState(null);

  // Load real certificates
  useEffect(() => {
    const loadCertificates = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        const response = await certificateApi.getMyCertificates();

        // Transform to match the UI structure
        const transformedCerts = (response.data.certificates || []).map(
          (cert) => ({
            id: cert._id,
            courseTitle: cert.courseTitle,
            instructor: cert.instructor,
            instructorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cert.instructor}`,
            completedDate: cert.completedDate,
            certificateNumber: cert.certificateNumber,
            grade: cert.grade,
            finalScore: cert.finalScore,
            thumbnail: cert.courseId?.thumbnail || cert.templateImage,
            skills: [],
            totalHours: cert.totalHours,
            totalLessons: cert.totalLessons,
            verificationUrl: cert.verificationUrl,
            blockchainHash: cert.blockchainHash,
            blockchainExplorerUrl: cert.blockchainExplorerUrl,
            templateImage: cert.templateImage,
          })
        );

        setCertificates(transformedCerts);
      } catch (error) {
        console.error("Error loading certificates:", error);
        toast.error("Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, [user, navigate]);

  const filteredCertificates = certificates.filter((cert) =>
    cert.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (cert) => {
    setViewingCertificate(cert);
    setShowViewModal(true);
  };

  const handleDownload = (cert) => {
    setViewingCertificate(cert);
    setShowViewModal(true);
  };

  const handleShare = (cert) => {
    setSelectedCertificate(cert);
    setShowShareModal(true);
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleShareSocial = (platform) => {
    const cert = selectedCertificate;
    const text = `I just completed "${cert.courseTitle}" on Lizard Academy! 🎓`;
    const url = cert.verificationUrl;

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text
        )}&url=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
    }
    window.open(shareUrl, "_blank", "width=600,height=400");
    toast.success(`Sharing to ${platform}!`);
  };

  const getGradeColor = (grade) => {
    switch (grade?.toLowerCase()) {
      case "outstanding":
        return "text-purple-500 bg-purple-500/10 border-purple-500/30";
      case "excellent":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "good":
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading certificates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                My Certificates
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and share your achievements
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary-400/10 to-primary-600/10 border-2 border-primary-400/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8 text-primary-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {certificates.length}
            </div>
            <div className="text-sm text-gray-500">Total Certificates</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {certificates.length > 0
                ? (
                    certificates.reduce(
                      (sum, cert) => sum + cert.finalScore,
                      0
                    ) / certificates.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-sm text-gray-500">Average Score</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {certificates
                .reduce((sum, cert) => sum + cert.totalHours, 0)
                .toFixed(1)}
              h
            </div>
            <div className="text-sm text-gray-500">Total Learning Hours</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
            />
          </div>
          <button className="p-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No certificates yet
            </h3>
            <p className="text-gray-500 mb-6">
              Complete courses to earn certificates
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl transition"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-2xl hover:border-primary-400/50 transition-all duration-300 group"
              >
                {/* Certificate Preview - Elite Design */}
                <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-gray-900 to-black p-6 flex flex-col overflow-hidden">
                  {/* Elegant background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <svg
                      className="w-full h-full"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <pattern
                          id="grid"
                          width="40"
                          height="40"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.5"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>

                  {/* Luxury corner ornaments */}
                  <div className="absolute top-2 left-2">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-primary-400/60 relative">
                      <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="w-8 h-8 border-t-2 border-r-2 border-primary-400/60 relative">
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <div className="w-8 h-8 border-b-2 border-l-2 border-primary-400/60 relative">
                      <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <div className="w-8 h-8 border-b-2 border-r-2 border-primary-400/60 relative">
                      <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Glowing orbs */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl"></div>

                  {/* Header Section */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="text-center space-y-2">
                      {/* Award Icon - Smaller */}
                      <div className="flex justify-center mb-1">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/50">
                            <Award
                              className="w-5 h-5 text-black"
                              strokeWidth={2.5}
                            />
                          </div>
                          <div className="absolute inset-0 bg-primary-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                        </div>
                      </div>

                      {/* Certificate Title */}
                      <div>
                        <div className="flex items-center justify-center space-x-2 mb-1.5">
                          <div className="h-px w-6 bg-gradient-to-r from-transparent to-primary-400/50"></div>
                          <Star className="w-2.5 h-2.5 text-primary-400" />
                          <div className="h-px w-6 bg-gradient-to-l from-transparent to-primary-400/50"></div>
                        </div>
                        <p className="text-primary-400 text-[9px] font-bold tracking-[0.2em] uppercase mb-1.5">
                          Certificate of Completion
                        </p>
                        <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary-400/30 to-transparent mx-auto"></div>
                      </div>
                    </div>
                  </div>

                  {/* Course Title - Centered with flex-grow */}
                  <div className="relative z-10 flex-grow flex items-center justify-center py-2">
                    <h3 className="text-white font-bold text-[11px] leading-tight line-clamp-2 px-6 text-center">
                      {cert.courseTitle}
                    </h3>
                  </div>

                  {/* Footer Section */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="text-center space-y-1.5">
                      {/* Student Name Badge */}
                      <div className="inline-flex flex-col items-center px-4 py-2 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-lg border border-primary-400/20 shadow-xl">
                        <p className="text-white/50 text-[8px] tracking-wider uppercase mb-0.5">
                          Awarded to
                        </p>
                        <p className="text-white font-bold text-[11px] tracking-wide">
                          {user?.username || "Student"}
                        </p>
                      </div>

                      {/* Bottom Info */}
                      <div className="flex items-center justify-center space-x-1.5 text-[8px] text-white/30 tracking-wider">
                        <span className="font-semibold">LIZARD ACADEMY</span>
                        <span>•</span>
                        <span>
                          {new Date(cert.completedDate).getFullYear()}
                        </span>
                        <span>•</span>
                        <Lock className="w-2 h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Subtle vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none"></div>
                </div>

                {/* Certificate Info */}
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <img
                      src={cert.instructorAvatar}
                      alt={cert.instructor}
                      className="w-6 h-6 rounded-full ring-2 ring-gray-200 dark:ring-gray-800"
                    />
                    <span className="text-sm text-gray-500 font-medium">
                      {cert.instructor}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${getGradeColor(
                        cert.grade
                      )}`}
                    >
                      {cert.grade}
                    </div>
                    <div className="text-sm text-gray-500">
                      Score:{" "}
                      <span className="font-bold text-gray-900 dark:text-white">
                        {cert.finalScore}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(cert.completedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{cert.totalLessons} lessons</span>
                    </div>
                  </div>
                  {cert.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cert.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary-400/10 text-primary-400 text-xs rounded-lg font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons with Enhanced Hover */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleView(cert)}
                      className="py-2.5 border-2 border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold hover:border-primary-400 hover:bg-primary-400/5 hover:scale-105 hover:shadow-lg transition-all duration-200 active:scale-95"
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          // Fetch and auto-download
                          const response = await fetch(cert.templateImage);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `${cert.certificateNumber}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                          toast.success("Certificate downloaded!");
                        } catch (error) {
                          console.error("Download error:", error);
                          toast.error("Failed to download certificate");
                        }
                      }}
                      className="py-2.5 border-2 border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold hover:border-primary-400 hover:bg-primary-400/5 hover:scale-105 hover:shadow-lg transition-all duration-200 active:scale-95"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleShare(cert)}
                      className="py-2.5 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl text-sm font-bold hover:from-primary-500 hover:to-primary-700 hover:scale-105 hover:shadow-xl hover:shadow-primary-400/30 transition-all duration-200 active:scale-95"
                    >
                      Share
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <Lock className="w-3 h-3" />
                      <span className="font-mono">
                        {cert.certificateNumber}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyLink(cert.verificationUrl)}
                      className="text-xs text-primary-400 hover:text-primary-500 font-semibold flex items-center space-x-1 hover:underline transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Verify on blockchain</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && selectedCertificate && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowShareModal(false)}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6 z-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Share Certificate
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-6 p-4 bg-gradient-to-br from-primary-400 to-purple-600 rounded-xl text-center">
                <Award className="w-12 h-12 text-white mx-auto mb-2" />
                <p className="text-white font-bold text-sm line-clamp-2">
                  {selectedCertificate.courseTitle}
                </p>
                <p className="text-white/80 text-xs mt-2">
                  Grade: {selectedCertificate.grade} (
                  {selectedCertificate.finalScore}%)
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleShareSocial("twitter")}
                  className="w-full flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Twitter className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900 dark:text-white">
                      Twitter
                    </p>
                    <p className="text-xs text-gray-500">Share on Twitter</p>
                  </div>
                </button>
                <button
                  onClick={() => handleShareSocial("linkedin")}
                  className="w-full flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                    <Linkedin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900 dark:text-white">
                      LinkedIn
                    </p>
                    <p className="text-xs text-gray-500">Share on LinkedIn</p>
                  </div>
                </button>
                <button
                  onClick={() => handleShareSocial("facebook")}
                  className="w-full flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900 dark:text-white">
                      Facebook
                    </p>
                    <p className="text-xs text-gray-500">Share on Facebook</p>
                  </div>
                </button>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Link
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={selectedCertificate.verificationUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                  <button
                    onClick={() =>
                      handleCopyLink(selectedCertificate.verificationUrl)
                    }
                    className="p-2 bg-primary-400 text-black rounded-lg hover:bg-primary-500 transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* View Certificate Modal */}
        {showViewModal && viewingCertificate && (
          <CertificateViewModal
            certificate={viewingCertificate}
            onClose={() => {
              setShowViewModal(false);
              setViewingCertificate(null);
            }}
            onShare={handleShare}
          />
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;
