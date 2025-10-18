import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Search,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { adminApi } from "@services/api";
import toast from "react-hot-toast";

const AdminCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    category: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadCourses();
  }, [filters, pagination.page]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllCoursesAdmin({
        page: pagination.page,
        limit: pagination.limit,
        search,
        ...filters,
      });
      setCourses(response.data.courses);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Load courses error:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadCourses();
  };

  const handleStatusUpdate = async (courseId, newStatus) => {
    if (
      !confirm(
        `Are you sure you want to change the course status to ${newStatus}?`
      )
    ) {
      return;
    }

    try {
      await adminApi.updateCourseStatus(courseId, { status: newStatus });
      toast.success(`Course status updated to ${newStatus}`);
      loadCourses();
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Failed to update course status");
    }
  };

  const handleDelete = async (courseId) => {
    if (
      !confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteCourse(courseId);
      toast.success("Course deleted successfully");
      loadCourses();
    } catch (error) {
      console.error("Delete course error:", error);
      toast.error(error.response?.data?.error || "Failed to delete course");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-500";
      case "draft":
        return "bg-gray-500/10 text-gray-500";
      case "review":
        return "bg-yellow-500/10 text-yellow-500";
      case "rejected":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Course Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage all courses
          </p>
        </div>

        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses by title..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="review">Under Review</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
            >
              <option value="">All Categories</option>
              <option value="Web3 Development">Web3 Development</option>
              <option value="DeFi">DeFi</option>
              <option value="NFTs & Digital Art">NFTs & Digital Art</option>
              <option value="Blockchain Fundamentals">
                Blockchain Fundamentals
              </option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading courses...
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No courses found
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Course
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Instructor
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Students
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {courses.map((course) => (
                      <tr
                        key={course._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {course.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {course.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {course.instructor?.username || "Unknown"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(
                              course.status
                            )}`}
                          >
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900 dark:text-white">
                            {course.enrollmentCount || 0}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/courses/${course.slug}`}
                              target="_blank"
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                              title="View course"
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </Link>
                            <Link
                              to={`/instructor/edit-course/${course.slug}`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                              title="Edit course"
                            >
                              <Edit className="w-4 h-4 text-purple-500" />
                            </Link>
                            {course.status !== "published" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(course._id, "published")
                                }
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                                title="Publish course"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </button>
                            )}
                            {course.status !== "rejected" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(course._id, "rejected")
                                }
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                                title="Reject course"
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(course._id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                              title="Delete course"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t-2 border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {courses.length} of {pagination.total} courses
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          page: pagination.page - 1,
                        })
                      }
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          page: pagination.page + 1,
                        })
                      }
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCoursesPage;
