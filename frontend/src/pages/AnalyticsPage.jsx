import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "@services/api";
import { useWallet } from "@contexts/WalletContext";
import {
  TrendingUp,
  Target,
  Award,
  Clock,
  BookOpen,
  CheckCircle,
  Zap,
  Trophy,
  Star,
  BarChart3,
  ArrowUp,
  Sparkles,
  Play,
  Brain,
  Flame,
  Crown,
  Code,
  Coins,
  Link,
  Image,
  Rocket,
  MessageSquare,
  MessageCircle,
  ShoppingCart,
  Package,
  Library,
  Globe,
  Compass,
  Calendar,
  Moon,
  Sunrise,
  Shield,
  GraduationCap,
  Eye,
  PlayCircle,
  Activity,
  Stars,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

const iconMap = {
  Play,
  Trophy,
  Flame,
  Zap,
  Crown,
  Award,
  BookOpen,
  Brain,
  Target,
  CheckCircle,
  Clock,
  Sparkles,
  Star,
  Stars,
  Code,
  Coins,
  Link,
  TrendingUp,
  Image,
  Rocket,
  MessageSquare,
  MessageCircle,
  ShoppingCart,
  Package,
  Library,
  Globe,
  Compass,
  Calendar,
  Moon,
  Sunrise,
  Shield,
  GraduationCap,
  Eye,
  PlayCircle,
  Activity,
  User,
};

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useWallet();
  const [timeRange, setTimeRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [achievementFilter, setAchievementFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!currentUser) {
        toast.error("Please log in to view analytics");
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        const response = await userApi.getStudentAnalytics();
        console.log("📊 Student analytics:", response.data);
        setAnalytics(response.data.analytics);
        setLoading(false);
      } catch (error) {
        console.error("Error loading analytics:", error);
        toast.error("Failed to load analytics");
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No analytics available</h2>
          <p className="text-gray-500 mb-4">
            Start taking courses to see your progress!
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  const { stats, weeklyActivity, courseProgress, skills } = analytics;

  // Helper function to format watch time
  const formatWatchTime = (seconds) => {
    if (seconds >= 3600) {
      return `${Math.floor(seconds / 3600)}h ${Math.floor(
        (seconds % 3600) / 60
      )}m`;
    } else if (seconds >= 60) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const maxWeeklyHours = Math.max(...weeklyActivity.map((d) => d.hours), 1);

  // Simple achievements based on real data

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                My Progress
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track your learning journey and achievements
              </p>
            </div>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center space-x-2 mb-8">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeRange === "week"
                ? "bg-primary-400 text-black"
                : "bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-primary-400"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeRange === "month"
                ? "bg-primary-400 text-black"
                : "bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-primary-400"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeRange("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeRange === "all"
                ? "bg-primary-400 text-black"
                : "bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-primary-400"
            }`}
          >
            All Time
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-blue-500" />
              <div className="flex items-center space-x-1 text-green-500 text-sm font-bold">
                <ArrowUp className="w-4 h-4" />
                <span>12%</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {formatWatchTime(stats.totalWatchTime)}
            </div>
            <div className="text-sm text-gray-500">Total Watch Time</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="flex items-center space-x-1 text-green-500 text-sm font-bold">
                <ArrowUp className="w-4 h-4" />
                <span>8%</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.completedCourses}/{stats.totalCourses}
            </div>
            <div className="text-sm text-gray-500">Courses Completed</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8 text-purple-500" />
              <div className="flex items-center space-x-1 text-green-500 text-sm font-bold">
                <ArrowUp className="w-4 h-4" />
                <span>5%</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.averageScore}%
            </div>
            <div className="text-sm text-gray-500">Average Progress</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-8 h-8 text-orange-500" />
              <div className="flex items-center space-x-1 text-green-500 text-sm font-bold">
                <ArrowUp className="w-4 h-4" />
                <span>Keep it up!</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.currentStreak} days
            </div>
            <div className="text-sm text-gray-500">Current Streak</div>
          </div>
        </div>

        {/* Weekly Activity & Level Progress - Keep the same structure but use real weeklyActivity data */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Weekly Activity Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Weekly Activity
              </h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary-400 rounded-full" />
                  <span className="text-gray-500">Hours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-gray-500">Lessons</span>
                </div>
              </div>
            </div>

            {weeklyActivity.length > 0 ? (
              <div className="space-y-4">
                {weeklyActivity.map((day, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400 w-12">
                        {day.day}
                      </span>
                      <div className="flex-1 flex items-center space-x-3">
                        <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg flex items-center justify-end pr-2"
                            style={{
                              width: `${(day.hours / maxWeeklyHours) * 100}%`,
                            }}
                          >
                            {day.hours > 0 && (
                              <span className="text-xs font-bold text-black">
                                {day.hours}h
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {day.lessons} lessons
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No activity this week. Start learning!</p>
              </div>
            )}
          </div>

          {/* Level Progress - Keep same UI but use real stats */}
          <div className="bg-gradient-to-br from-primary-400/10 to-purple-500/10 border-2 border-primary-400/30 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Level Progress
            </h2>

            <div className="text-center mb-6">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-800"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 56 * (1 - stats.totalXP / 5000)
                    }`}
                    className="text-primary-400"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.level}
                    </div>
                    <div className="text-xs text-gray-500">Level</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {stats.totalXP} / 5000 XP
                </p>
                <p className="text-xs text-gray-500">
                  {5000 - stats.totalXP} XP to level {stats.level + 1}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-5 h-5 text-primary-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Total $FDR Earned
                  </span>
                </div>
                <span className="text-lg font-bold text-primary-400">
                  {stats.fdrEarned}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Skills Learned
                  </span>
                </div>
                <span className="text-lg font-bold text-purple-500">
                  {stats.skillsLearned}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Certificates
                  </span>
                </div>
                <span className="text-lg font-bold text-green-500">
                  {stats.certificatesEarned}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Course Progress Breakdown
          </h2>

          {courseProgress.length > 0 ? (
            <div className="space-y-4">
              {courseProgress.map((course) => (
                <div
                  key={course.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/courses/${course.slug}/learn`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        {course.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{course.category}</span>
                        <span>•</span>
                        <span>Last accessed {course.lastAccessed}</span>
                      </div>
                    </div>
                    {course.status === "completed" ? (
                      <div className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg border border-green-500/30">
                        Completed
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-lg border border-blue-500/30">
                        In Progress
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Progress</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {course.progress}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Time Spent</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatWatchTime(course.timeSpent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Lessons</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {course.lessonsCompleted}/{course.totalLessons}
                      </p>
                    </div>
                  </div>

                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No courses enrolled yet</p>
            </div>
          )}
        </div>

        {/* Skills & Achievements */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Skills */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Skills Progress
            </h2>

            {skills.length > 0 ? (
              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {skill.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {skill.courses}{" "}
                          {skill.courses === 1 ? "course" : "courses"}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary-400">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-purple-500 transition-all"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No skills tracked yet</p>
              </div>
            )}
          </div>

          {/* Achievements */}
          {/* Achievements */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Achievements
              </h2>
              <span className="text-sm text-gray-500">
                {analytics.achievements
                  ? `${
                      analytics.achievements.filter((a) => a.unlocked).length
                    }/${analytics.achievements.length}`
                  : "0/0"}
              </span>
            </div>

            {analytics.achievements && analytics.achievements.length > 0 ? (
              <>
                {/* Filter by category */}
                <div className="flex items-center space-x-2 mb-4 overflow-x-auto  pb-2">
                  {[
                    "all",
                    "getting_started",
                    "streaks",
                    "completion",
                    "watch_time",
                    "lessons",
                    "web3",
                    "perfection",
                    "speed",
                    "community",
                    "spending",
                    "certificates",
                    "special",
                  ].map((category) => (
                    <button
                      key={category}
                      onClick={() => setAchievementFilter(category)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                        achievementFilter === category
                          ? "bg-primary-400 text-black"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {category.replace("_", " ").toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Filter by difficulty */}
                <div className="flex items-center space-x-2 mb-6">
                  {[
                    "all",
                    "easy",
                    "medium",
                    "hard",
                    "extreme",
                    "legendary",
                  ].map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() => setDifficultyFilter(difficulty)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        difficultyFilter === difficulty
                          ? "bg-primary-400 text-black"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {difficulty.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.achievements
                    .filter((a) => {
                      if (
                        achievementFilter !== "all" &&
                        a.category !== achievementFilter
                      )
                        return false;
                      if (
                        difficultyFilter !== "all" &&
                        a.difficulty !== difficultyFilter
                      )
                        return false;
                      return true;
                    })
                    .map((achievement) => {
                      const Icon = iconMap[achievement.icon] || Trophy;
                      const difficultyColors = {
                        easy: "border-blue-500/30 from-blue-500/5 to-cyan-500/5",
                        medium:
                          "border-purple-500/30 from-purple-500/5 to-pink-500/5",
                        hard: "border-orange-500/30 from-orange-500/5 to-red-500/5",
                        extreme:
                          "border-red-500/30 from-red-500/5 to-pink-500/5",
                        legendary:
                          "border-primary-400/30 from-primary-400/5 to-purple-500/5",
                      };

                      return (
                        <div
                          key={achievement.id}
                          className={`p-4 rounded-xl border-2 transition cursor-pointer hover:scale-105 ${
                            achievement.unlocked
                              ? `bg-gradient-to-br ${
                                  difficultyColors[achievement.difficulty] ||
                                  difficultyColors.medium
                                }`
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                              achievement.unlocked
                                ? "bg-primary-400"
                                : "bg-gray-300 dark:bg-gray-700"
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                achievement.unlocked
                                  ? "text-black"
                                  : "text-gray-500"
                              }`}
                            />
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                            {achievement.title}
                          </h3>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                            {achievement.description}
                          </p>

                          {achievement.unlocked ? (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 text-xs">
                                {achievement.xpReward > 0 && (
                                  <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">
                                    +{achievement.xpReward} XP
                                  </span>
                                )}
                                {achievement.fdrReward > 0 && (
                                  <span className="bg-primary-400/20 text-primary-400 px-2 py-0.5 rounded font-bold">
                                    +{achievement.fdrReward} $FDR
                                  </span>
                                )}
                              </div>
                              {achievement.unlockedAt && (
                                <p className="text-xs text-primary-400 font-medium">
                                  {new Date(
                                    achievement.unlockedAt
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 uppercase">
                              {achievement.difficulty}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                {analytics.achievements.filter((a) => {
                  if (
                    achievementFilter !== "all" &&
                    a.category !== achievementFilter
                  )
                    return false;
                  if (
                    difficultyFilter !== "all" &&
                    a.difficulty !== difficultyFilter
                  )
                    return false;
                  return true;
                }).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No achievements found in this category</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Complete lessons to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
