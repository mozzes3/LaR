// frontend/src/pages/AdminProfessionalCertificationsPage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { adminProfessionalCertificationApi } from "@services/api";
import toast from "react-hot-toast";

const AdminProfessionalCertificationsPage = () => {
  const navigate = useNavigate();

  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadCertifications();
  }, [filters, pagination.page]);

  const loadCertifications = async () => {
    try {
      setLoading(true);
      const response =
        await adminProfessionalCertificationApi.getAllCertifications({
          page: pagination.page,
          limit: pagination.limit,
          ...filters,
        });
      setCertifications(response.data.certifications);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Load certifications error:", error);
      toast.error("Failed to load certifications");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure? This will delete the certification and all questions."
      )
    )
      return;

    try {
      await adminProfessionalCertificationApi.deleteCertification(id);
      toast.success("Certification deleted successfully");
      loadCertifications();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error.response?.data?.error || "Failed to delete certification"
      );
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminProfessionalCertificationApi.updateStatus(id, { status });
      toast.success(`Certification ${status} successfully`);
      loadCertifications();
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-500";
      case "draft":
        return "bg-gray-500/10 text-gray-500";
      case "archived":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "beginner":
        return "bg-green-500/10 text-green-500";
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-500";
      case "advanced":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Professional Certifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage certification tests and questions
            </p>
          </div>
          <button
            onClick={() =>
              navigate("/admin/professional-certifications/create")
            }
            className="flex items-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create Certification</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search certifications..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
            >
              <option value="">All Categories</option>
              <option value="Blockchain Fundamentals">
                Blockchain Fundamentals
              </option>
              <option value="Web3 Development">Web3 Development</option>
              <option value="DeFi">DeFi</option>
              <option value="NFTs & Digital Art">NFTs & Digital Art</option>
              <option value="Smart Contracts">Smart Contracts</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading certifications...
              </p>
            </div>
          ) : certifications.length === 0 ? (
            <div className="p-12 text-center">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No certifications found
              </p>
              <button
                onClick={() =>
                  navigate("/admin/professional-certifications/create")
                }
                className="mt-4 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
              >
                Create First Certification
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Certification
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Level
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Questions
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Stats
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {certifications.map((cert) => (
                      <tr
                        key={cert._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={cert.thumbnail}
                              alt={cert.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {cert.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {cert.duration} min • $
                                {cert.certificatePrice?.usd || 5}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {cert.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${getLevelColor(
                              cert.level
                            )}`}
                          >
                            {cert.level}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-center">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {cert.totalQuestions}
                            </p>
                            <p className="text-xs text-gray-500">questions</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Attempts:</span>{" "}
                              {cert.totalAttempts || 0}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Passed:</span>{" "}
                              {cert.totalPassed || 0}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={cert.status}
                            onChange={(e) =>
                              handleUpdateStatus(cert._id, e.target.value)
                            }
                            className={`px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(
                              cert.status
                            )} border-0 cursor-pointer`}
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/admin/professional-certifications/${cert._id}`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                              title="View details"
                            >
                              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </Link>
                            <Link
                              to={`/admin/professional-certifications/${cert._id}/edit`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Link>
                            <button
                              onClick={() => handleDelete(cert._id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                              title="Delete"
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

              {/* Pagination */}
              <div className="px-6 py-4 border-t-2 border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {certifications.length} of {pagination.total}{" "}
                    certifications
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

export default AdminProfessionalCertificationsPage;
