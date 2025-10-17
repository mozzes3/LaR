import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AvatarUpload from "@components/AvatarUpload";
import {
  User,
  Mail,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  Save,
  Upload,
  X,
  Award,
  Shield,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Wallet,
  Bell,
  Lock,
  Trash2,
  ExternalLink,
  Camera,
  Loader,
} from "lucide-react";
import { useWallet } from "@contexts/WalletContext";
import { userApi } from "@services/api";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, walletAddress, refreshUser } = useWallet();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Profile data
  const [profileData, setProfileData] = useState({
    username: "",
    displayName: "",
    email: "",
    bio: "",
    website: "",
    twitter: "",
    linkedin: "",
    github: "",
    instagram: "",
    avatar: null,
  });

  // Instructor specific data
  const [instructorData, setInstructorData] = useState({
    displayName: "",
    tagline: "",
    bio: "",
    expertise: [],
    badge: "Creator",
    isPublic: true,
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    newStudents: true,
    reviews: true,
    earnings: true,
    marketing: false,
  });

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);

        // Load full profile data
        const response = await userApi.getProfile(user.username);
        const userData = response.data.user;

        console.log("📥 Loaded user data:", userData);

        // Set profile data
        setProfileData({
          username: userData.username || "",
          displayName: userData.displayName || "",
          email: userData.email || "",
          bio: userData.bio || "",
          website: userData.socialLinks?.website || "",
          twitter: userData.socialLinks?.twitter || "",
          linkedin: userData.socialLinks?.linkedin || "",
          github: userData.socialLinks?.github || "",
          instagram: userData.socialLinks?.instagram || "",
          avatar: null,
        });

        // Set avatar preview
        setAvatarPreview(
          userData.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`
        );

        // Set instructor data if user is instructor
        if (userData.isInstructor) {
          setInstructorData({
            displayName: userData.displayName || userData.username || "",
            tagline: userData.expertise?.[0] || "",
            bio: userData.instructorBio || userData.bio || "",
            expertise: userData.expertise || [],
            badge: userData.badge || "Creator",
            isPublic: true,
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load profile data");
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, navigate]);

  const badges = [
    { id: "creator", label: "Creator", icon: Sparkles, color: "primary" },
    { id: "kol", label: "KOL", icon: Award, color: "purple" },
    { id: "professional", label: "Professional", icon: Shield, color: "blue" },
    { id: "expert", label: "Expert", icon: Award, color: "green" },
  ];

  const handleProfileChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
  };

  const handleInstructorChange = (field, value) => {
    setInstructorData({ ...instructorData, [field]: value });
  };

  const addExpertise = () => {
    setInstructorData({
      ...instructorData,
      expertise: [...instructorData.expertise, ""],
    });
  };

  const updateExpertise = (index, value) => {
    const updated = [...instructorData.expertise];
    updated[index] = value;
    setInstructorData({ ...instructorData, expertise: updated });
  };

  const removeExpertise = (index) => {
    setInstructorData({
      ...instructorData,
      expertise: instructorData.expertise.filter((_, i) => i !== index),
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      console.log("🚀 Current profileData:", profileData);

      // Prepare update data
      const updateData = {
        displayName: profileData.displayName,
        bio: profileData.bio,
        socialLinks: {
          website: profileData.website,
          twitter: profileData.twitter,
          linkedin: profileData.linkedin,
          github: profileData.github,
        },
      };

      // Only include username if it changed
      if (profileData.username !== user.username) {
        updateData.username = profileData.username;
      }

      console.log("💾 Sending update data:", updateData);

      // Update profile data
      const response = await userApi.updateProfile(updateData);

      console.log("✅ Response from server:", response.data);

      // Upload avatar if changed

      toast.success("Profile updated successfully!");

      // Refresh user in context
      await refreshUser();

      // Reload the data without full page refresh
      const freshData = await userApi.getProfile(
        updateData.username || user.username
      );
      const userData = freshData.data.user;

      console.log("🔄 Fresh data loaded:", userData);

      // Update local state
      setProfileData({
        username: userData.username || "",
        displayName: userData.displayName || userData.username || "",
        email: userData.email || "",
        bio: userData.bio || "",
        website: userData.socialLinks?.website || "",
        twitter: userData.socialLinks?.twitter || "",
        linkedin: userData.socialLinks?.linkedin || "",
        github: userData.socialLinks?.github || "",
        instagram: userData.socialLinks?.instagram || "",
        avatar: null,
      });

      setAvatarPreview(
        userData.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`
      );
    } catch (error) {
      console.error("❌ Update error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInstructor = async () => {
    setSaving(true);
    try {
      // Update instructor-specific data
      await userApi.updateProfile({
        displayName: instructorData.displayName,
        instructorBio: instructorData.bio,
        expertise: instructorData.expertise.filter((e) => e.trim()),
      });

      toast.success("Instructor profile updated!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update instructor profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // TODO: Add notification preferences API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Notification preferences saved!");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    {
      id: "instructor",
      label: "Instructor Profile",
      icon: Award,
      requireInstructor: true,
    },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
  ];

  const visibleTabs = tabs.filter(
    (tab) => !tab.requireInstructor || user?.isInstructor
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container-custom max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-4">
              <div className="space-y-2">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                      activeTab === tab.id
                        ? "bg-primary-400 text-black"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Wallet Info */}
            <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Wallet className="w-5 h-5 text-primary-400" />
                <span className="font-bold text-gray-900 dark:text-white">
                  Connected Wallet
                </span>
              </div>
              <div className="font-mono text-sm text-gray-600 dark:text-gray-400 break-all bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {walletAddress}
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Public Profile
                    </h2>
                  </div>
                  {/* Avatar */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Profile Picture
                    </label>
                    <AvatarUpload
                      currentAvatar={avatarPreview}
                      onUploadSuccess={(url) => {
                        setAvatarPreview(url);
                        // Refresh user data
                        refreshUser();
                      }}
                    />
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) =>
                        handleProfileChange("displayName", e.target.value)
                      }
                      placeholder="Your display name"
                      maxLength={50}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is how your name appears to others. Can be changed
                      anytime.
                    </p>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) =>
                        handleProfileChange("username", e.target.value)
                      }
                      placeholder="Your username"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ⚠️ Username can only be changed once every 30 days
                    </p>
                    {user?.lastUsernameChange && (
                      <p className="text-xs text-orange-500 mt-1">
                        Last changed:{" "}
                        {new Date(user.lastUsernameChange).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Email (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          handleProfileChange("email", e.target.value)
                        }
                        placeholder="your@email.com"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Used for notifications and account recovery
                    </p>
                  </div>
                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) =>
                        handleProfileChange("bio", e.target.value)
                      }
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={200}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {profileData.bio.length}/200 characters
                    </p>
                  </div>
                  {/* Social Links */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Social Links
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Website
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="url"
                            value={profileData.website}
                            onChange={(e) =>
                              handleProfileChange("website", e.target.value)
                            }
                            placeholder="https://yourwebsite.com"
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Twitter
                        </label>
                        <div className="relative">
                          <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={profileData.twitter}
                            onChange={(e) =>
                              handleProfileChange("twitter", e.target.value)
                            }
                            placeholder="@username"
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          LinkedIn
                        </label>
                        <div className="relative">
                          <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={profileData.linkedin}
                            onChange={(e) =>
                              handleProfileChange("linkedin", e.target.value)
                            }
                            placeholder="linkedin.com/in/username"
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          GitHub
                        </label>
                        <div className="relative">
                          <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={profileData.github}
                            onChange={(e) =>
                              handleProfileChange("github", e.target.value)
                            }
                            placeholder="github.com/username"
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Save Button */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {/* Instructor Profile Tab */}
              {activeTab === "instructor" && user?.isInstructor && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Instructor Profile
                    </h2>
                    <p className="text-sm text-gray-500">
                      This information appears on your course pages
                    </p>
                  </div>
                  {/* Public Toggle */}
                  <div className="flex items-center justify-between p-4 bg-blue-500/5 border-2 border-blue-500/20 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Eye className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          Public Instructor Profile
                        </p>
                        <p className="text-sm text-gray-500">
                          Show your profile on course pages
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleInstructorChange(
                          "isPublic",
                          !instructorData.isPublic
                        )
                      }
                      className={`relative w-14 h-7 rounded-full transition ${
                        instructorData.isPublic
                          ? "bg-primary-400"
                          : "bg-gray-300 dark:bg-gray-700"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          instructorData.isPublic ? "translate-x-7" : ""
                        }`}
                      />
                    </button>
                  </div>
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={instructorData.displayName}
                      onChange={(e) =>
                        handleInstructorChange("displayName", e.target.value)
                      }
                      placeholder="How you want to be known"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                  </div>
                  {/* Tagline */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={instructorData.tagline}
                      onChange={(e) =>
                        handleInstructorChange("tagline", e.target.value)
                      }
                      placeholder="e.g., Web3 Marketing Expert & NFT Consultant"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                  </div>
                  {/* Instructor Bio */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Instructor Bio
                    </label>
                    <textarea
                      value={instructorData.bio}
                      onChange={(e) =>
                        handleInstructorChange("bio", e.target.value)
                      }
                      placeholder="Share your experience and expertise..."
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This appears on your course pages. Tell students about
                      your background.
                    </p>
                  </div>
                  {/* Badge Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Instructor Badge
                    </label>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-800">
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const currentBadge = badges.find(
                            (b) =>
                              b.label.toLowerCase() ===
                              instructorData.badge.toLowerCase()
                          );
                          const Icon = currentBadge?.icon || Award;
                          return (
                            <>
                              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                <Icon className="w-6 h-6 text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">
                                  {instructorData.badge}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Your current instructor badge
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Badges are assigned by admins based on achievements and
                      contributions
                    </p>
                  </div>
                  {/* Areas of Expertise */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Areas of Expertise
                    </label>
                    <div className="space-y-3">
                      {instructorData.expertise.map((exp, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3"
                        >
                          <input
                            type="text"
                            value={exp}
                            onChange={(e) =>
                              updateExpertise(index, e.target.value)
                            }
                            placeholder="e.g., NFT Marketing, Community Building"
                            className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                          />
                          <button
                            onClick={() => removeExpertise(index)}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addExpertise}
                        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-400 transition font-medium text-gray-500 hover:text-primary-400 flex items-center justify-center space-x-2"
                      >
                        <span>Add Expertise</span>
                      </button>
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="p-6 bg-gradient-to-br from-primary-400/5 to-purple-500/5 border-2 border-primary-400/20 rounded-xl">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                      Profile Preview
                    </h3>
                    <div className="flex items-start space-x-4">
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {instructorData.displayName || "Your Name"}
                          </h4>
                          <CheckCircle className="w-4 h-4 text-primary-400" />
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs font-bold rounded border border-purple-500/30">
                            {instructorData.badge}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {instructorData.tagline || "Your tagline here"}
                        </p>
                        {instructorData.expertise.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {instructorData.expertise
                              .filter((e) => e.trim())
                              .map((exp, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded"
                                >
                                  {exp}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Save Button */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={handleSaveInstructor}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Instructor Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Notification Preferences
                    </h2>
                    <p className="text-sm text-gray-500">
                      Choose what notifications you want to receive
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Course Updates
                        </p>
                        <p className="text-sm text-gray-500">
                          New lessons and course announcements
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications({
                            ...notifications,
                            courseUpdates: !notifications.courseUpdates,
                          })
                        }
                        className={`relative w-14 h-7 rounded-full transition ${
                          notifications.courseUpdates
                            ? "bg-primary-400"
                            : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            notifications.courseUpdates ? "translate-x-7" : ""
                          }`}
                        />
                      </button>
                    </div>
                    {user?.isInstructor && (
                      <>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              New Students
                            </p>
                            <p className="text-sm text-gray-500">
                              When someone enrolls in your course
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setNotifications({
                                ...notifications,
                                newStudents: !notifications.newStudents,
                              })
                            }
                            className={`relative w-14 h-7 rounded-full transition ${
                              notifications.newStudents
                                ? "bg-primary-400"
                                : "bg-gray-300 dark:bg-gray-700"
                            }`}
                          >
                            <div
                              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                notifications.newStudents ? "translate-x-7" : ""
                              }`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Reviews
                            </p>
                            <p className="text-sm text-gray-500">
                              New course reviews and ratings
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setNotifications({
                                ...notifications,
                                reviews: !notifications.reviews,
                              })
                            }
                            className={`relative w-14 h-7 rounded-full transition ${
                              notifications.reviews
                                ? "bg-primary-400"
                                : "bg-gray-300 dark:bg-gray-700"
                            }`}
                          >
                            <div
                              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                notifications.reviews ? "translate-x-7" : ""
                              }`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Earnings
                            </p>
                            <p className="text-sm text-gray-500">
                              Payment notifications and earnings updates
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setNotifications({
                                ...notifications,
                                earnings: !notifications.earnings,
                              })
                            }
                            className={`relative w-14 h-7 rounded-full transition ${
                              notifications.earnings
                                ? "bg-primary-400"
                                : "bg-gray-300 dark:bg-gray-700"
                            }`}
                          >
                            <div
                              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                notifications.earnings ? "translate-x-7" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Marketing Emails
                        </p>
                        <p className="text-sm text-gray-500">
                          News, updates, and promotional content
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications({
                            ...notifications,
                            marketing: !notifications.marketing,
                          })
                        }
                        className={`relative w-14 h-7 rounded-full transition ${
                          notifications.marketing
                            ? "bg-primary-400"
                            : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            notifications.marketing ? "translate-x-7" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  {/* Save Button */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Preferences</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Security Settings
                    </h2>
                    <p className="text-sm text-gray-500">
                      Manage your account security
                    </p>
                  </div>
                  {/* Wallet Security */}
                  <div className="p-6 bg-green-500/5 border-2 border-green-500/20 rounded-xl">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                          Wallet-Based Authentication
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Your account is secured by your Web3 wallet. No
                          password needed!
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-green-500">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">
                            Secured by: {walletAddress?.slice(0, 10)}...
                            {walletAddress?.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Active Sessions */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Active Sessions
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Current Device
                          </p>
                          <p className="text-sm text-gray-500">
                            Last active: Just now
                          </p>
                        </div>
                        <div className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg">
                          Active
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Danger Zone */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-red-500 mb-4">
                      Danger Zone
                    </h3>
                    <div className="p-6 bg-red-500/5 border-2 border-red-500/20 rounded-xl">
                      <div className="flex items-start space-x-4">
                        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                            Delete Account
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Permanently delete your account and all associated
                            data. This action cannot be undone.
                          </p>
                          <button className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition flex items-center space-x-2">
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Account</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
