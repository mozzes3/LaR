import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Shield,
  Ban,
  CheckCircle,
  AlertCircle,
  Crown,
} from "lucide-react";
import { adminApi } from "@services/api";
import toast from "react-hot-toast";

const AdminUserEditPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState([]);
  const [deniedPermissions, setDeniedPermissions] = useState([]);
  const [notes, setNotes] = useState("");
  const [userPermissions, setUserPermissions] = useState([]);

  const availableResources = [
    {
      name: "users",
      label: "Users",
      actions: ["create", "read", "update", "delete"],
    },
    {
      name: "roles",
      label: "Roles",
      actions: ["create", "read", "update", "delete"],
    },
    {
      name: "courses",
      label: "Courses",
      actions: ["create", "read", "update", "delete", "approve", "publish"],
    },
    {
      name: "reviews",
      label: "Reviews",
      actions: ["create", "read", "update", "delete"],
    },
    {
      name: "applications",
      label: "Applications",
      actions: ["read", "approve", "delete"],
    },
    {
      name: "categories",
      label: "Categories",
      actions: ["create", "read", "update", "delete"],
    },
    { name: "payments", label: "Payments", actions: ["read", "update"] },
    { name: "analytics", label: "Analytics", actions: ["read"] },
  ];

  useEffect(() => {
    loadUserDetails();
    loadRoles();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUserDetails(userId);
      setUser(response.data.user);
      setSelectedRole(response.data.user.roleRef?._id || "");
      setUserPermissions(response.data.permissions || []);

      if (response.data.user.customPermissions) {
        setCustomPermissions(
          response.data.user.customPermissions.customPermissions || []
        );
        setDeniedPermissions(
          response.data.user.customPermissions.deniedPermissions || []
        );
        setNotes(response.data.user.customPermissions.notes || "");
      }
    } catch (error) {
      console.error("Load user error:", error);
      toast.error("Failed to load user details");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await adminApi.getAllRoles();
      setRoles(response.data.roles);
    } catch (error) {
      console.error("Load roles error:", error);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      await adminApi.assignRole(userId, { roleId: selectedRole });
      toast.success("Role assigned successfully");
      loadUserDetails();
    } catch (error) {
      console.error("Assign role error:", error);
      toast.error("Failed to assign role");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      setSaving(true);
      await adminApi.updateUserPermissions(userId, {
        customPermissions,
        deniedPermissions,
        notes,
      });
      toast.success("Permissions updated successfully");
      loadUserDetails();
    } catch (error) {
      console.error("Update permissions error:", error);
      toast.error("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const toggleCustomPermission = (resource, action) => {
    const existingPerm = customPermissions.find((p) => p.resource === resource);

    if (existingPerm) {
      if (existingPerm.actions.includes(action)) {
        existingPerm.actions = existingPerm.actions.filter((a) => a !== action);
        if (existingPerm.actions.length === 0) {
          setCustomPermissions(
            customPermissions.filter((p) => p.resource !== resource)
          );
        } else {
          setCustomPermissions([...customPermissions]);
        }
      } else {
        existingPerm.actions.push(action);
        setCustomPermissions([...customPermissions]);
      }
    } else {
      setCustomPermissions([
        ...customPermissions,
        { resource, actions: [action], granted: true },
      ]);
    }
  };

  const toggleDeniedPermission = (resource, action) => {
    const existingPerm = deniedPermissions.find((p) => p.resource === resource);

    if (existingPerm) {
      if (existingPerm.actions.includes(action)) {
        existingPerm.actions = existingPerm.actions.filter((a) => a !== action);
        if (existingPerm.actions.length === 0) {
          setDeniedPermissions(
            deniedPermissions.filter((p) => p.resource !== resource)
          );
        } else {
          setDeniedPermissions([...deniedPermissions]);
        }
      } else {
        existingPerm.actions.push(action);
        setDeniedPermissions([...deniedPermissions]);
      }
    } else {
      setDeniedPermissions([
        ...deniedPermissions,
        { resource, actions: [action] },
      ]);
    }
  };

  const hasCustomPermission = (resource, action) => {
    const perm = customPermissions.find((p) => p.resource === resource);
    return perm?.actions.includes(action) || false;
  };

  const isDeniedPermission = (resource, action) => {
    const perm = deniedPermissions.find((p) => p.resource === resource);
    return perm?.actions.includes(action) || false;
  };

  const hasRolePermission = (resource, action) => {
    return userPermissions.includes(`${resource}:${action}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          to="/admin/users"
          className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users</span>
        </Link>

        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <img
              src={
                user.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
              }
              alt={user.username}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user.username}
                </h1>
                {user.isSuperAdmin && (
                  <Crown className="w-6 h-6 text-yellow-500" />
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {user.email || user.walletAddress}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.isBanned ? (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-bold bg-red-500/10 text-red-500">
                <Ban className="w-4 h-4" />
                <span>Banned</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-bold bg-green-500/10 text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span>Active</span>
              </span>
            )}
            {user.isInstructor && (
              <span className="px-3 py-1 rounded-lg text-sm font-bold bg-purple-500/10 text-purple-500">
                Instructor
              </span>
            )}
            {user.role === "admin" && (
              <span className="px-3 py-1 rounded-lg text-sm font-bold bg-blue-500/10 text-blue-500">
                Admin
              </span>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Role Assignment
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Current Role
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="font-bold text-gray-900 dark:text-white">
                  {user.roleRef?.displayName || user.role || "No role assigned"}
                </p>
                {user.roleRef?.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {user.roleRef.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Assign New Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAssignRole}
              disabled={!selectedRole || saving}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-5 h-5" />
              <span>{saving ? "Saving..." : "Assign Role"}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Current Permissions
            </h2>

            {user.isSuperAdmin ? (
              <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-xl">
                <p className="text-yellow-600 dark:text-yellow-500 font-bold">
                  This user has super admin privileges with full access
                </p>
              </div>
            ) : userPermissions.length > 0 ? (
              <div className="space-y-2">
                {userPermissions.map((perm, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-primary-500/10 text-primary-500 rounded-lg text-sm font-bold"
                  >
                    {perm}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No permissions assigned
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Custom Permission Overrides
          </h2>

          <div className="mb-4 p-4 bg-blue-500/10 border-2 border-blue-500/20 rounded-xl">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Custom permissions override role permissions. Green = Grant, Red =
              Deny
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {availableResources.map((resource) => (
              <div
                key={resource.name}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
              >
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                  {resource.label}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Grant Permissions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {resource.actions.map((action) => (
                        <button
                          key={action}
                          onClick={() =>
                            toggleCustomPermission(resource.name, action)
                          }
                          className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                            hasCustomPermission(resource.name, action)
                              ? "bg-green-500 text-white"
                              : hasRolePermission(resource.name, action)
                              ? "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Deny Permissions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {resource.actions.map((action) => (
                        <button
                          key={action}
                          onClick={() =>
                            toggleDeniedPermission(resource.name, action)
                          }
                          className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                            isDeniedPermission(resource.name, action)
                              ? "bg-red-500 text-white"
                              : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Admin Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about these permission overrides..."
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={handleUpdatePermissions}
            disabled={saving}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? "Saving..." : "Save Permissions"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserEditPage;
