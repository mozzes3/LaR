import { useState, useEffect } from "react";
import {
  FileText,
  Filter,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react";
import { adminApi } from "@services/api";
import toast from "react-hot-toast";

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    admin: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadLogs();
  }, [filters, pagination.page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.action) params.action = filters.action;
      if (filters.admin) params.admin = filters.admin;

      const response = await adminApi.getAuditLogs(params);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Load audit logs error:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ action: "", admin: "" });
    setPagination({ ...pagination, page: 1 });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "manual_escrow_release":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "manual_escrow_refund":
        return <XCircle className="w-4 h-4 text-blue-500" />;
      case "grant_free_course_access":
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      case "remove_course_access":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "manual_escrow_release":
        return "bg-green-500/10 text-green-500";
      case "manual_escrow_refund":
        return "bg-blue-500/10 text-blue-500";
      case "grant_free_course_access":
        return "bg-purple-500/10 text-purple-500";
      case "remove_course_access":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const formatActionName = (action) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Audit Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track all admin actions and security events
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Filters
            </h2>
            {(filters.action || filters.admin) && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => {
                  setFilters({ ...filters, action: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900 dark:text-white"
              >
                <option value="">All Actions</option>
                <option value="manual_escrow_release">
                  Manual Escrow Release
                </option>
                <option value="manual_escrow_refund">
                  Manual Escrow Refund
                </option>
                <option value="grant_free_course_access">
                  Grant Free Course Access
                </option>
                <option value="remove_course_access">
                  Remove Course Access
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Logs
              </label>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {pagination.total} total logs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Releases
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {logs.filter((l) => l.action === "manual_escrow_release").length}
            </p>
          </div>

          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Refunds
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {logs.filter((l) => l.action === "manual_escrow_refund").length}
            </p>
          </div>

          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Access Granted
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {
                logs.filter((l) => l.action === "grant_free_course_access")
                  .length
              }
            </p>
          </div>

          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Access Removed
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {logs.filter((l) => l.action === "remove_course_access").length}
            </p>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading audit logs...
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        Admin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-200 dark:divide-gray-800">
                    {logs.map((log) => (
                      <tr
                        key={log._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-500/10 text-primary-500 rounded-lg flex items-center justify-center">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {log.admin?.displayName || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {log.admin?.username || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-bold ${getActionColor(
                                log.action
                              )}`}
                            >
                              {formatActionName(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-md">
                            {log.details?.reason && (
                              <p className="text-sm text-gray-900 dark:text-white mb-1">
                                <span className="font-medium">Reason:</span>{" "}
                                {log.details.reason}
                              </p>
                            )}
                            {log.details?.userName && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                User: {log.details.userName}
                              </p>
                            )}
                            {log.details?.courseTitle && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Course: {log.details.courseTitle}
                              </p>
                            )}
                            {log.details?.transactionHash && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                Tx: {log.details.transactionHash.slice(0, 10)}
                                ...
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {log.ipAddress || "N/A"}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="border-t-2 border-gray-200 dark:border-gray-800 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Page {pagination.page} of {pagination.pages} (
                      {pagination.total} total logs)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setPagination({
                            ...pagination,
                            page: pagination.page - 1,
                          })
                        }
                        disabled={pagination.page === 1}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setPagination({
                            ...pagination,
                            page: pagination.page + 1,
                          })
                        }
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
