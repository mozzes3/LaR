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
  Award,
  Zap,
  Sparkles,
  Trophy,
  X,
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

  const [editMode, setEditMode] = useState(false);
  const [userDetails, setUserDetails] = useState({
    username: "",
    displayName: "",
    email: "",
    bio: "",
    isInstructor: false,
    instructorBio: "",

    expertise: [],
    badges: ["Instructor"],
    socialLinks: {
      twitter: "",
      linkedin: "",
      website: "",
    },
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

  const availableBadges = [
    { value: "Instructor", label: "Instructor", color: "gray" },
    { value: "Creator", label: "Creator", color: "pink" },
    { value: "KOL", label: "KOL", color: "purple" },
    { value: "Professional", label: "Professional", color: "blue" },
    { value: "Expert", label: "Expert", color: "green" },
  ];

  const toggleBadge = (badge) => {
    setUserDetails((prev) => {
      const currentBadges = prev.badges || [];

      // Special handling for Instructor badge
      if (badge === "Instructor") {
        if (
          currentBadges.includes("Instructor") &&
          currentBadges.length === 1
        ) {
          return prev; // Don't allow removing if it's the only badge
        }
        if (currentBadges.includes("Instructor")) {
          return {
            ...prev,
            badges: currentBadges.filter((b) => b !== "Instructor"),
          };
        } else {
          return { ...prev, badges: ["Instructor", ...currentBadges] };
        }
      }

      // For other badges
      if (currentBadges.includes(badge)) {
        const newBadges = currentBadges.filter((b) => b !== badge);
        return {
          ...prev,
          badges: newBadges.length === 0 ? ["Instructor"] : newBadges,
        };
      } else {
        const withoutInstructor = currentBadges.filter(
          (b) => b !== "Instructor"
        );
        const hasInstructor = currentBadges.includes("Instructor");
        return {
          ...prev,
          badges: hasInstructor
            ? ["Instructor", ...withoutInstructor, badge]
            : [...currentBadges, badge],
        };
      }
    });
  };

  const getBadgeColor = (color) => {
    const colors = {
      yellow: "bg-primary-400/10 text-primary-400 border-primary-400/30",
      pink: "bg-pink-500/10 text-pink-400 border-pink-500/30",
      purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      green: "bg-green-500/10 text-green-400 border-green-500/30",
    };
    return colors[color] || colors.yellow;
  };

  useEffect(() => {
    loadUserDetails();
    loadRoles();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUserDetails(userId);
      const userData = response.data.user;

      setUser(userData);
      setSelectedRole(userData.roleRef?._id || "");
      setUserPermissions(response.data.permissions || []);

      // Populate edit form
      setUserDetails({
        username: userData.username || "",
        displayName: userData.displayName || "",
        email: userData.email || "",
        bio: userData.bio || "",
        isInstructor: userData.isInstructor || false,
        instructorBio: userData.instructorBio || "",
        expertise: userData.expertise || [],
        badges:
          userData.badges && userData.badges.length > 0
            ? userData.badges
            : ["Instructor"],
        socialLinks: {
          twitter: userData.socialLinks?.twitter || "",
          linkedin: userData.socialLinks?.linkedin || "",
          website: userData.socialLinks?.website || "",
        },
      });

      if (userData.customPermissions) {
        setCustomPermissions(
          userData.customPermissions.customPermissions || []
        );
        setDeniedPermissions(
          userData.customPermissions.deniedPermissions || []
        );
        setNotes(userData.customPermissions.notes || "");
      }
    } catch (error) {
      console.error("Load user error:", error);
      toast.error("Failed to load user details");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateUserDetails = async () => {
    try {
      setSaving(true);
      await adminApi.updateUserDetails(userId, userDetails);
      toast.success("User details updated successfully");
      loadUserDetails();
      setEditMode(false);
    } catch (error) {
      console.error("Update user details error:", error);
      toast.error(
        error.response?.data?.error || "Failed to update user details"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleInstructor = async () => {
    try {
      setSaving(true);
      const newStatus = !userDetails.isInstructor;
      await adminApi.toggleInstructorStatus(userId, {
        isInstructor: newStatus,
      });
      toast.success(
        `User ${newStatus ? "granted" : "removed"} instructor status`
      );
      loadUserDetails();
    } catch (error) {
      console.error("Toggle instructor error:", error);
      toast.error("Failed to update instructor status");
    } finally {
      setSaving(false);
    }
  };

  const addExpertise = () => {
    setUserDetails({
      ...userDetails,
      expertise: [...userDetails.expertise, ""],
    });
  };

  const updateExpertise = (index, value) => {
    const updated = [...userDetails.expertise];
    updated[index] = value;
    setUserDetails({ ...userDetails, expertise: updated });
  };

  const removeExpertise = (index) => {
    setUserDetails({
      ...userDetails,
      expertise: userDetails.expertise.filter((_, i) => i !== index),
    });
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

        {/* User Profile Section */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              User Profile
            </h2>
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {editMode ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {!editMode ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {user?.username}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Display Name
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {user?.displayName || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {user?.email || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Wallet Address
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-xs">
                    {user?.walletAddress}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Bio
                </label>
                <p className="text-gray-900 dark:text-white">
                  {user?.bio || "No bio"}
                </p>
              </div>

              {/* Instructor Status Toggle */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Instructor Status
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {userDetails.isInstructor
                        ? "This user is an instructor"
                        : "This user is not an instructor"}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleInstructor}
                    disabled={saving}
                    className={`px-6 py-3 rounded-xl font-bold transition disabled:opacity-50 ${
                      userDetails.isInstructor
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {saving
                      ? "Updating..."
                      : userDetails.isInstructor
                      ? "Remove Instructor"
                      : "Make Instructor"}
                  </button>
                </div>
              </div>

              {userDetails.isInstructor && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Instructor Details
                  </h3>
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Instructor Bio
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {user?.instructorBio || "Not set"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Expertise
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user?.expertise?.length > 0 ? (
                        user.expertise.map((exp, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg text-sm font-bold"
                          >
                            {exp}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No expertise set</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Social Links
                    </label>
                    <div className="space-y-2 mt-2">
                      {user?.socialLinks?.twitter && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Twitter: {user.socialLinks.twitter}
                        </p>
                      )}
                      {user?.socialLinks?.linkedin && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          LinkedIn: {user.socialLinks.linkedin}
                        </p>
                      )}
                      {user?.socialLinks?.website && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Website: {user.socialLinks.website}
                        </p>
                      )}
                      {!user?.socialLinks?.twitter &&
                        !user?.socialLinks?.linkedin &&
                        !user?.socialLinks?.website && (
                          <p className="text-gray-500">No social links set</p>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={userDetails.username}
                    onChange={(e) =>
                      setUserDetails({
                        ...userDetails,
                        username: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={userDetails.displayName}
                    onChange={(e) =>
                      setUserDetails({
                        ...userDetails,
                        displayName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userDetails.email}
                    onChange={(e) =>
                      setUserDetails({ ...userDetails, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={userDetails.bio}
                  onChange={(e) =>
                    setUserDetails({ ...userDetails, bio: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black resize-none"
                />
              </div>

              {userDetails.isInstructor && (
                <>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                      Instructor Details
                    </h3>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Instructor Bio
                    </label>
                    <textarea
                      value={userDetails.instructorBio}
                      onChange={(e) =>
                        setUserDetails({
                          ...userDetails,
                          instructorBio: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Expertise
                    </label>
                    {userDetails.expertise.map((exp, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 mb-2"
                      >
                        <input
                          type="text"
                          value={exp}
                          onChange={(e) =>
                            updateExpertise(index, e.target.value)
                          }
                          className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                          placeholder="e.g., Smart Contracts, DeFi"
                        />
                        <button
                          onClick={() => removeExpertise(index)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addExpertise}
                      className="text-primary-500 hover:text-primary-600 font-bold text-sm"
                    >
                      + Add Expertise
                    </button>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                      Instructor Badges
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableBadges.map((badge) => (
                        <button
                          key={badge.value}
                          onClick={() => toggleBadge(badge.value)}
                          type="button"
                          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border-2 font-bold transition ${
                            userDetails.badges?.includes(badge.value)
                              ? getBadgeColor(badge.color) +
                                " ring-2 ring-offset-2 ring-primary-400"
                              : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400"
                          }`}
                        >
                          {badge.value === "Instructor" && (
                            <Award className="w-4 h-4" />
                          )}
                          {badge.value === "Creator" && (
                            <Zap className="w-4 h-4" />
                          )}
                          {badge.value === "KOL" && (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {badge.value === "Professional" && (
                            <Shield className="w-4 h-4" />
                          )}
                          {badge.value === "Expert" && (
                            <Trophy className="w-4 h-4" />
                          )}
                          <span>{badge.label}</span>
                          {userDetails.badges?.includes(badge.value) && (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Instructor badge is always included and displayed first
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Social Links
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={userDetails.socialLinks.twitter}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            socialLinks: {
                              ...userDetails.socialLinks,
                              twitter: e.target.value,
                            },
                          })
                        }
                        placeholder="Twitter handle"
                        className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                      />
                      <input
                        type="url"
                        value={userDetails.socialLinks.linkedin}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            socialLinks: {
                              ...userDetails.socialLinks,
                              linkedin: e.target.value,
                            },
                          })
                        }
                        placeholder="LinkedIn URL"
                        className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                      />
                      <input
                        type="url"
                        value={userDetails.socialLinks.website}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            socialLinks: {
                              ...userDetails.socialLinks,
                              website: e.target.value,
                            },
                          })
                        }
                        placeholder="Website URL"
                        className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={handleUpdateUserDetails}
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}
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
