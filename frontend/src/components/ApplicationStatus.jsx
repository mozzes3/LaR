// Create this as: frontend/src/components/ApplicationStatus.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle, AlertCircle, Mail } from "lucide-react";
import { instructorApi } from "@services/api";
import toast from "react-hot-toast";

const ApplicationStatus = () => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const response = await instructorApi.getMyApplication();
      setApplication(response.data.application);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error fetching application:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading application status...</p>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      title: "Application Under Review",
      description:
        "Your application is being reviewed by our team. We'll notify you within 3-5 business days.",
    },
    "under-review": {
      icon: AlertCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      title: "Under Review",
      description:
        "Our team is currently reviewing your application in detail.",
    },
    approved: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      title: "Application Approved! 🎉",
      description: "Congratulations! You can now create and publish courses.",
    },
    rejected: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      title: "Application Not Approved",
      description:
        application.rejectionReason ||
        "Unfortunately, your application was not approved at this time.",
    },
  };

  const status = statusConfig[application.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div
      className={`${status.bgColor} border-2 ${status.borderColor} rounded-2xl p-6 mb-6`}
    >
      <div className="flex items-start space-x-4">
        <div
          className={`w-12 h-12 ${status.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}
        >
          <StatusIcon className={`w-6 h-6 ${status.color}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {status.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {status.description}
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>
              Applied: {new Date(application.createdAt).toLocaleDateString()}
            </span>
            {application.reviewedAt && (
              <span>
                • Reviewed:{" "}
                {new Date(application.reviewedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {application.status === "approved" && (
            <button
              onClick={() => navigate("/instructor/create-course")}
              className="mt-4 px-6 py-2 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
            >
              Create Your First Course
            </button>
          )}

          {application.status === "rejected" && (
            <p className="mt-4 text-sm text-gray-500">
              You may reapply after addressing the feedback. Contact support if
              you have questions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;
