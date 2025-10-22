import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { courseApi, reviewApi } from "@services/api";
import CourseQuestionsModal from "@components/CourseQuestionsModal";
import {
  Star,
  Clock,
  Users,
  Award,
  Play,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  Calendar,
  BarChart,
  Share2,
  ShoppingCart,
  Lock,
  Download,
  FileText,
  Trophy,
  Sparkles,
  Shield,
  Zap,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  X,
} from "lucide-react";
import { useWallet } from "@contexts/WalletContext";
import toast from "react-hot-toast";

const CourseDetailPage = () => {
  const { slug } = useParams();
  console.log("📍 URL slug from params:", slug);
  const navigate = useNavigate();
  const { isConnected, user } = useWallet();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState([0]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [currentPreviewVideo, setCurrentPreviewVideo] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("usdt");
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [userReview, setUserReview] = useState(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [previewVideoLoading, setPreviewVideoLoading] = useState(false);

  // Mock crypto prices (in production, fetch from API)
  const cryptoPrices = {
    eth: 3500,
    btc: 65000,
    sol: 140,
    usdt: 1,
    usdc: 1,
    fdr: 1,
  };

  const calculateCryptoPrice = (usdPrice, crypto) => {
    const amount = usdPrice / cryptoPrices[crypto];
    return crypto === "btc" ? amount.toFixed(4) : amount.toFixed(2);
  };

  // Get dynamic payment options based on course price
  const getPaymentOptions = () => {
    if (!course?.price) {
      return [
        {
          id: "usdt",
          name: "USDT",
          icon: "₮",
          color: "bg-green-500",
          amount: "0.00",
          isStable: true,
        },
      ];
    }

    const usdPrice = course.price.usd || 0;

    return [
      {
        id: "usdt",
        name: "USDT",
        icon: "₮",
        color: "bg-green-500",
        amount: usdPrice.toFixed(2),
        isStable: true,
      },
      {
        id: "usdc",
        name: "USDC",
        icon: "$",
        color: "bg-blue-500",
        amount: usdPrice.toFixed(2),
        isStable: true,
      },
      {
        id: "fdr",
        name: "FDR",
        icon: "F",
        color: "bg-primary-500",
        amount: usdPrice.toFixed(2),
        badge: "Earn Cashback",
        isStable: true,
      },
      {
        id: "eth",
        name: "ETH",
        icon: "Ξ",
        color: "bg-indigo-500",
        amount: calculateCryptoPrice(usdPrice, "eth"),
        isStable: false,
      },
      {
        id: "btc",
        name: "BTC",
        icon: "₿",
        color: "bg-orange-500",
        amount: calculateCryptoPrice(usdPrice, "btc"),
        isStable: false,
      },
      {
        id: "sol",
        name: "SOL",
        icon: "◎",
        color: "bg-purple-500",
        amount: calculateCryptoPrice(usdPrice, "sol"),
        isStable: false,
      },
    ];
  };

  const paymentOptions = getPaymentOptions();
  const selectedOption =
    paymentOptions.find((opt) => opt.id === selectedPayment) ||
    paymentOptions[0];

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);

        // Real API call
        const response = await courseApi.getBySlug(slug);

        // Transform data
        const courseData = {
          ...response.data.course,
          id: response.data.course._id,
          slug: response.data.course.slug,
          students: response.data.course.enrollmentCount || 0,
          duration: formatDuration(response.data.course.totalDuration || 0),
          lessons: response.data.course.totalLessons || 0,
          rating: response.data.course.averageRating || 0,
          totalRatings: response.data.course.totalRatings || 0,
          ratingDistribution: response.data.course.ratingDistribution || {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
          reviews: [],
          features: [
            {
              icon: <Clock className="w-5 h-5" />,
              text: `${formatDuration(
                response.data.course.totalDuration || 0
              )} on-demand video`,
            },
            {
              icon: <Download className="w-5 h-5" />,
              text: "Downloadable resources",
            },
            {
              icon: <Trophy className="w-5 h-5" />,
              text: "Certificate of completion",
            },
            {
              icon: <Users className="w-5 h-5" />,
              text: "Lifetime access",
            },
          ],
          instructor: {
            ...response.data.course.instructor,
            verified:
              response.data.course.instructor?.instructorVerified || false,
            totalStudents: response.data.course.instructor?.totalStudents || 0,
            totalCoursesCreated:
              response.data.course.instructor?.totalCoursesCreated || 0,
            rating: response.data.course.instructor?.averageRating || 0,
            followers: "0",
            badges:
              response.data.course.instructor?.badges &&
              response.data.course.instructor.badges.length > 0
                ? response.data.course.instructor.badges
                : ["Instructor"],
            badge: response.data.course.instructor?.badges?.[0] || "Instructor",
            badgeColor: getBadgeColorFromBadge(
              response.data.course.instructor?.badges?.[0] || "Instructor"
            ),
            bio:
              response.data.course.instructor?.bio ||
              response.data.course.instructor?.instructorBio ||
              "",
            expertise: response.data.course.instructor?.expertise || [],
            socialLinks: response.data.course.instructor?.socialLinks || {
              twitter: "",
              website: "",
            },
          },
          lastUpdated: new Date(
            response.data.course.updatedAt
          ).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          language: "English",
        };

        setCourse(courseData);
        setHasPurchased(response.data.hasPurchased || false);
        setIsInstructor(response.data.isInstructor || false);

        // Load Real Instructor Stats
        try {
          const { userApi } = await import("@services/api");
          const statsResponse = await userApi.getInstructorStats(
            response.data.course.instructor.username
          );

          console.log("📊 Instructor stats loaded:", statsResponse.data.stats);

          // Update course with real instructor stats
          setCourse((prev) => ({
            ...prev,
            instructor: {
              ...prev.instructor,
              totalStudents: statsResponse.data.stats.totalStudents,
              totalCoursesCreated: statsResponse.data.stats.totalCoursesCreated,
              rating: statsResponse.data.stats.averageRating,
              totalReviews: statsResponse.data.stats.totalReviews,
            },
          }));
        } catch (statsError) {
          console.error("Error loading instructor stats:", statsError);
          // Continue without stats - not critical
        }

        if (response.data.hasPurchased) {
          setExpandedSections([0, 1, 2]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading course:", error);
        toast.error("Failed to load course");
        setLoading(false);
        navigate("/courses");
      }
    };

    if (slug) {
      loadCourse();
    }
  }, [slug, navigate]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!course) return;

      try {
        setReviewsLoading(true);
        const response = await reviewApi.getCourseReviews(course.id, {
          page: 1,
          limit: 10,
          sort: "helpful",
        });
        setReviews(response.data.reviews);

        if (user) {
          const myReview = response.data.reviews.find(
            (r) => r.user._id === user.id || r.user.username === user.username
          );
          setUserReview(myReview);
        }
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [course, user]);

  const formatLessonDuration = (seconds) => {
    if (!seconds || seconds < 0) return "0s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleEnroll = () => {
    console.log("🛒 handleEnroll called, course:", course);
    console.log("🛒 course.slug:", course?.slug);
    console.log("🛒 slug from params:", slug);

    if (!isConnected) {
      toast.error("Please connect your wallet to enroll");
      return;
    }
    navigate(`/checkout/${slug}`, {
      state: { paymentMethod: selectedPayment },
    });
  };

  const handlePreviewLesson = async (lesson) => {
    // Check if lesson is previewable
    if (!lesson.isPreview && !hasPurchased) {
      toast.error("Please enroll to watch this lesson");
      return;
    }

    try {
      setPreviewVideoLoading(true);
      setShowVideoPreview(true);

      // Create video session first
      const sessionResponse = await courseApi.createVideoSession(slug);
      const sessionToken = sessionResponse.data.sessionToken;

      // Get video URL with session token
      const videoResponse = await courseApi.getLessonVideoWithSession(
        slug,
        lesson._id,
        sessionToken
      );

      setCurrentPreviewVideo({
        ...lesson,
        videoUrl: videoResponse.data.videoUrl,
      });

      setPreviewVideoLoading(false);
    } catch (error) {
      console.error("Error loading preview:", error);
      toast.error("Failed to load video preview");
      setShowVideoPreview(false);
      setPreviewVideoLoading(false);
    }
  };

  const getBadgeIcon = (badge) => {
    switch (badge?.toLowerCase()) {
      case "kol":
        return <Trophy className="w-4 h-4" />;
      case "professional":
        return <Shield className="w-4 h-4" />;
      case "expert":
        return <Sparkles className="w-4 h-4" />;
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

  const getBadgeColorFromBadge = (badge) => {
    switch (badge?.toLowerCase()) {
      case "kol":
        return "purple";
      case "professional":
        return "blue";
      case "expert":
        return "green";
      case "creator":
        return "pink";
      case "instructor":
      default:
        return "primary";
    }
  };

  const getPreviewLessons = () => {
    if (!course?.sections) return [];

    const allLessons = course.sections.flatMap((section) =>
      section.lessons.map((lesson) => ({
        ...lesson,
        sectionTitle: section.title,
      }))
    );

    const previewLessons = allLessons.filter((lesson) => lesson.isPreview);

    return previewLessons.slice(0, 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <Link
            to="/courses"
            className="text-primary-400 hover:text-primary-500"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      {/* Glassmorphism Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary-400/20 via-purple-400/15 to-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/15 via-cyan-400/10 to-green-400/10 rounded-full blur-3xl animate-float-delay-1"></div>
        <div className="absolute bottom-1/4 left-1/3 w-[550px] h-[550px] bg-gradient-to-br from-purple-400/15 via-pink-400/10 to-rose-400/10 rounded-full blur-3xl animate-float-delay-2"></div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float-delay-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 25px) scale(1.05); }
          66% { transform: translate(30px, -20px) scale(0.95); }
        }
        @keyframes float-delay-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, 30px) scale(0.95); }
          66% { transform: translate(-30px, -25px) scale(1.05); }
        }
        .animate-float {
          animation: float 25s ease-in-out infinite;
        }
        .animate-float-delay-1 {
          animation: float-delay-1 30s ease-in-out infinite;
        }
        .animate-float-delay-2 {
          animation: float-delay-2 28s ease-in-out infinite;
        }
      `}</style>

      {/* Hero Section with BREATHTAKING Glassmorphism */}
      <section className="relative py-12 border-b border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
        {/* Enhanced gradient background - Different for light/dark mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-white to-gray-50 dark:from-gray-900/95 dark:via-black/95 dark:to-gray-900/95"></div>

        {/* Multiple glass layers for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_60%)]"></div>

        {/* Animated gradient orbs in hero */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary-400/20 to-purple-400/20 rounded-full blur-3xl opacity-60 animate-pulse-slow"></div>
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/15 to-cyan-400/15 rounded-full blur-3xl opacity-60 animate-pulse-slow"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <Link
                  to="/courses"
                  className="hover:text-primary-400 transition"
                >
                  Courses
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link
                  to={`/courses?category=${course.category}`}
                  className="hover:text-primary-400 transition"
                >
                  {course.category}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 dark:text-white truncate">
                  {course.title}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-gray-900 dark:text-white drop-shadow-lg">
                {course.title}
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 drop-shadow">
                {course.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-primary-400">
                    Bestseller
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-primary-400 fill-primary-400 drop-shadow-lg" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {course.rating}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ({(course?.totalRatings || 0).toLocaleString()} ratings)
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                  <Users className="w-5 h-5" />
                  <span>
                    {(course.students || 0).toLocaleString()} students
                  </span>
                </div>
              </div>

              {/* Enhanced Instructor Card with Glassmorphism */}
              <div className="relative p-4 rounded-xl border border-gray-300/50 dark:border-white/20 backdrop-blur-2xl bg-white/60 dark:bg-white/10 shadow-2xl overflow-hidden">
                {/* Glass layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/15 via-white/20 dark:via-white/5 to-transparent"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 dark:via-white/40 to-transparent"></div>

                <div className="relative z-10 flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={course.instructor.avatar}
                      alt={
                        course.instructor.displayName ||
                        course.instructor.username
                      }
                      className="w-16 h-16 rounded-full ring-2 ring-primary-400/50 shadow-xl"
                    />
                    <div className="absolute inset-0 rounded-full ring-1 ring-gray-300/50 dark:ring-white/30"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {course.instructor.displayName ||
                          course.instructor.username}
                      </span>
                      {course.instructor.verified && (
                        <Award className="w-5 h-5 text-primary-400 drop-shadow-lg" />
                      )}
                      <div
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold border backdrop-blur-xl ${getBadgeColors(
                          course.instructor.badgeColor
                        )}`}
                      >
                        {getBadgeIcon(course.instructor.badge)}
                        <span>{course.instructor.badge}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {(course.instructor?.totalStudents || 0).toLocaleString()}{" "}
                      students • {course.instructor?.totalCoursesCreated || 0}{" "}
                      courses
                    </p>
                  </div>
                  <Link
                    to={`/instructor/${course.instructor.username}`}
                    className="px-4 py-2 border border-gray-300 dark:border-white/30 rounded-lg text-sm font-medium hover:bg-white/20 dark:hover:bg-white/10 transition backdrop-blur-xl text-gray-900 dark:text-white"
                  >
                    View Profile
                  </Link>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Last updated {course.lastUpdated}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <span>{course.language}</span>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Enhanced Purchase Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 dark:border-gray-700/50 backdrop-blur-2xl bg-white/90 dark:bg-gray-900/80 shadow-2xl">
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 dark:from-white/5 via-transparent to-transparent pointer-events-none"></div>

                  {/* Preview Video */}
                  <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    {course.sections?.[0]?.lessons?.[0] && (
                      <button
                        onClick={() => {
                          const firstPreviewLesson = course.sections
                            .flatMap((s) => s.lessons)
                            .find((l) => l.isPreview);

                          if (firstPreviewLesson || isInstructor) {
                            handlePreviewLesson(
                              firstPreviewLesson ||
                                course.sections[0].lessons[0]
                            );
                          } else {
                            toast.error("No preview available for this course");
                          }
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition group"
                      >
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition shadow-2xl">
                          <Play className="w-8 h-8 text-gray-900 ml-1" />
                        </div>
                        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium backdrop-blur-md bg-black/30 px-4 py-2 rounded-lg">
                          Preview this course
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="p-6 relative z-10">
                    {/* Unified Payment Box */}
                    <div className="mb-6">
                      <div className="relative">
                        <button
                          onClick={() => setShowAllPayments(!showAllPayments)}
                          className="w-full p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800 rounded-xl border-2 border-primary-400/30 hover:border-primary-400 transition backdrop-blur-xl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Pay with
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                showAllPayments ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-12 h-12 ${selectedOption.color} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                              >
                                {selectedOption.icon}
                              </div>
                              <div className="text-left">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {selectedOption.amount} {selectedOption.name}
                                </div>
                                {!selectedOption.isStable && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    ≈ ${course.price.usd} USD
                                  </div>
                                )}
                              </div>
                            </div>
                            {selectedOption.badge && (
                              <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg">
                                {selectedOption.badge}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Payment Options Dropdown */}
                        {showAllPayments && (
                          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-10 max-h-96 overflow-y-auto">
                            <div className="space-y-1">
                              {/* Stablecoins Section */}
                              <div className="px-2 py-1">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                                  Stablecoins
                                </div>
                              </div>
                              {paymentOptions
                                .filter((opt) => opt.isStable)
                                .map((option) => (
                                  <button
                                    key={option.id}
                                    onClick={() => {
                                      setSelectedPayment(option.id);
                                      setShowAllPayments(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                                      selectedPayment === option.id
                                        ? "bg-primary-400/10"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className={`w-10 h-10 ${option.color} rounded-lg flex items-center justify-center text-white font-bold shadow-md`}
                                      >
                                        {option.icon}
                                      </div>
                                      <div className="text-left">
                                        <div className="font-bold text-gray-900 dark:text-white">
                                          {option.amount} {option.name}
                                        </div>
                                      </div>
                                    </div>
                                    {option.badge && (
                                      <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-bold rounded">
                                        {option.badge}
                                      </span>
                                    )}
                                  </button>
                                ))}

                              {/* Cryptocurrencies Section */}
                              <div className="px-2 py-1 mt-3">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                                  Cryptocurrencies
                                </div>
                              </div>
                              {paymentOptions
                                .filter((opt) => !opt.isStable)
                                .map((option) => (
                                  <button
                                    key={option.id}
                                    onClick={() => {
                                      setSelectedPayment(option.id);
                                      setShowAllPayments(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                                      selectedPayment === option.id
                                        ? "bg-primary-400/10"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className={`w-10 h-10 ${option.color} rounded-lg flex items-center justify-center text-white font-bold shadow-md`}
                                      >
                                        {option.icon}
                                      </div>
                                      <div className="text-left">
                                        <div className="font-bold text-gray-900 dark:text-white">
                                          {option.amount} {option.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ≈ ${course.price.usd} USD
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cashback Notice */}
                      <div className="flex items-start space-x-2 text-xs p-3 bg-primary-400/5 border border-primary-400/20 rounded-lg mt-3 backdrop-blur-xl">
                        <AlertCircle className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Earn{" "}
                          <span className="font-bold text-primary-400">
                            {Math.floor(course.price.usd)} $FDR
                          </span>{" "}
                          cashback
                        </span>
                      </div>
                    </div>

                    {/* CTA Button - Wishlist Removed */}
                    <div className="space-y-3 mb-6">
                      <button
                        onClick={handleEnroll}
                        className="relative group/btn w-full py-4 rounded-xl font-bold text-lg text-white transition-all transform hover:scale-[1.02] overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                        <div className="absolute inset-0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></div>
                        <span className="relative z-10 drop-shadow-lg">
                          Enroll Now
                        </span>
                      </button>
                    </div>

                    {/* What's Included */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                      <h4 className="font-bold mb-4 text-gray-900 dark:text-white">
                        This course includes:
                      </h4>
                      <ul className="space-y-3">
                        {course.features?.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-3 text-sm"
                          >
                            <div className="text-primary-400 mt-0.5">
                              {feature.icon}
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">
                              {feature.text}
                            </span>
                          </li>
                        ))}
                        {/* Dynamic Refund Period */}
                        <li className="flex items-start space-x-3 text-sm">
                          <div className="text-green-500 mt-0.5">
                            <Shield className="w-5 h-5" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {course.escrowSettings?.refundPeriodDays || 14}-day
                            money-back guarantee
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Share */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800 mt-6">
                      <button className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition">
                        <Share2 className="w-4 h-4" />
                        <span>Share this course</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Tabs Section */}
      <div className="container-custom py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800 mb-8">
              <div className="flex space-x-8">
                {[
                  "overview",
                  "curriculum",
                  "instructor",
                  "reviews",
                  "questions",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 font-medium capitalize transition relative ${
                      activeTab === tab
                        ? "text-primary-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content - Overview */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                    What you'll learn
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {course.whatYouWillLearn?.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    Description
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {course.description}
                  </p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    Requirements
                  </h2>
                  <ul className="space-y-2">
                    {course.requirements?.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {req}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    Who this course is for
                  </h2>
                  <ul className="space-y-2">
                    {course.targetAudience?.map((audience, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {audience}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Curriculum Tab */}
            {activeTab === "curriculum" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Course Content
                  </h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {course.sections?.length} sections • {course.lessons}{" "}
                    lectures • {course.duration} total
                  </div>
                </div>
                <div className="space-y-4">
                  {course.sections?.map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className="border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSection(sectionIndex)}
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <ChevronDown
                            className={`w-5 h-5 transition-transform ${
                              expandedSections.includes(sectionIndex)
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                          <span className="font-bold text-left">
                            {section.title}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {section.lessons?.length} lectures
                        </span>
                      </button>
                      {expandedSections.includes(sectionIndex) && (
                        <div className="divide-y divide-gray-200 dark:divide-gray-800">
                          {section.lessons?.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => handlePreviewLesson(lesson)}
                              disabled={!lesson.isPreview && !hasPurchased}
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition text-left disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <Play
                                  className={`w-4 h-4 ${
                                    lesson.isPreview
                                      ? "text-primary-400"
                                      : "text-gray-400"
                                  }`}
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {lesson.title}
                                </span>
                                {lesson.isPreview && (
                                  <span className="px-2 py-0.5 bg-primary-400/10 text-primary-400 text-xs font-bold rounded">
                                    PREVIEW
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500">
                                  {formatLessonDuration(lesson.duration)}
                                </span>
                                {!lesson.isPreview && !hasPurchased && (
                                  <Lock className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor Tab */}
            {activeTab === "instructor" && (
              <div>
                <div className="flex items-start space-x-6 mb-8">
                  <img
                    src={course.instructor.avatar}
                    alt={
                      course.instructor.displayName ||
                      course.instructor.username
                    }
                    className="w-32 h-32 rounded-full ring-4 ring-primary-400/20"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2 flex-wrap">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {course.instructor.displayName ||
                          course.instructor.username}
                      </h2>
                      {course.instructor.verified && (
                        <Award className="w-6 h-6 text-primary-400" />
                      )}
                      {course.instructor.badges?.map((badge, index) => (
                        <div
                          key={index}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-bold border ${getBadgeColors(
                            getBadgeColorFromBadge(badge)
                          )}`}
                        >
                          {getBadgeIcon(badge)}
                          <span>{badge}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {course.instructor.bio}
                    </p>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {course.instructor?.rating || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Rating
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(
                            course.instructor?.totalStudents || 0
                          ).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Students
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {course.instructor?.totalCoursesCreated || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Courses
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="font-bold mb-2 text-gray-900 dark:text-white">
                        Expertise
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {course.instructor.expertise?.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      {course.instructor.socialLinks?.twitter && (
                        <a
                          href={course.instructor.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-400 transition"
                        >
                          Twitter
                        </a>
                      )}
                      {course.instructor.socialLinks?.website && (
                        <a
                          href={course.instructor.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-400 transition"
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview Lessons */}
                {getPreviewLessons().length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                      Preview Lessons
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {getPreviewLessons().map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => handlePreviewLesson(lesson)}
                          disabled={!lesson.isPreview && !hasPurchased}
                          className="group p-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-start space-x-3 mb-2">
                            <Play
                              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                lesson.isPreview
                                  ? "text-primary-400"
                                  : "text-gray-400"
                              }`}
                            />
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-400 transition mb-1">
                                {lesson.title}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {lesson.sectionTitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pl-8">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatLessonDuration(lesson.duration)}
                            </span>
                            {lesson.isPreview && (
                              <span className="px-2 py-0.5 bg-primary-400/10 text-primary-400 text-xs font-bold rounded">
                                FREE
                              </span>
                            )}
                            {!lesson.isPreview && !hasPurchased && (
                              <Lock className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Rating Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-5xl font-bold">
                          {course.rating?.toFixed(1) || "0.0"}
                        </span>
                        <div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-6 h-6 ${
                                  i < Math.floor(course.rating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {course.totalRatings || 0} ratings
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="mt-6 space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = course.ratingDistribution?.[stars] || 0;
                      const percentage =
                        course.totalRatings > 0
                          ? (count / course.totalRatings) * 100
                          : 0;

                      return (
                        <div
                          key={stars}
                          className="flex items-center space-x-3"
                        >
                          <span className="text-sm w-16 text-gray-600 dark:text-gray-400">
                            {stars} star
                          </span>
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-primary-400/30 transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={
                                review.user?.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user?.username}`
                              }
                              alt={review.user?.username}
                              className="w-12 h-12 rounded-full"
                            />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {review.user?.username}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span>•</span>
                                <span>
                                  {new Date(
                                    review.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                          {review.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                          {review.comment}
                        </p>

                        <div className="flex items-center space-x-4 text-sm">
                          <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-400 transition">
                            <ThumbsUp className="w-4 h-4" />
                            <span>Helpful ({review.helpfulCount || 0})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No reviews yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === "questions" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Questions & Answers
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {hasPurchased || isInstructor
                        ? "Ask questions and get answers from the instructor"
                        : "Preview student questions (purchase course to ask your own)"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQuestionsModal(true)}
                    className="px-4 py-2 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition flex items-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      {hasPurchased || isInstructor
                        ? "Open Q&A"
                        : "View Questions"}
                    </span>
                  </button>
                </div>

                {hasPurchased || isInstructor ? (
                  <div className="border-2 border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
                    <MessageSquare className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      Ask Questions & Get Answers
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Have questions about the course? Ask here and get direct
                      answers from the instructor. See what other students are
                      asking too!
                    </p>
                    <button
                      onClick={() => setShowQuestionsModal(true)}
                      className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
                    >
                      Open Q&A Section
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/20 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <Lock className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                            Purchase Required to Ask Questions
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            You can browse existing questions, but you'll need
                            to enroll in this course to ask your own questions
                            and get answers from the instructor.
                          </p>
                          <button
                            onClick={() => navigate(`/checkout/${course.slug}`)}
                            className="px-4 py-2 bg-primary-400 text-black rounded-lg font-bold hover:bg-primary-500 transition"
                          >
                            Enroll Now to Ask Questions
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-2 border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Browse Student Questions
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        See what other students are asking about this course
                      </p>
                      <button
                        onClick={() => setShowQuestionsModal(true)}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                      >
                        View Questions (Read Only)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="lg:col-span-1"></div>
        </div>
      </div>

      {/* Video Preview Modal */}
      {showVideoPreview && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">
                {currentPreviewVideo?.title || "Loading..."}
              </h3>
              <button
                onClick={() => {
                  setShowVideoPreview(false);
                  setCurrentPreviewVideo(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="relative pt-[56.25%] bg-black rounded-xl overflow-hidden">
              {previewVideoLoading || !currentPreviewVideo?.videoUrl ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Loading video...</p>
                  </div>
                </div>
              ) : (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={currentPreviewVideo.videoUrl}
                  title={currentPreviewVideo.title}
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </div>
        </div>
      )}

      {showQuestionsModal && (
        <CourseQuestionsModal
          course={course}
          onClose={() => setShowQuestionsModal(false)}
          hasPurchased={hasPurchased || isInstructor}
        />
      )}
    </div>
  );
};

export default CourseDetailPage;
