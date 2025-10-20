import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Target,
  Clock,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { certificateApi, professionalCertificationApi } from "@services/api";
import { useWallet } from "@contexts/WalletContext";

const CertificatesPage = () => {
  const navigate = useNavigate();
  const { user } = useWallet();

  // Tab state
  const [activeTab, setActiveTab] = useState("all");
  const [competencySubTab, setCompetencySubTab] = useState("certificates");

  // Course Certificates
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [courseCertificates, setCourseCertificates] = useState([]);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState(null);

  // Professional Certificates
  const [professionalCertificates, setProfessionalCertificates] = useState([]);
  const [loadingProfessional, setLoadingProfessional] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [filteredAttempts, setFilteredAttempts] = useState([]);
  const [attemptFilter, setAttemptFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCertificates();
  }, []);

  useEffect(() => {
    applyAttemptFilters();
  }, [attemptFilter, categoryFilter, attempts]);

  const loadCertificates = async () => {
    await Promise.all([loadCourseCertificates(), loadProfessionalData()]);
  };

  const loadCourseCertificates = async () => {
    try {
      const response = await certificateApi.getMyCertificates();
      const transformed = (response.data.certificates || []).map((cert) => ({
        id: cert._id,
        type: "completion",
        courseTitle: cert.courseTitle,
        instructor: cert.instructor,
        instructorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cert.instructor}`, // ADD THIS LINE
        completedDate: cert.completedDate,
        certificateNumber: cert.certificateNumber,
        grade: cert.grade,
        finalScore: cert.finalScore,
        thumbnail: cert.courseId?.thumbnail || cert.templateImage,
        totalHours: cert.totalHours,
        totalLessons: cert.totalLessons,
        verificationUrl: cert.verificationUrl,
        blockchainHash: cert.blockchainHash,
        blockchainExplorerUrl: cert.blockchainExplorerUrl,
        templateImage: cert.templateImage,
      }));
      setCourseCertificates(transformed);
    } catch (error) {
      console.error("Error loading certificates:", error);
    } finally {
      setLoadingCourse(false);
    }
  };

  const loadProfessionalData = async () => {
    setLoadingProfessional(true);

    // Load Professional Certificates
    try {
      const response = await professionalCertificationApi.getMyCertificates();
      setProfessionalCertificates(response.data.certificates || []);
    } catch (error) {
      console.error("Error loading professional certificates:", error);
    } finally {
      setLoadingProfessional(false);
    }

    // Load Professional Attempts
    try {
      const response = await professionalCertificationApi.getMyAttempts();
      setAttempts(response.data.attempts || []);
      const uniqueCategories = [
        ...new Set(response.data.attempts.map((a) => a.certification.category)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading attempts:", error);
    }
  };

  const applyAttemptFilters = () => {
    let filtered = [...attempts];

    if (attemptFilter === "passed") {
      filtered = filtered.filter((a) => a.passed);
    } else if (attemptFilter === "failed") {
      filtered = filtered.filter((a) => !a.passed);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (a) => a.certification.category === categoryFilter
      );
    }

    setFilteredAttempts(filtered);
  };

  const filteredCourseCertificates = courseCertificates.filter((cert) =>
    cert.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allCertificates = [
    ...courseCertificates.map((c) => ({ ...c, type: "completion" })),
    ...professionalCertificates.map((c) => ({ ...c, type: "competency" })),
  ];

  const handleView = (cert) => {
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
    const text = `I earned a certificate from Lizard Academy! ${cert.verificationUrl}`;
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        cert.verificationUrl
      )}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        cert.verificationUrl
      )}`,
    };
    window.open(urls[platform], "_blank");
  };

  const getGradeColor = (grade) => {
    switch (grade?.toLowerCase()) {
      case "outstanding":
        return "text-purple-500 bg-purple-500/10 border-purple-500/30";
      case "excellent":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "very good":
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      case "good":
        return "text-cyan-500 bg-cyan-500/10 border-cyan-500/30";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getCompetencyGrade = (score) => {
    if (score >= 95)
      return {
        text: "Outstanding",
        color: "from-purple-500 to-pink-500",
        textColor: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
      };
    if (score >= 85)
      return {
        text: "Excellent",
        color: "from-green-500 to-emerald-500",
        textColor: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
      };
    if (score >= 75)
      return {
        text: "Very Good",
        color: "from-blue-500 to-cyan-500",
        textColor: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
      };
    if (score >= 70)
      return {
        text: "Good",
        color: "from-cyan-500 to-teal-500",
        textColor: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/30",
      };
    if (score >= 60)
      return {
        text: "Pass",
        color: "from-yellow-500 to-orange-500",
        textColor: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
      };
    return {
      text: "Fail",
      color: "from-red-500 to-rose-500",
      textColor: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    };
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const passedAttempts = attempts.filter((a) => a.passed);

  // Get eligible attempts (passed but no certificate)
  const eligibleAttempts = passedAttempts.filter((attempt) => {
    return !professionalCertificates.some(
      (cert) =>
        cert.attemptId && cert.attemptId.toString() === attempt._id.toString()
    );
  });

  const loading = loadingCourse || loadingProfessional;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary-400/10 to-primary-600/10 border-2 border-primary-400/30 rounded-2xl p-6">
            <Trophy className="w-8 h-8 text-primary-400 mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {allCertificates.length}
            </div>
            <div className="text-sm text-gray-500">Total Certificates</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl p-6">
            <Award className="w-8 h-8 text-blue-500 mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {courseCertificates.length}
            </div>
            <div className="text-sm text-gray-500">Course Certificates</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-2xl p-6">
            <Shield className="w-8 h-8 text-yellow-500 mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {professionalCertificates.length}
            </div>
            <div className="text-sm text-gray-500">
              Professional Certificates
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {passedAttempts.length}
            </div>
            <div className="text-sm text-gray-500">Tests Passed</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === "all"
                ? "bg-gradient-to-r from-primary-400 to-primary-600 text-black shadow-lg"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-800 hover:border-primary-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              All Certificates
            </div>
          </button>

          <button
            onClick={() => setActiveTab("completion")}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === "completion"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certificate of Completion
            </div>
          </button>

          <button
            onClick={() => setActiveTab("competency")}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap relative overflow-hidden ${
              activeTab === "competency"
                ? "bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-2 border-yellow-500/30 hover:border-yellow-500"
            }`}
          >
            <div className="flex items-center gap-2 relative z-10">
              <Shield className="w-5 h-5" />
              Certificate of Competency
              {activeTab === "competency" && (
                <Sparkles className="w-4 h-4 animate-pulse" />
              )}
            </div>
            {activeTab === "competency" && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "all" && (
          <div>
            {allCertificates.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No certificates yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Complete courses or pass professional tests to earn
                  certificates
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => navigate("/courses")}
                    className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl transition"
                  >
                    Browse Courses
                  </button>
                  <button
                    onClick={() => navigate("/professional-certifications")}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-xl font-bold hover:shadow-xl transition"
                  >
                    Take Professional Tests
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search certificates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Certificates Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Professional Certificates First */}
                  {allCertificates
                    .filter((cert) =>
                      cert.type === "completion"
                        ? cert.courseTitle
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        : cert.certificationTitle
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => {
                      // Sort: Certificate of Competency first, then Completion
                      if (a.type === "competency" && b.type !== "competency")
                        return -1;
                      if (a.type !== "competency" && b.type === "competency")
                        return 1;
                      return 0;
                    })
                    .map((cert) =>
                      cert.type === "completion" ? (
                        <CompletionCertificateCard
                          key={cert.id}
                          cert={cert}
                          user={user}
                          onView={handleView}
                          onShare={handleShare}
                          onCopyLink={handleCopyLink}
                          getGradeColor={getGradeColor}
                        />
                      ) : (
                        <CompetencyCertificateCard
                          key={cert._id}
                          cert={cert}
                          getCompetencyGrade={getCompetencyGrade}
                        />
                      )
                    )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "completion" && (
          <div>
            {courseCertificates.length === 0 ? (
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
                {filteredCourseCertificates.map((cert) => (
                  <CompletionCertificateCard
                    key={cert.id}
                    cert={cert}
                    user={user}
                    onView={handleView}
                    onShare={handleShare}
                    onCopyLink={handleCopyLink}
                    getGradeColor={getGradeColor}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "competency" && (
          <div>
            {/* Sub Tabs */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setCompetencySubTab("certificates")}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  competencySubTab === "certificates"
                    ? "bg-yellow-500 text-black"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-800"
                }`}
              >
                Certificates
              </button>
              <button
                onClick={() => setCompetencySubTab("eligible")}
                className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                  competencySubTab === "eligible"
                    ? "bg-yellow-500 text-black"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-800"
                }`}
              >
                <Star className="w-4 h-4" />
                Eligible ({eligibleAttempts.length})
              </button>
              <button
                onClick={() => setCompetencySubTab("attempts")}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  competencySubTab === "attempts"
                    ? "bg-yellow-500 text-black"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-800"
                }`}
              >
                All Attempts ({attempts.length})
              </button>
            </div>

            {competencySubTab === "certificates" && (
              <div>
                {professionalCertificates.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-2 border-yellow-500/30 rounded-2xl">
                    <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      No Certificate of Competency yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Pass a professional certification test to earn your COC
                      certificate
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {eligibleAttempts.length > 0 && (
                        <button
                          onClick={() => setCompetencySubTab("eligible")}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-xl transition inline-flex items-center gap-2"
                        >
                          <Star className="w-5 h-5" />
                          View Eligible ({eligibleAttempts.length})
                        </button>
                      )}
                      <button
                        onClick={() => navigate("/professional-certifications")}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-xl font-bold hover:shadow-xl transition inline-flex items-center gap-2"
                      >
                        <Target className="w-5 h-5" />
                        Take Professional Tests
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Verified Certificates
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {professionalCertificates.map((cert) => (
                        <CompetencyCertificateCard
                          key={cert._id}
                          cert={cert}
                          getCompetencyGrade={getCompetencyGrade}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {competencySubTab === "eligible" && (
              <div>
                {eligibleAttempts.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-2 border-green-500/30 rounded-2xl">
                    <Star className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      No eligible certificates
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Pass a professional test to become eligible for
                      certificate purchase
                    </p>
                    <button
                      onClick={() => navigate("/professional-certifications")}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-xl transition inline-flex items-center gap-2"
                    >
                      <Target className="w-5 h-5" />
                      Take Professional Tests
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Star className="w-6 h-6 text-yellow-500" />
                      Eligible for Certificate Purchase
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {eligibleAttempts.map((attempt) => (
                        <EligibleCertificateCard
                          key={attempt._id}
                          attempt={attempt}
                          getCompetencyGrade={getCompetencyGrade}
                          navigate={navigate}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {competencySubTab === "attempts" && (
              <div>
                {/* Filters */}
                <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                        Status Filter
                      </label>
                      <div className="flex gap-2">
                        {[
                          { value: "all", label: "All", icon: Target },
                          {
                            value: "passed",
                            label: "Passed",
                            icon: CheckCircle,
                          },
                          { value: "failed", label: "Failed", icon: X },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => setAttemptFilter(item.value)}
                            className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                              attemptFilter === item.value
                                ? "bg-yellow-500 text-black shadow-lg"
                                : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {categories.length > 0 && (
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                          Category Filter
                        </label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white font-semibold"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attempts List */}
                {filteredAttempts.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      No attempts found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Start taking professional tests to see your attempts here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAttempts.map((attempt) => (
                      <AttemptCard
                        key={attempt._id}
                        attempt={attempt}
                        getCompetencyGrade={getCompetencyGrade}
                        formatDuration={formatDuration}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal
            certificate={selectedCertificate}
            onClose={() => setShowShareModal(false)}
            onShareSocial={handleShareSocial}
            onCopyLink={handleCopyLink}
          />
        )}

        {/* View Modal */}
        {showViewModal && (
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

// Component: Completion Certificate Card (Your existing design)
const CompletionCertificateCard = ({
  cert,
  user,
  onView,
  onShare,
  onCopyLink,
  getGradeColor,
}) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-2xl hover:border-primary-400/50 transition-all duration-300 group">
    {/* Your existing certificate preview design */}
    <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-gray-900 to-black p-6 flex flex-col overflow-hidden">
      {/* Elegant background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
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
          <div className="flex justify-center mb-1">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/50">
                <Award className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <div className="absolute inset-0 bg-primary-400 rounded-full blur-md opacity-40 animate-pulse"></div>
            </div>
          </div>

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

      {/* Course Title */}
      <div className="relative z-10 flex-grow flex items-center justify-center py-2">
        <h3 className="text-white font-bold text-[11px] leading-tight line-clamp-2 px-6 text-center">
          {cert.courseTitle}
        </h3>
      </div>

      {/* Footer Section */}
      <div className="relative z-10 flex-shrink-0">
        <div className="text-center space-y-1.5">
          <div className="inline-flex flex-col items-center px-4 py-2 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-lg border border-primary-400/20 shadow-xl">
            <p className="text-white/50 text-[8px] tracking-wider uppercase mb-0.5">
              Awarded to
            </p>
            <p className="text-white font-bold text-[11px] tracking-wide">
              {user?.username || "Student"}
            </p>
          </div>

          <div className="flex items-center justify-center space-x-1.5 text-[8px] text-white/30 tracking-wider">
            <span className="font-semibold">LIZARD ACADEMY</span>
            <span>•</span>
            <span>{new Date(cert.completedDate).getFullYear()}</span>
            <span>•</span>
            <Lock className="w-2 h-2" />
          </div>
        </div>
      </div>

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
      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(cert.completedDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>{cert.totalLessons} lessons</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => onView(cert)}
          className="py-2.5 border-2 border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold hover:border-primary-400 hover:bg-primary-400/5 hover:scale-105 hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          View
        </button>
        <button
          onClick={async () => {
            try {
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
              toast.error("Failed to download certificate");
            }
          }}
          className="py-2.5 border-2 border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold hover:border-primary-400 hover:bg-primary-400/5 hover:scale-105 hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          Download
        </button>
        <button
          onClick={() => onShare(cert)}
          className="py-2.5 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl text-sm font-bold hover:from-primary-500 hover:to-primary-700 hover:scale-105 hover:shadow-xl hover:shadow-primary-400/30 transition-all duration-200 active:scale-95"
        >
          Share
        </button>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
          <Lock className="w-3 h-3" />
          <span className="font-mono">{cert.certificateNumber}</span>
        </div>
        <button
          onClick={() => onCopyLink(cert.verificationUrl)}
          className="text-xs text-primary-400 hover:text-primary-500 font-semibold flex items-center space-x-1 hover:underline transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Verify on blockchain</span>
        </button>
      </div>
    </div>
  </div>
);

// Component: Competency Certificate Card
const CompetencyCertificateCard = ({ cert, getCompetencyGrade }) => {
  const grade = getCompetencyGrade(cert.score);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-yellow-500/10 p-[2px] hover:scale-105 transition-all duration-300">
      <div className="bg-white dark:bg-black rounded-2xl overflow-hidden">
        <div className="relative aspect-video bg-gradient-to-br from-yellow-900 via-orange-900 to-yellow-900 p-6 flex flex-col overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-orange-600/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl"></div>

          <div className="absolute top-3 right-3 z-10">
            <div className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-[8px] font-bold text-black flex items-center gap-1 shadow-lg">
              <Shield className="w-2.5 h-2.5" />
              VERIFIED
            </div>
          </div>

          <div className="relative z-10 text-center mb-2">
            <div className="flex justify-center mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
                <Shield className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-yellow-400 text-[9px] font-bold tracking-[0.2em] uppercase">
              Professional Certificate
            </p>
          </div>

          <div className="relative z-10 flex-grow flex items-center justify-center">
            <h3 className="text-white font-bold text-[11px] leading-tight line-clamp-2 px-4 text-center">
              {cert.certificationTitle}
            </h3>
          </div>

          <div className="relative z-10 text-center">
            <div className="inline-flex flex-col items-center px-4 py-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-lg border border-yellow-400/30">
              <p className="text-white/70 text-[8px] tracking-wider uppercase mb-0.5">
                Score
              </p>
              <p className="text-white font-bold text-[13px]">{cert.score}%</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div
              className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${grade.bgColor} ${grade.borderColor} ${grade.textColor}`}
            >
              {grade.text}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(cert.issueDate).toLocaleDateString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                try {
                  const link = document.createElement("a");
                  link.href = cert.templateImage;
                  link.download = `professional-certificate-${cert.certificateNumber}.png`;
                  link.click();
                  toast.success("Certificate downloaded!");
                } catch (error) {
                  toast.error("Failed to download");
                }
              }}
              className="py-2.5 border-2 border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold hover:border-yellow-500 hover:bg-yellow-500/5 transition"
            >
              Download
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(cert.verificationUrl);
                toast.success("Link copied!");
              }}
              className="py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-xl text-sm font-bold hover:shadow-lg transition"
            >
              Share
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
              <Lock className="w-3 h-3" />
              <span className="font-mono">{cert.certificateNumber}</span>
            </div>
            <button
              onClick={() => window.open(cert.blockchainExplorerUrl, "_blank")}
              className="text-xs text-yellow-500 hover:text-yellow-600 font-semibold flex items-center space-x-1 hover:underline transition"
            >
              <Shield className="w-3 h-3" />
              <span>Verify on blockchain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component: Eligible Certificate Card
const EligibleCertificateCard = ({ attempt, getCompetencyGrade, navigate }) => {
  const grade = getCompetencyGrade(attempt.score);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/10 p-[2px] hover:scale-105 transition-all duration-300">
      <div className="bg-white dark:bg-black rounded-2xl overflow-hidden">
        <div className="relative aspect-video bg-gradient-to-br from-green-900 via-emerald-900 to-green-900 p-6 flex flex-col overflow-hidden backdrop-blur-xl">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-md"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/10 rounded-full blur-3xl"></div>

          <div className="absolute top-3 right-3 z-10">
            <div className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-[8px] font-bold text-white flex items-center gap-1 shadow-lg">
              <Star className="w-2.5 h-2.5" />
              ELIGIBLE
            </div>
          </div>

          <div className="relative z-10 text-center mb-2">
            <div className="flex justify-center mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 animate-pulse">
                <Shield className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-green-400 text-[9px] font-bold tracking-[0.2em] uppercase">
              Professional Certificate
            </p>
          </div>

          <div className="relative z-10 flex-grow flex items-center justify-center">
            <h3 className="text-white font-bold text-[11px] leading-tight line-clamp-2 px-4 text-center">
              {attempt.certification.title}
            </h3>
          </div>

          <div className="relative z-10 text-center">
            <div className="inline-flex flex-col items-center px-4 py-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-lg border border-green-400/30">
              <p className="text-white/70 text-[8px] tracking-wider uppercase mb-0.5">
                Score
              </p>
              <p className="text-white font-bold text-[13px]">
                {attempt.score}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div
                className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${grade.bgColor} ${grade.borderColor} ${grade.textColor}`}
              >
                {grade.text}
              </div>
              <div className="text-sm text-gray-500">
                {attempt.correctAnswers}/{attempt.totalQuestions}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(attempt.completedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>Attempt #{attempt.attemptNumber}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              navigate(`/professional-certifications/results/${attempt._id}`)
            }
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" />
            BUY CERTIFICATE ($5)
          </button>

          <p className="text-center text-xs text-gray-500 mt-2">
            Get your blockchain-verified certificate
          </p>
        </div>
      </div>
    </div>
  );
};

// Component: Attempt Card
const AttemptCard = ({
  attempt,
  getCompetencyGrade,
  formatDuration,
  navigate,
}) => {
  const grade = getCompetencyGrade(attempt.score);

  return (
    <div
      onClick={() =>
        navigate(`/professional-certifications/results/${attempt._id}`)
      }
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-r p-[2px] cursor-pointer hover:scale-[1.02] transition-all duration-300"
      style={{
        backgroundImage: `linear-gradient(135deg, ${
          attempt.passed
            ? "rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3)"
            : "rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3)"
        })`,
      }}
    >
      <div className="bg-white dark:bg-black rounded-2xl p-6">
        <div className="flex items-start gap-6">
          <div
            className={`p-4 rounded-2xl ${
              attempt.passed
                ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                : "bg-gradient-to-br from-red-500/20 to-rose-500/20"
            }`}
          >
            {attempt.passed ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <X className="w-8 h-8 text-red-500" />
            )}
          </div>

          <div className="flex-grow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {attempt.certification.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(attempt.completedAt).toLocaleDateString()}
                  </span>
                  {attempt.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(attempt.duration)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Attempt #{attempt.attemptNumber}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-xl ${grade.bgColor} border-2 ${grade.borderColor}`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Score
                </p>
                <p className={`text-3xl font-bold ${grade.textColor}`}>
                  {attempt.score}%
                </p>
              </div>
              <div
                className={`p-4 rounded-xl ${grade.bgColor} border-2 ${grade.borderColor}`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Grade
                </p>
                <p className={`text-2xl font-bold ${grade.textColor}`}>
                  {grade.text}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Correct
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attempt.correctAnswers}/{attempt.totalQuestions}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component: Share Modal
const ShareModal = ({ certificate, onClose, onShareSocial, onCopyLink }) => (
  <>
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      onClick={onClose}
    />
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Share Certificate
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onShareSocial("twitter")}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-xl font-semibold transition"
          >
            <Twitter className="w-5 h-5" />
            Share on Twitter
          </button>
          <button
            onClick={() => onShareSocial("linkedin")}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#0A66C2] hover:bg-[#084d94] text-white rounded-xl font-semibold transition"
          >
            <Linkedin className="w-5 h-5" />
            Share on LinkedIn
          </button>
          <button
            onClick={() => onShareSocial("facebook")}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#1877F2] hover:bg-[#145dbf] text-white rounded-xl font-semibold transition"
          >
            <Facebook className="w-5 h-5" />
            Share on Facebook
          </button>
          <button
            onClick={() => onCopyLink(certificate.verificationUrl)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition"
          >
            <Copy className="w-5 h-5" />
            Copy Link
          </button>
        </div>
      </div>
    </div>
  </>
);

export default CertificatesPage;
