import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { adminApi } from "@services/api";
import toast from "react-hot-toast";

const AdminPurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadPurchases();
  }, [filters, pagination.page]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllPurchases({
        page: pagination.page,
        limit: pagination.limit,
        search,
        ...filters,
      });
      setPurchases(response.data.purchases);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Load purchases error:", error);
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadPurchases();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "refunded":
        return "bg-red-500/10 text-red-500";
      case "expired":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Purchase Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all course purchases
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
                placeholder="Search by user or course..."
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
              <option value="active">Active</option>
              <option value="refunded">Refunded</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading purchases...
              </p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No purchases found
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Course
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Progress
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {purchases.map((purchase) => (
                      <tr
                        key={purchase._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={
                                purchase.user?.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${purchase.user?.username}`
                              }
                              alt={purchase.user?.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {purchase.user?.username}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {purchase.user?.email ||
                                  purchase.user?.walletAddress?.slice(0, 8) +
                                    "..."}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={purchase.course?.thumbnail}
                              alt={purchase.course?.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {purchase.course?.title}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 dark:text-white">
                            ${purchase.amount}
                          </p>
                          <p className="text-xs text-gray-500">
                            {purchase.paymentMethod?.toUpperCase()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(
                              purchase.status
                            )}`}
                          >
                            {purchase.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate(purchase.createdAt)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{ width: `${purchase.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {purchase.progress || 0}%
                            </span>
                          </div>
                          {purchase.isCompleted && (
                            <p className="text-xs text-green-500 mt-1">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Completed
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/courses/${purchase.course?.slug}`}
                              target="_blank"
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                              title="View course"
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </Link>
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
                    Showing {purchases.length} of {pagination.total} purchases
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

export default AdminPurchasesPage;
