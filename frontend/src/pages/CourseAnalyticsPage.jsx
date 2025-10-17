import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const CourseAnalyticsPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isAllCourses = !courseId;
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [selectedMetric, setSelectedMetric] = useState("all");

  // Mock course data

  const [course, setCourse] = useState(null);

  useEffect(() => {
    if (courseId) {
      // Load specific course data
      setCourse({
        id: courseId,
        title: "NFT Marketing Masterclass: 0 to 10K Discord Members",
        thumbnail:
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop",
      });
    }
  }, [courseId]);

  // Mock analytics data
  const analytics = {
    overview: {
      totalRevenue: 145413,
      revenueChange: "+23.5%",
      totalStudents: 487,
      studentsChange: "+12.3%",
      completionRate: 78,
      completionChange: "+5.2%",
      averageRating: 4.9,
      ratingChange: "+0.2",
    },
    engagement: {
      averageWatchTime: 85, // percentage
      dropOffRate: 15,
      mostWatchedLesson: "Setting Up Discord Server",
      leastWatchedLesson: "Advanced Community Management",
      averageSessionDuration: 45, // minutes
      returningStudents: 92, // percentage
    },
    revenue: {
      thisMonth: 18500,
      lastMonth: 15200,
      growth: 21.7,
      averagePerStudent: 299,
      refundRate: 2.3,
      totalEarnings: 145413,
    },
    studentProgress: [
      { range: "0-25%", count: 45, percentage: 9.2 },
      { range: "26-50%", count: 78, percentage: 16.0 },
      { range: "51-75%", count: 134, percentage: 27.5 },
      { range: "76-99%", count: 150, percentage: 30.8 },
      { range: "100%", count: 80, percentage: 16.5 },
    ],
    lessonPerformance: [
      {
        lesson: "Introduction to Discord",
        views: 487,
        completion: 95,
        avgRating: 4.8,
      },
      {
        lesson: "Server Setup Basics",
        views: 463,
        completion: 89,
        avgRating: 4.7,
      },
      {
        lesson: "Role Configuration",
        views: 421,
        completion: 82,
        avgRating: 4.6,
      },
      { lesson: "Bot Integration", views: 398, completion: 78, avgRating: 4.5 },
      {
        lesson: "Community Growth",
        views: 376,
        completion: 75,
        avgRating: 4.8,
      },
    ],
    reviews: {
      total: 128,
      fiveStar: 95,
      fourStar: 25,
      threeStar: 6,
      twoStar: 2,
      oneStar: 0,
      averageRating: 4.9,
    },
    trafficSources: [
      { source: "Direct", students: 210, percentage: 43.1 },
      { source: "Search", students: 145, percentage: 29.8 },
      { source: "Social Media", students: 87, percentage: 17.9 },
      { source: "Referral", students: 45, percentage: 9.2 },
    ],
  };

  const statCards = [
    {
      label: "Total Revenue",
      value: `$${analytics.overview.totalRevenue.toLocaleString()}`,
      change: analytics.overview.revenueChange,
      trend: "up",
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Total Students",
      value: analytics.overview.totalStudents,
      change: analytics.overview.studentsChange,
      trend: "up",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Completion Rate",
      value: `${analytics.overview.completionRate}%`,
      change: analytics.overview.completionChange,
      trend: "up",
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Average Rating",
      value: analytics.overview.averageRating,
      change: analytics.overview.ratingChange,
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
            <div className="h-64 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl border-2 border-green-500/20 flex items-center justify-center mb-6">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">Revenue trend chart</p>
              </div>
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
                    {analytics.engagement.averageWatchTime}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${analytics.engagement.averageWatchTime}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Returning Students
                  </span>
                  <span className="font-bold text-green-500">
                    {analytics.engagement.returningStudents}%
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Drop-off Rate
                  </span>
                  <span className="font-bold text-red-500">
                    {analytics.engagement.dropOffRate}%
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
                <div className="text-xs text-gray-500 mb-1">Most Watched</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.engagement.mostWatchedLesson}
                </div>
              </div>
              <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">
                  Needs Improvement
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.engagement.leastWatchedLesson}
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

        {/* Lesson Performance Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Lesson Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Lesson
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Views
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Completion
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {analytics.lessonPerformance.map((lesson, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {lesson.lesson}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {lesson.views}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`font-bold ${
                          lesson.completion >= 80
                            ? "text-green-500"
                            : lesson.completion >= 60
                            ? "text-orange-500"
                            : "text-red-500"
                        }`}
                      >
                        {lesson.completion}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Star className="w-4 h-4 fill-primary-400 text-primary-400" />
                        <span className="font-medium">{lesson.avgRating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Traffic Sources
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.trafficSources.map((source, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center"
              >
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {source.students}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {source.source}
                </div>
                <div className="text-lg font-bold text-primary-400">
                  {source.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseAnalyticsPage;
