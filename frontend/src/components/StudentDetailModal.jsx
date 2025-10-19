import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Star,
  TrendingUp,
  Target,
  CheckCircle,
  Activity,
  BarChart3,
  ExternalLink,
  Ban,
  Flag,
  MessageSquare,
} from "lucide-react";
import { userApi } from "@services/api";
import toast from "react-hot-toast";
import ReportIssueModal from "@components/ReportIssueModal";

const StudentDetailModal = ({ student, onClose, courses = [] }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showReportModal, setShowReportModal] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentDetails = async () => {
      if (!student) return;

      try {
        setLoading(true);
        const response = await userApi.getStudentDetails(student.id);
        const details = response.data.studentDetails;

        setStudentDetails({
          ...details,
          name: details.name,
          displayName: details.displayName,
          email: details.email,
          avatar: details.avatar,
          walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3",
          totalProgress: details.averageProgress,
          averageScore: details.averageProgress,
          status: details.status,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error loading student details:", error);
        toast.error("Failed to load student details");
        onClose();
      }
    };

    loadStudentDetails();
  }, [student, onClose]);

  if (!student) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen px-4 py-8 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading student details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!studentDetails) return null;

  const getActivityIcon = (type) => {
    switch (type) {
      case "lesson":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "purchase":
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case "completion":
        return <Award className="w-4 h-4 text-purple-500" />;
      case "review":
        return <Star className="w-4 h-4 text-primary-400" />;
      case "certificate":
        return <Award className="w-4 h-4 text-primary-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-screen px-4 py-8">
          {/* Modal */}
          <div
            className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-4xl mx-auto border-2 border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-4">
                <img
                  src={studentDetails.avatar}
                  alt={studentDetails.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {studentDetails.displayName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {studentDetails.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        studentDetails.status === "active"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      {studentDetails.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-gray-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {studentDetails.coursesEnrolled}
                </div>
                <div className="text-xs text-gray-500">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">
                  {studentDetails.totalProgress}%
                </div>
                <div className="text-xs text-gray-500">Avg Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {(() => {
                    const hours = Math.floor(
                      studentDetails.totalWatchTime / 60
                    );
                    const minutes = studentDetails.totalWatchTime % 60;
                    if (hours > 0) {
                      return `${hours}h ${minutes}m`;
                    }
                    return `${minutes}m`;
                  })()}
                </div>
                <div className="text-xs text-gray-500">Watch Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {studentDetails.averageScore}%
                </div>
                <div className="text-xs text-gray-500">Avg Score</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800">
              <div className="flex px-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-3 font-medium border-b-2 transition ${
                    activeTab === "overview"
                      ? "border-primary-400 text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("courses")}
                  className={`px-4 py-3 font-medium border-b-2 transition ${
                    activeTab === "courses"
                      ? "border-primary-400 text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Courses
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`px-4 py-3 font-medium border-b-2 transition ${
                    activeTab === "activity"
                      ? "border-primary-400 text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Activity
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[500px] overflow-y-auto">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                        Student Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <User className="w-4 h-4" />
                          <span>{studentDetails.displayName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span>{studentDetails.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {studentDetails.joinedDate}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 font-mono text-xs">
                          <ExternalLink className="w-4 h-4" />
                          <span>{studentDetails.walletAddress}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                        Learning Stats
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Courses Enrolled
                          </span>
                          <span className="font-bold">
                            {studentDetails.coursesEnrolled}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Courses Completed
                          </span>
                          <span className="font-bold">
                            {studentDetails.coursesCompleted}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Total Spent
                          </span>
                          <span className="font-bold">
                            ${studentDetails.totalSpent}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Login Streak
                          </span>
                          <span className="font-bold">
                            {studentDetails.loginStreak} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Performance Overview */}
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                      Performance Overview
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <div className="text-2xl font-bold text-blue-500 mb-1">
                          {studentDetails.totalProgress}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Average Progress
                        </div>
                      </div>
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <div className="text-2xl font-bold text-green-500 mb-1">
                          {studentDetails.averageScore}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Average Score
                        </div>
                      </div>
                      <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                        <div className="text-2xl font-bold text-purple-500 mb-1">
                          N/A
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg Rating Given
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Courses Tab */}
              {activeTab === "courses" && (
                <div className="space-y-4">
                  {studentDetails.courseProgress &&
                  studentDetails.courseProgress.length > 0 ? (
                    studentDetails.courseProgress.map((course) => (
                      <div
                        key={course.id}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                              {course.title}
                            </h4>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>
                                {course.completedLessons}/{course.totalLessons}{" "}
                                lessons
                              </span>
                              <span>•</span>
                              <span>
                                {Math.floor(course.timeSpent / 60)}h{" "}
                                {course.timeSpent % 60}m
                              </span>
                              <span>•</span>
                              <span>Last: {course.lastAccessed}</span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              course.status === "completed"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-blue-500/10 text-blue-500"
                            }`}
                          >
                            {course.status === "completed"
                              ? "Completed"
                              : "In Progress"}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">
                              Progress
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {course.progress}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                        {course.status === "completed" && (
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-2 text-sm">
                              <Award className="w-4 h-4 text-green-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                Completed {course.completedDate}
                              </span>
                            </div>
                            {course.certificateIssued && (
                              <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded font-medium">
                                Certificate Issued
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No course enrollment data available
                    </div>
                  )}
                </div>
              )}
              {/* Activity Tab */}
              {activeTab === "activity" && (
                <div className="space-y-3">
                  {studentDetails.recentActivity &&
                  studentDetails.recentActivity.length > 0 ? (
                    studentDetails.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                      >
                        <div className="w-8 h-8 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.text}
                          </p>
                          <span className="text-xs text-gray-500">
                            {activity.time}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No recent activity
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-orange-400 transition text-sm font-medium flex items-center space-x-2"
              >
                <Flag className="w-4 h-4" />
                <span>Report Issue</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showReportModal && (
        <ReportIssueModal
          student={student}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
};

export default StudentDetailModal;
