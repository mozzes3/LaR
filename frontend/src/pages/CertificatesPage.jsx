import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Plus, // Added missing import
} from "lucide-react";
import toast from "react-hot-toast";

const CertificatesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Mock certificates data
  const certificates = [
    {
      id: 1,
      courseTitle: "NFT Marketing Masterclass: 0 to 10K Discord Members",
      instructor: "CryptoMaverick",
      instructorAvatar:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoMaverick",
      completedDate: "2024-10-15",
      certificateNumber: "FA-2024-001234",
      grade: "Excellent",
      finalScore: 95,
      thumbnail:
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop",
      skills: ["NFT Marketing", "Discord Management", "Community Building"],
      totalHours: 12.5,
      totalLessons: 47,
      verificationUrl: "https://founderacademy.com/verify/FA-2024-001234",
      blockchainHash: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3f2a1",
    },
    {
      id: 2,
      courseTitle: "Web3 Community Building Strategies",
      instructor: "CryptoMaverick",
      instructorAvatar:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoMaverick",
      completedDate: "2024-09-28",
      certificateNumber: "FA-2024-001156",
      grade: "Outstanding",
      finalScore: 98,
      thumbnail:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=225&fit=crop",
      skills: ["Community Growth", "Engagement Strategy", "Web3 Marketing"],
      totalHours: 10.5,
      totalLessons: 38,
      verificationUrl: "https://founderacademy.com/verify/FA-2024-001156",
      blockchainHash: "0x8a3c41Dd7632B0553876a3b844Bc9e7595f0bEa2",
    },
    {
      id: 3,
      courseTitle: "Smart Contract Security Fundamentals",
      instructor: "Web3Wizard",
      instructorAvatar:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Web3Wizard",
      completedDate: "2024-09-10",
      certificateNumber: "FA-2024-000987",
      grade: "Excellent",
      finalScore: 92,
      thumbnail:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop",
      skills: ["Smart Contracts", "Security Auditing", "Solidity"],
      totalHours: 14.0,
      totalLessons: 41,
      verificationUrl: "https://founderacademy.com/verify/FA-2024-000987",
      blockchainHash: "0x9b4d52Ee8743C0542935b4b955Dc0f8706f1cFc3",
    },
  ];

  const filteredCertificates = certificates.filter((cert) =>
    cert.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (cert) => {
    toast.success("Certificate downloaded!");
    // Implement actual download logic
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
    const text = `I just completed "${cert.courseTitle}" on Founder Academy! 🎓`;
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
    switch (grade.toLowerCase()) {
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
              {(
                certificates.reduce((sum, cert) => sum + cert.finalScore, 0) /
                certificates.length
              ).toFixed(1)}
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
                className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition group"
              >
                <div className="relative aspect-video bg-gradient-to-br from-primary-400 to-purple-600 p-6 flex flex-col justify-between">
                  <div className="text-center">
                    <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg mb-4">
                      <Award className="w-8 h-8 text-white mx-auto mb-2" />
                      <p className="text-white text-xs font-bold">
                        CERTIFICATE OF COMPLETION
                      </p>
                    </div>
                    <h3 className="text-white font-bold text-sm line-clamp-2 mb-2">
                      {cert.courseTitle}
                    </h3>
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-xs mb-1">Awarded to</p>
                    <p className="text-white font-bold">You</p>
                  </div>
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-3">
                    <button
                      onClick={() => navigate(`/certificates/${cert.id}`)}
                      className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
                    >
                      <Eye className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleDownload(cert)}
                      className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleShare(cert)}
                      className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <img
                      src={cert.instructorAvatar}
                      alt={cert.instructor}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-500">
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
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cert.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary-400/10 text-primary-400 text-xs rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => navigate(`/certificates/${cert.id}`)}
                      className="py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium hover:border-primary-400 transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(cert)}
                      className="py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium hover:border-primary-400 transition"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleShare(cert)}
                      className="py-2 bg-primary-400 text-black rounded-lg text-sm font-medium hover:bg-primary-500 transition"
                    >
                      Share
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Lock className="w-3 h-3" />
                      <span>ID: {cert.certificateNumber}</span>
                    </div>
                    <button
                      onClick={() => handleCopyLink(cert.verificationUrl)}
                      className="mt-2 text-xs text-primary-400 hover:text-primary-500 font-medium flex items-center space-x-1"
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
      </div>
    </div>
  );
};

export default CertificatesPage;
