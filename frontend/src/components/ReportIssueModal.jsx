import { useState } from "react";
import { X, Flag, AlertTriangle, Loader } from "lucide-react";
import toast from "react-hot-toast";

const ReportIssueModal = ({ student, onClose }) => {
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    severity: "low",
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: "inappropriate-behavior", label: "Inappropriate Behavior" },
    { value: "spam", label: "Spam or Harassment" },
    { value: "cheating", label: "Academic Dishonesty" },
    { value: "payment-issue", label: "Payment/Refund Issue" },
    { value: "technical", label: "Technical Problem" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      // API call to submit report
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(
        "Report submitted successfully. Our team will review it shortly."
      );
      onClose();
    } catch (error) {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
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
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full border-2 border-gray-200 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Flag className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Report Issue
                </h2>
                <p className="text-sm text-gray-500">
                  Regarding: {student.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Student Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
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
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
              </div>
            </div>
            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Issue Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Severity */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Severity
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: "low" })}
                  className={`py-3 rounded-xl font-medium transition ${
                    formData.severity === "low"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Low
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, severity: "medium" })
                  }
                  className={`py-3 rounded-xl font-medium transition ${
                    formData.severity === "medium"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: "high" })}
                  className={`py-3 rounded-xl font-medium transition ${
                    formData.severity === "high"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  High
                </button>
              </div>
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                placeholder="Please provide detailed information about the issue..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition resize-none"
              />
            </div>
            {/* Info Notice */}
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  What happens next?
                </p>
                <p>
                  Our support team will review your report within 24-48 hours.
                  We may contact you for additional information if needed.
                </p>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-medium hover:border-gray-300 dark:hover:border-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-5 h-5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ReportIssueModal;
