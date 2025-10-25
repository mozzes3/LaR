import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  Edit,
  Ban,
  Shield,
  CheckCircle,
  XCircle,
  Crown,
} from "lucide-react";
import { adminApi } from "@services/api";
import { useWallet } from "@contexts/WalletContext";
import toast from "react-hot-toast";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user: currentUser } = useWallet();
  const [filters, setFilters] = useState({
    role: "",
    isInstructor: "",
    isBanned: "",
    isActive: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadUsers();
  }, [filters, pagination.page]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      console.log("🔍 Loading users with params:", {
        page: pagination.page,
        limit: pagination.limit,
        search,
        ...filters,
      });

      const cleanFilters = {};
      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== "" &&
          filters[key] !== null &&
          filters[key] !== undefined
        ) {
          cleanFilters[key] = filters[key];
        }
      });

      const response = await adminApi.getAllUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined, // Don't send empty string
        ...cleanFilters, // Only send non-empty filters
      });

      console.log("✅ Users response:", response.data);
      console.log("📊 Users count:", response.data.users?.length);
      console.log("📄 Pagination:", response.data.pagination);

      setUsers(response.data.users || []);
      setPagination(
        response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        }
      );
    } catch (error) {
      console.error("❌ Load users error:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadUsers();
  };

  const handleBanToggle = async (userId, currentStatus) => {
    if (
      !confirm(
        `Are you sure you want to ${currentStatus ? "unban" : "ban"} this user?`
      )
    ) {
      return;
    }

    try {
      await adminApi.toggleUserBan(userId);
      toast.success(
        `User ${currentStatus ? "unbanned" : "banned"} successfully`
      );
      loadUsers();
    } catch (error) {
      console.error("Toggle ban error:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleMakeSuperAdmin = async (userId) => {
    if (!confirm("Are you sure you want to make this user a super admin?")) {
      return;
    }

    try {
      await adminApi.makeSuperAdmin(userId);
      toast.success("User promoted to super admin");
      loadUsers();
    } catch (error) {
      console.error("Make super admin error:", error);
      toast.error("Failed to promote user");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions
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
                placeholder="Search by username, email, or wallet address..."
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={filters.isInstructor}
              onChange={(e) =>
                setFilters({ ...filters, isInstructor: e.target.value })
              }
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
            >
              <option value="">All Users</option>
              <option value="true">Instructors Only</option>
              <option value="false">Students Only</option>
            </select>

            <select
              value={filters.isBanned}
              onChange={(e) =>
                setFilters({ ...filters, isBanned: e.target.value })
              }
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
            >
              <option value="">All Status</option>
              <option value="false">Active</option>
              <option value="true">Banned</option>
            </select>

            <select
              value={filters.isActive}
              onChange={(e) =>
                setFilters({ ...filters, isActive: e.target.value })
              }
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
            >
              <option value="">All Accounts</option>
              <option value="true">Active Accounts</option>
              <option value="false">Inactive Accounts</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading users...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
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
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={
                                user.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                              }
                              alt={user.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-bold text-gray-900 dark:text-white">
                                  {user.username}
                                </p>
                                {user.isSuperAdmin && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {user.email ||
                                  user.walletAddress?.slice(0, 8) + "..."}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-primary-500/10 text-primary-500 w-fit">
                              {user.roleRef?.displayName || user.role}
                            </span>
                            {user.isInstructor && (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-500 w-fit">
                                Instructor
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            {user.isBanned ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 w-fit">
                                <Ban className="w-3 h-3" />
                                <span>Banned</span>
                              </span>
                            ) : user.isActive ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-500 w-fit">
                                <CheckCircle className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold bg-gray-500/10 text-gray-500 w-fit">
                                <XCircle className="w-3 h-3" />
                                <span>Inactive</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/admin/users/${user._id}`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4 text-primary-500" />
                            </Link>
                            {currentUser?.isSuperAdmin && (
                              <>
                                <button
                                  onClick={() =>
                                    handleToggleBan(user._id, user.isBanned)
                                  }
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                                  title={
                                    user.isBanned ? "Unban user" : "Ban user"
                                  }
                                >
                                  <Ban
                                    className={`w-4 h-4 ${
                                      user.isBanned
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }`}
                                  />
                                </button>
                                {!user.isSuperAdmin && (
                                  <button
                                    onClick={() =>
                                      handleMakeSuperAdmin(user._id)
                                    }
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                                    title="Make super admin"
                                  >
                                    <Shield className="w-4 h-4 text-yellow-500" />
                                  </button>
                                )}
                              </>
                            )}
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
                    Showing {users.length} of {pagination.total} users
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

export default AdminUsersPage;
