import { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  Lock,
} from "lucide-react";
import { adminApi } from "@services/api";
import toast from "react-hot-toast";

const AdminRolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    permissions: [],
  });

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
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllRoles();
      setRoles(response.data.roles);
    } catch (error) {
      console.error("Load roles error:", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      await adminApi.createRole(formData);
      toast.success("Role created successfully");
      setShowCreateModal(false);
      setFormData({
        name: "",
        displayName: "",
        description: "",
        permissions: [],
      });
      loadRoles();
    } catch (error) {
      console.error("Create role error:", error);
      toast.error(error.response?.data?.error || "Failed to create role");
    }
  };

  const handleUpdateRole = async (roleId) => {
    try {
      await adminApi.updateRole(roleId, editingRole);
      toast.success("Role updated successfully");
      setEditingRole(null);
      loadRoles();
    } catch (error) {
      console.error("Update role error:", error);
      toast.error("Failed to update role");
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      await adminApi.deleteRole(roleId);
      toast.success("Role deleted successfully");
      loadRoles();
    } catch (error) {
      console.error("Delete role error:", error);
      toast.error(error.response?.data?.error || "Failed to delete role");
    }
  };

  const togglePermission = (resource, action, isEditing = false) => {
    const data = isEditing ? editingRole : formData;
    const setter = isEditing ? setEditingRole : setFormData;

    const existingPerm = data.permissions.find((p) => p.resource === resource);

    if (existingPerm) {
      if (existingPerm.actions.includes(action)) {
        existingPerm.actions = existingPerm.actions.filter((a) => a !== action);
        if (existingPerm.actions.length === 0) {
          setter({
            ...data,
            permissions: data.permissions.filter(
              (p) => p.resource !== resource
            ),
          });
        } else {
          setter({ ...data });
        }
      } else {
        existingPerm.actions.push(action);
        setter({ ...data });
      }
    } else {
      setter({
        ...data,
        permissions: [...data.permissions, { resource, actions: [action] }],
      });
    }
  };

  const hasPermission = (permissions, resource, action) => {
    const perm = permissions.find((p) => p.resource === resource);
    return perm?.actions.includes(action) || false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Role Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure roles and permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create Role</span>
          </button>
        </div>

        <div className="space-y-4">
          {roles.map((role) => (
            <div
              key={role._id}
              className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6"
            >
              {editingRole && editingRole._id === role._id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={editingRole.displayName}
                        onChange={(e) =>
                          setEditingRole({
                            ...editingRole,
                            displayName: e.target.value,
                          })
                        }
                        className="text-xl font-bold bg-transparent border-2 border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 mb-2 w-full"
                      />
                      <textarea
                        value={editingRole.description}
                        onChange={(e) =>
                          setEditingRole({
                            ...editingRole,
                            description: e.target.value,
                          })
                        }
                        className="text-sm bg-transparent border-2 border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 w-full resize-none"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                      Permissions
                    </h3>
                    <div className="space-y-3">
                      {availableResources.map((resource) => (
                        <div
                          key={resource.name}
                          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                        >
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                            {resource.label}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {resource.actions.map((action) => (
                              <button
                                key={action}
                                onClick={() =>
                                  togglePermission(resource.name, action, true)
                                }
                                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                                  hasPermission(
                                    editingRole.permissions,
                                    resource.name,
                                    action
                                  )
                                    ? "bg-primary-500 text-white"
                                    : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleUpdateRole(role._id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setEditingRole(null)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {role.displayName}
                        </h2>
                        {role.isSystemRole && (
                          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-500">
                            <Lock className="w-3 h-3" />
                            <span>System</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {role.description}
                      </p>
                    </div>
                    {!role.isSystemRole && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingRole(role)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role._id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Permissions:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((perm, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg text-sm font-bold"
                        >
                          {perm.resource}: {perm.actions.join(", ")}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create New Role
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Role Name (Identifier) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="team_member"
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    placeholder="Team Member"
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this role can do..."
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                    Permissions
                  </h3>
                  <div className="space-y-3">
                    {availableResources.map((resource) => (
                      <div
                        key={resource.name}
                        className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                      >
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                          {resource.label}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {resource.actions.map((action) => (
                            <button
                              key={action}
                              onClick={() =>
                                togglePermission(resource.name, action, false)
                              }
                              className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                                hasPermission(
                                  formData.permissions,
                                  resource.name,
                                  action
                                )
                                  ? "bg-primary-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={handleCreateRole}
                    disabled={!formData.name || !formData.displayName}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Create Role</span>
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRolesPage;
