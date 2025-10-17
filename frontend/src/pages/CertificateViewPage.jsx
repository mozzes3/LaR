import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock user data
  const user = {
    username: "CryptoNinja",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoNinja",
    totalCourses: 5,
    completedCourses: 2,
    inProgressCourses: 3,
    totalWatchTime: 2847, // minutes
    certificatesEarned: 2,
    currentStreak: 7,
    fdrEarned: 1247,
    level: 12,
    xp: 3420,
    nextLevelXp: 5000,
  };

  // Mock enrolled courses
  const enrolledCourses = [
    {
      id: 1,
      slug: "nft-marketing-masterclass",
      title: "NFT Marketing Masterclass: 0 to 10K Discord Members",
      instructor: "CryptoMaverick",
      instructorAvatar:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoMaverick",
      thumbnail:
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop",
      progress: 65,
      currentLesson: "Setting Up Your Discord Server",
      totalLessons: 47,
      completedLessons: 31,
      lastWatched: "2 hours ago",
      rating: 4.9,
      status: "in-progress",
      timeLeft: "4h 20m",
    },
    {
      id: 2,
      slug: "web3-community-building-strategies",
      title: "Web3 Community Building Strategies",
      instructor: "CryptoMaverick",
      instructorAvatar:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoMaverick",
      thumbnail:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=225&fit=crop",
      progress: 100,
      currentLesson: "Course Completed",
      totalLessons: 38,
      completedLessons: 38,
      lastWatched: "3 days ago",
      rating: 4.7,
      status: "completed",
      certificateUrl: "/certificates/2",
    },
    {
      id: 3,
      slug: "token-economics-and-tokenomics-design",
      title: "Token Economics & Tokenomics Design",
      instructor: "BlockchainBob",
      instructorAvatar:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=BlockchainBob",
      thumbnail:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=225&fit=crop",
      progress: 23,
      currentLesson: "Understanding Token Supply",
      totalLessons: 52,
      completedLessons: 12,
      lastWatched: "1 day ago",
      rating: 4.8,
      status: "in-progress",
      timeLeft: "8h 45m",
    },
    {
      id: 4,
      slug: "smart-contract-security-fundamentals",
      title: "Smart Contract Security Fundamentals",
      instructor: "Web3Wizard",
      instructorAvatar:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Web3Wizard",
      thumbnail:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop",
      progress: 100,
      currentLesson: "Course Completed",
      totalLessons: 41,
      completedLessons: 41,
      lastWatched: "1 week ago",
      rating: 4.9,
      status: "completed",
      certificateUrl: "/certificates/4",
    },
    {
      id: 5,
      slug: "advanced-defi-protocol-development",
      title: "Advanced DeFi Protocol Development",
      instructor: "DeFiDave",
      instructorAvatar:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=DeFiDave",
      thumbnail:
        "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=225&fit=crop",
      progress: 8,
      currentLesson: "DeFi Basics Introduction",
      totalLessons: 67,
      completedLessons: 5,
      lastWatched: "5 days ago",
      rating: 4.6,
      status: "in-progress",
      timeLeft: "15h 30m",
    },
  ];

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
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Completed lesson
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    NFT Marketing Masterclass
                  </p>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Earned 50 $FDR
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Course completion bonus
                  </p>
                  <span className="text-xs text-gray-400">3 days ago</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Level up to 12
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Unlocked new rewards
                  </p>
                  <span className="text-xs text-gray-400">5 days ago</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Certificate earned
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Smart Contract Security
                  </p>
                  <span className="text-xs text-gray-400">1 week ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* My Courses */}
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
                          onClick={() => navigate(course.certificateUrl)}
                          className="py-2 bg-primary-400 text-black rounded-lg font-bold hover:bg-primary-500 transition text-sm flex items-center justify-center space-x-1"
                        >
                          <Award className="w-4 h-4" />
                          <span>Certificate</span>
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
                No courses found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Start learning by enrolling in a course"}
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
      </div>
    </div>
  );
};

export default DashboardPage;
