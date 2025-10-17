import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { purchaseApi, courseApi, reviewApi } from "@services/api";
import ReviewModal from "@components/ReviewModal";
import VideoPlayer from "@components/VideoPlayer";
import { useWallet } from "@contexts/WalletContext";
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
  BookOpen,
  TrendingUp,
  Target,
  User,
} from "lucide-react";

const CourseLearningPage = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useWallet();

  // State declarations
  const [course, setCourse] = useState(null);
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [watchTime, setWatchTime] = useState(0);
  const [expandedModules, setExpandedModules] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [note, setNote] = useState("");
  const [totalCourseDuration, setTotalCourseDuration] = useState(0);

  // Helper functions
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

  // Load course data
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
          slug: courseData.slug,
          title: courseData.title,
          instructor: {
            username: courseData.instructor?.username || "Unknown",
            avatar: courseData.instructor?.avatar || "",
            verified: courseData.instructor?.instructorVerified || false,
            badge: courseData.instructor?.expertise?.[0] || "Instructor",
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
                duration: formatLessonDuration(lesson.duration),
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
        console.log(
          "📋 Modules detail:",
          JSON.stringify(transformedCourse.modules, null, 2)
        );
        transformedCourse.modules.forEach((module, idx) => {
          console.log(
            `📦 Module ${idx}:`,
            module.title,
            `- ${module.lessons.length} lessons`
          );
          module.lessons.forEach((lesson, lIdx) => {
            console.log(`  📹 Lesson ${lIdx}:`, lesson.title, lesson.id);
          });
        });
        setCourse(transformedCourse);
        setPurchase(purchaseData);
        setCompletedLessons(purchaseData.completedLessons || []);

        // Calculate total course duration
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

        // Check for existing review
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
        console.error("❌ Error details:", error.response?.data);
        toast.error("Failed to load course");
        setLoading(false);
        navigate("/courses");
      }
    };

    loadCourseData();
  }, [courseSlug, user, navigate]);

  useEffect(() => {
    if (!course?.modules || course.modules.length === 0) return;
    const allLessons = course.modules.flatMap((module) => module.lessons);
    const currentLesson = allLessons[currentLessonIndex];
    if (!currentLesson?.id) return;

    const watchInterval = setInterval(() => {
      setWatchTime((prev) => prev + 10);
    }, 10000);

    return () => clearInterval(watchInterval);
  }, [course, currentLessonIndex]);

  useEffect(() => {
    setWatchTime(0);
  }, [currentLessonIndex]);

  const markAsComplete = async () => {
    if (!course) return;

    const allLessons = course.modules.flatMap((module) => module.lessons);
    const currentLesson = allLessons[currentLessonIndex];

    if (!currentLesson || completedLessons.includes(currentLesson.id)) {
      return;
    }

    const [mins, secs] = (currentLesson.duration || "0:0")
      .split(":")
      .map(Number);
    const lessonDurationInSeconds = mins * 60 + (secs || 0);
    const minWatchPercentage = 0.8;
    const requiredWatchTime = lessonDurationInSeconds * minWatchPercentage;

    if (watchTime < requiredWatchTime && lessonDurationInSeconds > 0) {
      toast.error(
        `Please watch at least ${Math.round(
          minWatchPercentage * 100
        )}% of the video`
      );
      return;
    }

    try {
      await purchaseApi.completeLesson({
        purchaseId: purchase._id,
        lessonId: currentLesson.id,
        watchTime: watchTime,
      });

      const newCompletedLessons = [...completedLessons, currentLesson.id];
      setCompletedLessons(newCompletedLessons);

      const totalLessons = allLessons.length;
      const newProgress = Math.round(
        (newCompletedLessons.length / totalLessons) * 100
      );

      setCourse((prev) => ({
        ...prev,
        progress: newProgress,
        completedLessons: newCompletedLessons.length,
      }));

      toast.success("Lesson completed! 🎉");
      setWatchTime(0);

      if (currentLessonIndex < allLessons.length - 1) {
        setTimeout(() => handleNextLesson(), 1500);
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
      toast.error("Failed to save progress");
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
    if (lessonIndex !== -1 && !allLessons[lessonIndex].locked) {
      setCurrentLessonIndex(lessonIndex);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  if (loading) {
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
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

  if (!currentLessonData) {
    console.log("❌ EARLY RETURN: No currentLessonData");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No lessons available
          </p>
          <Link
            to="/dashboard"
            className="text-primary-400 hover:text-primary-500 mt-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  const totalWatchPercentage =
    totalCourseDuration > 0
      ? ((purchase?.totalWatchTime || 0 / totalCourseDuration) * 100).toFixed(1)
      : "0";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header and other JSX remains the same */}
      {/* ... The rest of your component's JSX */}
    </div>
  );
};

export default CourseLearningPage;
