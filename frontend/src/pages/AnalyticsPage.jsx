import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Target,
  Award,
  Clock,
  Calendar,
  BookOpen,
  CheckCircle,
  Zap,
  Trophy,
  Star,
  BarChart3,
  Activity,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Users,
  Play,
  Brain,
  Flame,
  Plus, // Added missing import
  Search,
  Filter,
} from "lucide-react";

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("all"); // all, month, week

  // Mock analytics data
  const stats = {
    totalCourses: 5,
    completedCourses: 2,
    inProgressCourses: 3,
    totalWatchTime: 2847, // minutes
    averageScore: 93.5,
    certificatesEarned: 2,
    currentStreak: 7,
    longestStreak: 14,
    totalXP: 3420,
    level: 12,
    fdrEarned: 1247,
    skillsLearned: 15,
    lessonsCompleted: 127,
    totalLessons: 203,
  };

  // Weekly activity
  const weeklyActivity = [
    { day: "Mon", hours: 2.5, lessons: 5 },
    { day: "Tue", hours: 1.8, lessons: 3 },
    { day: "Wed", hours: 3.2, lessons: 7 },
    { day: "Thu", hours: 2.0, lessons: 4 },
    { day: "Fri", hours: 4.5, lessons: 9 },
    { day: "Sat", hours: 1.2, lessons: 2 },
    { day: "Sun", hours: 2.8, lessons: 6 },
  ];

  // Course breakdown
  const courseProgress = [
    {
      id: 1,
      slug: "nft-marketing-masterclass",
      title: "NFT Marketing Masterclass",
      progress: 65,
      timeSpent: 780, // minutes
      lessonsCompleted: 31,
      totalLessons: 47,
      lastAccessed: "2 hours ago",
      category: "Marketing",
      status: "in-progress",
    },
    {
      id: 2,
      slug: "web3-community-building",
      title: "Web3 Community Building",
      progress: 100,
      timeSpent: 630,
      lessonsCompleted: 38,
      totalLessons: 38,
      lastAccessed: "3 days ago",
      category: "Community",
      status: "completed",
    },
    {
      id: 3,
      slug: "token-economics-design",
      title: "Token Economics Design",
      progress: 23,
      timeSpent: 425,
      lessonsCompleted: 12,
      totalLessons: 52,
      lastAccessed: "1 day ago",
      category: "Blockchain",
      status: "in-progress",
    },
    {
      id: 4,
      slug: "smart-contract-security",
      title: "Smart Contract Security",
      progress: 100,
      timeSpent: 574,
      lessonsCompleted: 41,
      totalLessons: 41,
      lastAccessed: "1 week ago",
      category: "Development",
      status: "completed",
    },
    {
      id: 5,
      slug: "defi-protocol-development",
      title: "DeFi Protocol Development",
      progress: 8,
      timeSpent: 438,
      lessonsCompleted: 5,
      totalLessons: 67,
      lastAccessed: "5 days ago",
      category: "Development",
      status: "in-progress",
    },
  ];

  // Skills mastered
  const skills = [
    { name: "NFT Marketing", level: 85, courses: 2 },
    { name: "Community Building", level: 92, courses: 2 },
    { name: "Smart Contracts", level: 78, courses: 2 },
    { name: "Token Economics", level: 45, courses: 1 },
    { name: "DeFi", level: 25, courses: 1 },
    { name: "Discord Management", level: 88, courses: 1 },
  ];

  // Achievements
  const achievements = [
    {
      id: 1,
      title: "First Steps",
      description: "Complete your first lesson",
      icon: Play,
      unlocked: true,
      unlockedDate: "Sep 1, 2024",
    },
    {
      id: 2,
      title: "Week Warrior",
      description: "Maintain a 7-day learning streak",
      icon: Flame,
      unlocked: true,
      unlockedDate: "Oct 10, 2024",
    },
    {
      id: 3,
      title: "Course Conqueror",
      description: "Complete your first course",
      icon: Trophy,
      unlocked: true,
      unlockedDate: "Sep 28, 2024",
    },
    {
      id: 4,
      title: "Knowledge Seeker",
      description: "Watch 50 hours of content",
      icon: Brain,
      unlocked: true,
      unlockedDate: "Oct 15, 2024",
    },
    {
      id: 5,
      title: "Perfect Score",
      description: "Score 100% on a quiz",
      icon: Star,
      unlocked: false,
    },
    {
      id: 6,
      title: "Marathon Runner",
      description: "Maintain a 30-day streak",
      icon: Zap,
      unlocked: false,
    },
  ];

  const maxWeeklyHours = Math.max(...weeklyActivity.map((d) => d.hours));

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
              {Math.floor(stats.totalWatchTime / 60)}h{" "}
              {stats.totalWatchTime % 60}m
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
            <div className="text-sm text-gray-500">Average Score</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-8 h-8 text-orange-500" />
              <div className="flex items-center space-x-1 text-green-500 text-sm font-bold">
                <ArrowUp className="w-4 h-4" />
                <span>2 days</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.currentStreak} days
            </div>
            <div className="text-sm text-gray-500">Current Streak</div>
          </div>
        </div>

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
          </div>

          {/* Level Progress */}
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
                      {Math.floor(course.timeSpent / 60)}h{" "}
                      {course.timeSpent % 60}m
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
        </div>

        {/* Skills & Achievements */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Skills */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Skills Progress
            </h2>

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
          </div>

          {/* Achievements */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Achievements
              </h2>
              <span className="text-sm text-gray-500">
                {achievements.filter((a) => a.unlocked).length}/
                {achievements.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border-2 transition ${
                    achievement.unlocked
                      ? "bg-gradient-to-br from-primary-400/10 to-purple-500/10 border-primary-400/30"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      achievement.unlocked
                        ? "bg-primary-400"
                        : "bg-gray-300 dark:bg-gray-700"
                    }`}
                  >
                    <achievement.icon
                      className={`w-6 h-6 ${
                        achievement.unlocked ? "text-black" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {achievement.description}
                  </p>
                  {achievement.unlocked && (
                    <p className="text-xs text-primary-400 font-medium">
                      Unlocked {achievement.unlockedDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
