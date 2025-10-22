import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { purchaseApi, courseApi, reviewApi, noteApi } from "@services/api";
import ReviewModal from "@components/ReviewModal";
import VideoPlayer from "@components/VideoPlayer";
import { useWallet } from "@contexts/WalletContext";
import CourseQuestionsModal from "@components/CourseQuestionsModal";
import CourseCompletionModal from "@components/CourseCompletionModal";
import toast from "react-hot-toast";
import {
  Play,
  CheckCircle,
  Circle,
  Lock,
  Award,
  Download,
  FileText,
  Clock,
  Star,
  ChevronLeft,
  ChevronDown,
  Share2,
  Menu,
  X,
  Sparkles,
  Trophy,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Target,
  User,
  Save,
  Edit3,
  Plus,
  Trash2,
  Shield,
  Zap,
} from "lucide-react";

const CourseLearningPage = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useWallet();

  const [course, setCourse] = useState(null);
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [expandedModules, setExpandedModules] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [note, setNote] = useState("");
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [totalCourseDuration, setTotalCourseDuration] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedCertificateId, setCompletedCertificateId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [videoSessionToken, setVideoSessionToken] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatLessonDuration = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const loadNotes = async () => {
      if (!course || !user) return;

      const allLessons = course.modules.flatMap((module) => module.lessons);
      const currentLesson = allLessons[currentLessonIndex];

      if (!currentLesson) return;

      try {
        setLoadingNotes(true);
        const response = await noteApi.getNotes(course.id, currentLesson.id);
        setNotes(response.data.notes || []);
      } catch (error) {
        console.error("Error loading notes:", error);
      } finally {
        setLoadingNotes(false);
      }
    };

    loadNotes();
  }, [course, currentLessonIndex, user]);

  useEffect(() => {
    const createSession = async () => {
      if (!courseSlug) return;

      try {
        console.log("🎬 Creating video session for:", courseSlug);
        const sessionResponse = await courseApi.createVideoSession(courseSlug);
        setVideoSessionToken(sessionResponse.data.sessionToken);
        console.log(
          "✅ Video session created:",
          sessionResponse.data.sessionToken
        );
      } catch (error) {
        console.error("❌ Failed to create video session:", error);
        toast.error("Failed to initialize video player");
      }
    };

    createSession();
  }, [courseSlug]);

  useEffect(() => {
    const loadCourseData = async () => {
      console.log("🚀 Starting loadCourseData...");
      console.log("👤 User:", user);
      console.log("📚 Course Slug:", courseSlug);

      if (!user) {
        console.log("❌ No user found, redirecting...");
        toast.error("Please log in to access this course");
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        console.log("⏳ Loading set to true");

        console.log("🔍 Fetching course by slug:", courseSlug);
        const courseResponse = await courseApi.getBySlug(courseSlug);
        const courseData = courseResponse.data.course;

        console.log("✅ Course data received:", courseData);

        if (
          !courseResponse.data.hasPurchased &&
          !courseResponse.data.isInstructor
        ) {
          console.log("❌ User has not purchased and is not instructor");
          toast.error("You need to purchase this course first");
          navigate(`/courses/${courseSlug}`);
          return;
        }

        console.log("🔍 Fetching purchase data for course:", courseData._id);
        const purchaseResponse = await purchaseApi.getPurchase(courseData._id);
        const purchaseData = purchaseResponse.data.purchase;

        console.log("✅ Purchase data received:", purchaseData);

        const transformedCourse = {
          id: courseData._id,
          slug: courseData.slug || courseSlug,
          title: courseData.title,
          instructor: {
            username: courseData.instructor?.username || "Unknown",
            avatar: courseData.instructor?.avatar || "",
            verified: courseData.instructor?.instructorVerified || false,
            badges: courseData.instructor?.badges || ["Instructor"],
            badgeColor: "purple",
          },
          thumbnail: courseData.thumbnail,
          progress: purchaseData.progress || 0,
          totalLessons: courseData.totalLessons || 0,
          completedLessons: purchaseData.completedLessons?.length || 0,
          totalDuration: formatDuration(courseData.totalDuration || 0),
          certificate: courseData.hasCertificate || true,
          modules:
            courseData.sections?.map((section, idx) => ({
              id: section._id || idx,
              title: section.title,
              duration: formatDuration(
                section.lessons.reduce((sum, l) => sum + (l.duration || 0), 0)
              ),
              lessons: section.lessons.map((lesson) => ({
                id: lesson._id,
                title: lesson.title,
                duration: formatLessonDuration(lesson.duration || 0),
                type: "video",
                videoUrl: lesson.videoUrl,
                description: lesson.description || "",
                resources: lesson.resources || [],
                locked: false,
              })),
            })) || [],
        };

        console.log("🔄 Transformed course:", transformedCourse);
        console.log("📊 Total modules:", transformedCourse.modules.length);

        setCourse(transformedCourse);
        setPurchase(purchaseData);
        setCompletedLessons(purchaseData.completedLessons || []);

        const totalDuration = transformedCourse.modules.reduce(
          (total, module) => {
            return (
              total +
              module.lessons.reduce((sum, lesson) => {
                const [mins, secs] = (lesson.duration || "0:0")
                  .split(":")
                  .map(Number);
                return sum + (mins * 60 + (secs || 0));
              }, 0)
            );
          },
          0
        );

        setTotalCourseDuration(totalDuration);
        console.log(`📊 Total course duration: ${totalDuration}s`);

        if (transformedCourse.modules.length > 0) {
          setExpandedModules([transformedCourse.modules[0].id]);
        }

        try {
          const reviewsResponse = await reviewApi.getCourseReviews(
            courseData._id,
            { page: 1, limit: 100 }
          );

          const myReview = reviewsResponse.data.reviews.find(
            (r) => r.user._id === user.id || r.user.username === user.username
          );

          if (myReview) {
            setUserReview(myReview);
          }
        } catch (error) {
          console.error("Error checking user review:", error);
        }

        console.log("✅ Setting loading to false");
        setLoading(false);
      } catch (error) {
        console.error("❌ Error loading course:", error);
        toast.error("Failed to load course");
        setLoading(false);
        navigate("/courses");
      }
    };

    loadCourseData();
  }, [courseSlug, user, navigate]);

  const getBadgeIcon = (badge) => {
    switch (badge?.toLowerCase()) {
      case "kol":
        return <Sparkles className="w-4 h-4" />;
      case "professional":
        return <Shield className="w-4 h-4" />;
      case "expert":
        return <Trophy className="w-4 h-4" />;
      case "creator":
        return <Zap className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const getBadgeColors = (color) => {
    switch (color) {
      case "purple":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "blue":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "green":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "pink":
        return "bg-pink-500/10 text-pink-400 border-pink-500/30";
      default:
        return "bg-primary-400/10 text-primary-400 border-primary-400/30";
    }
  };
  const handleCreateNote = async () => {
    if (!noteContent.trim()) {
      toast.error("Please enter note content");
      return;
    }

    const allLessons = course.modules.flatMap((module) => module.lessons);
    const currentLesson = allLessons[currentLessonIndex];

    try {
      const response = await noteApi.createNote({
        courseId: course.id,
        lessonId: currentLesson.id,
        content: noteContent.trim(),
        timestamp: 0,
      });

      setNotes([response.data.note, ...notes]);
      setNoteContent("");
      toast.success("Note saved!");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to save note");
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!noteContent.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    try {
      const response = await noteApi.updateNote(noteId, {
        content: noteContent.trim(),
      });

      setNotes(notes.map((n) => (n._id === noteId ? response.data.note : n)));
      setEditingNoteId(null);
      setNoteContent("");
      toast.success("Note updated!");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm("Delete this note?")) return;

    try {
      await noteApi.deleteNote(noteId);
      setNotes(notes.filter((n) => n._id !== noteId));
      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const startEditingNote = (note) => {
    setEditingNoteId(note._id);
    setNoteContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setNoteContent("");
  };

  const markAsComplete = async () => {
    if (!course) return;

    const allLessons = course.modules.flatMap((module) => module.lessons);
    const currentLesson = allLessons[currentLessonIndex];

    if (!currentLesson || completedLessons.includes(currentLesson.id)) {
      toast.error("Lesson already completed!");
      return;
    }

    try {
      console.log(`✅ Marking lesson complete`);

      // Check if this is the last lesson BEFORE making the API call
      const isLastLesson = currentLessonIndex === allLessons.length - 1;
      const willCompleteCourse =
        isLastLesson && !completedLessons.includes(currentLesson.id);

      // Show modal IMMEDIATELY if completing the course
      if (willCompleteCourse) {
        setShowCompletionModal(true);
      }

      const response = await purchaseApi.completeLesson({
        purchaseId: purchase._id,
        lessonId: currentLesson.id,
      });

      // Update local state with backend data
      const updatedPurchase = response.data.purchase;
      setCompletedLessons(updatedPurchase.completedLessons || []);
      setPurchase(updatedPurchase);

      // Update course progress display
      setCourse((prev) => ({
        ...prev,
        progress: updatedPurchase.progress,
        completedLessons: updatedPurchase.completedLessons?.length || 0,
      }));

      if (!willCompleteCourse) {
        toast.success("Lesson completed! 🎉");
      }

      // Store certificate ID if available
      if (response.data.certificate) {
        console.log("🎉 COURSE COMPLETED! Certificate generated!");
        console.log("📜 Certificate ID:", response.data.certificate._id);
        setCompletedCertificateId(response.data.certificate._id);
        return;
      }

      // Auto-advance to next lesson if not completed
      if (currentLessonIndex < allLessons.length - 1) {
        setTimeout(() => handleNextLesson(), 1500);
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
      toast.error("Failed to save progress");
      setShowCompletionModal(false); // Close modal on error
    }
  };

  const handleNextLesson = () => {
    if (!course) return;
    const allLessons = course.modules.flatMap((module) => module.lessons);
    if (currentLessonIndex < allLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const handleSelectLesson = (lessonId) => {
    if (!course) return;
    const allLessons = course.modules.flatMap((module) => module.lessons);
    const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);

    if (lessonIndex === -1 || allLessons[lessonIndex].locked) {
      return;
    }

    // ENFORCE SEQUENTIAL LEARNING: Can't skip ahead
    if (lessonIndex > 0) {
      const previousLesson = allLessons[lessonIndex - 1];
      if (!completedLessons.includes(previousLesson.id)) {
        toast.error("Please complete the previous lesson first");
        return;
      }
    }

    setCurrentLessonIndex(lessonIndex);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  console.log("🎯 RENDER CHECK: loading =", loading);
  console.log("🎯 RENDER CHECK: course =", course);

  if (loading) {
    console.log("🔄 RENDERING: Loading state");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    console.log("❌ RENDERING: No course");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Course not found
          </h2>
          <Link
            to="/dashboard"
            className="text-primary-400 hover:text-primary-500"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const allLessons = course.modules.flatMap((module) => module.lessons);
  const currentLessonData = allLessons[currentLessonIndex];

  console.log("🎯 allLessons count:", allLessons.length);
  console.log("🎯 currentLessonIndex:", currentLessonIndex);
  console.log("🎯 currentLessonData:", currentLessonData);

  if (!currentLessonData) {
    console.log("❌ RENDERING: No currentLessonData");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            No lessons available for this course
          </p>
          <Link
            to="/dashboard"
            className="text-primary-400 hover:text-primary-500"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // FIXED: Proper calculation with parentheses
  const totalWatchPercentage =
    totalCourseDuration > 0
      ? (((purchase?.totalWatchTime || 0) / totalCourseDuration) * 100).toFixed(
          1
        )
      : "0";

  console.log("✅ RENDERING: Main content");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/dashboard`)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                  {course.title}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span>
                    {course.completedLessons} of {course.totalLessons} lessons
                  </span>
                  <span>•</span>
                  <span>{course.progress}% complete</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-400 transition text-sm font-medium flex items-center space-x-2">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition lg:hidden"
              >
                {showSidebar ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 w-full">
          <VideoPlayer
            courseSlug={courseSlug}
            courseId={course.id} // ADD THIS LINE
            lessonId={currentLessonData.id}
            lessonTitle={currentLessonData.title}
          />
          <div className="p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentLessonData.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{currentLessonData.duration}</span>
                  </div>
                  <span>•</span>
                  <span>
                    Lesson {currentLessonIndex + 1} of {allLessons.length}
                  </span>
                </div>
              </div>
              <button
                onClick={markAsComplete}
                className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-2 ${
                  completedLessons.includes(currentLessonData.id)
                    ? "bg-green-500/10 text-green-500 border-2 border-green-500/30"
                    : "bg-primary-400 text-black hover:bg-primary-500"
                }`}
              >
                {completedLessons.includes(currentLessonData.id) ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-5 h-5" />
                    <span>Mark Complete</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.username}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {course.instructor.username}
                  </span>
                  {course.instructor.verified && (
                    <Award className="w-4 h-4 text-primary-400" />
                  )}
                  {course.instructor.badges?.map((badge, index) => (
                    <div
                      key={index}
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold border ${getBadgeColors(
                        badge
                      )}`}
                    >
                      {getBadgeIcon(badge)}
                      <span>{badge}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">Course Instructor</p>
              </div>
              <Link
                to={`/instructor/${course.instructor.username}`}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg font-medium hover:border-primary-400 transition flex items-center space-x-2 whitespace-nowrap"
              >
                <User className="w-4 h-4" />
                <span>View Profile</span>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex space-x-6 px-6">
              {[
                { id: "overview", label: "Overview", icon: BookOpen },
                { id: "notes", label: "Notes", icon: FileText },
                { id: "resources", label: "Resources", icon: Download },
                { id: "qa", label: "Q&A", icon: MessageSquare },
                { id: "review", label: "Review", icon: Star },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition ${
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

          <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
            {activeTab === "overview" && (
              <div className="max-w-3xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  About this lesson
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  {currentLessonData.description || "No description available."}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      <span className="font-bold text-sm">Your Progress</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-500">
                      {course.progress}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {course.completedLessons} lessons completed
                    </p>
                  </div>
                  <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-5 h-5 text-green-500" />
                      <span className="font-bold text-sm">
                        Lessons Completed
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      {course.completedLessons}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      out of {course.totalLessons} total
                    </p>
                  </div>
                  {/* ✅ ADD THIS NEW CARD */}
                  <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <span className="font-bold text-sm">Watch Time</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-500">
                      {(() => {
                        const totalSeconds = purchase?.totalWatchTime || 0;
                        if (totalSeconds >= 3600) {
                          return `${Math.floor(
                            totalSeconds / 3600
                          )}h ${Math.floor((totalSeconds % 3600) / 60)}m`;
                        } else if (totalSeconds >= 60) {
                          return `${Math.floor(totalSeconds / 60)}m ${
                            totalSeconds % 60
                          }s`;
                        } else {
                          return `${totalSeconds}s`;
                        }
                      })()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalCourseDuration > 0
                        ? `${Math.round(
                            ((purchase?.totalWatchTime || 0) /
                              totalCourseDuration) *
                              100
                          )}% of course`
                        : "Total watched"}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-primary-400/5 border border-primary-400/20 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary-400" />
                    <span className="font-bold">Smart Contract Escrow</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your payment is held in escrow. Watch less than 20% or under
                    120 minutes to be eligible for a full refund within 14 days.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Take a note for this lesson..."
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                    rows="4"
                  />
                  <div className="flex justify-end space-x-2 mt-3">
                    {editingNoteId && (
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-bold"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={
                        editingNoteId
                          ? () => handleUpdateNote(editingNoteId)
                          : handleCreateNote
                      }
                      disabled={!noteContent.trim()}
                      className="px-4 py-2 bg-primary-400 text-black rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold flex items-center space-x-2"
                    >
                      {editingNoteId ? (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Update</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add Note</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {loadingNotes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mx-auto"></div>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No notes yet. Add your first note above!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note._id}
                        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        <p className="text-gray-900 dark:text-white mb-2 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {new Date(note.createdAt).toLocaleDateString()} at{" "}
                            {new Date(note.createdAt).toLocaleTimeString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditingNote(note)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note._id)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "qa" && (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Course Q&A
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Ask questions and get answers from the instructor
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQuestionsModal(true)}
                    className="px-4 py-2 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition flex items-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Q&A</span>
                  </button>
                </div>

                {/* Preview/Teaser */}
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20 rounded-xl">
                    <div className="flex items-center space-x-3 mb-4">
                      <MessageSquare className="w-8 h-8 text-blue-500" />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          Interactive Learning
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Get help when you need it
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Ask questions about any lesson</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Get direct answers from the instructor</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>See what other students are asking</span>
                      </li>
                    </ul>
                    <button
                      onClick={() => setShowQuestionsModal(true)}
                      className="mt-6 w-full px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
                    >
                      View All Questions & Answers
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                      <MessageSquare className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        Open
                      </div>
                      <div className="text-xs text-gray-500">Q&A Available</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        Fast
                      </div>
                      <div className="text-xs text-gray-500">
                        Instructor Replies
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "resources" && (
              <div className="max-w-3xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  Downloadable Resources
                </h3>
                {currentLessonData.resources &&
                currentLessonData.resources.length > 0 ? (
                  <div className="space-y-3">
                    {currentLessonData.resources.map((resource, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-400/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {resource.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {resource.type}
                            </p>
                          </div>
                        </div>
                        <a
                          href={resource.url}
                          download
                          className="p-2 hover:bg-primary-400/10 rounded-lg transition text-primary-400"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No resources available for this lesson
                  </p>
                )}
              </div>
            )}

            {activeTab === "review" && (
              <div className="max-w-3xl">
                {userReview ? (
                  <div className="border-2 border-primary-400/30 rounded-xl p-6 bg-primary-400/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">Your Review</h3>
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="px-4 py-2 text-sm font-medium text-primary-400 hover:text-primary-500 transition"
                      >
                        Edit Review
                      </button>
                    </div>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < userReview.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <h4 className="font-bold mb-2">{userReview.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {userReview.comment}
                    </p>
                    <p className="text-sm text-gray-500 mt-3">
                      Posted{" "}
                      {new Date(userReview.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center">
                    <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">
                      Share Your Experience
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Help other students by sharing your thoughts about this
                      course.
                    </p>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="px-8 py-4 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
                    >
                      Write a Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showSidebar && (
          <div className="w-full lg:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 lg:sticky lg:top-[89px] lg:h-[calc(100vh-89px)] lg:overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Course Content</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {course.modules.map((module) => (
                  <div
                    key={module.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {module.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {module.lessons.length} lessons • {module.duration}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                          expandedModules.includes(module.id)
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>

                    {expandedModules.includes(module.id) && (
                      <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson.id)}
                            disabled={lesson.locked}
                            className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left ${
                              currentLessonData.id === lesson.id
                                ? "bg-primary-400/10"
                                : ""
                            } ${
                              lesson.locked
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <div className="mt-0.5">
                              {lesson.locked ? (
                                <Lock className="w-5 h-5 text-gray-400" />
                              ) : completedLessons.includes(lesson.id) ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : currentLessonData.id === lesson.id ? (
                                <Play className="w-5 h-5 text-primary-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium mb-1 ${
                                  currentLessonData.id === lesson.id
                                    ? "text-primary-400"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                {lesson.title}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span>{lesson.duration}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {course.certificate && (
                <div className="mt-6 p-4 bg-gradient-to-br from-primary-400/10 to-purple-500/10 border-2 border-primary-400/30 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <Trophy className="w-6 h-6 text-primary-400" />
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        Certificate Progress
                      </h4>
                      <p className="text-sm text-gray-500">
                        {course.progress}% completed
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-purple-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        courseId={course?.id}
        existingReview={userReview}
        onSuccess={async () => {
          try {
            const reviewsResponse = await reviewApi.getCourseReviews(
              course.id,
              { page: 1, limit: 100 }
            );

            const myReview = reviewsResponse.data.reviews.find(
              (r) => r.user._id === user.id || r.user.username === user.username
            );

            if (myReview) {
              setUserReview(myReview);
            } else {
              setUserReview(null);
            }
          } catch (error) {
            console.error("Error refreshing reviews:", error);
          }
        }}
      />
      {showQuestionsModal && (
        <CourseQuestionsModal
          course={course}
          onClose={() => setShowQuestionsModal(false)}
          hasPurchased={true} // They must have purchased to be on this page
        />
      )}
      {/* ✨ ADD THIS NEW COMPLETION MODAL */}
      <CourseCompletionModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          // Optional: Show review modal after completion modal closes
          setShowReviewModal(true);
        }}
        courseTitle={course?.title}
        certificateId={completedCertificateId}
      />
    </div>
  );
};

export default CourseLearningPage;
