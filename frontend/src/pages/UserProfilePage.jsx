import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { userApi, purchaseApi, certificateApi } from "@services/api";
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

        // Load user profile
        const profileResponse = await userApi.getProfile(username);
        setProfile(profileResponse.data.user);

        // If viewing own profile, load additional data
        if (isOwnProfile) {
          // Load stats
          try {
            const statsResponse = await userApi.getStats();
            setStats(statsResponse.data.stats);
          } catch (error) {
            console.error("Error loading stats:", error);
            setStats(null);
          }

          // Load enrolled courses
          const coursesResponse = await purchaseApi.getMyPurchases();
          setEnrolledCourses(coursesResponse.data.purchases);

          // Load certificates
          try {
            const certsResponse = await certificateApi.getMyCertificates();
            setCertificates(certsResponse.data.certificates || []);
          } catch (error) {
            console.error("Error loading certificates:", error);
            setCertificates([]);
          }
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
  }, [username, isOwnProfile]);

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
    const currentXP = stats?.experience || profile?.experience || 0;

    // XP formula: level = floor(sqrt(experience / 100)) + 1
    // Reversed: experience = (level - 1)^2 * 100

    const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100;
    const nextLevelXP = Math.pow(currentLevel, 2) * 100;

    const progressXP = currentXP - currentLevelXP;
    const requiredXP = nextLevelXP - currentLevelXP;

    const percentage = requiredXP > 0 ? (progressXP / requiredXP) * 100 : 0;

    return Math.max(0, Math.min(100, percentage));
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

  // Get current level and XP
  const currentLevel = stats?.level || profile?.level || 1;
  const currentXP = stats?.experience || profile?.experience || 0;

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
                    {currentLevel}
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
                      {currentXP}
                    </div>
                    <div className="text-sm text-gray-500">XP</div>
                  </div>
                </div>

                {/* Level Progress */}
                {isOwnProfile && (
                  <div className="p-4 bg-gradient-to-r from-primary-400/10 to-purple-500/10 border-2 border-primary-400/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-primary-400" />
                        <span className="font-bold text-gray-900 dark:text-white">
                          Level {currentLevel}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.floor(getLevelProgress())}% to Level{" "}
                        {currentLevel + 1}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-purple-500 transition-all"
                        style={{ width: `${getLevelProgress()}%` }}
                      />
                    </div>
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
                      {certificates.map((cert) => (
                        <div
                          key={cert._id}
                          className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-primary-400/50 transition-all duration-300"
                        >
                          {/* Certificate Preview Card */}
                          <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-gray-900 to-black p-6 flex flex-col overflow-hidden">
                            {/* Background pattern */}
                            <div className="absolute inset-0 opacity-5">
                              <svg
                                className="w-full h-full"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <defs>
                                  <pattern
                                    id={`grid-${cert._id}`}
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
                                <rect
                                  width="100%"
                                  height="100%"
                                  fill={`url(#grid-${cert._id})`}
                                />
                              </svg>
                            </div>

                            {/* Corner ornaments */}
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

                            {/* Header */}
                            <div className="relative z-10 flex-shrink-0">
                              <div className="text-center space-y-2">
                                <div className="flex justify-center mb-1">
                                  <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/50">
                                      <Award
                                        className="w-5 h-5 text-black"
                                        strokeWidth={2.5}
                                      />
                                    </div>
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

                            {/* Footer */}
                            <div className="relative z-10 flex-shrink-0">
                              <div className="text-center space-y-1.5">
                                <div className="inline-flex flex-col items-center px-4 py-2 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-lg border border-primary-400/20 shadow-xl">
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
                                    {new Date(cert.completedDate).getFullYear()}
                                  </span>
                                  <span>•</span>
                                  <Lock className="w-2 h-2" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Certificate Info */}
                          <div className="p-4">
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
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(
                                    cert.completedDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>{cert.totalLessons} lessons</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
