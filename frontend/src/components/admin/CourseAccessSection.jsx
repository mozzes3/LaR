import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { adminApi } from "@services/api";

import toast from "react-hot-toast";

const CourseAccessSection = ({ userId }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, [userId]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUserPurchases(userId);
      setPurchases(response.data.purchases);
    } catch (error) {
      console.error("Load purchases error:", error);
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccess = (purchase) => {
    setSelectedPurchase(purchase);
    setShowRemoveModal(true);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Course Access Management
        </h2>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Course Access Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage user's course purchases and access
            </p>
          </div>
          <button
            onClick={() => setShowGrantModal(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Grant Access
          </button>
        </div>

        {purchases.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No course purchases found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div
                key={purchase._id}
                className="border-2 border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {purchase.course?.title || "Unknown Course"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>${purchase.amountInUSD || "0.00"}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          purchase.status === "active"
                            ? "bg-green-500/10 text-green-500"
                            : purchase.status === "completed"
                            ? "bg-blue-500/10 text-blue-500"
                            : purchase.status === "refunded"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : purchase.status === "revoked"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {purchase.status}
                      </span>
                      <span>
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {(purchase.status === "active" ||
                    purchase.status === "completed") && (
                    <button
                      onClick={() => handleRemoveAccess(purchase)}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && (
        <GrantAccessModal
          userId={userId}
          onClose={() => setShowGrantModal(false)}
          onSuccess={() => {
            loadPurchases();
            setShowGrantModal(false);
          }}
        />
      )}

      {/* Remove Access Modal */}
      {showRemoveModal && selectedPurchase && (
        <RemoveAccessModal
          purchase={selectedPurchase}
          onClose={() => {
            setShowRemoveModal(false);
            setSelectedPurchase(null);
          }}
          onSuccess={() => {
            loadPurchases();
            setShowRemoveModal(false);
            setSelectedPurchase(null);
          }}
        />
      )}
    </>
  );
};

// Grant Access Modal Component
const GrantAccessModal = ({ userId, onClose, onSuccess }) => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter((course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchQuery, courses]);

  const loadCourses = async () => {
    try {
      setSearchLoading(true);
      const response = await adminApi.getCourses({ status: "published" });
      setCourses(response.data.courses);
      setFilteredCourses(response.data.courses);
    } catch (error) {
      console.error("Load courses error:", error);
      toast.error("Failed to load courses");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    try {
      setLoading(true);
      await adminApi.grantFreeCourseAccess(userId, selectedCourse, { reason });
      toast.success("Course access granted successfully");
      onSuccess();
    } catch (error) {
      console.error("Grant access error:", error);
      toast.error(error.response?.data?.error || "Failed to grant access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Grant Free Course Access
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Courses
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course name..."
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Course *
            </label>
            {searchLoading ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Choose a course</option>
                  {filteredCourses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {searchQuery && filteredCourses.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No courses found</p>
                )}
                {filteredCourses.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Showing {filteredCourses.length} of {courses.length} courses
                  </p>
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you granting free access?"
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900 dark:text-white resize-none"
              required
            />
          </div>

          <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Warning:</strong> This action will be logged and
                audited. Make sure you have proper authorization.
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? "Granting..." : "Grant Access"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Remove Access Modal Component
const RemoveAccessModal = ({ purchase, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    try {
      setLoading(true);
      await adminApi.removeCourseAccess(purchase.user, purchase.course._id, {
        reason,
      });
      toast.success("Course access removed successfully");
      onSuccess();
    } catch (error) {
      console.error("Remove access error:", error);
      toast.error(error.response?.data?.error || "Failed to remove access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Remove Course Access
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              {purchase.course?.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Purchased: {new Date(purchase.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Removal *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you removing access?"
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900 dark:text-white resize-none"
              required
            />
          </div>

          <div className="bg-red-500/10 border-2 border-red-500/20 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-400">
                <strong>Warning:</strong> User will immediately lose access to
                this course. This action will be logged and audited.
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? "Removing..." : "Remove Access"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseAccessSection;
