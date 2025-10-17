import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import toast from "react-hot-toast";
import CourseQuestionsModal from "@components/CourseQuestionsModal";
import CoursePreviewModal from "@components/CoursePreviewModal";
import DeleteCourseModal from "@components/DeleteCourseModal";

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [showCourseMenu, setShowCourseMenu] = useState(null);
  const [previewCourse, setPreviewCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [questionsForCourse, setQuestionsForCourse] = useState(null);

  // Mock instructor data
  const instructor = {
    username: "CryptoMaverick",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoMaverick",
    verified: true,
    badge: "KOL",
    badgeColor: "purple",
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    joinedDate: "2024-01-15",
    totalEarnings: 45892.5,
    pendingEarnings: 8420.0,
    availableToWithdraw: 37472.5,
    totalStudents: 1847,
    totalCourses: 8,
    averageRating: 4.8,
    totalReviews: 342,
  };

  // Mock stats
  const stats = [
    {
      label: "Total Earnings",
      value: `$${instructor.totalEarnings.toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      label: "Total Students",
      value: instructor.totalStudents.toLocaleString(),
      change: "+8.3%",
      trend: "up",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Active Courses",
      value: instructor.totalCourses,
      change: "+2",
      trend: "up",
      icon: BookOpen,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      label: "Avg Rating",
      value: instructor.averageRating.toFixed(1),
      change: "+0.2",
      trend: "up",
      icon: Star,
      color: "text-primary-400",
      bgColor: "bg-primary-400/10",
      borderColor: "border-primary-400/20",
    },
  ];

  // Mock courses
  const courses = [
    {
      id: 1,
      title: "NFT Marketing Masterclass: 0 to 10K Discord Members",
      thumbnail:
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop",
      price: 299,
      students: 487,
      revenue: 145413,
      rating: 4.9,
      reviews: 128,
      status: "published",
      lastUpdated: "2024-10-15",
      completionRate: 78,
    },
    {
      id: 2,
      title: "Web3 Community Building Strategies",
      thumbnail:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=225&fit=crop",
      price: 199,
      students: 623,
      revenue: 123977,
      rating: 4.7,
      reviews: 89,
      status: "published",
      lastUpdated: "2024-10-10",
      completionRate: 82,
    },
    {
      id: 3,
      title: "Token Economics & Tokenomics Design",
      thumbnail:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=225&fit=crop",
      price: 349,
      students: 312,
      revenue: 108888,
      rating: 4.8,
      reviews: 67,
      status: "published",
      lastUpdated: "2024-10-08",
      completionRate: 71,
    },
    {
      id: 4,
      title: "Smart Contract Security Fundamentals",
      thumbnail:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop",
      price: 399,
      students: 198,
      revenue: 79002,
      rating: 4.9,
      reviews: 45,
      status: "published",
      lastUpdated: "2024-09-28",
      completionRate: 68,
    },
    {
      id: 5,
      title: "Advanced DeFi Protocol Development",
      thumbnail:
        "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=225&fit=crop",
      price: 449,
      students: 156,
      revenue: 70044,
      rating: 4.6,
      reviews: 34,
      status: "draft",
      lastUpdated: "2024-10-16",
      completionRate: 0,
    },
  ];

  // Mock recent activity
  const recentActivity = [
    {
      id: 1,
      type: "purchase",
      student: "CryptoNinja",
      course: "NFT Marketing Masterclass",
      amount: 299,
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "review",
      student: "BlockchainBob",
      course: "Web3 Community Building",
      rating: 5,
      time: "5 hours ago",
    },
    {
      id: 3,
      type: "completion",
      student: "DeFiDave",
      course: "Token Economics",
      time: "8 hours ago",
    },
    {
      id: 4,
      type: "purchase",
      student: "Web3Wizard",
      course: "Smart Contract Security",
      amount: 399,
      time: "12 hours ago",
    },
    {
      id: 5,
      type: "question",
      student: "SolanaSam",
      course: "NFT Marketing Masterclass",
      time: "1 day ago",
    },
  ];

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
                <div
                  className={`flex items-center space-x-1 text-sm font-bold ${
                    stat.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
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
            {/* Simple earnings chart placeholder */}
            <div className="h-64 bg-gradient-to-br from-primary-400/5 to-purple-500/5 rounded-xl border-2 border-primary-400/20 flex items-center justify-center mb-6">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-primary-400 mx-auto mb-3" />
                <p className="text-gray-500">Earnings chart visualization</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">Total Earnings</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${instructor.totalEarnings.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">In Escrow</div>
                <div className="text-2xl font-bold text-orange-500">
                  ${instructor.pendingEarnings.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">Available</div>
                <div className="text-2xl font-bold text-green-500">
                  ${instructor.availableToWithdraw.toLocaleString()}
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
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
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
              ))}
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
              Withdraw Earnings
            </h3>
            <p className="text-sm text-gray-500">
              ${instructor.availableToWithdraw.toLocaleString()} available
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
              {instructor.totalStudents.toLocaleString()} total students
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
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
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
                            {course.rating} ({course.reviews})
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

                      {course.status === "published" && (
                        <button
                          onClick={() =>
                            navigate(
                              `/instructor/courses/${course.id}/students`
                            )
                          }
                          className="p-2 hover:bg-white dark:hover:bg-gray-900 rounded-lg transition group/students relative"
                        >
                          <Users className="w-4 h-4 text-gray-400 group-hover/students:text-primary-400" />
                          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/students:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                            View Students
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() =>
                          navigate(`/instructor/courses/${course.id}/edit`)
                        }
                        className="p-2 hover:bg-white dark:hover:bg-gray-900 rounded-lg transition group/edit relative"
                      >
                        <Edit className="w-4 h-4 text-gray-400 group-hover/edit:text-primary-400" />
                        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/edit:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                          Edit Course
                        </span>
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/instructor/courses/${course.id}/analytics`)
                        }
                        className="p-2 hover:bg-white dark:hover:bg-gray-900 rounded-lg transition group/analytics relative"
                      >
                        <BarChart3 className="w-4 h-4 text-gray-400 group-hover/analytics:text-primary-400" />
                        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/analytics:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                          View Analytics
                        </span>
                      </button>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowCourseMenu(
                              showCourseMenu === course.id ? null : course.id
                            )
                          }
                          className="p-2 hover:bg-white dark:hover:bg-gray-900 rounded-lg transition"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>

                        {showCourseMenu === course.id && (
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

                            {/* Update Content - stays the same */}
                            <button
                              onClick={() => {
                                navigate(
                                  `/instructor/courses/${course.id}/edit`
                                );
                                setShowCourseMenu(null);
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center space-x-2"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Update Content</span>
                            </button>

                            {/* View Questions button */}
                            <button
                              onClick={() => {
                                setQuestionsForCourse(course);
                                setShowCourseMenu(null);
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center space-x-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>View Questions</span>
                            </button>

                            {/* Delete Course button */}
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
                    <span>Updated {course.lastUpdated}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
          onConfirm={() => {
            toast.success("Course deleted successfully");
            setDeletingCourse(null);
            // In production: make API call to delete course
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
