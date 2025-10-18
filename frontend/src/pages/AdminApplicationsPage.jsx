import { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Eye,
  Clock,
  ExternalLink,
  User,
  Mail,
  Briefcase,
  BookOpen,
  Link as LinkIcon,
  MessageSquare,
  Globe,
  Twitter,
  Linkedin,
} from "lucide-react";
import { adminApi } from "@services/api";
import toast from "react-hot-toast";

const AdminApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadApplications();
  }, [filter, pagination.page]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllApplications({
        page: pagination.page,
        limit: pagination.limit,
        status: filter,
      });
      setApplications(response.data.applications);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Load applications error:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const notes = prompt("Add admin notes (optional):");
    try {
      await adminApi.approveApplication(id, { adminNotes: notes });
      toast.success("Application approved! User is now an instructor.");
      loadApplications();
      if (showModal) setShowModal(false);
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve application");
    }
  };

  const handleInReview = async (id) => {
    const reason = prompt("Add note for review:");
    if (!reason) return;
    try {
      await adminApi.pauseApplication(id, { reason });
      toast.success("Application marked as under review");
      loadApplications();
    } catch (error) {
      console.error("In review error:", error);
      toast.error("Failed to update application");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    const notes = prompt("Admin notes (optional):");
    try {
      await adminApi.rejectApplication(id, {
        rejectionReason: reason,
        adminNotes: notes,
      });
      toast.success("Application rejected");
      loadApplications();
      if (showModal) setShowModal(false);
    } catch (error) {
      console.error("Reject error:", error);
      toast.error("Failed to reject application");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this application permanently?")) return;
    try {
      await adminApi.deleteApplication(id);
      toast.success("Application deleted");
      loadApplications();
      if (showModal) setShowModal(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete application");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "under-review":
        return "bg-blue-500/10 text-blue-500";
      case "approved":
        return "bg-green-500/10 text-green-500";
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
            Instructor Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage instructor applications
          </p>
        </div>

        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="under-review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading applications...
              </p>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No applications found
              </p>
            </div>
          ) : (
            <>
              {applications.map((app) => (
                <div
                  key={app._id}
                  className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={
                            app.user?.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user?.username}`
                          }
                          alt={app.user?.username}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {app.fullName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            @{app.user?.username} • {app.email}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                            Expertise
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {app.expertise?.map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-primary-500/10 text-primary-500 rounded-lg text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                            Experience
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {app.yearsOfExperience} years
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                          Bio
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {app.bio?.slice(0, 200)}...
                        </p>
                      </div>

                      <div className="text-xs text-gray-500">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                        title="View full details"
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>

                      <button
                        onClick={() => handleApprove(app._id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </button>

                      <button
                        onClick={() => handleInReview(app._id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                        title="Mark as in review"
                      >
                        <AlertCircle className="w-4 h-4 text-blue-500" />
                      </button>

                      <button
                        onClick={() => handleReject(app._id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                      </button>

                      <button
                        onClick={() => handleDelete(app._id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {applications.length} of {pagination.total}{" "}
                    applications
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

        {/* Full Details Modal */}
        {showModal && selectedApp && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-black border-b-2 border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Application Details
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Submitted{" "}
                    {new Date(selectedApp.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary-500" />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Full Name
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedApp.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Display Name
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedApp.user?.displayName ||
                          selectedApp.user?.username}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Email
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedApp.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Username
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        @{selectedApp.user?.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-primary-500" />
                    Professional Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Professional Tagline/Bio
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedApp.bio}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Years of Experience
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedApp.yearsOfExperience} years
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Teaching/Professional Experience
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedApp.hasTeachingExperience ? "Yes" : "No"}
                      </p>
                      {selectedApp.teachingExperienceDetails && (
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                          {selectedApp.teachingExperienceDetails}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Areas of Expertise
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedApp.expertise?.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why Teach */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-primary-500" />
                    Why do you want to teach on Founder Academy?
                  </h3>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedApp.motivation}
                  </p>
                </div>

                {/* Portfolio & Links */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <LinkIcon className="w-5 h-5 mr-2 text-primary-500" />
                    Portfolio/Work Samples & Social Links
                  </h3>

                  <div className="space-y-3">
                    {selectedApp.portfolio && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Portfolio Link
                        </p>
                        <a
                          href={
                            selectedApp.portfolio.startsWith("http")
                              ? selectedApp.portfolio
                              : `https://${selectedApp.portfolio}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition group"
                          title={selectedApp.portfolio}
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="break-all group-hover:underline">
                            {selectedApp.portfolio}
                          </span>
                        </a>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      {selectedApp.twitter && (
                        <div>
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                            <Twitter className="w-4 h-4 mr-1 text-blue-400" />
                            Twitter
                          </p>
                          <a
                            href={
                              selectedApp.twitter.startsWith("http")
                                ? selectedApp.twitter
                                : `https://twitter.com/${selectedApp.twitter.replace(
                                    "@",
                                    ""
                                  )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition group"
                            title={selectedApp.twitter}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="group-hover:underline">
                              {selectedApp.twitter}
                            </span>
                          </a>
                        </div>
                      )}

                      {selectedApp.linkedin && (
                        <div>
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                            <Linkedin className="w-4 h-4 mr-1 text-blue-600" />
                            LinkedIn
                          </p>
                          <a
                            href={
                              selectedApp.linkedin.startsWith("http")
                                ? selectedApp.linkedin
                                : `https://${selectedApp.linkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition group"
                            title={selectedApp.linkedin}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="group-hover:underline">
                              View Profile
                            </span>
                          </a>
                        </div>
                      )}

                      {selectedApp.website && (
                        <div>
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                            <Globe className="w-4 h-4 mr-1 text-green-500" />
                            Website
                          </p>
                          <a
                            href={
                              selectedApp.website.startsWith("http")
                                ? selectedApp.website
                                : `https://${selectedApp.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition group"
                            title={selectedApp.website}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="group-hover:underline">
                              Visit Website
                            </span>
                          </a>
                        </div>
                      )}

                      {selectedApp.discord && (
                        <div>
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                            <svg
                              className="w-4 h-4 mr-1 text-indigo-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            Discord
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                              {selectedApp.discord}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course Ideas */}
                {selectedApp.proposedCourses?.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-primary-500" />
                      Course Ideas
                    </h3>
                    <div className="space-y-4">
                      {selectedApp.proposedCourses.map((course, i) => (
                        <div
                          key={i}
                          className="p-4 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg"
                        >
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                            {course.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {course.description}
                          </p>
                          {course.category && (
                            <span className="inline-block px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-medium">
                              {course.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {(selectedApp.adminNotes ||
                  selectedApp.rejectionReason ||
                  selectedApp.followUpMessage) && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Admin Notes
                    </h3>
                    {selectedApp.adminNotes && (
                      <div className="mb-3">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          Notes:
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {selectedApp.adminNotes}
                        </p>
                      </div>
                    )}
                    {selectedApp.rejectionReason && (
                      <div className="mb-3">
                        <p className="text-sm font-bold text-red-600">
                          Rejection Reason:
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {selectedApp.rejectionReason}
                        </p>
                      </div>
                    )}
                    {selectedApp.followUpMessage && (
                      <div>
                        <p className="text-sm font-bold text-blue-600">
                          Follow-up Message:
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {selectedApp.followUpMessage}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white dark:bg-black border-t-2 border-gray-200 dark:border-gray-800 p-6 flex items-center justify-end space-x-3">
                <button
                  onClick={() => handleDelete(selectedApp._id)}
                  className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500/20 transition flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>

                <button
                  onClick={() => handleReject(selectedApp._id)}
                  className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl font-bold hover:bg-orange-500/20 transition flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>

                <button
                  onClick={() => handleInReview(selectedApp._id)}
                  className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl font-bold hover:bg-blue-500/20 transition flex items-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>In Review</span>
                </button>

                <button
                  onClick={() => handleApprove(selectedApp._id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApplicationsPage;
