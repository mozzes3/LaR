import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Play,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  X,
  SlidersHorizontal,
  Sparkles,
  Shield,
  Zap,
  Trophy,
  BookOpen,
  Code,
  Palette,
  MessageSquare,
  TrendingUp as Fire,
  Coins,
  ChevronUp,
} from "lucide-react";
import { courseApi, categoryApi } from "@services/api";
import toast from "react-hot-toast";

const CoursesPage = () => {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("browse");
  const [categories, setCategories] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: [],
    level: "",
    minPrice: "",
    maxPrice: "",
    rating: "",
    sort: "newest",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const categoryList = [
    {
      id: "nft",
      name: "NFT Creation",
      icon: <Palette className="w-5 h-5" />,
      description: "Learn to create, mint, and sell NFTs",
      color: "from-pink-500 to-rose-500",
    },
    {
      id: "smart-contracts",
      name: "Smart Contracts",
      icon: <Code className="w-5 h-5" />,
      description: "Master Solidity and blockchain development",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "marketing",
      name: "Marketing",
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Grow your Web3 project with proven strategies",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "community",
      name: "Community Building",
      icon: <MessageSquare className="w-5 h-5" />,
      description: "Build engaged Discord and social communities",
      color: "from-purple-500 to-violet-500",
    },
    {
      id: "defi",
      name: "DeFi",
      icon: <Coins className="w-5 h-5" />,
      description: "Master decentralized finance protocols",
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "development",
      name: "Web3 Development",
      icon: <Code className="w-5 h-5" />,
      description: "Build full-stack decentralized applications",
      color: "from-indigo-500 to-blue-500",
    },
  ];

  const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
  ];

  // Sync URL search param with filters
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch && urlSearch !== filters.search) {
      setFilters((prev) => ({ ...prev, search: urlSearch }));
      setViewMode("all");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Fetch categories error:", error);
    }
  };

  // Fetch courses whenever filters change
  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);

      // Real API call
      const response = await courseApi.getAll({
        search: filters.search,
        category:
          Array.isArray(filters.category) && filters.category.length > 0
            ? filters.category.join(",")
            : "",
        level: filters.level === "All Levels" ? "" : filters.level,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        sort: filters.sort,
        page: 1,
        limit: 100,
      });

      // Transform backend data to match frontend expectations
      const transformedCourses = (response.data.courses || []).map(
        (course) => ({
          id: course._id,
          slug: course.slug,
          title: course.title,
          subtitle: course.subtitle,
          thumbnail: course.thumbnail,
          price: course.price,
          rating: course.averageRating || 0,
          totalRatings: course.totalRatings || 0,
          students: course.enrollmentCount || 0,
          duration: formatDuration(course.totalDuration || 0),
          category: course.category,
          subcategories: course.subcategories || [],
          level: course.level,
          trending: course.enrollmentCount > 500,
          featured: course.averageRating >= 4.8,
          lessons: course.totalLessons || 0,
          lastUpdated: formatDate(course.updatedAt),
          language: "English",
          whatYouWillLearn: course.whatYouWillLearn || [],
          instructor: {
            name:
              course.instructor?.displayName ||
              course.instructor?.username ||
              "Unknown",
            username: course.instructor?.username || "Unknown",
            avatar:
              course.instructor?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${course._id}`,
            verified: course.instructor?.instructorVerified || false,
            followers: "0",
            badges:
              course.instructor?.badges && course.instructor.badges.length > 0
                ? course.instructor.badges
                : ["Instructor"], // ✅ Badges array
            badge: course.instructor?.badges?.[0] || "Instructor", // Single for compatibility
            badgeColor: getBadgeColorFromBadge(
              course.instructor?.badges?.[0] || "Instructor"
            ),
          },
        })
      );

      setCourses(transformedCourses);
    } catch (error) {
      console.error("Fetch courses error:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0h 0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (date) => {
    const days = Math.floor(
      (new Date() - new Date(date)) / (1000 * 60 * 60 * 24)
    );
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const handleFilterChange = (key, value) => {
    if (key === "category") {
      setFilters((prev) => {
        const categories = Array.isArray(prev.category) ? prev.category : [];
        const isSelected = categories.includes(value);
        return {
          ...prev,
          category: isSelected
            ? categories.filter((c) => c !== value)
            : [...categories, value],
        };
      });
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: [],
      level: "",
      minPrice: "",
      maxPrice: "",
      rating: "",
      sort: "newest",
    });
  };

  const getBadgeIcon = (badge) => {
    switch (badge?.toLowerCase()) {
      case "kol":
        return <Trophy className="w-3 h-3" />;
      case "professional":
        return <Shield className="w-3 h-3" />;
      case "expert":
        return <Sparkles className="w-3 h-3" />;
      case "creator":
        return <Zap className="w-3 h-3" />;
      case "instructor":
      default:
        return <Award className="w-3 h-3" />;
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

  const featuredCourses = courses.filter((c) => c.featured);
  const trendingCourses = courses.filter((c) => c.trending);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      {/* MASSIVE GLOWING ORBS - BODY BACKGROUND ONLY */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Light Mode - HUGE Visible Glowing Orbs */}
        <div className="absolute top-[50px] left-[-20%] w-[2000px] h-[2000px] bg-gradient-to-br from-primary-300/35 via-primary-400/18 to-transparent rounded-full blur-3xl animate-float dark:opacity-0"></div>
        <div className="absolute top-[400px] right-[-25%] w-[2200px] h-[2200px] bg-gradient-to-br from-purple-300/35 via-purple-400/18 to-transparent rounded-full blur-3xl animate-float-delay-1 dark:opacity-0"></div>
        <div className="absolute top-[1000px] left-[-15%] w-[1900px] h-[1900px] bg-gradient-to-br from-blue-300/35 via-blue-400/18 to-transparent rounded-full blur-3xl animate-float-delay-2 dark:opacity-0"></div>
        <div className="absolute top-[1600px] right-[-20%] w-[2100px] h-[2100px] bg-gradient-to-br from-pink-300/35 via-pink-400/18 to-transparent rounded-full blur-3xl animate-float-delay-3 dark:opacity-0"></div>
        <div className="absolute top-[2200px] left-[-18%] w-[2000px] h-[2000px] bg-gradient-to-br from-cyan-300/35 via-cyan-400/18 to-transparent rounded-full blur-3xl animate-float dark:opacity-0"></div>
        <div className="absolute top-[2800px] right-[-22%] w-[1900px] h-[1900px] bg-gradient-to-br from-orange-300/32 via-orange-400/16 to-transparent rounded-full blur-3xl animate-pulse-slow dark:opacity-0"></div>
        <div
          className="absolute top-[3400px] left-[-15%] w-[2000px] h-[2000px] bg-gradient-to-br from-green-300/32 via-green-400/16 to-transparent rounded-full blur-3xl animate-pulse-slow dark:opacity-0"
          style={{ animationDelay: "1.5s" }}
        ></div>
        <div className="absolute top-[700px] left-[40%] w-[1800px] h-[1800px] bg-gradient-to-br from-yellow-300/28 via-yellow-400/12 to-transparent rounded-full blur-3xl animate-float-delay-1 dark:opacity-0"></div>
        <div className="absolute top-[2000px] left-[35%] w-[1900px] h-[1900px] bg-gradient-to-br from-indigo-300/28 via-indigo-400/12 to-transparent rounded-full blur-3xl animate-float-delay-3 dark:opacity-0"></div>

        {/* Dark Mode - HUGE Visible Glowing Orbs */}
        <div className="absolute top-[50px] left-[-20%] w-[2000px] h-[2000px] bg-gradient-to-br from-primary-500/25 via-primary-600/12 to-transparent rounded-full blur-3xl animate-float opacity-0 dark:opacity-100"></div>
        <div className="absolute top-[400px] right-[-25%] w-[2200px] h-[2200px] bg-gradient-to-br from-purple-500/25 via-purple-600/12 to-transparent rounded-full blur-3xl animate-float-delay-1 opacity-0 dark:opacity-100"></div>
        <div className="absolute top-[1000px] left-[-15%] w-[1900px] h-[1900px] bg-gradient-to-br from-blue-500/25 via-blue-600/12 to-transparent rounded-full blur-3xl animate-float-delay-2 opacity-0 dark:opacity-100"></div>
        <div className="absolute top-[1600px] right-[-20%] w-[2100px] h-[2100px] bg-gradient-to-br from-pink-500/25 via-pink-600/12 to-transparent rounded-full blur-3xl animate-float-delay-3 opacity-0 dark:opacity-100"></div>
        <div className="absolute top-[2200px] left-[-18%] w-[2000px] h-[2000px] bg-gradient-to-br from-cyan-500/25 via-cyan-600/12 to-transparent rounded-full blur-3xl animate-float opacity-0 dark:opacity-100"></div>
        <div className="absolute top-[2800px] right-[-22%] w-[1900px] h-[1900px] bg-gradient-to-br from-orange-500/22 via-orange-600/10 to-transparent rounded-full blur-3xl animate-pulse-slow opacity-0 dark:opacity-100"></div>
        <div
          className="absolute top-[3400px] left-[-15%] w-[2000px] h-[2000px] bg-gradient-to-br from-green-500/22 via-green-600/10 to-transparent rounded-full blur-3xl animate-pulse-slow opacity-0 dark:opacity-100"
          style={{ animationDelay: "1.5s" }}
        ></div>
        <div className="absolute top-[700px] left-[40%] w-[1800px] h-[1800px] bg-gradient-to-br from-yellow-500/20 via-yellow-600/9 to-transparent rounded-full blur-3xl animate-float-delay-1 opacity-0 dark:opacity-100"></div>
        <div className="absolute top-[2000px] left-[35%] w-[1900px] h-[1900px] bg-gradient-to-br from-indigo-500/20 via-indigo-600/9 to-transparent rounded-full blur-3xl animate-float-delay-3 opacity-0 dark:opacity-100"></div>

        {/* MASSIVE Center Spotlight */}
        <div className="absolute top-[1800px] left-[50%] -translate-x-1/2 w-[2500px] h-[2500px] bg-gradient-radial from-white/35 via-white/12 to-transparent rounded-full blur-3xl animate-pulse-slow dark:opacity-0"></div>
        <div className="absolute top-[1800px] left-[50%] -translate-x-1/2 w-[2500px] h-[2500px] bg-gradient-radial from-white/15 via-white/5 to-transparent rounded-full blur-3xl animate-pulse-slow opacity-0 dark:opacity-100"></div>

        {/* Subtle mesh gradient overlay */}
        <div className="absolute inset-0 opacity-15 dark:opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 via-transparent to-purple-400/10 animate-gradient"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-400/10 via-transparent to-pink-400/10 animate-gradient-reverse"></div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.95); }
        }
        @keyframes float-delay-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-18px, 18px) scale(1.05); }
          66% { transform: translate(20px, -15px) scale(0.95); }
        }
        @keyframes float-delay-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(15px, 20px) scale(1.05); }
          66% { transform: translate(-20px, -18px) scale(0.95); }
        }
        @keyframes float-delay-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-15px, -15px) scale(1.05); }
          66% { transform: translate(18px, 20px) scale(0.95); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes gradient {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(5%, 5%) rotate(2deg); }
        }
        @keyframes gradient-reverse {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-5%, -5%) rotate(-2deg); }
        }
        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-float-delay-1 { animation: float-delay-1 22s ease-in-out infinite; }
        .animate-float-delay-2 { animation: float-delay-2 24s ease-in-out infinite; }
        .animate-float-delay-3 { animation: float-delay-3 26s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-gradient { animation: gradient 15s ease-in-out infinite; }
        .animate-gradient-reverse { animation: gradient-reverse 15s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <section className="relative bg-gradient-to-br from-gray-100 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white py-16 border-b border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Glassmorphism Background Effects */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Large animated gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary-400/20 via-purple-400/15 to-blue-400/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/15 via-cyan-400/10 to-green-400/10 rounded-full blur-3xl animate-float-delay-1"></div>
          <div className="absolute bottom-1/4 left-1/3 w-[550px] h-[550px] bg-gradient-to-br from-purple-400/15 via-pink-400/10 to-rose-400/10 rounded-full blur-3xl animate-float-delay-2"></div>

          {/* Radial gradients for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.12),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.12),transparent_60%)]"></div>

          {/* Noise texture for realism */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(to_right,#ffffff0f_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0f_1px,transparent_1px)]"></div>

          {/* Top light beam */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-white/10 dark:from-white/5 to-transparent blur-3xl"></div>
        </div>

        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Explore{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                Web3 Courses
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Learn from verified KOLs, professionals, and experts
            </p>
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-6">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses, topics, or instructors..."
                className="w-full pl-14 pr-5 py-4 rounded-xl border-2 border-gray-700 bg-gray-900/50 backdrop-blur-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition text-white placeholder-gray-500"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            {/* View All Courses Button */}
            <div className="flex items-center justify-center space-x-4 mt-6">
              <button
                onClick={() => setViewMode("all")}
                className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl hover:shadow-primary-400/50 transition-all transform hover:scale-105"
              >
                <BookOpen className="w-5 h-5" />
                <span>View All Courses</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="text-gray-400">or browse by category below</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container-custom py-10">
        {viewMode === "browse" ? (
          /* Browse Mode - Featured & Categories */
          <>
            {/* Featured Courses */}
            {featuredCourses.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      ⭐ Featured Courses
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Hand-picked by our team of experts
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      getBadgeIcon={getBadgeIcon}
                      getBadgeColors={getBadgeColors}
                      getBadgeColorFromBadge={getBadgeColorFromBadge}
                      compact={false}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Trending Courses */}
            {trendingCourses.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Fire className="w-7 h-7 text-orange-500" />
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Trending Now
                      </h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Most popular courses this week
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingCourses.slice(0, 3).map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      getBadgeIcon={getBadgeIcon}
                      getBadgeColors={getBadgeColors}
                      getBadgeColorFromBadge={getBadgeColorFromBadge}
                      compact={false}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Browse by Category */}
            <section className="mb-12 relative">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Browse by Category
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Find the perfect course for your Web3 journey
                </p>
              </div>

              {categories.length === 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl h-48"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories
                      .slice(0, showAllCategories ? categories.length : 6)
                      .map((category, index) => {
                        // Subtle accent colors for borders and glows only
                        const categoryAccents = [
                          {
                            border:
                              "border-pink-400/30 dark:border-pink-400/20",
                            glow: "hover:shadow-pink-400/20",
                            gradient: "from-pink-500/5 to-transparent",
                          },
                          {
                            border:
                              "border-blue-400/30 dark:border-blue-400/20",
                            glow: "hover:shadow-blue-400/20",
                            gradient: "from-blue-500/5 to-transparent",
                          },
                          {
                            border:
                              "border-green-400/30 dark:border-green-400/20",
                            glow: "hover:shadow-green-400/20",
                            gradient: "from-green-500/5 to-transparent",
                          },
                          {
                            border:
                              "border-purple-400/30 dark:border-purple-400/20",
                            glow: "hover:shadow-purple-400/20",
                            gradient: "from-purple-500/5 to-transparent",
                          },
                          {
                            border:
                              "border-orange-400/30 dark:border-orange-400/20",
                            glow: "hover:shadow-orange-400/20",
                            gradient: "from-orange-500/5 to-transparent",
                          },
                          {
                            border:
                              "border-indigo-400/30 dark:border-indigo-400/20",
                            glow: "hover:shadow-indigo-400/20",
                            gradient: "from-indigo-500/5 to-transparent",
                          },
                        ];
                        const accent =
                          categoryAccents[index % categoryAccents.length];

                        return (
                          <button
                            key={`${category.id}-${index}`}
                            onClick={() => {
                              handleFilterChange("category", category.name);
                              setViewMode("all");
                            }}
                            className={`group relative p-6 rounded-2xl border-2 ${
                              accent.border
                            } transition-all duration-500 hover:-translate-y-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-2xl ${
                              accent.glow
                            } isolate ${
                              filters.category === category.name
                                ? "shadow-2xl scale-105 bg-white/80 dark:bg-gray-900/80"
                                : ""
                            }`}
                            style={{ isolation: "isolate" }}
                          >
                            {/* Multi-layer glass overlay */}
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} rounded-2xl pointer-events-none`}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/10 via-white/20 dark:via-white/5 to-transparent rounded-2xl pointer-events-none"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>

                            {/* Animated shimmer effect on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-2xl pointer-events-none">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </div>

                            {/* Top shine line */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent pointer-events-none"></div>

                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/40 dark:bg-white/10 backdrop-blur-md rounded-xl text-gray-700 dark:text-white shadow-lg ring-1 ring-white/40 dark:ring-white/20">
                                  {categoryList.find(
                                    (c) => c.name === category.name
                                  )?.icon || <Code className="w-6 h-6" />}
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 drop-shadow-sm">
                                {category.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                {category.description}
                              </p>
                              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400 text-sm font-medium">
                                <span className="backdrop-blur-sm bg-white/30 dark:bg-white/10 px-3 py-1.5 rounded-lg ring-1 ring-white/20">
                                  {category.courseCount || 0} courses
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                  {categories.length > 6 && (
                    <button
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="mt-8 mx-auto flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-400 transition font-medium backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 hover:bg-white/80 dark:hover:bg-gray-900/80"
                    >
                      <span>
                        {showAllCategories
                          ? "Show Less"
                          : "View All Categories"}
                      </span>
                      {showAllCategories ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          /* All Courses View */
          <>
            {/* Filters Bar */}
            <div className="mb-6 space-y-3">
              {/* Main Filter Bar - Compact */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-400 transition text-sm"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                  </button>

                  {/* Quick Category Filters - Compact */}
                  {categories.slice(0, 4).map((cat) => (
                    <button
                      key={cat._id || cat.name}
                      onClick={() => handleFilterChange("category", cat.name)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        filters.category.includes(cat.name)
                          ? "bg-primary-400 text-black"
                          : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}

                  {categories.length > 4 && (
                    <button
                      onClick={() => setShowFilters(true)}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    >
                      +{categories.length - 4}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className="px-3 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-sm"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setViewMode("browse")}
                    className="px-3 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-400 transition text-sm whitespace-nowrap"
                  >
                    Back to Browse
                  </button>
                </div>
              </div>

              {/* Active Filters Display - Compact */}
              {(filters.category.length > 0 ||
                filters.level ||
                filters.minPrice ||
                filters.maxPrice ||
                filters.rating) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Active:
                  </span>
                  {filters.category.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-400 text-black rounded-lg text-xs font-medium"
                    >
                      {cat}
                      <button
                        onClick={() => handleFilterChange("category", cat)}
                        className="hover:bg-black/10 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {filters.level && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-400 text-black rounded-lg text-xs font-medium">
                      {filters.level}
                      <button
                        onClick={() => handleFilterChange("level", "")}
                        className="hover:bg-black/10 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {(filters.minPrice || filters.maxPrice) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-400 text-black rounded-lg text-xs font-medium">
                      ${filters.minPrice || "0"} - ${filters.maxPrice || "∞"}
                      <button
                        onClick={() => {
                          handleFilterChange("minPrice", "");
                          handleFilterChange("maxPrice", "");
                        }}
                        className="hover:bg-black/10 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.rating && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-400 text-black rounded-lg text-xs font-medium">
                      {filters.rating}+ ⭐
                      <button
                        onClick={() => handleFilterChange("rating", "")}
                        className="hover:bg-black/10 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary-400 hover:text-primary-500 font-medium underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mb-6 p-4 border-2 border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900">
                <div className="space-y-4">
                  {/* Categories - Box Style */}
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white">
                      Categories (Multiple)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat._id || cat.name}
                          onClick={() =>
                            handleFilterChange("category", cat.name)
                          }
                          className={`group relative px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            filters.category.includes(cat.name)
                              ? "bg-primary-400 text-black shadow-lg scale-105"
                              : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:shadow-md text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <span className="relative z-10">{cat.name}</span>
                          {filters.category.includes(cat.name) && (
                            <div className="absolute inset-0 bg-primary-500/20 rounded-lg blur-sm"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other Filters - Compact Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Level */}
                    <div>
                      <label className="block text-xs font-bold mb-2 text-gray-900 dark:text-white">
                        Level
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {levels.map((level) => (
                          <button
                            key={level}
                            onClick={() =>
                              handleFilterChange(
                                "level",
                                filters.level === level ? "" : level
                              )
                            }
                            className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                              filters.level === level
                                ? "bg-primary-400 text-black shadow-lg"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-400 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-xs font-bold mb-2 text-gray-900 dark:text-white">
                        Price Range
                      </label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { label: "Free", min: "0", max: "0" },
                          { label: "$0-$50", min: "0", max: "50" },
                          { label: "$50-$100", min: "50", max: "100" },
                          { label: "$100+", min: "100", max: "" },
                        ].map((range) => (
                          <button
                            key={range.label}
                            onClick={() => {
                              handleFilterChange("minPrice", range.min);
                              handleFilterChange("maxPrice", range.max);
                            }}
                            className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                              filters.minPrice === range.min &&
                              filters.maxPrice === range.max
                                ? "bg-primary-400 text-black shadow-lg"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-400 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Price */}
                    <div>
                      <label className="block text-xs font-bold mb-2 text-gray-900 dark:text-white">
                        Custom Price
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="number"
                          placeholder="Min"
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 transition-all"
                          value={filters.minPrice}
                          onChange={(e) =>
                            handleFilterChange("minPrice", e.target.value)
                          }
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 transition-all"
                          value={filters.maxPrice}
                          onChange={(e) =>
                            handleFilterChange("maxPrice", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-xs font-bold mb-2 text-gray-900 dark:text-white">
                        Min Rating
                      </label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { label: "Any", value: "" },
                          { label: "3.5+⭐", value: "3.5" },
                          { label: "4.0+⭐", value: "4.0" },
                          { label: "4.5+⭐", value: "4.5" },
                        ].map((rating) => (
                          <button
                            key={rating.label}
                            onClick={() =>
                              handleFilterChange("rating", rating.value)
                            }
                            className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                              filters.rating === rating.value
                                ? "bg-primary-400 text-black shadow-lg"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-400 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {rating.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Grid */}
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl h-64 mb-4"></div>
                    <div className="bg-gray-200 dark:bg-gray-800 rounded h-6 mb-2"></div>
                    <div className="bg-gray-200 dark:bg-gray-800 rounded h-4 w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">No courses found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your filters
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-primary-400 text-black rounded-lg font-medium"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    getBadgeIcon={getBadgeIcon}
                    getBadgeColors={getBadgeColors}
                    getBadgeColorFromBadge={getBadgeColorFromBadge}
                    compact={true}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const CourseCard = ({
  course,
  getBadgeIcon,
  getBadgeColors,
  compact,
  getBadgeColorFromBadge,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative rounded-2xl overflow-hidden backdrop-blur-3xl border-2 border-white/30 dark:border-white/10 hover:border-primary-400/60 transition-all hover:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.3)] hover:shadow-primary-400/30 hover:-translate-y-3 duration-700 bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-gray-900/80 dark:via-gray-900/60 dark:to-gray-900/40 isolate">
        {/* LAYER 1: Base frosted glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-white/30 dark:from-white/10 dark:via-white/5 dark:to-transparent pointer-events-none"></div>

        {/* LAYER 2: Radial gradient for depth - multiple sources */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.15),transparent_60%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none"></div>

        {/* LAYER 3: Animated gradient orbs - LARGER and MORE VISIBLE */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-primary-400/40 via-purple-400/30 to-blue-400/20 dark:from-primary-400/25 dark:via-purple-400/20 dark:to-blue-400/15 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse-slow"></div>
        <div
          className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-blue-400/35 via-cyan-400/25 to-green-400/20 dark:from-blue-400/20 dark:via-cyan-400/15 dark:to-green-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse-slow"
          style={{ transitionDelay: "150ms" }}
        ></div>

        {/* LAYER 4: Shimmer overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1500 skew-x-12"></div>
        </div>

        {/* LAYER 5: Top edge shine - more prominent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/40 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent blur-sm pointer-events-none"></div>

        {/* LAYER 6: Inner glow effect */}
        <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-b from-white/40 dark:from-white/10 to-transparent pointer-events-none"></div>

        {/* Thumbnail Section with ENHANCED effects */}
        <div
          className={`relative ${compact ? "h-40" : "h-48"} overflow-hidden`}
        >
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          />

          {/* Enhanced multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

          {/* Colorful glow on hover - more vibrant */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400/30 via-purple-400/20 to-blue-400/30 opacity-0 group-hover:opacity-100 mix-blend-overlay transition-opacity duration-700"></div>

          {/* Enhanced badges with better glass effect */}
          {course.trending && (
            <div className="absolute top-3 left-3 z-10">
              <div className="relative group/badge">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg blur-md opacity-60"></div>
                <div className="relative flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-br from-orange-500/95 to-red-500/95 backdrop-blur-xl text-white text-xs font-bold rounded-lg border border-orange-400/50 shadow-xl">
                  <Fire className="w-3.5 h-3.5 animate-pulse" />
                  <span className="drop-shadow-lg">Trending</span>
                </div>
              </div>
            </div>
          )}

          {/* Level badge with premium glass */}
          <div className="absolute top-3 right-3 z-10">
            <div className="px-3 py-1.5 bg-white/25 dark:bg-black/50 backdrop-blur-2xl text-white text-xs font-semibold rounded-lg border border-white/40 shadow-2xl ring-1 ring-white/30 hover:scale-105 transition-transform">
              {course.level}
            </div>
          </div>

          {/* Enhanced course meta badges */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white z-10">
            <div className="flex items-center space-x-1.5 text-xs font-semibold backdrop-blur-2xl bg-white/20 dark:bg-black/40 px-3 py-1.5 rounded-lg border border-white/40 shadow-xl ring-1 ring-white/20">
              <Clock className="w-3.5 h-3.5" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-semibold backdrop-blur-2xl bg-white/20 dark:bg-black/40 px-3 py-1.5 rounded-lg border border-white/40 shadow-xl ring-1 ring-white/20">
              <Play className="w-3.5 h-3.5" />
              <span>{course.lessons} lessons</span>
            </div>
          </div>
        </div>

        {/* Content area with MAXIMUM glass effect */}
        <div className="p-5 relative">
          {/* Multi-layer inner lighting */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 dark:from-white/8 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-400/10 via-transparent to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          {/* Subtle category pills with vibrant glass */}
          {course.subcategories && course.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
              {course.subcategories.slice(0, 2).map((sub, index) => (
                <span
                  key={index}
                  className="relative group/pill px-2.5 py-1 text-[10px] font-semibold rounded-md uppercase tracking-wide backdrop-blur-xl shadow-lg hover:scale-105 transition-transform overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400/30 to-purple-400/30 dark:from-primary-400/20 dark:to-purple-400/20"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/10 to-transparent"></div>
                  <span className="relative z-10 text-primary-700 dark:text-primary-300 drop-shadow-sm">
                    {sub}
                  </span>
                  <div className="absolute inset-0 border border-primary-400/40 dark:border-primary-400/30 rounded-md"></div>
                </span>
              ))}
            </div>
          )}

          {/* Title with gradient on hover */}
          <h3
            className={`${
              compact ? "text-sm" : "text-base"
            } font-bold mb-3 text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-purple-600 dark:group-hover:from-primary-400 dark:group-hover:to-purple-400 transition-all line-clamp-2 leading-snug ${
              compact ? "min-h-[2.5rem]" : "min-h-[3rem]"
            } relative z-10`}
          >
            {course.title}
          </h3>

          {/* Enhanced instructor section */}
          <div className="flex items-center space-x-2.5 mb-4 pb-4 border-b border-gray-300/40 dark:border-gray-700/40 relative z-10">
            <div className="relative group/avatar">
              {/* Glowing ring animation */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-500"></div>
              <img
                src={course.instructor.avatar}
                alt={course.instructor.username}
                className={`${
                  compact ? "w-8 h-8" : "w-9 h-9"
                } rounded-full ring-2 ring-primary-400/50 shadow-xl relative z-10 group-hover:ring-primary-400 transition-all`}
              />
              <div className="absolute inset-0 rounded-full ring-1 ring-white/50 dark:ring-white/30"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 mb-1">
                <span
                  className={`${
                    compact ? "text-xs" : "text-sm"
                  } font-semibold text-gray-800 dark:text-gray-100 truncate`}
                >
                  {course.instructor.name}
                </span>
                {course.instructor.verified && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-400/40 blur-sm rounded-full"></div>
                    <Award className="w-3.5 h-3.5 text-primary-500 relative z-10 drop-shadow-lg" />
                  </div>
                )}
              </div>

              {/* Vibrant badge design */}
              <div className="flex items-center gap-1.5">
                {course.instructor.badges?.slice(0, 2).map((badge, index) => (
                  <div
                    key={index}
                    className="relative group/badge inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-xl shadow-lg overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 dark:from-white/10 to-transparent"></div>
                    <span className="relative z-10 w-2 h-2 rounded-full bg-gradient-to-br from-primary-400 via-purple-400 to-blue-400 shadow-lg"></span>
                    <span className="relative z-10 text-gray-700 dark:text-gray-200">
                      {badge}
                    </span>
                    <div className="absolute inset-0 border border-gray-300/50 dark:border-gray-600/50 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats row with better design */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center space-x-1.5">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/40 blur-md rounded-full"></div>
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 relative z-10 drop-shadow-lg" />
              </div>
              <span
                className={`${
                  compact ? "text-sm" : "text-base"
                } font-bold text-gray-900 dark:text-white`}
              >
                {course.rating}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                ({(course.totalRatings || 0).toLocaleString()})
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-gray-600 dark:text-gray-400 font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>{course.students.toLocaleString()}</span>
            </div>
          </div>

          {/* Price and CTA with ultimate glass button */}
          <div className="flex items-center justify-between relative z-10">
            <div className="relative">
              <div
                className={`${
                  compact ? "text-2xl" : "text-3xl"
                } font-black bg-gradient-to-br from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent drop-shadow-sm`}
              >
                ${course.price.usd}
              </div>
            </div>
            <button className="relative group/btn overflow-hidden px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:scale-105 active:scale-100 hover:shadow-2xl hover:shadow-primary-400/50">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 transition-transform group-hover/btn:scale-110"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>

              {/* Glass overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>

              {/* Shimmer effect */}
              <div className="absolute inset-0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"></div>

              {/* Border glow */}
              <div className="absolute inset-0 rounded-lg ring-1 ring-white/40 group-hover/btn:ring-white/60 transition-all"></div>

              <span className="relative z-10 drop-shadow-lg">Enroll Now</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CoursesPage;
