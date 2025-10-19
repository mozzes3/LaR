import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { courseApi, userApi, uploadApi } from "@services/api";
import { useWallet } from "@contexts/WalletContext";
import ThumbnailUpload from "@components/ThumbnailUpload";
import VideoUpload from "@components/VideoUpload";
import ResourceUpload from "@components/ResourceUpload";
import ThumbnailUploadDraft from "@components/ThumbnailUploadDraft";
import VideoUploadDraft from "@components/VideoUploadDraft";
import ResourceUploadDraft from "@components/ResourceUploadDraft";
import { categoryApi } from "@services/api";
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
  const { slug } = useParams();
  const { user: currentUser } = useWallet();
  const isEditing = !!slug;
  const [activeTab, setActiveTab] = useState("basics");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  // Course data state
  const [courseData, setCourseData] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "",
    subcategories: [],
    level: "beginner",
    language: "english",
    thumbnailFile: null,
    thumbnailPreview: null,
    originalThumbnailUrl: null,
    price: { usd: "", fdr: "" },
    acceptedPayments: ["usdt", "usdc"],
    escrowSettings: {
      refundPeriodDays: 14,
      minWatchPercentage: 20,
      maxWatchTime: 120,
    },
    sections: [],
    requirements: [""],
    whatYouWillLearn: [""],
    learningOutcomes: [""],
    targetAudience: [""],
  });
  const [errors, setErrors] = useState({});
  const canEditCourse = (currentUser, course) => {
    if (!currentUser) return false;

    // Super admin can edit anything
    if (currentUser.isSuperAdmin) return true;

    // Course owner can edit
    const instructorId =
      typeof course.instructor === "string"
        ? course.instructor
        : course.instructor?._id || course.instructor;
    const currentUserId = currentUser?._id || currentUser?.id;

    if (instructorId === currentUserId) return true;

    // Check if user has Courses update permission via role
    if (currentUser.roleRef?.permissions) {
      const hasCoursesUpdate = currentUser.roleRef.permissions.some(
        (perm) => perm.resource === "Courses" && perm.actions.includes("update")
      );
      if (hasCoursesUpdate) return true;
    }

    // Check custom permissions
    if (currentUser.customPermissions?.customPermissions) {
      const hasCustomUpdate =
        currentUser.customPermissions.customPermissions.some(
          (perm) =>
            perm.resource === "Courses" &&
            perm.actions.includes("update") &&
            perm.granted
        );
      if (hasCustomUpdate) return true;
    }

    // Check if denied
    if (currentUser.customPermissions?.deniedPermissions) {
      const isDenied = currentUser.customPermissions.deniedPermissions.some(
        (perm) => perm.resource === "Courses" && perm.actions.includes("update")
      );
      if (isDenied) return false;
    }

    // Legacy admin check
    if (currentUser.role === "admin") return true;

    return false;
  };
  // Check if user is instructor
  useEffect(() => {
    if (!currentUser?.isInstructor) {
      toast.error("You must be an instructor to create courses");
      navigate("/");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getAll();
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadSubcategories = async () => {
      if (courseData.category) {
        try {
          const response = await categoryApi.getSubcategories(
            courseData.category
          );
          setSubcategories(response.data.subcategories);
          console.log("✅ Loaded subcategories:", response.data.subcategories);
        } catch (error) {
          console.error("Error loading subcategories:", error);
          setSubcategories([]);
        }
      } else {
        setSubcategories([]);
      }
    };
    loadSubcategories();
  }, [courseData.category]);
  // Load course data when editing
  useEffect(() => {
    const loadCourseForEditing = async () => {
      if (slug && currentUser?.isInstructor) {
        try {
          setLoading(true);
          toast.loading("Loading course for editing...");

          const response = await courseApi.getBySlug(slug);
          const course = response.data.course;

          console.log("📝 Loading course for edit:", course);
          if (!canEditCourse(currentUser, course)) {
            toast.dismiss();
            toast.error("You don't have permission to edit this course");
            navigate("/instructor");
            return;
          }

          // Check if user owns this course - handle both string and populated instructor
          const instructorId =
            typeof course.instructor === "string"
              ? course.instructor
              : course.instructor?._id || course.instructor;

          const currentUserId = currentUser?._id || currentUser?.id;

          console.log("🔍 Instructor ID:", instructorId);
          console.log("🔍 Current User ID:", currentUserId);

          if (instructorId !== currentUserId) {
            toast.dismiss();
            toast.error("You don't have permission to edit this course");
            navigate("/instructor");
            return;
          }

          setCourseData({
            title: course.title || "",
            subtitle: course.subtitle || "",
            description: course.description || "",
            category: course.category || "",
            subcategories: course.subcategories || [],
            level: course.level || "beginner",
            language: course.language || "english",

            // Keep existing thumbnail, no file
            thumbnailFile: null,
            thumbnailPreview: course.thumbnail || null,
            originalThumbnailUrl: course.thumbnail || null, // NEW: Keep original URL

            price: {
              usd: course.price?.usd?.toString() || "",
              fdr: course.price?.fdr?.toString() || "",
            },
            acceptedPayments: course.acceptedPayments || ["usdt", "usdc"],
            escrowSettings: course.escrowSettings || {
              refundPeriodDays: 14,
              minWatchPercentage: 20,
              maxWatchTime: 120,
            },

            // Load sections with proper IDs
            sections: (course.sections || []).map((section) => ({
              ...section,
              id: section._id, // Use MongoDB ID as temp ID
              lessons: (section.lessons || []).map((lesson) => ({
                ...lesson,
                id: lesson._id, // Use MongoDB ID as temp ID
                // Keep existing video/resource, no new files
                videoFile: null,
                resourceFile: null,
                originalVideoId: lesson.videoId,
              })),
            })),

            requirements:
              course.requirements?.length > 0 ? course.requirements : [""],
            whatYouWillLearn:
              course.whatYouWillLearn?.length > 0
                ? course.whatYouWillLearn
                : [""],
            learningOutcomes:
              course.learningOutcomes?.length > 0
                ? course.learningOutcomes
                : [""],
            targetAudience:
              course.targetAudience?.length > 0 ? course.targetAudience : [""],
          });

          toast.dismiss();
          toast.success("Course loaded for editing");
          setLoading(false);
        } catch (error) {
          console.error("Load course error:", error);
          toast.dismiss();
          toast.error("Failed to load course");
          navigate("/instructor");
          setLoading(false);
        }
      } else if (!slug) {
        // Creating new course, not editing
        setLoading(false);
      }
    };

    loadCourseForEditing();
  }, [slug, currentUser, navigate]);

  // ADD THIS:
  const paymentOptions = [
    { id: "usdt", name: "USDT", icon: "₮" },
    { id: "usdc", name: "USDC", icon: "$" },
    { id: "eth", name: "ETH", icon: "Ξ" },
    { id: "btc", name: "BTC", icon: "₿" },
    { id: "sol", name: "SOL", icon: "S" },
    { id: "fdr", name: "$FDR", icon: "F" },
  ];

  const handlePaymentToggle = (paymentId) => {
    const current = courseData.acceptedPayments;
    const updated = current.includes(paymentId)
      ? current.filter((id) => id !== paymentId)
      : [...current, paymentId];
    setCourseData({ ...courseData, acceptedPayments: updated });
  };

  const handleInputChange = (field, value) => {
    setCourseData({ ...courseData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handlePriceChange = (currency, value) => {
    setCourseData({
      ...courseData,
      price: { ...courseData.price, [currency]: value },
    });
  };

  const addSection = () => {
    const newSection = {
      id: `temp-${Date.now()}`,
      title: "",
      description: "",
      lessons: [],
    };
    setCourseData({
      ...courseData,
      sections: [...courseData.sections, newSection],
    });
    setExpandedSection(newSection.id);
  };

  const updateSection = (sectionId, field, value) => {
    const updated = courseData.sections.map((section) =>
      section.id === sectionId || section._id === sectionId
        ? { ...section, [field]: value }
        : section
    );
    setCourseData({ ...courseData, sections: updated });
  };

  const deleteSection = (sectionId) => {
    setCourseData({
      ...courseData,
      sections: courseData.sections.filter(
        (s) => s.id !== sectionId && s._id !== sectionId
      ),
    });
  };

  const addLesson = (sectionId) => {
    const newLesson = {
      id: `temp-${Date.now()}`,
      title: "",
      videoFile: null, // NEW: Store video File object
      videoId: null,
      videoUrl: "", // For display/reference
      resourceFile: null, // NEW: Store resource File object
      resources: [],
      duration: 0,
      description: "",
      isPreview: false,
    };
    const updated = courseData.sections.map((section) =>
      section.id === sectionId || section._id === sectionId
        ? { ...section, lessons: [...(section.lessons || []), newLesson] }
        : section
    );
    setCourseData({ ...courseData, sections: updated });
  };

  const updateLesson = (sectionId, lessonId, field, value) => {
    const updated = courseData.sections.map((section) =>
      section.id === sectionId || section._id === sectionId
        ? {
            ...section,
            lessons: (section.lessons || []).map((lesson) =>
              lesson.id === lessonId || lesson._id === lessonId
                ? { ...lesson, [field]: value }
                : lesson
            ),
          }
        : section
    );
    setCourseData({ ...courseData, sections: updated });
  };

  const deleteLesson = (sectionId, lessonId) => {
    const updated = courseData.sections.map((section) =>
      section.id === sectionId || section._id === sectionId
        ? {
            ...section,
            lessons: (section.lessons || []).filter(
              (l) => l.id !== lessonId && l._id !== lessonId
            ),
          }
        : section
    );
    setCourseData({ ...courseData, sections: updated });
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

  const uploadAllFiles = async (courseSlug) => {
    try {
      let uploadedCount = 0;
      let totalUploads = 0;

      // Count thumbnail only if there's a new file
      if (courseData.thumbnailFile) {
        totalUploads++;
      }

      // Count videos and resources that have new files
      courseData.sections.forEach((section) => {
        (section.lessons || []).forEach((lesson) => {
          if (lesson.videoFile) totalUploads++;
          if (lesson.resourceFile) totalUploads++;
        });
      });

      console.log(`📤 Starting upload of ${totalUploads} files...`);

      if (totalUploads === 0) {
        console.log(`ℹ️ No new files to upload`);

        // Still need to save sections even if no new uploads
        const cleanSections = courseData.sections
          .map((section, sIdx) => ({
            title: section.title,
            description: section.description || "",
            order: section.order || sIdx,
            lessons: (section.lessons || [])
              .filter((lesson) => {
                // ✅ FIX: Check for videoFile OR videoId
                const hasTitle = lesson.title && lesson.title.trim() !== "";
                const hasVideo =
                  lesson.videoFile ||
                  (lesson.videoId && lesson.videoId.trim() !== "");

                if (!hasTitle) {
                  console.warn(
                    `⚠️ Skipping lesson without title in section: ${section.title}`
                  );
                }
                if (!hasVideo) {
                  console.warn(
                    `⚠️ Skipping lesson without video in section: ${section.title}`
                  );
                }

                return hasTitle && hasVideo;
              })
              .map((lesson, lIdx) => ({
                title: lesson.title.trim(),
                description: lesson.description || "",
                videoId: lesson.videoId || "",
                videoUrl: lesson.videoUrl || "",
                duration: lesson.duration || 0,
                order: lesson.order || lIdx,
                isPreview: lesson.isPreview || false,
                resources: Array.isArray(lesson.resources)
                  ? lesson.resources
                  : [],
              })),
          }))
          .filter((section) => section.lessons.length > 0);

        console.log(`📋 Saving ${cleanSections.length} sections`);
        await courseApi.update(courseSlug, { sections: cleanSections });

        return true;
      }

      // 1. Upload Thumbnail (only if new file selected)
      if (courseData.thumbnailFile) {
        uploadedCount++;
        toast.loading(
          `Uploading thumbnail... (${uploadedCount}/${totalUploads})`
        );

        const response = await uploadApi.uploadThumbnail(
          courseData.thumbnailFile
        );

        console.log(`✅ Thumbnail uploaded: ${response.data.url}`);

        await courseApi.update(courseSlug, {
          thumbnail: response.data.url,
        });

        // Delete old thumbnail if exists
        if (
          courseData.originalThumbnailUrl &&
          !courseData.originalThumbnailUrl.includes("placeholder")
        ) {
          try {
            await uploadApi.deleteThumbnail(courseData.originalThumbnailUrl);
            console.log(`✅ Deleted old thumbnail from CDN`);
          } catch (error) {
            console.warn("⚠️ Could not delete old thumbnail:", error.message);
          }
        }
      }

      // 2. Upload Videos and Resources
      for (
        let sectionIndex = 0;
        sectionIndex < courseData.sections.length;
        sectionIndex++
      ) {
        const section = courseData.sections[sectionIndex];

        for (
          let lessonIndex = 0;
          lessonIndex < (section.lessons || []).length;
          lessonIndex++
        ) {
          const lesson = section.lessons[lessonIndex];

          // Upload NEW video if selected
          if (lesson.videoFile) {
            uploadedCount++;
            toast.loading(
              `Uploading video: ${lesson.title}... (${uploadedCount}/${totalUploads})`
            );

            const oldVideoId = lesson.originalVideoId || lesson.videoId || null;

            const videoResponse = await uploadApi.uploadVideo(
              lesson.videoFile,
              {
                title: lesson.title || "Untitled Lesson",
                courseSlug: courseSlug,
                oldVideoId: oldVideoId,
              }
            );

            // ✅ Update lesson with new video data
            courseData.sections[sectionIndex].lessons[lessonIndex].videoId =
              videoResponse.data.videoId;
            courseData.sections[sectionIndex].lessons[
              lessonIndex
            ].videoUrl = `https://iframe.mediadelivery.net/embed/${videoResponse.data.libraryId}/${videoResponse.data.videoId}`;

            console.log(`✅ Video uploaded: ${videoResponse.data.videoId}`);

            delete courseData.sections[sectionIndex].lessons[lessonIndex]
              .videoFile;
          }

          // Upload NEW resource if selected
          if (lesson.resourceFile) {
            uploadedCount++;
            toast.loading(
              `Uploading resource... (${uploadedCount}/${totalUploads})`
            );

            const oldResourceUrl = lesson.resources?.[0]?.url || null;

            if (oldResourceUrl) {
              try {
                await uploadApi.deleteResource(oldResourceUrl);
                console.log(`✅ Deleted old resource`);
              } catch (error) {
                console.warn(
                  "⚠️ Could not delete old resource:",
                  error.message
                );
              }
            }

            const resourceResponse = await uploadApi.uploadResource(
              lesson.resourceFile
            );

            const resourceData = [
              {
                title: lesson.resourceFile.name,
                url: resourceResponse.data.url,
                type: lesson.resourceFile.name.split(".").pop(),
              },
            ];

            courseData.sections[sectionIndex].lessons[lessonIndex].resources =
              resourceData;

            console.log(`✅ Resource uploaded`);

            delete courseData.sections[sectionIndex].lessons[lessonIndex]
              .resourceFile;
          }
        }
      }

      // 3. Save all sections
      const cleanSections = courseData.sections
        .map((section, sIdx) => ({
          title: section.title,
          description: section.description || "",
          order: section.order || sIdx,
          lessons: (section.lessons || [])
            .filter((lesson) => {
              const hasTitle = lesson.title && lesson.title.trim() !== "";
              const hasVideo = lesson.videoId && lesson.videoId.trim() !== "";

              return hasTitle && hasVideo;
            })
            .map((lesson, lIdx) => ({
              title: lesson.title.trim(),
              description: lesson.description || "",
              videoId: lesson.videoId || "",
              videoUrl: lesson.videoUrl || "",
              duration: lesson.duration || 0,
              order: lesson.order || lIdx,
              isPreview: lesson.isPreview || false,
              resources: Array.isArray(lesson.resources)
                ? lesson.resources
                : [],
            })),
        }))
        .filter((section) => section.lessons.length > 0);

      console.log(`📋 Saving ${cleanSections.length} sections`);

      await courseApi.update(courseSlug, { sections: cleanSections });

      toast.dismiss();
      console.log(`✅ All ${totalUploads} files uploaded successfully!`);
      return true;
    } catch (error) {
      console.error("❌ Upload error:", error);
      toast.dismiss();
      throw error;
    }
  };

  const validateCourse = () => {
    const newErrors = {};

    if (!courseData.title.trim()) newErrors.title = "Title is required";
    if (!courseData.subtitle.trim())
      newErrors.subtitle = "Subtitle is required";
    if (!courseData.description.trim())
      newErrors.description = "Description is required";
    if (!courseData.category) newErrors.category = "Category is required";
    if (!courseData.price.usd) newErrors.price = "Price is required";
    if (!courseData.thumbnailPreview)
      newErrors.thumbnail = "Thumbnail is required";
    if (courseData.sections.length === 0)
      newErrors.sections = "Add at least one section";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const formData = new FormData();

      // Basic info
      formData.append("title", courseData.title);
      formData.append("subtitle", courseData.subtitle);
      formData.append("description", courseData.description);
      formData.append("category", courseData.category);
      formData.append("level", courseData.level);
      formData.append("price", JSON.stringify(courseData.price));

      // Arrays
      formData.append(
        "requirements",
        JSON.stringify(courseData.requirements.filter((r) => r.trim()))
      );
      formData.append(
        "whatYouWillLearn",
        JSON.stringify(courseData.whatYouWillLearn.filter((w) => w.trim()))
      );
      formData.append(
        "targetAudience",
        JSON.stringify(courseData.targetAudience.filter((t) => t.trim()))
      );

      // Thumbnail
      if (courseData.thumbnail) {
        formData.append("thumbnail", courseData.thumbnail);
      }

      let response;
      if (isEditing) {
        response = await courseApi.update(slug, formData);
      } else {
        response = await courseApi.create(formData);
      }

      toast.success(
        `Course ${isEditing ? "updated" : "created"} successfully!`
      );
      navigate("/instructor");
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.error || "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    // Step 1: Validate basic course information
    if (!validateCourse()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Step 2: Check for incomplete lessons
    const incompleteLessons = [];
    const emptyTitleLessons = [];
    const noVideoLessons = [];

    courseData.sections.forEach((section, sIdx) => {
      section.lessons?.forEach((lesson, lIdx) => {
        const hasTitle = lesson.title && lesson.title.trim() !== "";
        // ✅ FIX: Check for EITHER videoFile (new upload) OR videoId (existing)
        const hasVideo =
          lesson.videoFile || (lesson.videoId && lesson.videoId.trim() !== "");

        if (!hasTitle && hasVideo) {
          emptyTitleLessons.push(
            `Section "${section.title}" → Lesson ${lIdx + 1}`
          );
        }

        if (hasTitle && !hasVideo) {
          noVideoLessons.push(
            `"${lesson.title}" in section "${section.title}"`
          );
        }

        if (!hasTitle && !hasVideo) {
          incompleteLessons.push(
            `Section "${section.title}" → Lesson ${
              lIdx + 1
            } (no title or video)`
          );
        }
      });
    });

    // Step 3: Show appropriate error/warning messages
    if (emptyTitleLessons.length > 0) {
      toast.error(
        `❌ These lessons have videos but no titles. Please add titles:\n\n${emptyTitleLessons.join(
          "\n"
        )}`,
        { duration: 6000 }
      );
      return;
    }

    if (noVideoLessons.length > 0) {
      toast.error(
        `❌ These lessons have titles but no videos. Please upload videos:\n\n${noVideoLessons.join(
          "\n"
        )}`,
        { duration: 6000 }
      );
      return;
    }

    if (incompleteLessons.length > 0) {
      const proceed = window.confirm(
        `⚠️ These incomplete lessons will be skipped:\n\n${incompleteLessons.join(
          "\n"
        )}\n\nContinue?`
      );

      if (!proceed) {
        return;
      }
    }

    // Step 4: Check if there are any valid lessons
    const validLessonsCount = courseData.sections.reduce((count, section) => {
      return (
        count +
        (section.lessons?.filter((lesson) => {
          const hasTitle = lesson.title?.trim();
          const hasVideo = lesson.videoFile || lesson.videoId?.trim();
          return hasTitle && hasVideo;
        }).length || 0)
      );
    }, 0);

    if (validLessonsCount === 0) {
      toast.error(
        "❌ You need at least one complete lesson (with title and video) to publish the course"
      );
      return;
    }

    setSaving(true);

    try {
      console.log("🚀 Publishing course...");

      // Step 5: First, save basic course info and get slug
      let courseSlug = slug;

      if (!isEditing) {
        // Create new course first
        const basicCourseData = {
          title: courseData.title,
          subtitle: courseData.subtitle,
          description: courseData.description,
          category: courseData.category,
          subcategories: courseData.subcategories,
          level: courseData.level,
          price: courseData.price,
          requirements: courseData.requirements.filter((r) => r.trim()),
          whatYouWillLearn: courseData.whatYouWillLearn.filter((w) => w.trim()),
          targetAudience: courseData.targetAudience.filter((t) => t.trim()),
          acceptedPayments: courseData.acceptedPayments,
          escrowSettings: courseData.escrowSettings,
        };

        console.log("📝 Creating new course...");
        const createResponse = await courseApi.create(basicCourseData);
        courseSlug = createResponse.data.course.slug;
        console.log(`✅ Course created with slug: ${courseSlug}`);
      } else {
        // Update existing course info
        console.log("📝 Updating course info...");
        await courseApi.update(courseSlug, {
          title: courseData.title,
          subtitle: courseData.subtitle,
          description: courseData.description,
          category: courseData.category,
          level: courseData.level,
          price: courseData.price,
          requirements: courseData.requirements.filter((r) => r.trim()),
          whatYouWillLearn: courseData.whatYouWillLearn.filter((w) => w.trim()),
          targetAudience: courseData.targetAudience.filter((t) => t.trim()),
          acceptedPayments: courseData.acceptedPayments,
          escrowSettings: courseData.escrowSettings,
        });
      }

      // Step 6: Upload all files (thumbnail, videos, resources)
      await uploadAllFiles(courseSlug);

      // Step 7: Publish the course
      await courseApi.publish(courseSlug);

      toast.success("🎉 Course published successfully!");

      // Step 8: Redirect to course page
      setTimeout(() => {
        navigate(`/courses/${courseSlug}`);
      }, 1500);
    } catch (error) {
      console.error("Publish error:", error);
      console.error("Error response:", error.response?.data);

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to publish course";

      toast.error(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "basics", label: "Basic Info", icon: FileText },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "curriculum", label: "Curriculum", icon: Video },
    { id: "details", label: "Course Details", icon: Target },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

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
            {isEditing && (
              <button
                onClick={() => navigate(`/courses/${slug}`)}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition font-medium flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}
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
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
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

              {/* Subcategory dropdown - full width below category/level */}
              {/* Multi-select Subcategories - appears after category is selected */}
              {courseData.category && subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Subcategories (Optional - Max 5)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Select up to 5 subcategories that best describe your course
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {subcategories.map((sub) => {
                      const isSelected = (
                        courseData.subcategories || []
                      ).includes(sub); // ← Add || [] here
                      const canSelect =
                        (courseData.subcategories || []).length < 5;

                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              // Remove subcategory
                              handleInputChange(
                                "subcategories",
                                courseData.subcategories.filter(
                                  (s) => s !== sub
                                )
                              );
                            } else if (canSelect) {
                              // Add subcategory
                              handleInputChange("subcategories", [
                                ...courseData.subcategories,
                                sub,
                              ]);
                            }
                          }}
                          disabled={!isSelected && !canSelect}
                          className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition ${
                            isSelected
                              ? "border-primary-400 bg-primary-400/10 text-primary-400"
                              : !canSelect
                              ? "border-gray-200 dark:border-gray-800 text-gray-400 cursor-not-allowed opacity-50"
                              : "border-gray-200 dark:border-gray-800 hover:border-primary-400 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex-1">{sub}</span>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-primary-400 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {courseData.subcategories &&
                    courseData.subcategories.length > 0 && (
                      <div className="mt-3 flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">
                          Selected: {courseData.subcategories.length}/5
                        </span>
                        <button
                          type="button"
                          onClick={() => handleInputChange("subcategories", [])}
                          className="text-red-500 hover:text-red-600 font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                </div>
              )}

              <ThumbnailUploadDraft
                currentFile={courseData.thumbnailFile}
                currentPreview={courseData.thumbnailPreview}
                onFileSelect={(file, preview) => {
                  setCourseData({
                    ...courseData,
                    thumbnailFile: file,
                    thumbnailPreview: preview,
                    // originalThumbnailUrl stays the same - we need it for deletion!
                  });
                }}
                error={errors.thumbnail}
              />
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
                    value={courseData.price.usd} // ✅ CORRECT - access .usd
                    onChange={(e) => handlePriceChange("usd", e.target.value)}
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
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Course Price ($FDR){" "}
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    F
                  </span>
                  <input
                    type="number"
                    value={courseData.price.fdr}
                    onChange={(e) => handlePriceChange("fdr", e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to only accept USD
                </p>
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
                    Organize your course into sections and lessons
                  </p>
                </div>
                <button
                  onClick={addSection}
                  className="px-4 py-2 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Section</span>
                </button>
              </div>

              {errors.sections && (
                <div className="p-4 bg-red-500/10 border-2 border-red-500/20 rounded-xl flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-500 text-sm">{errors.sections}</p>
                </div>
              )}

              {courseData.sections.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    No sections yet. Start building your course!
                  </p>
                  <button
                    onClick={addSection}
                    className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
                  >
                    Add Your First Section
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseData.sections.map((section, sectionIndex) => (
                    <div
                      key={section.id || section._id}
                      className="border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                    >
                      <div className="bg-gray-50 dark:bg-gray-800 p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) =>
                              updateSection(
                                section.id || section._id,
                                "title",
                                e.target.value
                              )
                            }
                            placeholder="Section Title (e.g., Getting Started)"
                            className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 font-bold"
                          />
                          <button
                            onClick={() =>
                              setExpandedSection(
                                expandedSection === (section.id || section._id)
                                  ? null
                                  : section.id || section._id
                              )
                            }
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                          >
                            {expandedSection === (section.id || section._id) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              deleteSection(section.id || section._id)
                            }
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {expandedSection === (section.id || section._id) && (
                          <div className="space-y-4">
                            <textarea
                              value={section.description}
                              onChange={(e) =>
                                updateSection(
                                  section.id || section._id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Section description (optional)"
                              rows={2}
                              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm resize-none"
                            />

                            {/* Lessons */}
                            <div className="space-y-3">
                              {(section.lessons || []).map(
                                (lesson, lessonIndex) => (
                                  <div
                                    key={lesson.id || lesson._id}
                                    className="bg-white dark:bg-gray-900 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700"
                                  >
                                    {/* Lesson Header */}
                                    <div className="flex items-center space-x-3 mb-3">
                                      <Video className="w-4 h-4 text-gray-400" />
                                      <input
                                        type="text"
                                        value={lesson.title}
                                        onChange={(e) =>
                                          updateLesson(
                                            section.id || section._id,
                                            lesson.id || lesson._id,
                                            "title",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Lesson title *" // Add asterisk to show it's required
                                        className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-medium ${
                                          !lesson.title ||
                                          lesson.title.trim() === ""
                                            ? "border-red-500" // Red border if empty
                                            : "border-gray-200 dark:border-gray-700"
                                        }`}
                                        required
                                      />
                                      {!lesson.title && (
                                        <p className="text-xs text-red-500 mt-1">
                                          Title is required
                                        </p>
                                      )}
                                      <button
                                        onClick={() =>
                                          deleteLesson(
                                            section.id || section._id,
                                            lesson.id || lesson._id
                                          )
                                        }
                                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Lesson Description */}
                                    <textarea
                                      value={lesson.description}
                                      onChange={(e) =>
                                        updateLesson(
                                          section.id || section._id,
                                          lesson.id || lesson._id,
                                          "description",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Lesson description (optional)"
                                      rows={2}
                                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm mb-3 resize-none"
                                    />

                                    {/* Video Upload */}
                                    {/* Video Upload */}
                                    <div className="mb-3">
                                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Lesson Video
                                      </label>
                                      <VideoUploadDraft
                                        lessonTitle={
                                          lesson.title || "Untitled Lesson"
                                        }
                                        currentFile={lesson.videoFile}
                                        currentVideoUrl={lesson.videoUrl}
                                        onFileSelect={(file) => {
                                          updateLesson(
                                            section.id || section._id,
                                            lesson.id || lesson._id,
                                            "videoFile",
                                            file
                                          );
                                        }}
                                      />
                                    </div>

                                    {/* Preview Toggle */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3">
                                      <div className="flex items-center space-x-2">
                                        <Eye className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          Free Preview
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          (Allow non-enrolled students to watch)
                                        </span>
                                      </div>
                                      <button
                                        onClick={() =>
                                          updateLesson(
                                            section.id || section._id,
                                            lesson.id || lesson._id,
                                            "isPreview",
                                            !lesson.isPreview
                                          )
                                        }
                                        className={`relative w-12 h-6 rounded-full transition ${
                                          lesson.isPreview
                                            ? "bg-primary-400"
                                            : "bg-gray-300 dark:bg-gray-700"
                                        }`}
                                      >
                                        <div
                                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                            lesson.isPreview
                                              ? "translate-x-6"
                                              : ""
                                          }`}
                                        />
                                      </button>
                                    </div>

                                    {/* Resources */}
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Lesson Resources (Optional)
                                      </label>
                                      <ResourceUploadDraft
                                        currentFile={lesson.resourceFile}
                                        currentResource={lesson.resources?.[0]}
                                        onFileSelect={(file) => {
                                          updateLesson(
                                            section.id || section._id,
                                            lesson.id || lesson._id,
                                            "resourceFile",
                                            file
                                          );
                                        }}
                                      />
                                    </div>
                                  </div>
                                )
                              )}

                              <button
                                onClick={() =>
                                  addLesson(section.id || section._id)
                                }
                                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-primary-400 transition text-sm font-medium text-gray-500 hover:text-primary-400 flex items-center justify-center space-x-2"
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
