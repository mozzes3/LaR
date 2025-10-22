import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userApi, courseApi } from "@services/api";
import { useWallet } from "@contexts/WalletContext";
import {
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Star,
  Clock,
  Award,
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wallet,
  CreditCard,
  BarChart3,
  PieChart,
  TrendingDown,
  Sparkles,
  Target,
  Zap,
  MessageSquare,
  FileText,
  Settings,
  Bell,
  Activity,
} from "lucide-react";
// ADD THIS LINE:
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import CourseQuestionsModal from "@components/CourseQuestionsModal";
import CoursePreviewModal from "@components/CoursePreviewModal";
import DeleteCourseModal from "@components/DeleteCourseModal";

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useWallet();
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [showCourseMenu, setShowCourseMenu] = useState(null);
  const [previewCourse, setPreviewCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [questionsForCourse, setQuestionsForCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState([]);
  const [instructorStats, setInstructorStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser || !currentUser.isInstructor) {
        toast.error("You must be an instructor to access this page");
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        const response = await userApi.getInstructorDashboardComplete(
          selectedPeriod
        );

        setInstructorStats(response.data.stats);
        setCourses(response.data.courses);
        setRecentActivity(response.data.activities);
        setEarningsData(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        toast.error("Failed to load dashboard data");
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser, navigate, selectedPeriod]);

  useEffect(() => {
    if (instructorStats) {
      loadEarningsData(selectedPeriod);
    }
  }, [selectedPeriod]);

  const loadEarningsData = async (period) => {
    try {
      const response = await userApi.getInstructorEarningsHistory(period);
      setEarningsData(response.data.data);
    } catch (error) {
      console.error("Error loading earnings data:", error);
      setEarningsData([]);
    }
  };

  const stats = instructorStats
    ? [
        {
          label: "Total Earnings",
          value: `$${instructorStats.totalEarnings.toLocaleString()}`,
          change:
            instructorStats.totalCourses > 0
              ? `${instructorStats.totalCourses} courses`
              : "No courses",
          trend: "up",
          icon: DollarSign,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
        },
        {
          label: "Total Students",
          value: instructorStats.totalStudents.toLocaleString(),
          change:
            instructorStats.publishedCourses > 0
              ? `${instructorStats.publishedCourses} published`
              : "No published",
          trend: "up",
          icon: Users,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
        },
        {
          label: "Active Courses",
          value: instructorStats.publishedCourses,
          change: `${instructorStats.totalCourses} total`,
          trend: "up",
          icon: BookOpen,
          color: "text-purple-500",
          bgColor: "bg-purple-500/10",
          borderColor: "border-purple-500/20",
        },
        {
          label: "Avg Rating",
          value: instructorStats.averageRating.toFixed(1),
          change: `${instructorStats.totalReviews} reviews`,
          trend: "up",
          icon: Star,
          color: "text-primary-400",
          bgColor: "bg-primary-400/10",
          borderColor: "border-primary-400/20",
        },
      ]
    : [];

  const getActivityIcon = (type) => {
    switch (type) {
      case "purchase":
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case "review":
        return <Star className="w-4 h-4 text-primary-400" />;
      case "completion":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "question":
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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

  if (!instructorStats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Failed to load dashboard</h2>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Instructor Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your courses, track earnings, and engage with students
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition font-medium flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
            <button
              onClick={() => navigate("/instructor/create-course")}
              className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl hover:shadow-primary-400/50 transition flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Course</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-gray-900 rounded-2xl border-2 ${stat.borderColor} p-6 hover:shadow-lg transition`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-xs text-gray-500">{stat.change}</div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Earnings Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Earnings Overview
              </h2>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-sm font-medium"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="1year">Last year</option>
              </select>
            </div>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value) => [`$${value}`, "Earnings"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: "#8B5CF6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">Total Earnings</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${instructorStats.totalEarnings.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">In Escrow</div>
                <div className="text-2xl font-bold text-orange-500">
                  ${instructorStats.pendingEarnings.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">Withdrawn</div>
                <div className="text-2xl font-bold text-green-500">
                  ${instructorStats.availableToWithdraw.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                  >
                    <div className="w-8 h-8 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.student}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {activity.course}
                      </p>
                      {activity.amount && (
                        <p className="text-xs font-bold text-green-500 mt-1">
                          +${activity.amount}
                        </p>
                      )}
                      {activity.rating && (
                        <div className="flex items-center space-x-1 mt-1">
                          {[...Array(activity.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 fill-primary-400 text-primary-400"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {activity.time}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate("/instructor/earnings")}
            className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 rounded-2xl hover:shadow-lg transition text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition">
                <Wallet className="w-6 h-6 text-green-500" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Earning Details
            </h3>
            <p className="text-sm text-gray-500">
              View detailed earnings breakdown
            </p>
          </button>
          <button
            onClick={() => navigate("/instructor/students")}
            className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 rounded-2xl hover:shadow-lg transition text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              View Students
            </h3>
            <p className="text-sm text-gray-500">
              {instructorStats.totalStudents.toLocaleString()} total students
            </p>
          </button>
          <button
            onClick={() => navigate("/instructor/analytics")}
            className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20 rounded-2xl hover:shadow-lg transition text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition">
                <BarChart3 className="w-6 h-6 text-purple-500" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-purple-500 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              View Analytics
            </h3>
            <p className="text-sm text-gray-500">
              Detailed performance insights
            </p>
          </button>
        </div>

        {/* My Courses */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Courses
            </h2>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-sm w-64"
                />
              </div>
              <button className="p-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-400 transition">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition group"
                >
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-32 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {course.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{course.students} students</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>${course.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-primary-400 text-primary-400" />
                            <span>
                              {course.averageRating?.toFixed(1) || "0.0"} (
                              {course.reviews})
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>{course.completionRate}% completion</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            course.status === "published"
                              ? "bg-green-500/10 text-green-500 border border-green-500/30"
                              : "bg-orange-500/10 text-orange-500 border border-orange-500/30"
                          }`}
                        >
                          {course.status}
                        </span>

                        <button
                          onClick={() => navigate(`/courses/${course.slug}`)}
                          className="p-2 hover:bg-white dark:hover:bg-gray-900 rounded-lg transition group/view relative"
                        >
                          <Eye className="w-4 h-4 text-gray-400 group-hover/view:text-primary-400" />
                          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/view:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                            View Course
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            navigate(`/instructor/edit-course/${course.slug}`);
                          }}
                          className="p-2 hover:bg-white dark:hover:bg-gray-900 rounded-lg transition group/edit relative"
                        >
                          <Edit className="w-4 h-4 text-gray-400 group-hover/edit:text-primary-400" />
                          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/edit:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                            Edit Course
                          </span>
                        </button>

                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowCourseMenu(
                                showCourseMenu === course._id
                                  ? null
                                  : course._id
                              )
                            }
                            className="p-2 hover:bg-white dark:hover:bg-gray-900 rounded-lg transition"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>

                          {showCourseMenu === course._id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-10">
                              <button
                                onClick={() => {
                                  setPreviewCourse(course);
                                  setShowCourseMenu(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center space-x-2 rounded-t-xl"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Preview</span>
                              </button>

                              <button
                                onClick={() => {
                                  navigate(
                                    `/instructor/courses/${course.slug}/analytics`
                                  ); // Use slug, not _id
                                  setShowCourseMenu(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center space-x-2"
                              >
                                <BarChart3 className="w-4 h-4" />
                                <span>View Analytics</span>
                              </button>

                              <button
                                onClick={() => {
                                  setDeletingCourse(course);
                                  setShowCourseMenu(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition flex items-center space-x-2 rounded-b-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Course</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Updated {formatDate(course.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No courses yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first course to start teaching
              </p>
              <button
                onClick={() => navigate("/instructor/create-course")}
                className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
              >
                Create Course
              </button>
            </div>
          )}
        </div>
      </div>

      {previewCourse && (
        <CoursePreviewModal
          course={previewCourse}
          onClose={() => setPreviewCourse(null)}
        />
      )}

      {deletingCourse && (
        <DeleteCourseModal
          course={deletingCourse}
          onConfirm={async () => {
            try {
              toast.loading("Deleting course and all files...");

              await courseApi.delete(deletingCourse.slug);

              toast.dismiss();
              toast.success("Course deleted successfully!");

              // Remove from list
              setCourses(courses.filter((c) => c._id !== deletingCourse._id));
              setDeletingCourse(null);
            } catch (error) {
              console.error("Delete error:", error);
              toast.dismiss();
              toast.error(
                error.response?.data?.error || "Failed to delete course"
              );
            }
          }}
          onClose={() => setDeletingCourse(null)}
        />
      )}

      {questionsForCourse && (
        <CourseQuestionsModal
          course={questionsForCourse}
          onClose={() => setQuestionsForCourse(null)}
        />
      )}
    </div>
  );
};

export default InstructorDashboard;
