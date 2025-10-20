import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Clock,
  Target,
  DollarSign,
  Shield,
  Users,
} from "lucide-react";
import { adminProfessionalCertificationApi, uploadApi } from "@services/api";
import toast from "react-hot-toast";

const AdminCreateProfessionalCertificationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null); // Cache file
  const [thumbnailPreview, setThumbnailPreview] = useState(null); // Preview URL

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail: "",
    originalThumbnailUrl: "", // ADD THIS
    category: "Blockchain Fundamentals",
    subcategory: "",
    level: "intermediate",
    tags: [],
    duration: 60,
    passingScore: 70,
    maxAttempts: 3,
    certificatePrice: { usd: 5 },
    discountPrice: { usd: 0 },
    discountEndDate: "",
    allowCopyPaste: false,
    allowTabSwitch: false,
    tabSwitchWarnings: 2,
    shuffleQuestions: true,
    shuffleOptions: true,
    questions: [],
    status: "draft",
    // Additional metadata
    designedBy: "",
    designedByLink: "",
    auditedBy: "",
    auditedByLink: "",
    version: "1.0",
    lastUpdated: new Date().toISOString(),
  });

  const [currentTag, setCurrentTag] = useState("");

  const categories = [
    "Blockchain Fundamentals",
    "Web3 Development",
    "DeFi",
    "NFTs & Digital Art",
    "Smart Contracts",
    "Community Building",
    "Marketing & Growth",
    "Trading & Investment",
    "Security & Auditing",
    "DAOs & Governance",
  ];

  useEffect(() => {
    if (isEditMode) {
      loadCertification();
    }
  }, [id]);

  // Set preview when editing
  useEffect(() => {
    if (formData.thumbnail && !thumbnailPreview) {
      setThumbnailPreview(formData.thumbnail);
    }
  }, [formData.thumbnail]);

  const loadCertification = async () => {
    try {
      setLoading(true);
      const response =
        await adminProfessionalCertificationApi.getCertificationDetails(id);
      const cert = response.data.certification;

      setFormData({
        ...cert,
        originalThumbnailUrl: cert.thumbnail, // CAPTURE ORIGINAL
      });
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Failed to load certification");
      navigate("/admin/professional-certifications");
    } finally {
      setLoading(false);
    }
  };
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Cache file for later upload
    setThumbnailFile(file);

    // --- START CHANGE ---
    // Create preview URL as data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result will be a base64 data: URL (e.g., "data:image/png;base64,...")
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
    // --- END CHANGE ---

    // We no longer use createObjectURL
    // const previewUrl = URL.createObjectURL(file);
    // setThumbnailPreview(previewUrl);

    toast.success("Thumbnail ready. Click 'Save & Publish' to upload.");
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setFormData({ ...formData, thumbnail: "" });

    // Revoke preview URL to free memory
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()],
      });
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // Removed the first, incomplete handleSave function that was here.

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: "",
          type: "multiple-choice",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
          correctAnswer: "",
          points: 1,
          explanation: "",
          order: formData.questions.length + 1,
        },
      ],
    });
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...formData.questions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, questions: updated });
  };

  const updateQuestionOption = (questionIndex, optionIndex, field, value) => {
    const updated = [...formData.questions];
    updated[questionIndex].options[optionIndex] = {
      ...updated[questionIndex].options[optionIndex],
      [field]: value,
    };

    // If marking as correct, unmark others
    if (field === "isCorrect" && value === true) {
      updated[questionIndex].options.forEach((opt, idx) => {
        if (idx !== optionIndex) opt.isCorrect = false;
      });
    }

    setFormData({ ...formData, questions: updated });
  };

  const addQuestionOption = (questionIndex) => {
    const updated = [...formData.questions];
    updated[questionIndex].options.push({ text: "", isCorrect: false });
    setFormData({ ...formData, questions: updated });
  };

  const removeQuestionOption = (questionIndex, optionIndex) => {
    const updated = [...formData.questions];
    updated[questionIndex].options = updated[questionIndex].options.filter(
      (_, idx) => idx !== optionIndex
    );
    setFormData({ ...formData, questions: updated });
  };

  const removeQuestion = (index) => {
    if (!confirm("Delete this question?")) return;
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, idx) => idx !== index),
    });
  };

  const duplicateQuestion = (index) => {
    const questionToDuplicate = { ...formData.questions[index] };
    questionToDuplicate.order = formData.questions.length + 1;
    setFormData({
      ...formData,
      questions: [...formData.questions, questionToDuplicate],
    });
    toast.success("Question duplicated");
  };

  const handleSave = async (status = "draft") => {
    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!formData.thumbnail && !thumbnailFile) {
      // Check if either old thumbnail exists or new one is staged
      toast.error("Thumbnail is required");
      return;
    }

    if (formData.questions.length === 0) {
      toast.error("Add at least one question");
      return;
    }

    // Validate questions
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];

      if (!q.question.trim()) {
        toast.error(`Question ${i + 1}: Question text is required`);
        return;
      }

      if (q.type === "multiple-choice") {
        if (q.options.length < 2) {
          toast.error(`Question ${i + 1}: Need at least 2 options`);
          return;
        }

        const hasCorrect = q.options.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
          toast.error(`Question ${i + 1}: Mark one option as correct`);
          return;
        }

        const emptyOptions = q.options.filter((opt) => !opt.text.trim());
        if (emptyOptions.length > 0) {
          toast.error(`Question ${i + 1}: All options must have text`);
          return;
        }
      } else if (q.type === "true-false") {
        if (!q.correctAnswer) {
          toast.error(`Question ${i + 1}: Select correct answer (True/False)`);
          return;
        }
      }
    }

    try {
      setSaving(true);

      let thumbnailUrl = formData.thumbnail;

      // Upload thumbnail if new file selected
      if (thumbnailFile) {
        toast.loading("Uploading thumbnail...");

        const formDataUpload = new FormData();
        formDataUpload.append("thumbnail", thumbnailFile);

        // Pass ORIGINAL thumbnail URL for deletion
        if (
          formData.originalThumbnailUrl &&
          formData.originalThumbnailUrl.trim() !== ""
        ) {
          console.log(
            "🗑️ Sending old thumbnail for deletion:",
            formData.originalThumbnailUrl
          );
          formDataUpload.append(
            "oldThumbnailUrl",
            formData.originalThumbnailUrl
          );
        }

        try {
          const response = await uploadApi.uploadCertificationThumbnail(
            formDataUpload
          );
          thumbnailUrl = response.data.url;

          // UPDATE: Set new URL as both current and original for next update
          setFormData({
            ...formData,
            thumbnail: thumbnailUrl,
            originalThumbnailUrl: thumbnailUrl,
          });

          toast.dismiss();
          toast.success("Thumbnail uploaded");
        } catch (uploadError) {
          toast.dismiss();
          toast.error("Failed to upload thumbnail");
          setSaving(false);
          return;
        }
      }

      const dataToSave = {
        ...formData,
        thumbnail: thumbnailUrl,
        status,
        lastUpdated: new Date().toISOString(),
      };

      if (isEditMode) {
        await adminProfessionalCertificationApi.updateCertification(
          id,
          dataToSave
        );
        toast.success("Certification updated successfully");
      } else {
        await adminProfessionalCertificationApi.createCertification(dataToSave);
        toast.success("Certification created successfully");
      }

      navigate("/admin/professional-certifications");
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error.response?.data?.error || "Failed to save certification"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/admin/professional-certifications")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Edit" : "Create"} Professional Certification
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Design a comprehensive certification test
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-bold hover:border-primary-500 transition disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? "Saving..." : "Save & Publish"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Basic Information
              </h2>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Certification Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g., Blockchain Fundamentals Certification"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="blockchain-fundamentals-cert"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition font-mono text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Comprehensive description of what this certification proves..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition resize-none"
                  />
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Thumbnail *{" "}
                    {thumbnailFile && (
                      <span className="text-primary-500">
                        (Ready to upload)
                      </span>
                    )}
                  </label>
                  {thumbnailPreview ? (
                    <div className="relative">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={removeThumbnail}
                        className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-500 transition cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                      <div className="h-full flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Click to select thumbnail
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Will be uploaded when you save
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Category, Subcategory & Level */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value,
                          subcategory: "",
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      value={formData.subcategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subcategory: e.target.value,
                        })
                      }
                      placeholder="e.g., Bitcoin, Ethereum"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Level *
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({ ...formData, level: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Tags
                  </label>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                      placeholder="Add a tag"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                    />
                    <button
                      onClick={addTag}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-2 px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg text-sm font-medium"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-primary-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metadata - Designed By & Audited By with Links */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Designed By
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={formData.designedBy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            designedBy: e.target.value,
                          })
                        }
                        placeholder="e.g., John Doe"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                      />
                      <input
                        type="url"
                        value={formData.designedByLink || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            designedByLink: e.target.value,
                          })
                        }
                        placeholder="Profile URL (optional)"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Audited By
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={formData.auditedBy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            auditedBy: e.target.value,
                          })
                        }
                        placeholder="e.g., Jane Smith"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                      />
                      <input
                        type="url"
                        value={formData.auditedByLink || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            auditedByLink: e.target.value,
                          })
                        }
                        placeholder="Profile URL (optional)"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Questions ({formData.questions.length})
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Add questions with correct answers
                  </p>
                </div>
                <button
                  onClick={addQuestion}
                  className="flex items-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Question</span>
                </button>
              </div>

              {formData.questions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No questions added yet
                  </p>
                  <button
                    onClick={addQuestion}
                    className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
                  >
                    Add First Question
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.questions.map((question, qIndex) => (
                    <div
                      key={qIndex}
                      className="border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                            {qIndex + 1}
                          </div>
                          <select
                            value={question.type}
                            onChange={(e) =>
                              updateQuestion(qIndex, "type", e.target.value)
                            }
                            className="px-3 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-sm font-medium"
                          >
                            <option value="multiple-choice">
                              Multiple Choice
                            </option>
                            <option value="true-false">True/False</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => duplicateQuestion(qIndex)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                            title="Duplicate"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeQuestion(qIndex)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                          Question *
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) =>
                            updateQuestion(qIndex, "question", e.target.value)
                          }
                          placeholder="Enter your question here..."
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition resize-none"
                        />
                      </div>

                      {/* Options */}
                      {question.type === "multiple-choice" ? (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-900 dark:text-white">
                              Options * (mark correct answer)
                            </label>
                            <button
                              onClick={() => addQuestionOption(qIndex)}
                              className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                            >
                              + Add Option
                            </button>
                          </div>
                          <div className="space-y-3">
                            {question.options.map((option, oIndex) => (
                              <div
                                key={oIndex}
                                className="flex items-center space-x-3"
                              >
                                <button
                                  onClick={() =>
                                    updateQuestionOption(
                                      qIndex,
                                      oIndex,
                                      "isCorrect",
                                      !option.isCorrect
                                    )
                                  }
                                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                                    option.isCorrect
                                      ? "bg-green-500 border-green-500"
                                      : "border-gray-300 dark:border-gray-700"
                                  }`}
                                >
                                  {option.isCorrect && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  )}
                                </button>
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) =>
                                    updateQuestionOption(
                                      qIndex,
                                      oIndex,
                                      "text",
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Option ${oIndex + 1}`}
                                  className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                                />
                                {question.options.length > 2 && (
                                  <button
                                    onClick={() =>
                                      removeQuestionOption(qIndex, oIndex)
                                    }
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Correct Answer *
                          </label>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() =>
                                updateQuestion(qIndex, "correctAnswer", "true")
                              }
                              className={`flex-1 px-6 py-4 border-2 rounded-xl font-bold transition ${
                                question.correctAnswer === "true"
                                  ? "border-green-500 bg-green-500/10 text-green-500"
                                  : "border-gray-200 dark:border-gray-800"
                              }`}
                            >
                              TRUE
                            </button>
                            <button
                              onClick={() =>
                                updateQuestion(qIndex, "correctAnswer", "false")
                              }
                              className={`flex-1 px-6 py-4 border-2 rounded-xl font-bold transition ${
                                question.correctAnswer === "false"
                                  ? "border-red-500 bg-red-500/10 text-red-500"
                                  : "border-gray-200 dark:border-gray-800"
                              }`}
                            >
                              FALSE
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Points & Explanation */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Points
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={question.points}
                            onChange={(e) =>
                              updateQuestion(
                                qIndex,
                                "points",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Explanation (Optional)
                          </label>
                          <input
                            type="text"
                            value={question.explanation}
                            onChange={(e) =>
                              updateQuestion(
                                qIndex,
                                "explanation",
                                e.target.value
                              )
                            }
                            placeholder="Why this is the answer..."
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-500 outline-none transition"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Settings */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Test Settings */}
              <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Test Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 60,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      <Target className="w-4 h-4 inline mr-2" />
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingScore}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passingScore: parseInt(e.target.value) || 70,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.maxAttempts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxAttempts: parseInt(e.target.value) || 3,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Certificate Pricing
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.certificatePrice.usd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          certificatePrice: {
                            usd: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Discount Price (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountPrice?.usd || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPrice: {
                            usd: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Discount End Date
                    </label>
                    <input
                      type="date"
                      value={
                        formData.discountEndDate
                          ? formData.discountEndDate.split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountEndDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                    />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Security Settings
                </h3>

                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Allow Copy/Paste
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.allowCopyPaste}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowCopyPaste: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Allow Tab Switch
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.allowTabSwitch}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowTabSwitch: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                  </label>

                  {!formData.allowTabSwitch && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                        Tab Switch Warnings
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={formData.tabSwitchWarnings}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tabSwitchWarnings: parseInt(e.target.value) || 2,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                      />
                    </div>
                  )}

                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Shuffle Questions
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.shuffleQuestions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shuffleQuestions: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Shuffle Options
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.shuffleOptions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shuffleOptions: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4">Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Questions:</span>
                    <span className="font-bold">
                      {formData.questions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Total Points:</span>
                    <span className="font-bold">
                      {formData.questions.reduce(
                        (sum, q) => sum + (q.points || 1),
                        0
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Duration:</span>
                    <span className="font-bold">{formData.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Passing Score:</span>
                    <span className="font-bold">{formData.passingScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Certificate Price:</span>
                    <span className="font-bold">
                      ${formData.certificatePrice.usd}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateProfessionalCertificationPage;
