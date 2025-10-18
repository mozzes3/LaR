import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Search,
  Eye,
  Flag,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import { adminApi } from "@services/api";
import toast from "react-hot-toast";

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    courseId: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadReviews();
  }, [filters, pagination.page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllReviewsAdmin({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      setReviews(response.data.reviews);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Load reviews error:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reviewId, newStatus) => {
    let flagReason = "";
    if (newStatus === "flagged") {
      flagReason = prompt("Enter reason for flagging this review:");
      if (!flagReason) return;
    }

    try {
      await adminApi.updateReviewStatus(reviewId, {
        status: newStatus,
        flagReason,
      });
      toast.success(`Review status updated to ${newStatus}`);
      loadReviews();
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Failed to update review status");
    }
  };

  const handleDelete = async (reviewId) => {
    if (
      !confirm(
        "Are you sure you want to delete this review? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteReview(reviewId);
      toast.success("Review deleted successfully");
      loadReviews();
    } catch (error) {
      console.error("Delete review error:", error);
      toast.error("Failed to delete review");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "flagged":
        return "bg-red-500/10 text-red-500";
      case "removed":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-500 text-yellow-500"
                : "text-gray-300 dark:text-gray-700"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Review Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Moderate and manage course reviews
          </p>
        </div>

        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="removed">Removed</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading reviews...
              </p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No reviews found
              </p>
            </div>
          ) : (
            <>
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={
                            review.user?.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user?.username}`
                          }
                          alt={review.user?.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {review.user?.username}
                          </p>
                          <div className="flex items-center space-x-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/courses/${review.course?.slug}`}
                        className="text-sm text-primary-500 hover:underline mb-2 block"
                      >
                        {review.course?.title}
                      </Link>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                        {review.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {review.comment}
                      </p>
                      {review.status === "flagged" && review.flagReason && (
                        <div className="p-3 bg-red-500/10 border-2 border-red-500/20 rounded-lg mb-3">
                          <p className="text-sm text-red-600 dark:text-red-400">
                            <strong>Flag Reason:</strong> {review.flagReason}
                          </p>
                        </div>
                      )}
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(
                          review.status
                        )}`}
                      >
                        {review.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {review.status !== "published" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(review._id, "published")
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                          title="Publish review"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </button>
                      )}
                      {review.status !== "flagged" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(review._id, "flagged")
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                          title="Flag review"
                        >
                          <Flag className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                      {review.status !== "removed" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(review._id, "removed")
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                          title="Remove review"
                        >
                          <XCircle className="w-4 h-4 text-orange-500" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {review.helpfulCount > 0 && (
                    <div className="text-sm text-gray-500">
                      {review.helpfulCount} people found this helpful
                    </div>
                  )}
                </div>
              ))}

              <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {reviews.length} of {pagination.total} reviews
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

export default AdminReviewsPage;
