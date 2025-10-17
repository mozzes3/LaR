import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  TrendingUp,
  Clock,
  CheckCircle,
  Award,
  Star,
  BarChart3,
  Calendar,
  ExternalLink,
  MoreVertical,
  Eye,
  Ban,
  UserCheck,
  ArrowLeft,
  Activity,
  Target,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import StudentDetailModal from "@components/StudentDetailModal";
import { useWallet } from "@contexts/WalletContext";

const StudentsManagementPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Mock course data
  const course = {
    id: 1,
    title: "NFT Marketing Masterclass: 0 to 10K Discord Members",
    totalStudents: 1247,
    activeStudents: 892,
    completedStudents: 355,
    averageProgress: 67,
    averageRating: 4.8,
    totalRevenue: 37410,
  };

  // Mock students data
  const students = [
    {
      id: 1,
      name: "CryptoNinja",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoNinja",
      email: "crypto@example.com",
      enrolledDate: "2024-10-01",
      progress: 85,
      completedLessons: 40,
      totalLessons: 47,
      lastActive: "2 hours ago",
      status: "active",
      watchTime: 847, // minutes
      rating: 5,
      hasReviewed: true,
      hasCertificate: false,
    },
    {
      id: 2,
      name: "Web3Warrior",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Web3Warrior",
      email: "web3@example.com",
      enrolledDate: "2024-09-28",
      progress: 100,
      completedLessons: 47,
      totalLessons: 47,
      lastActive: "1 day ago",
      status: "completed",
      watchTime: 1250,
      rating: 5,
      hasReviewed: true,
      hasCertificate: true,
    },
    {
      id: 3,
      name: "BlockchainBob",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=BlockchainBob",
      email: "bob@example.com",
      enrolledDate: "2024-10-10",
      progress: 45,
      completedLessons: 21,
      totalLessons: 47,
      lastActive: "5 hours ago",
      status: "active",
      watchTime: 523,
      rating: null,
      hasReviewed: false,
      hasCertificate: false,
    },
    {
      id: 4,
      name: "NFTQueen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NFTQueen",
      email: "nft@example.com",
      enrolledDate: "2024-09-15",
      progress: 23,
      completedLessons: 11,
      totalLessons: 47,
      lastActive: "2 weeks ago",
      status: "inactive",
      watchTime: 287,
      rating: null,
      hasReviewed: false,
      hasCertificate: false,
    },
    {
      id: 5,
      name: "DeFiDave",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DeFiDave",
      email: "defi@example.com",
      enrolledDate: "2024-09-20",
      progress: 100,
      completedLessons: 47,
      totalLessons: 47,
      lastActive: "3 days ago",
      status: "completed",
      watchTime: 1180,
      rating: 4,
      hasReviewed: true,
      hasCertificate: true,
    },
    {
      id: 6,
      name: "MetaMike",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MetaMike",
      email: "meta@example.com",
      enrolledDate: "2024-10-12",
      progress: 65,
      completedLessons: 31,
      totalLessons: 47,
      lastActive: "1 hour ago",
      status: "active",
      watchTime: 698,
      rating: null,
      hasReviewed: false,
      hasCertificate: false,
    },
  ];

  const stats = [
    {
      label: "Total Students",
      value: course.totalStudents,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      trend: "+12%",
    },
    {
      label: "Active Students",
      value: course.activeStudents,
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      trend: "+8%",
    },
    {
      label: "Completed",
      value: course.completedStudents,
      icon: CheckCircle,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      trend: "+15%",
    },
    {
      label: "Avg Progress",
      value: `${course.averageProgress}%`,
      icon: Target,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      trend: "+5%",
    },
  ];

  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "active" && student.status === "active") ||
        (selectedFilter === "completed" && student.status === "completed") ||
        (selectedFilter === "inactive" && student.status === "inactive");

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.enrolledDate) - new Date(a.enrolledDate);
      } else if (sortBy === "progress") {
        return b.progress - a.progress;
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "completed":
        return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      case "inactive":
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
    }
  };

  const handleExportStudents = () => {
    // Export functionality
    toast.success("Exporting student data...");
  };

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
                Students
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {course.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleExportStudents}
            className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition font-medium flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex items-center space-x-1 text-green-500 text-sm font-bold">
                  <TrendingUp className="w-4 h-4" />
                  <span>{stat.trend}</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1 lg:flex-initial">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
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
                  onClick={() => setSelectedFilter("active")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedFilter === "active"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  Active
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
                <button
                  onClick={() => setSelectedFilter("inactive")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedFilter === "inactive"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <label className="text-sm text-gray-500">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="progress">Progress</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Watch Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {student.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.progress}%
                          </span>
                          <span className="text-xs text-gray-500">
                            {student.completedLessons}/{student.totalLessons}
                          </span>
                        </div>
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(
                          student.status
                        )}`}
                      >
                        {student.status.charAt(0).toUpperCase() +
                          student.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>
                          {Math.floor(student.watchTime / 60)}h{" "}
                          {student.watchTime % 60}m
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {student.lastActive}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.hasReviewed ? (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-primary-400 text-primary-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.rating}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition group relative"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary-400" />
                          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                            View Details
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedStudent && (
              <StudentDetailModal
                student={selectedStudent}
                onClose={() => setSelectedStudent(null)}
              />
            )}
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No students found
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Students will appear here when they enroll"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsManagementPage;
