import { useState } from "react";
import { X, AlertTriangle, Trash2, Loader } from "lucide-react";
import toast from "react-hot-toast";

const DeleteCourseModal = ({ course, onConfirm, onClose }) => {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== "delete") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call
      onConfirm();
    } catch (error) {
      toast.error("Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border-2 border-red-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Delete Course
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Warning */}
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deleting this course will permanently remove:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside mt-2 space-y-1">
                <li>All course content and lessons</li>
                <li>Student enrollment data</li>
                <li>Course analytics and reviews</li>
                <li>All associated media files</li>
              </ul>
            </div>
            {/* Course Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-start space-x-3">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-20 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {course.students || 0} students enrolled
                  </p>
                </div>
              </div>
            </div>
            {/* Confirmation Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Type <span className="text-red-500">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-red-500 transition"
              />
            </div>
            {/* Student Warning */}
            {course.students > 0 && (
              <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong className="text-orange-500">Note:</strong>{" "}
                  {course.students} students are currently enrolled in this
                  course. They will lose access immediately.
                </p>
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onClose}
              disabled={deleting}
              className="px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-medium hover:border-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || confirmText.toLowerCase() !== "delete"}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 flex items-center space-x-2"
            >
              {deleting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Forever</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteCourseModal;
