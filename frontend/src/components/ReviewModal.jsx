import { useState, useEffect } from "react";
import { X, Star, Trash2 } from "lucide-react";
import { reviewApi } from "@services/api";
import toast from "react-hot-toast";

const ReviewModal = ({
  isOpen,
  onClose,
  courseId,
  existingReview = null,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Populate form if editing existing review
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title);
      setComment(existingReview.comment);
    } else {
      setRating(5);
      setTitle("");
      setComment("");
    }
  }, [existingReview, isOpen]);

  const handleSubmit = async () => {
    if (!title.trim() || !comment.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (title.length > 100) {
      toast.error("Title must be 100 characters or less");
      return;
    }

    if (comment.length > 1000) {
      toast.error("Review must be 1000 characters or less");
      return;
    }

    try {
      setLoading(true);

      if (existingReview) {
        // Update existing review
        await reviewApi.update(existingReview._id, {
          rating,
          title,
          comment,
        });
        toast.success("Review updated successfully! 🎉");
      } else {
        // Create new review
        await reviewApi.create({
          courseId,
          rating,
          title,
          comment,
          contentQuality: rating,
          instructorQuality: rating,
          valueForMoney: rating,
        });
        toast.success("Review submitted successfully! 🎉");
      }

      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to submit review";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;

    try {
      setLoading(true);
      await reviewApi.delete(existingReview._id);
      toast.success("Review deleted successfully");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {existingReview ? "Edit Your Review" : "Write a Review"}
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-3 text-gray-900 dark:text-white">
              Your Rating *
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  disabled={loading}
                  className="transition hover:scale-110 disabled:cursor-not-allowed"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white">
              Review Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:border-primary-400 transition disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about the course..."
              rows={6}
              maxLength={1000}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white resize-none focus:border-primary-400 transition disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3">
            {existingReview && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="px-4 py-3 border-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center space-x-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Review</span>
              </button>
            )}

            {showDeleteConfirm && (
              <div className="flex-1 flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900 rounded-xl">
                <span className="text-sm text-red-600 dark:text-red-400 flex-1">
                  Delete this review?
                </span>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}

            <div className="flex-1 flex space-x-3 justify-end">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !title.trim() || !comment.trim()}
                className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Submitting..."
                  : existingReview
                  ? "Update Review"
                  : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
