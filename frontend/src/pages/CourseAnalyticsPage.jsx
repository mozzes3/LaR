import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { courseApi } from "@services/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  Clock,
  Award,
  Star,
  Target,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  PlayCircle,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CourseAnalyticsPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isAllCourses = !courseId;
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);

        let response;
        if (isAllCourses) {
          response = await courseApi.getAllCoursesAnalytics();
        } else {
          response = await courseApi.getCourseAnalytics(courseId);
          setCourse(response.data.course);
        }

        setAnalytics(response.data.analytics);
        setLoading(false);
      } catch (error) {
        console.error("Error loading analytics:", error);
        toast.error("Failed to load analytics");
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [courseId, isAllCourses]);

  if (loading || !analytics) {
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

  const statCards = [
    {
      label: "Total Revenue",
      value: `$${analytics.overview.totalRevenue.toLocaleString()}`,
      change: `${analytics.revenue.growth >= 0 ? "+" : ""}${
        analytics.revenue.growth
      }%`,
      trend: analytics.revenue.growth >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Total Students",
      value: analytics.overview.totalStudents,
      change: "Active",
      trend: "up",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Completion Rate",
      value: `${analytics.overview.completionRate}%`,
      change: "Overall",
      trend: "up",
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Average Rating",
      value: analytics.overview.averageRating.toFixed(1),
      change: `${analytics.reviews.total} reviews`,
      trend: "up",
      icon: Star,
      color: "text-primary-400",
      bgColor: "bg-primary-400/10",
    },
  ];
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/instructor")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {isAllCourses ? "All Courses Analytics" : "Course Analytics"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isAllCourses ? "Overview of all your courses" : course?.title}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black text-sm font-medium"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="1year">Last year</option>
              <option value="all">All time</option>
            </select>
            <button className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition font-medium flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between mb-4">
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
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
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

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Revenue Overview
            </h2>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { month: "Jan", revenue: 0 },
                    { month: "Feb", revenue: 0 },
                    {
                      month: "Last Month",
                      revenue: analytics.revenue.lastMonth,
                    },
                    {
                      month: "This Month",
                      revenue: analytics.revenue.thisMonth,
                    },
                  ]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="month"
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
                    formatter={(value) => [`$${value}`, "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: "#10B981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">This Month</div>
                <div className="text-lg font-bold text-green-500">
                  ${analytics.revenue.thisMonth.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Last Month</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  ${analytics.revenue.lastMonth.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Growth</div>
                <div className="text-lg font-bold text-green-500">
                  +{analytics.revenue.growth}%
                </div>
              </div>
            </div>
          </div>

          {/* Student Progress Distribution */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Student Progress Distribution
            </h2>
            <div className="space-y-4">
              {analytics.studentProgress.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {item.range} Complete
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {item.count} students ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>Engagement</span>
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Avg Watch Time
                  </span>
                  <span className="font-bold">
                    {analytics.engagement.averageWatchTime} mins
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Students
                  </span>
                  <span className="font-bold text-green-500">
                    {analytics.overview.totalStudents}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Completion Rate
                  </span>
                  <span className="font-bold text-blue-500">
                    {analytics.overview.completionRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <PlayCircle className="w-5 h-5 text-purple-500" />
              <span>Top Performing</span>
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Total Revenue</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  ${analytics.revenue.totalEarnings.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">
                  Avg Per Student
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  ${analytics.revenue.averagePerStudent.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Star className="w-5 h-5 text-primary-400" />
              <span>Reviews</span>
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count =
                  analytics.reviews[
                    stars === 5
                      ? "fiveStar"
                      : stars === 4
                      ? "fourStar"
                      : stars === 3
                      ? "threeStar"
                      : stars === 2
                      ? "twoStar"
                      : "oneStar"
                  ];
                const percentage = (count / analytics.reviews.total) * 100;
                return (
                  <div key={stars} className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-8">{stars}★</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseAnalyticsPage;
