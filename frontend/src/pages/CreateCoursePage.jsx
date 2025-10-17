import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  X,
  Plus,
  GripVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  FileText,
  HelpCircle,
  DollarSign,
  Users,
  Clock,
  Target,
  Award,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader,
  Lightbulb,
} from "lucide-react";
import toast from "react-hot-toast";

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditing = !!courseId;
  const [activeTab, setActiveTab] = useState("basics");
  const [saving, setSaving] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);

  // Course data state
  const [courseData, setCourseData] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "",
    level: "beginner",
    language: "english",
    thumbnail: null,
    thumbnailPreview: null,
    price: "",
    acceptedPayments: ["usdt", "usdc", "eth"],
    escrowSettings: {
      refundPeriodDays: 14,
      minWatchPercentage: 20,
      maxWatchTime: 120,
    },
    modules: [],
    requirements: [""],
    learningOutcomes: [""],
    targetAudience: [""],
    whatYouWillLearn: [""],
  });
  const [errors, setErrors] = useState({});

  // Load course data when editing
  useEffect(() => {
    if (isEditing && courseId) {
      loadCourseData(courseId);
    }
  }, [courseId, isEditing]);

  const loadCourseData = async (id) => {
    try {
      // Mock data - replace with actual API call later
      // In production: const response = await api.get(`/courses/${id}`);

      const mockCourse = {
        title: "NFT Marketing Masterclass: 0 to 10K Discord Members",
        subtitle: "Master the art of building thriving Web3 communities",
        description:
          "Learn proven strategies to grow your Discord server from zero to 10,000+ engaged members. This course covers everything from setup to advanced community management techniques used by successful NFT projects.",
        category: "Web3 Marketing",
        level: "intermediate",
        language: "english",
        thumbnailPreview:
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop",
        price: "299",
        acceptedPayments: ["usdt", "usdc", "eth"],
        escrowSettings: {
          refundPeriodDays: 14,
          minWatchPercentage: 20,
          maxWatchTime: 120,
        },
        modules: [
          {
            id: 1,
            title: "Getting Started with Discord",
            description: "Learn the fundamentals",
            lessons: [
              {
                id: 1,
                title: "Introduction to Discord",
                type: "video",
                duration: "10:30",
              },
              {
                id: 2,
                title: "Server Setup Basics",
                type: "video",
                duration: "15:20",
              },
            ],
          },
        ],
        requirements: ["Basic understanding of Discord", "NFT project or idea"],
        learningOutcomes: [
          "Build a Discord server from scratch",
          "Grow to 10K+ members",
        ],
        targetAudience: ["NFT project founders", "Community managers"],
        whatYouWillLearn: [
          "Discord server setup",
          "Community growth strategies",
        ],
      };

      setCourseData(mockCourse);
      toast.success("Course data loaded");
    } catch (error) {
      toast.error("Failed to load course data");
      console.error(error);
    }
  };

  const categories = [
    "Blockchain Development",
    "NFT & Digital Art",
    "DeFi & Trading",
    "Web3 Marketing",
    "Smart Contracts",
    "Tokenomics",
    "Community Building",
    "Cryptocurrency",
    "Other",
  ];

  const paymentOptions = [
    { id: "usdt", name: "USDT", icon: "₮" },
    { id: "usdc", name: "USDC", icon: "$" },
    { id: "eth", name: "ETH", icon: "Ξ" },
    { id: "btc", name: "BTC", icon: "₿" },
    { id: "sol", name: "SOL", icon: "S" },
    { id: "fdr", name: "$FDR", icon: "F" },
  ];

  const handleInputChange = (field, value) => {
    setCourseData({ ...courseData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCourseData({
          ...courseData,
          thumbnail: file,
          thumbnailPreview: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentToggle = (paymentId) => {
    const current = courseData.acceptedPayments;
    const updated = current.includes(paymentId)
      ? current.filter((id) => id !== paymentId)
      : [...current, paymentId];
    setCourseData({ ...courseData, acceptedPayments: updated });
  };

  const addModule = () => {
    const newModule = {
      id: Date.now(),
      title: "",
      description: "",
      lessons: [],
    };
    setCourseData({
      ...courseData,
      modules: [...courseData.modules, newModule],
    });
    setExpandedModule(newModule.id);
  };

  const updateModule = (moduleId, field, value) => {
    const updated = courseData.modules.map((module) =>
      module.id === moduleId ? { ...module, [field]: value } : module
    );
    setCourseData({ ...courseData, modules: updated });
  };

  const deleteModule = (moduleId) => {
    setCourseData({
      ...courseData,
      modules: courseData.modules.filter((m) => m.id !== moduleId),
    });
  };

  const addLesson = (moduleId) => {
    const newLesson = {
      id: Date.now(),
      title: "",
      type: "video",
      duration: "",
      videoUrl: "",
      description: "",
      resources: [],
    };
    const updated = courseData.modules.map((module) =>
      module.id === moduleId
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    );
    setCourseData({ ...courseData, modules: updated });
  };

  const updateLesson = (moduleId, lessonId, field, value) => {
    const updated = courseData.modules.map((module) =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map((lesson) =>
              lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
            ),
          }
        : module
    );
    setCourseData({ ...courseData, modules: updated });
  };

  const deleteLesson = (moduleId, lessonId) => {
    const updated = courseData.modules.map((module) =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.filter((l) => l.id !== lessonId),
          }
        : module
    );
    setCourseData({ ...courseData, modules: updated });
  };

  const addArrayItem = (field) => {
    setCourseData({
      ...courseData,
      [field]: [...courseData[field], ""],
    });
  };

  const updateArrayItem = (field, index, value) => {
    const updated = [...courseData[field]];
    updated[index] = value;
    setCourseData({ ...courseData, [field]: updated });
  };

  const removeArrayItem = (field, index) => {
    setCourseData({
      ...courseData,
      [field]: courseData[field].filter((_, i) => i !== index),
    });
  };

  const validateCourse = () => {
    const newErrors = {};

    if (!courseData.title.trim()) newErrors.title = "Title is required";
    if (!courseData.subtitle.trim())
      newErrors.subtitle = "Subtitle is required";
    if (!courseData.description.trim())
      newErrors.description = "Description is required";
    if (!courseData.category) newErrors.category = "Category is required";
    if (!courseData.price) newErrors.price = "Price is required";
    if (courseData.acceptedPayments.length === 0)
      newErrors.acceptedPayments = "Select at least one payment method";
    if (!courseData.thumbnail) newErrors.thumbnail = "Thumbnail is required";
    if (courseData.modules.length === 0)
      newErrors.modules = "Add at least one module";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Course saved as draft!");
      navigate("/instructor");
    } catch (error) {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!validateCourse()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Course published successfully!");
      navigate("/instructor");
    } catch (error) {
      toast.error("Failed to publish course");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "basics", label: "Basic Info", icon: FileText },
    { id: "pricing", label: "Pricing & Payments", icon: DollarSign },
    { id: "curriculum", label: "Curriculum", icon: Video },
    { id: "details", label: "Course Details", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container-custom max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/instructor")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Course" : "Create New Course"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Share your knowledge with the world
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/courses/preview")}
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition font-medium flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Draft</span>
            </button>
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              <span>Publish Course</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary-400 text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8">
          {/* Basic Info Tab */}
          {activeTab === "basics" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={courseData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., NFT Marketing Masterclass: 0 to 10K Discord Members"
                  className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-black ${
                    errors.title
                      ? "border-red-500"
                      : "border-gray-200 dark:border-gray-800"
                  } focus:border-primary-400 transition`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Course Subtitle *
                </label>
                <input
                  type="text"
                  value={courseData.subtitle}
                  onChange={(e) =>
                    handleInputChange("subtitle", e.target.value)
                  }
                  placeholder="A brief, engaging description of your course"
                  className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-black ${
                    errors.subtitle
                      ? "border-red-500"
                      : "border-gray-200 dark:border-gray-800"
                  } focus:border-primary-400 transition`}
                />
                {errors.subtitle && (
                  <p className="text-red-500 text-sm mt-1">{errors.subtitle}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Course Description *
                </label>
                <textarea
                  value={courseData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Detailed description of what students will learn..."
                  rows={6}
                  className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-black ${
                    errors.description
                      ? "border-red-500"
                      : "border-gray-200 dark:border-gray-800"
                  } focus:border-primary-400 transition resize-none`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={courseData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-black ${
                      errors.category
                        ? "border-red-500"
                        : "border-gray-200 dark:border-gray-800"
                    } focus:border-primary-400 transition`}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.category}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Course Level
                  </label>
                  <select
                    value={courseData.level}
                    onChange={(e) => handleInputChange("level", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all">All Levels</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Course Thumbnail *
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center ${
                    errors.thumbnail
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  {courseData.thumbnailPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={courseData.thumbnailPreview}
                        alt="Thumbnail preview"
                        className="max-h-64 rounded-lg"
                      />
                      <button
                        onClick={() =>
                          setCourseData({
                            ...courseData,
                            thumbnail: null,
                            thumbnailPreview: null,
                          })
                        }
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Upload course thumbnail (16:9 ratio recommended)
                      </p>
                      <label className="inline-block px-6 py-3 bg-primary-400 text-black rounded-xl font-bold cursor-pointer hover:bg-primary-500 transition">
                        Choose Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
                {errors.thumbnail && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.thumbnail}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Course Price (USD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={courseData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="299"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-white dark:bg-black ${
                      errors.price
                        ? "border-red-500"
                        : "border-gray-200 dark:border-gray-800"
                    } focus:border-primary-400 transition`}
                  />
                </div>
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Accepted Payment Methods *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paymentOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handlePaymentToggle(option.id)}
                      className={`p-4 border-2 rounded-xl transition ${
                        courseData.acceptedPayments.includes(option.id)
                          ? "border-primary-400 bg-primary-400/10"
                          : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-bold text-sm">{option.name}</div>
                    </button>
                  ))}
                </div>
                {errors.acceptedPayments && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.acceptedPayments}
                  </p>
                )}
              </div>
              <div className="bg-blue-500/5 border-2 border-blue-500/20 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  <span>Smart Contract Escrow Settings</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Refund Period (Days)
                    </label>
                    <input
                      type="number"
                      value={courseData.escrowSettings.refundPeriodDays}
                      onChange={(e) =>
                        setCourseData({
                          ...courseData,
                          escrowSettings: {
                            ...courseData.escrowSettings,
                            refundPeriodDays: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Students can request refund within this period
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Watch Percentage for No Refund (%)
                    </label>
                    <input
                      type="number"
                      value={courseData.escrowSettings.minWatchPercentage}
                      onChange={(e) =>
                        setCourseData({
                          ...courseData,
                          escrowSettings: {
                            ...courseData.escrowSettings,
                            minWatchPercentage: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Students who watch more than this cannot get refund
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maximum Watch Time for Refund (Minutes)
                    </label>
                    <input
                      type="number"
                      value={courseData.escrowSettings.maxWatchTime}
                      onChange={(e) =>
                        setCourseData({
                          ...courseData,
                          escrowSettings: {
                            ...courseData.escrowSettings,
                            maxWatchTime: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Students who watch more than this cannot get refund
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Curriculum Tab */}
          {activeTab === "curriculum" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Course Curriculum
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Organize your course into modules and lessons
                  </p>
                </div>
                <button
                  onClick={addModule}
                  className="px-4 py-2 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Module</span>
                </button>
              </div>
              {errors.modules && (
                <div className="p-4 bg-red-500/10 border-2 border-red-500/20 rounded-xl flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-500 text-sm">{errors.modules}</p>
                </div>
              )}
              {courseData.modules.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    No modules yet. Start building your course!
                  </p>
                  <button
                    onClick={addModule}
                    className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
                  >
                    Add Your First Module
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseData.modules.map((module) => (
                    <div
                      key={module.id}
                      className="border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                    >
                      <div className="bg-gray-50 dark:bg-gray-800 p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) =>
                              updateModule(module.id, "title", e.target.value)
                            }
                            placeholder="Module Title (e.g., Getting Started)"
                            className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 font-bold"
                          />
                          <button
                            onClick={() =>
                              setExpandedModule(
                                expandedModule === module.id ? null : module.id
                              )
                            }
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                          >
                            {expandedModule === module.id ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteModule(module.id)}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        {expandedModule === module.id && (
                          <div className="space-y-4">
                            <textarea
                              value={module.description}
                              onChange={(e) =>
                                updateModule(
                                  module.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Module description (optional)"
                              rows={2}
                              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm resize-none"
                            />
                            <div className="space-y-2">
                              {module.lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                  <div className="flex items-center space-x-3 mb-3">
                                    <Video className="w-4 h-4 text-gray-400" />
                                    <input
                                      type="text"
                                      value={lesson.title}
                                      onChange={(e) =>
                                        updateLesson(
                                          module.id,
                                          lesson.id,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Lesson title"
                                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                                    />
                                    <input
                                      type="text"
                                      value={lesson.duration}
                                      onChange={(e) =>
                                        updateLesson(
                                          module.id,
                                          lesson.id,
                                          "duration",
                                          e.target.value
                                        )
                                      }
                                      placeholder="5:30"
                                      className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                                    />
                                    <button
                                      onClick={() =>
                                        deleteLesson(module.id, lesson.id)
                                      }
                                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={lesson.videoUrl}
                                    onChange={(e) =>
                                      updateLesson(
                                        module.id,
                                        lesson.id,
                                        "videoUrl",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Video URL or upload link"
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                                  />
                                </div>
                              ))}
                              <button
                                onClick={() => addLesson(module.id)}
                                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-primary-400 transition text-sm font-medium text-gray-500 hover:text-primary-400 flex items-center justify-center space-x-2"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Add Lesson</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Course Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-8">
              {/* What You'll Learn - For Course Card Hover */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-primary-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    What You'll Learn
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Quick highlights shown on course card (3-4 bullet points
                  recommended)
                </p>
                <div className="space-y-3">
                  {courseData.whatYouWillLearn.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={item}
                        onChange={(e) =>
                          updateArrayItem(
                            "whatYouWillLearn",
                            index,
                            e.target.value
                          )
                        }
                        placeholder="e.g., Build a thriving NFT community from scratch"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                      />
                      {courseData.whatYouWillLearn.length > 1 && (
                        <button
                          onClick={() =>
                            removeArrayItem("whatYouWillLearn", index)
                          }
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem("whatYouWillLearn")}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-400 transition font-medium text-gray-500 hover:text-primary-400 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Learning Point</span>
                  </button>
                </div>
              </div>
              {/* Requirements */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Course Requirements
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  What students need to know or have before starting
                </p>
                <div className="space-y-3">
                  {courseData.requirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) =>
                          updateArrayItem("requirements", index, e.target.value)
                        }
                        placeholder="e.g., Basic understanding of blockchain"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                      />
                      {courseData.requirements.length > 1 && (
                        <button
                          onClick={() => removeArrayItem("requirements", index)}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem("requirements")}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-400 transition font-medium text-gray-500 hover:text-primary-400 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Requirement</span>
                  </button>
                </div>
              </div>
              {/* Learning Outcomes */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Learning Outcomes
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Detailed outcomes shown on course detail page
                </p>
                <div className="space-y-3">
                  {courseData.learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={outcome}
                        onChange={(e) =>
                          updateArrayItem(
                            "learningOutcomes",
                            index,
                            e.target.value
                          )
                        }
                        placeholder="e.g., Build a successful NFT community from 0 to 10K members"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                      />
                      {courseData.learningOutcomes.length > 1 && (
                        <button
                          onClick={() =>
                            removeArrayItem("learningOutcomes", index)
                          }
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem("learningOutcomes")}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-400 transition font-medium text-gray-500 hover:text-primary-400 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Learning Outcome</span>
                  </button>
                </div>
              </div>
              {/* Target Audience */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Target Audience
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Who is this course for?
                </p>
                <div className="space-y-3">
                  {courseData.targetAudience.map((audience, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={audience}
                        onChange={(e) =>
                          updateArrayItem(
                            "targetAudience",
                            index,
                            e.target.value
                          )
                        }
                        placeholder="e.g., NFT project founders and community managers"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                      />
                      {courseData.targetAudience.length > 1 && (
                        <button
                          onClick={() =>
                            removeArrayItem("targetAudience", index)
                          }
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem("targetAudience")}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-400 transition font-medium text-gray-500 hover:text-primary-400 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Target Audience</span>
                  </button>
                </div>
              </div>
              {/* Info Box */}
              <div className="bg-blue-500/5 border-2 border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                      About Instructor Information
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your instructor profile (name, avatar, badge, bio) is
                      automatically displayed on all your courses. You can edit
                      your instructor profile in{" "}
                      <button
                        onClick={() => navigate("/profile")}
                        className="text-primary-400 hover:text-primary-500 font-medium"
                      >
                        Profile Settings
                      </button>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;
