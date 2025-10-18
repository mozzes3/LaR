import { useState, useEffect } from "react";
import { purchaseApi, userApi, certificateApi } from "@services/api";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "@contexts/WalletContext";
import CertificateViewModal from "@components/CertificateViewModal";
import toast from "react-hot-toast";
import {
  Play,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  Star,
  BookOpen,
  Target,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  Download,
  Share2,
  Bookmark,
  ChevronRight,
  Sparkles,
  Trophy,
  Zap,
  BarChart3,
  Users,
  MessageSquare,
  FileText,
  ArrowRight,
  Plus,
} from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user: walletUser } = useWallet();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  // User stats - will be updated from API
  const [user, setUser] = useState({
    username: walletUser?.username || "CryptoNinja",
    avatar:
      walletUser?.avatar ||
      "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoNinja",
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalWatchTime: 0,
    certificatesEarned: 0,
    currentStreak: 0,
    fdrEarned: 0,
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
  });

  // Load enrolled courses from API
  // Load enrolled courses from API
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!walletUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load enrolled courses
        const coursesResponse = await purchaseApi.getMyPurchases();

        // Use SAME API as Analytics page
        const analyticsResponse = await userApi.getStudentAnalytics();
        const apiStats = analyticsResponse.data.analytics.stats;

        console.log("📊 Dashboard stats from API:", apiStats);
        console.log("🔍 Full analytics:", analyticsResponse.data.analytics);

        // Transform courses with proper lesson title lookup
        const transformedCourses = coursesResponse.data.purchases
          .filter((purchase) => purchase.course)
          .map((purchase) => {
            // Get the actual last accessed lesson title
            let currentLessonTitle = "Start learning";

            if (purchase.lastAccessedLesson && purchase.course.sections) {
              // Search through all sections to find the lesson
              for (const section of purchase.course.sections) {
                const lesson = section.lessons.find(
                  (l) =>
                    l._id.toString() === purchase.lastAccessedLesson.toString()
                );
                if (lesson) {
                  currentLessonTitle = lesson.title;
                  break;
                }
              }
            }

            return {
              id: purchase.course._id,
              slug: purchase.course.slug,
              title: purchase.course.title,
              instructor: purchase.course.instructor?.username || "Unknown",
              instructorAvatar:
                purchase.course.instructor?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${purchase.course._id}`,
              thumbnail: purchase.course.thumbnail,
              progress: purchase.progress || 0,
              currentLesson: currentLessonTitle,
              totalLessons: purchase.course.totalLessons || 0,
              completedLessons: purchase.completedLessons?.length || 0,
              lastWatched: formatLastWatched(purchase.lastAccessedAt),
              lastAccessedAt: purchase.lastAccessedAt,
              rating: purchase.course.averageRating || 0,
              status: purchase.isCompleted ? "completed" : "in-progress",
              timeLeft: calculateTimeLeft(
                purchase.course.totalDuration,
                purchase.progress
              ),
              certificateUrl: purchase.certificateId
                ? `/certificates/${purchase.certificateId}`
                : null,
              certificateId: purchase.certificateId,
            };
          });

        setEnrolledCourses(transformedCourses);

        // Set user stats from API - SAME AS ANALYTICS
        setUser({
          username: walletUser?.username || "User",
          avatar:
            walletUser?.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletUser?.username}`,
          totalCourses: apiStats.totalCourses,
          completedCourses: apiStats.completedCourses,
          inProgressCourses: apiStats.inProgressCourses,
          totalWatchTime: apiStats.totalWatchTimeMinutes || 0,
          certificatesEarned: apiStats.certificatesEarned,
          currentStreak: apiStats.currentStreak,
          fdrEarned: apiStats.fdrEarned,
          level: apiStats.level,
          xp: apiStats.totalXP || 0, // ← Use totalXP from analytics
          nextLevelXp: 5000,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setEnrolledCourses([]);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [walletUser]);
  // Helper functions
  const formatLastWatched = (date) => {
    if (!date) return "Not started yet";

    const now = new Date();
    const watched = new Date(date);
    const diffMs = now - watched;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const calculateTimeLeft = (totalDuration, progress) => {
    if (!totalDuration) return "N/A";
    const remainingSeconds = (totalDuration * (100 - progress)) / 100;
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calculateNextLevelXp = (level) => {
    return 5000;
  };

  const stats = [
    {
      label: "Courses Enrolled",
      value: user.totalCourses,
      icon: BookOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Completed",
      value: user.completedCourses,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      label: "Watch Time",
      value: `${Math.floor(user.totalWatchTime / 60)}h ${
        user.totalWatchTime % 60
      }m`,
      icon: Clock,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      label: "Certificates",
      value: user.certificatesEarned,
      icon: Award,
      color: "text-primary-400",
      bgColor: "bg-primary-400/10",
      borderColor: "border-primary-400/20",
    },
  ];
  const handleViewCertificate = async (courseId) => {
    try {
      setLoadingCertificate(true);

      // Get all certificates
      const response = await certificateApi.getMyCertificates();

      // Find certificate for this course
      const cert = response.data.certificates.find(
        (c) => c.courseId._id === courseId || c.courseId === courseId
      );

      if (cert) {
        // Transform to match modal format
        const transformedCert = {
          id: cert._id,
          courseTitle: cert.courseTitle,
          instructor: cert.instructor,
          completedDate: cert.completedDate,
          certificateNumber: cert.certificateNumber,
          grade: cert.grade,
          finalScore: cert.finalScore,
          totalHours: cert.totalHours,
          totalLessons: cert.totalLessons,
          verificationUrl: cert.verificationUrl,
          templateImage: cert.templateImage,
        };

        setSelectedCertificate(transformedCert);
        setShowCertificateModal(true);
      } else {
        toast.error("Certificate not found for this course");
      }
    } catch (error) {
      console.error("Error loading certificate:", error);
      toast.error("Failed to load certificate");
    } finally {
      setLoadingCertificate(false);
    }
  };

  const handleShareCertificate = (cert) => {
    const text = `I just completed "${cert.courseTitle}" on Lizard Academy! 🎓`;
    const url = cert.verificationUrl;

    // Open share options
    if (navigator.share) {
      navigator
        .share({
          title: "My Certificate",
          text: text,
          url: url,
        })
        .catch(() => {
          // Fallback to copying link
          navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard!");
        });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };
  const filteredCourses = enrolledCourses.filter((course) => {
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "in-progress" && course.status === "in-progress") ||
      (selectedFilter === "completed" && course.status === "completed");

    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your dashboard...
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              My Learning
            </h1>
            <Link
              to="/courses"
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition font-medium flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Browse Courses</span>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track your progress and continue learning
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-gray-900 rounded-2xl border-2 ${stat.borderColor} p-6 hover:shadow-lg transition`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Progress & Achievements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Level Progress */}
            <div className="bg-gradient-to-br from-primary-400/10 to-purple-500/10 border-2 border-primary-400/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-black font-bold text-xl">
                    {user.level}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Level {user.level}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {user.xp} / {user.nextLevelXp} XP
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-400">
                    {user.fdrEarned} $FDR
                  </div>
                  <p className="text-xs text-gray-500">Earned from courses</p>
                </div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-purple-500 transition-all duration-500"
                  style={{ width: `${(user.xp / user.nextLevelXp) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Streak */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <Zap className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.currentStreak} Day Streak 🔥
                    </h3>
                    <p className="text-sm text-gray-500">
                      Keep learning to maintain your streak!
                    </p>
                  </div>
                </div>
                <Trophy className="w-12 h-12 text-primary-400" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate("/courses")}
                className="p-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition text-left group"
              >
                <BookOpen className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition" />
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                  Browse Courses
                </h4>
                <p className="text-xs text-gray-500">Discover new skills</p>
              </button>
              <button
                onClick={() => navigate("/certificates")}
                className="p-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition text-left group"
              >
                <Award className="w-8 h-8 text-primary-400 mb-3 group-hover:scale-110 transition" />
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                  Certificates
                </h4>
                <p className="text-xs text-gray-500">View achievements</p>
              </button>
              <button
                onClick={() => navigate("/progress")}
                className="p-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition text-left group"
              >
                <BarChart3 className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition" />
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                  My Progress
                </h4>
                <p className="text-xs text-gray-500">Detailed analytics</p>
              </button>
            </div>
          </div>

          {/* Activity Feed */}
          {/* Activity Feed */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {enrolledCourses.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              ) : (
                enrolledCourses
                  .filter((c) => c.lastAccessedAt)
                  .sort((a, b) => {
                    // Sort by most recent first - FIX: Use lastAccessedAt instead of lastWatched
                    const dateA = new Date(a.lastAccessedAt);
                    const dateB = new Date(b.lastAccessedAt);
                    return dateB - dateA;
                  })
                  .slice(0, 5)
                  .map((course, index) => (
                    <div
                      key={course.id}
                      className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
                      onClick={() => navigate(`/learn/${course.slug}`)}
                    >
                      <div className="w-10 h-10 bg-primary-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {course.status === "completed" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Play className="w-5 h-5 text-primary-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {course.status === "completed"
                            ? "Completed"
                            : "Watched"}{" "}
                          {course.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course.lastWatched}
                        </p>
                      </div>
                      {course.status === "in-progress" && (
                        <div className="text-xs font-bold text-primary-400">
                          {course.progress}%
                        </div>
                      )}
                    </div>
                  ))
              )}

              {enrolledCourses.length > 5 && (
                <button
                  onClick={() => setActiveTab("courses")}
                  className="w-full py-2 text-sm text-primary-400 hover:text-primary-500 font-medium"
                >
                  View all activity →
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Courses
            </h2>
            <div className="flex items-center space-x-3">
              <div className="relative flex-1 lg:flex-initial">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-sm w-full lg:w-64"
                />
              </div>
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setSelectedFilter("all")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedFilter === "all"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedFilter("in-progress")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedFilter === "in-progress"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setSelectedFilter("completed")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedFilter === "completed"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition group flex flex-col"
              >
                <div className="relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                  {course.status === "completed" ? (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-bold rounded-lg">
                      {course.progress}%
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/courses/${course.slug}/learn`)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <div className="w-16 h-16 bg-primary-400 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-black ml-1" />
                    </div>
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition">
                    {course.title}
                  </h3>
                  <div className="flex items-center space-x-2 mb-3">
                    <img
                      src={course.instructorAvatar}
                      alt={course.instructor}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm text-gray-500">
                      {course.instructor}
                    </span>
                  </div>
                  {/* Flexible spacer - pushes content to bottom */}
                  <div className="flex-1" />
                  {course.status === "in-progress" && (
                    <>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>
                            {course.completedLessons} / {course.totalLessons}{" "}
                            lessons
                          </span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Current: {course.currentLesson}
                      </p>
                      <button
                        onClick={() =>
                          navigate(`/courses/${course.slug}/learn`)
                        }
                        className="w-full py-2 bg-primary-400 text-black rounded-lg font-bold hover:bg-primary-500 transition flex items-center justify-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Continue Learning</span>
                      </button>
                    </>
                  )}
                  {course.status === "completed" && (
                    <>
                      <div className="flex items-center space-x-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(course.rating)
                                ? "fill-primary-400 text-primary-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-500 ml-1">
                          {course.rating}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleViewCertificate(course.id)}
                          disabled={loadingCertificate}
                          className="py-2 bg-primary-400 text-black rounded-lg font-bold hover:bg-primary-500 transition text-sm flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Award className="w-4 h-4" />
                          <span>
                            {loadingCertificate ? "Loading..." : "Certificate"}
                          </span>
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/courses/${course.slug}/learn`)
                          }
                          className="py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg font-bold hover:border-primary-400 transition text-sm"
                        >
                          Rewatch
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {enrolledCourses.length === 0
                  ? "No courses enrolled yet"
                  : "No courses found"}
              </h3>
              <p className="text-gray-500 mb-6">
                {enrolledCourses.length === 0
                  ? "Start your learning journey by enrolling in a course"
                  : searchQuery
                  ? "Try adjusting your search"
                  : "No courses match this filter"}
              </p>
              <button
                onClick={() => navigate("/courses")}
                className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl transition"
              >
                Browse Courses
              </button>
            </div>
          )}
        </div>
        {showCertificateModal && selectedCertificate && (
          <CertificateViewModal
            certificate={selectedCertificate}
            onClose={() => {
              setShowCertificateModal(false);
              setSelectedCertificate(null);
            }}
            onShare={handleShareCertificate}
          />
        )}
      </div>
    </div>
  );
};
export default DashboardPage;
