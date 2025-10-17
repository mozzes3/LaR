import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { courseApi } from "@services/api";
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
  Heart,
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
  const navigate = useNavigate();
  const { isConnected, user } = useWallet();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState([0]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [currentPreviewVideo, setCurrentPreviewVideo] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("usdt");
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

  // Mock crypto prices (in production, fetch from API)
  const cryptoPrices = {
    eth: 3500,
    btc: 65000,
    sol: 140,
    usdt: 1,
    usdc: 1,
    fdr: 0.85,
  };

  const calculateCryptoPrice = (usdPrice, crypto) => {
    const amount = usdPrice / cryptoPrices[crypto];
    return crypto === "btc" ? amount.toFixed(4) : amount.toFixed(2);
  };

  const paymentOptions = [
    {
      id: "usdt",
      name: "USDT",
      icon: "₮",
      color: "bg-green-500",
      amount: "299.00",
      isStable: true,
    },
    {
      id: "usdc",
      name: "USDC",
      icon: "$",
      color: "bg-blue-500",
      amount: "299.00",
      isStable: true,
    },
    {
      id: "eth",
      name: "ETH",
      icon: "Ξ",
      color: "bg-gradient-to-br from-purple-500 to-blue-500",
      amount: calculateCryptoPrice(299, "eth"),
      isStable: false,
    },
    {
      id: "btc",
      name: "BTC",
      icon: "₿",
      color: "bg-orange-500",
      amount: calculateCryptoPrice(299, "btc"),
      isStable: false,
    },
    {
      id: "sol",
      name: "SOL",
      icon: "S",
      color: "bg-gradient-to-br from-purple-500 to-green-400",
      amount: calculateCryptoPrice(299, "sol"),
      isStable: false,
    },
    {
      id: "fdr",
      name: "$FDR",
      icon: "F",
      color: "bg-gradient-to-br from-primary-400 to-primary-600",
      amount: "299",
      isStable: true,
      badge: "Save 10%",
    },
  ];

  const selectedOption = paymentOptions.find((p) => p.id === selectedPayment);

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
            badge:
              response.data.course.instructor?.expertise?.[0] || "Instructor",
            badgeColor: "blue",
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
        };

        setCourse(courseData);
        setHasPurchased(response.data.hasPurchased || false);
        setIsInstructor(response.data.isInstructor || false);
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

  // Helper function
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
    if (!isConnected) {
      toast.error("Please connect your wallet to enroll");
      return;
    }
    navigate(`/checkout/${course.slug}`, {
      // ← Use slug instead of id
      state: { paymentMethod: selectedPayment },
    });
  };

  const handleAddToWishlist = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    setIsInWishlist(!isInWishlist);
    toast.success(isInWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const handlePreviewLesson = (lesson) => {
    if (lesson.isPreview) {
      setCurrentPreviewVideo(lesson);
      setShowVideoPreview(true);
    } else if (!hasPurchased) {
      toast.error("Please enroll to watch this lesson");
    }
  };

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case "KOL":
        return <Sparkles className="w-4 h-4" />;
      case "Professional":
        return <Shield className="w-4 h-4" />;
      case "Expert":
        return <Trophy className="w-4 h-4" />;
      case "Creator":
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

  const getPreviewLessons = () => {
    const allLessons = course.sections.flatMap((section) =>
      section.lessons.map((lesson) => ({
        ...lesson,
        sectionTitle: section.title,
      }))
    );
    return allLessons.slice(0, 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-12 border-b border-gray-800">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
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
                <span className="text-white truncate">{course.title}</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {course.title}
              </h1>
              <p className="text-xl text-gray-300 mb-6">{course.subtitle}</p>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-primary-400">
                    Bestseller
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-primary-400 fill-primary-400" />
                  <span className="text-lg font-bold">{course.rating}</span>
                  <span className="text-gray-400">
                    ({(course?.totalRatings || 0).toLocaleString()} ratings)
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-gray-400">
                  <Users className="w-5 h-5" />
                  <span>
                    {(course.students || 0).toLocaleString()} students
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.username}
                  className="w-16 h-16 rounded-full ring-2 ring-primary-400/50"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-lg">
                      {course.instructor.username}
                    </span>
                    {course.instructor.verified && (
                      <Award className="w-5 h-5 text-primary-400" />
                    )}
                    <div
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold border ${getBadgeColors(
                        course.instructor.badgeColor
                      )}`}
                    >
                      {getBadgeIcon(course.instructor.badge)}
                      <span>{course.instructor.badge}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    {(course.instructor?.totalStudents || 0).toLocaleString()}{" "}
                    students • {course.instructor?.totalCoursesCreated || 0}{" "}
                    courses
                  </p>
                </div>
                <Link
                  to={`/instructor/${course.instructor.username}`}
                  className="px-4 py-2 border border-white/20 rounded-lg text-sm font-medium hover:bg-white/10 transition"
                >
                  View Profile
                </Link>
              </div>
              <div className="flex items-center space-x-4 mt-6 text-sm text-gray-400">
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
            {/* Right Sidebar - Purchase Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl">
                  {/* Preview Video */}
                  <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setCurrentPreviewVideo({
                          title: "Course Preview",
                          videoUrl: course.previewVideoUrl,
                        });
                        setShowVideoPreview(true);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition group"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition shadow-xl">
                        <Play className="w-8 h-8 text-black ml-1" />
                      </div>
                      <span className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/80 backdrop-blur-sm text-white text-sm font-medium rounded-lg">
                        Preview this course
                      </span>
                    </button>
                  </div>
                  <div className="p-6">
                    {/* Unified Payment Box */}
                    <div className="mb-6">
                      <div className="relative">
                        <button
                          onClick={() => setShowAllPayments(!showAllPayments)}
                          className="w-full p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800 rounded-xl border-2 border-primary-400/30 hover:border-primary-400 transition"
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
                          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-10 max-h-96 overflow-y-auto">
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
                      <div className="flex items-start space-x-2 text-xs p-3 bg-primary-400/5 border border-primary-400/20 rounded-lg mt-3">
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
                    {/* CTA Buttons */}
                    <div className="space-y-3 mb-6">
                      <button
                        onClick={handleEnroll}
                        className="w-full py-4 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-primary-400/50 transition-all transform hover:scale-[1.02]"
                      >
                        Enroll Now
                      </button>
                      <button
                        onClick={handleAddToWishlist}
                        className="w-full py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-medium hover:border-primary-400 transition flex items-center justify-center space-x-2"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isInWishlist ? "fill-red-500 text-red-500" : ""
                          }`}
                        />
                        <span>
                          {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
                        </span>
                      </button>
                    </div>
                    {/* What's Included */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                      <h4 className="font-bold mb-4 text-gray-900 dark:text-white">
                        This course includes:
                      </h4>
                      <ul className="space-y-3">
                        {course.features.map((feature, index) => (
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
                {["overview", "curriculum", "instructor", "reviews"].map(
                  (tab) => (
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
                  )
                )}
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
                    {course.whatYouWillLearn.map((item, index) => (
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
                    {course.requirements.map((req, index) => (
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
                    {course.targetAudience.map((audience, index) => (
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
                    {course.sections.length} sections • {course.totalLessons}{" "}
                    lectures • {course.duration} total
                  </div>
                </div>
                <div className="space-y-4">
                  {course.sections.map((section, sectionIndex) => (
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
                          {section.lessons.length} lectures
                        </span>
                      </button>
                      {expandedSections.includes(sectionIndex) && (
                        <div className="divide-y divide-gray-200 dark:divide-gray-800">
                          {section.lessons.map((lesson) => (
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
                                  {lesson.duration}
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
                    alt={course.instructor.username}
                    className="w-32 h-32 rounded-full ring-4 ring-primary-400/20"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {course.instructor.username}
                      </h2>
                      {course.instructor.verified && (
                        <Award className="w-6 h-6 text-primary-400" />
                      )}
                      <div
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-bold border ${getBadgeColors(
                          course.instructor.badgeColor
                        )}`}
                      >
                        {getBadgeIcon(course.instructor.badge)}
                        <span>{course.instructor.badge}</span>
                      </div>
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
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {course.instructor?.followers || "0"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Followers
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="font-bold mb-2 text-gray-900 dark:text-white">
                        Expertise
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {course.instructor.expertise.map((skill, index) => (
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
                      {course.instructor.socialLinks.twitter && (
                        <a
                          href={course.instructor.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-400 transition"
                        >
                          Twitter
                        </a>
                      )}
                      {course.instructor.socialLinks.website && (
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
                            {lesson.duration}
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
              </div>
            )}
            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                <div className="mb-8 p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
                        {course.rating}
                      </div>
                      <div className="flex items-center justify-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-6 h-6 text-primary-400 fill-primary-400"
                          />
                        ))}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {(course?.totalRatings || 0).toLocaleString()} ratings
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = course.ratingDistribution[rating];
                        const percentage = (count / course.totalRatings) * 100;
                        return (
                          <div
                            key={rating}
                            className="flex items-center space-x-3"
                          >
                            <span className="text-sm w-12">{rating} stars</span>
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-400"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {course.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="pb-6 border-b border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-start space-x-4">
                        <img
                          src={review.user.avatar}
                          alt={review.user.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold">
                                  {review.user.name}
                                </span>
                                {review.user.verified && (
                                  <Award className="w-4 h-4 text-primary-400" />
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? "text-primary-400 fill-primary-400"
                                          : "text-gray-300 dark:text-gray-700"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {review.date}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-3">
                            {review.comment}
                          </p>
                          <button className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition">
                            <ThumbsUp className="w-4 h-4" />
                            <span>Helpful ({review.helpful})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-1"></div>
        </div>
      </div>
      {/* Video Preview Modal */}
      {showVideoPreview && currentPreviewVideo && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">
                {currentPreviewVideo.title}
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
              <iframe
                className="absolute inset-0 w-full h-full"
                src={currentPreviewVideo.videoUrl}
                title={currentPreviewVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;
