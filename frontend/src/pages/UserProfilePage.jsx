import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  userApi,
  purchaseApi,
  certificateApi,
  professionalCertificationApi,
} from "@services/api";
import { useWallet } from "@contexts/WalletContext";
import toast from "react-hot-toast";
import {
  User,
  Award,
  BookOpen,
  Trophy,
  Star,
  Calendar,
  Globe,
  Twitter,
  Linkedin,
  TrendingUp,
  Clock,
  Target,
  Zap,
  CheckCircle,
  Play,
  Settings,
  Lock,
} from "lucide-react";

const UserProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useWallet();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        // Single API call - gets everything
        const response = await userApi.getProfileComplete(username);
        const data = response.data;

        console.log("📊 Profile complete data:", data);

        setProfile(data.profile);

        if (data.isOwnProfile) {
          setStats(data.stats);
          setEnrolledCourses(data.enrolledCourses);
          setCertificates(data.certificates);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
        setLoading(false);
      }
    };

    if (username) {
      loadProfile();
    }
  }, [username]);
  const currentLevel = stats?.level || profile?.level || 1;
  const currentXP = stats?.totalXP || profile?.totalXP || 0;
  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "0s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 && hours === 0) parts.push(`${secs}s`);

    return parts.join(" ") || "0s";
  };

  // Helper function to get level progress
  const getLevelProgress = () => {
    // Use stats if available, otherwise use profile data
    const currentLevel = stats?.level || profile?.level || 1;
    const currentXP = stats?.totalXP || profile?.totalXP || 0; // ← CHANGED to totalXP

    // XP formula: level = floor(sqrt(experience / 100)) + 1
    // Reversed: experience = (level - 1)^2 * 100

    const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100;
    const nextLevelXP = Math.pow(currentLevel, 2) * 100;

    const progressXP = currentXP - currentLevelXP;
    const requiredXP = nextLevelXP - currentLevelXP;

    const percentage = requiredXP > 0 ? (progressXP / requiredXP) * 100 : 0;

    return Math.max(0, Math.min(100, percentage));
  };

  // Also update these lines further down:

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

  // Get current level and XP

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <Link to="/" className="text-primary-400 hover:text-primary-500">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container-custom max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-primary-400 to-purple-500"></div>

          {/* Profile Info */}
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
              {/* Avatar */}
              <div className="relative -mt-24 mb-4 md:mb-0">
                <img
                  src={
                    profile.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`
                  }
                  alt={profile.username}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 object-cover"
                />
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-primary-400 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900">
                  <span className="text-black font-bold text-sm">
                    {stats?.levelProgress?.currentLevel || profile?.level || 1}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {profile.displayName || profile.username}
                      </h1>
                      {profile.isInstructor && profile.instructorVerified && (
                        <Award className="w-6 h-6 text-primary-400" />
                      )}
                    </div>
                    {profile.displayName &&
                      profile.displayName !== profile.username && (
                        <p className="text-sm text-gray-500 mb-2">
                          @{profile.username}
                        </p>
                      )}
                    <p className="text-gray-600 dark:text-gray-400">
                      {profile.bio || "No bio yet"}
                    </p>
                  </div>

                  {isOwnProfile && (
                    <Link
                      to="/settings"
                      className="mt-4 md:mt-0 px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-medium hover:border-primary-400 transition flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </Link>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {enrolledCourses.filter((p) => p.course !== null)
                        .length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Enrolled</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.coursesCompleted || 0}
                    </div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.certificatesEarned || 0}
                    </div>
                    <div className="text-sm text-gray-500">Certificates</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <Zap className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalXP || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total XP</div>
                  </div>
                </div>

                {/* Level Progress */}
                {isOwnProfile && (
                  <div className="p-4 bg-gradient-to-r from-primary-400/10 to-purple-500/10 border-2 border-primary-400/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-primary-400" />
                        <span className="font-bold text-gray-900 dark:text-white">
                          Level {stats?.levelProgress?.currentLevel || 1}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {stats?.levelProgress?.xpInCurrentLevel || 0} /{" "}
                        {stats?.levelProgress?.xpNeededForNextLevel || 100} XP
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-purple-500 transition-all"
                        style={{
                          width: `${
                            stats?.levelProgress?.progressPercentage || 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {stats?.levelProgress?.isMaxLevel
                        ? "Max level reached! 🎉"
                        : `${Math.floor(
                            stats?.levelProgress?.progressPercentage || 0
                          )}% to Level ${
                            (stats?.levelProgress?.currentLevel || 1) + 1
                          }`}
                    </p>
                  </div>
                )}

                {/* Social Links */}
                {(profile.socialLinks?.twitter ||
                  profile.socialLinks?.website ||
                  profile.socialLinks?.linkedin) && (
                  <div className="flex items-center space-x-3 mt-4">
                    {profile.socialLinks.website && (
                      <a
                        href={profile.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                    {profile.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${profile.socialLinks.twitter.replace(
                          "@",
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {profile.socialLinks.linkedin && (
                      <a
                        href={profile.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Only show tabs for own profile */}
        {isOwnProfile && (
          <>
            {/* Tabs */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 mb-6">
              <div className="flex space-x-6 px-6 border-b border-gray-200 dark:border-gray-800">
                {["overview", "courses", "certificates"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 font-medium capitalize transition relative ${
                      activeTab === tab
                        ? "text-primary-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-6 bg-blue-500/5 border-2 border-blue-500/20 rounded-xl">
                      <div className="flex items-center space-x-3 mb-2">
                        <Clock className="w-6 h-6 text-blue-500" />
                        <span className="font-bold text-sm">Total Time</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-500">
                        {formatTime(
                          enrolledCourses.reduce(
                            (sum, p) => sum + (p.totalWatchTime || 0),
                            0
                          )
                        )}
                      </p>
                    </div>
                    <div className="p-6 bg-green-500/5 border-2 border-green-500/20 rounded-xl">
                      <div className="flex items-center space-x-3 mb-2">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                        <span className="font-bold text-sm">Progress</span>
                      </div>
                      <p className="text-3xl font-bold text-green-500">
                        {profile.coursesCompleted > 0 &&
                        profile.coursesEnrolled > 0
                          ? Math.round(
                              (profile.coursesCompleted /
                                profile.coursesEnrolled) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <div className="p-6 bg-purple-500/5 border-2 border-purple-500/20 rounded-xl">
                      <div className="flex items-center space-x-3 mb-2">
                        <Star className="w-6 h-6 text-purple-500" />
                        <span className="font-bold text-sm">Level</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-500">
                        {currentLevel}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "courses" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">My Courses</h2>

                  {enrolledCourses.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {enrolledCourses
                        .filter((purchase) => purchase.course !== null)
                        .map((purchase) => (
                          <Link
                            key={purchase._id}
                            to={`/courses/${purchase.course.slug}/learn`}
                            className="group border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:border-primary-400 transition"
                          >
                            <img
                              src={purchase.course.thumbnail}
                              alt={purchase.course.title}
                              className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                              <h3 className="font-bold text-lg mb-2 group-hover:text-primary-400 transition">
                                {purchase.course.title}
                              </h3>
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Progress
                                  </span>
                                  <span className="font-bold">
                                    {purchase.progress}%
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary-400"
                                    style={{ width: `${purchase.progress}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>
                                  {purchase.completedLessons?.length || 0} /{" "}
                                  {purchase.course.totalLessons} lessons
                                </span>
                                <Play className="w-4 h-4 text-primary-400" />
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No courses enrolled yet</p>
                      <Link
                        to="/courses"
                        className="inline-block mt-4 px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
                      >
                        Browse Courses
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "certificates" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">My Certificates</h2>

                  {certificates.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {certificates.map((cert) =>
                        cert.type === "competency" ? (
                          // Competency Certificate Card (Simplified View-Only)
                          <div
                            key={cert._id}
                            className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-yellow-500/50 transition-all duration-300"
                          >
                            {/* Certificate Preview */}
                            <div className="relative aspect-video bg-gradient-to-br from-yellow-900 via-orange-900 to-yellow-900 p-6 flex flex-col overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-orange-600/20"></div>
                              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl"></div>

                              {/* Official Badge */}
                              <div className="absolute top-3 right-3 z-10">
                                <div className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-[8px] font-bold text-black flex items-center gap-1 shadow-lg">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  OFFICIAL
                                </div>
                              </div>

                              {/* Header */}
                              <div className="relative z-10 flex-shrink-0">
                                <div className="text-center space-y-2">
                                  <div className="flex justify-center mb-1">
                                    <div className="relative">
                                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
                                        <Award
                                          className="w-5 h-5 text-black"
                                          strokeWidth={2.5}
                                        />
                                      </div>
                                      <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-center space-x-2 mb-1.5">
                                      <div className="h-px w-6 bg-gradient-to-r from-transparent to-yellow-400/50"></div>
                                      <Star className="w-2.5 h-2.5 text-yellow-400" />
                                      <div className="h-px w-6 bg-gradient-to-l from-transparent to-yellow-400/50"></div>
                                    </div>
                                    <p className="text-yellow-400 text-[9px] font-bold tracking-[0.2em] uppercase mb-1.5">
                                      Certificate of Competency
                                    </p>
                                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent mx-auto"></div>
                                  </div>
                                </div>
                              </div>

                              {/* Title */}
                              <div className="relative z-10 flex-grow flex items-center justify-center py-2">
                                <h3 className="text-white font-bold text-[11px] leading-tight line-clamp-2 px-6 text-center">
                                  {cert.certificationTitle ||
                                    cert.certificationId?.title}
                                </h3>
                              </div>

                              {/* Footer */}
                              <div className="relative z-10 flex-shrink-0">
                                <div className="text-center space-y-1.5">
                                  <div className="inline-flex flex-col items-center px-4 py-2 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-lg border border-yellow-400/20 shadow-xl">
                                    <p className="text-white/50 text-[8px] tracking-wider uppercase mb-0.5">
                                      Awarded to
                                    </p>
                                    <p className="text-white font-bold text-[11px] tracking-wide">
                                      {profile.username}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-center space-x-1.5 text-[8px] text-white/30 tracking-wider">
                                    <span className="font-semibold">
                                      LIZARD ACADEMY
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {new Date(
                                        cert.issuedDate || cert.completedDate
                                      ).getFullYear()}
                                    </span>
                                    <span>•</span>
                                    <Lock className="w-2 h-2" />
                                  </div>
                                </div>
                              </div>

                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none"></div>
                            </div>

                            {/* Certificate Info */}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div
                                  className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${
                                    cert.score >= 95
                                      ? "text-purple-500 bg-purple-500/10 border-purple-500/30"
                                      : cert.score >= 85
                                      ? "text-green-500 bg-green-500/10 border-green-500/30"
                                      : cert.score >= 75
                                      ? "text-blue-500 bg-blue-500/10 border-blue-500/30"
                                      : cert.score >= 70
                                      ? "text-cyan-500 bg-cyan-500/10 border-cyan-500/30"
                                      : cert.score >= 60
                                      ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/30"
                                      : "text-red-500 bg-red-500/10 border-red-500/30"
                                  }`}
                                >
                                  {cert.grade}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Score:{" "}
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    {cert.score}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(
                                      cert.issuedDate || cert.completedDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Trophy className="w-3 h-3" />
                                  <span>
                                    {cert.correctAnswers}/{cert.totalQuestions}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Completion Certificate Card - NO GRADE/SCORE
                          <div
                            key={cert._id}
                            className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-primary-400/50 transition-all duration-300 cursor-pointer"
                            onClick={() => navigate("/certificates")}
                          >
                            {/* Certificate Preview */}
                            <div className="relative aspect-video bg-gradient-to-br from-primary-900 via-purple-900 to-primary-900 p-6 flex flex-col overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-purple-600/20"></div>
                              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl"></div>

                              {/* Completion Badge */}
                              <div className="absolute top-3 right-3 z-10">
                                <div className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-[8px] font-bold text-black flex items-center gap-1 shadow-lg">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  COMPLETED
                                </div>
                              </div>

                              {/* NFT Badge if minted */}
                              {cert.nftMinted && (
                                <div className="absolute top-3 left-3 z-10">
                                  <div className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[8px] font-bold text-white flex items-center gap-1 shadow-lg">
                                    <Trophy className="w-2.5 h-2.5" />
                                    NFT
                                  </div>
                                </div>
                              )}

                              {/* Header */}
                              <div className="relative z-10 flex-shrink-0 mb-auto">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                    <BookOpen className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <p className="text-[10px] text-white/60 text-center uppercase tracking-wider font-bold">
                                  Certificate of Completion
                                </p>
                              </div>

                              {/* Course Title */}
                              <div className="relative z-10 text-center">
                                <h4 className="text-sm font-bold text-white line-clamp-2 mb-1">
                                  {cert.courseTitle}
                                </h4>
                              </div>
                            </div>

                            {/* Certificate Details */}
                            <div className="p-4">
                              <div className="flex items-start space-x-3 mb-3">
                                <div className="p-2 bg-primary-400/10 rounded-lg">
                                  <BookOpen className="w-5 h-5 text-primary-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                                    {cert.courseTitle}
                                  </h3>
                                  <p className="text-xs text-gray-500">
                                    {cert.instructor}
                                  </p>
                                </div>
                              </div>

                              {/* Stats - Hours and Lessons ONLY (NO grade/score) */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {cert.totalHours}h
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Total Hours
                                  </div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {cert.totalLessons}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Lessons
                                  </div>
                                </div>
                              </div>

                              {/* Date and Status */}
                              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(
                                      cert.completedDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                {cert.nftMinted && (
                                  <div className="flex items-center space-x-1 text-xs text-purple-500">
                                    <Trophy className="w-3 h-3" />
                                    <span className="font-semibold">
                                      NFT Minted
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No certificates earned yet</p>
                      <p className="text-sm mt-2">
                        Complete courses to earn certificates
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* If viewing someone else's profile */}
        {!isOwnProfile && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {profile.isInstructor
                ? "Visit this instructor's courses to learn more"
                : "This user's profile is private"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
