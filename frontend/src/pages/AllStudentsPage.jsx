import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "@services/api";
import { useWallet } from "@contexts/WalletContext";
import {
  Users,
  Search,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  ArrowLeft,
  Activity,
  Target,
  Eye,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import StudentDetailModal from "@components/StudentDetailModal";

const AllStudentsPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [aggregateStats, setAggregateStats] = useState(null);

  useEffect(() => {
    const loadStudents = async () => {
      if (!currentUser || !currentUser.isInstructor) {
        toast.error("You must be an instructor to access this page");
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        const response = await userApi.getAllStudents();
        console.log("📚 All students data:", response.data);

        setStudents(response.data.students);
        setAggregateStats(response.data.stats);
        setLoading(false);
      } catch (error) {
        console.error("Error loading students:", error);
        toast.error("Failed to load students");
        setLoading(false);
      }
    };

    loadStudents();
  }, [currentUser, navigate]);

  const stats = aggregateStats
    ? [
        {
          label: "Total Students",
          value: aggregateStats.totalStudents,
          icon: Users,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          trend: "+12%",
        },
        {
          label: "Active Students",
          value: aggregateStats.activeStudents,
          icon: Activity,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          trend: "+8%",
        },
        {
          label: "Completed Courses",
          value: aggregateStats.completedStudents,
          icon: CheckCircle,
          color: "text-purple-500",
          bgColor: "bg-purple-500/10",
          trend: "+15%",
        },
        {
          label: "Avg Progress",
          value: `${aggregateStats.averageProgress}%`,
          icon: Target,
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
          trend: "+5%",
        },
      ]
    : [];

  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "active" && student.status === "active") ||
        (selectedFilter === "inactive" && student.status === "inactive");
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.lastActive) - new Date(a.lastActive);
      } else if (sortBy === "progress") {
        return b.totalProgress - a.totalProgress;
      } else if (sortBy === "courses") {
        return b.enrolledCourses - a.enrolledCourses;
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "inactive":
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
    }
  };

  const handleExportStudents = () => {
    // Create CSV
    const headers = [
      "Name",
      "Email",
      "Courses",
      "Progress",
      "Status",
      "Watch Time",
      "Last Active",
    ];
    const csvData = filteredStudents.map((s) => [
      s.name,
      s.email,
      s.enrolledCourses,
      `${s.totalProgress}%`,
      s.status,
      `${Math.floor(s.totalWatchTime / 60)}h ${s.totalWatchTime % 60}m`,
      s.lastActive,
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast.success("Student data exported!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading students...
          </p>
        </div>
      </div>
    );
  }

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
                All Students
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and manage students across all your courses
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
              className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition"
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

        {/* Rest of the component remains the same... */}
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
                <option value="courses">Enrolled Courses</option>
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
                    Enrolled Courses
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Avg Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total Watch Time
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
                            {student.displayName || student.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {student.enrolledCourses} courses
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {student.courseTitles.slice(0, 2).map((title, i) => (
                            <div key={i}>• {title}</div>
                          ))}
                          {student.courseTitles.length > 2 && (
                            <div className="text-primary-400">
                              +{student.courseTitles.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.totalProgress}%
                          </span>
                        </div>
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
                            style={{ width: `${student.totalProgress}%` }}
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
                          {student.totalWatchTime >= 3600
                            ? `${Math.floor(
                                student.totalWatchTime / 3600
                              )}h ${Math.floor(
                                (student.totalWatchTime % 3600) / 60
                              )}m`
                            : student.totalWatchTime >= 60
                            ? `${Math.floor(student.totalWatchTime / 60)}m ${
                                student.totalWatchTime % 60
                              }s`
                            : `${student.totalWatchTime}s`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {student.lastActive}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.averageRating ? (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-primary-400 text-primary-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.averageRating}
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
                  : "Students will appear here when they enroll in your courses"}
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          courses={
            students.find((s) => s.id === selectedStudent.id)?.courseTitles ||
            []
          }
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default AllStudentsPage;
