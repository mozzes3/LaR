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
    category: "",
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
        category: filters.category,
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
            badge: course.instructor?.expertise?.[0] || "Instructor",
          },
        })
      );

      setCourses(transformedCourses);
      setLoading(false);
    } catch (error) {
      console.error("Fetch courses error:", error);
      toast.error("Failed to load courses");
      setCourses([]); // Empty array instead of mock data
      setLoading(false);
    }
  };

  // Add helper functions at the bottom
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (date) => {
    const days = Math.floor(
      (new Date() - new Date(date)) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === "category" && value) {
      setViewMode("all");
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      level: "",
      minPrice: "",
      maxPrice: "",
      rating: "",
      sort: "newest",
    });
    setViewMode("browse");
  };

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case "KOL":
        return <Sparkles className="w-3 h-3" />;
      case "Professional":
        return <Shield className="w-3 h-3" />;
      case "Expert":
        return <Trophy className="w-3 h-3" />;
      case "Creator":
        return <Zap className="w-3 h-3" />;
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

  const featuredCourses = courses.filter((c) => c.featured);
  const trendingCourses = courses.filter((c) => c.trending);
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-16 border-b border-gray-800">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Explore{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                Web3 Courses
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
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

            {/* ADD: View All Courses Button - RIGHT UNDER SEARCH */}
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
                      🌟 Featured Courses
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
                      compact={false}
                    />
                  ))}
                </div>
              </section>
            )}
            {/* Browse by Category */}
            {/* Browse by Category */}
            <section className="mb-12">
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
                      .map((category) => {
                        const categoryCourses = courses.filter(
                          (c) =>
                            c.category ===
                            category.name.toLowerCase().replace(/\s+/g, "-")
                        );

                        // Color gradients for each category
                        const colorGradients = [
                          "from-pink-500 to-rose-500",
                          "from-blue-500 to-cyan-500",
                          "from-green-500 to-emerald-500",
                          "from-purple-500 to-violet-500",
                          "from-yellow-500 to-orange-500",
                          "from-indigo-500 to-blue-500",
                          "from-red-500 to-pink-500",
                          "from-teal-500 to-green-500",
                          "from-orange-500 to-red-500",
                          "from-cyan-500 to-blue-500",
                          "from-violet-500 to-purple-500",
                          "from-lime-500 to-green-500",
                          "from-fuchsia-500 to-pink-500",
                          "from-sky-500 to-blue-500",
                          "from-amber-500 to-orange-500",
                        ];

                        const colorIndex =
                          categories.indexOf(category) % colorGradients.length;
                        const gradient = colorGradients[colorIndex];

                        // Icon mapping
                        const iconMap = {
                          "Web3 Development": <Code className="w-6 h-6" />,
                          "Blockchain Fundamentals": (
                            <Sparkles className="w-6 h-6" />
                          ),
                          DeFi: <Coins className="w-6 h-6" />,
                          "NFTs & Digital Art": <Palette className="w-6 h-6" />,
                          "Smart Contracts": <Code className="w-6 h-6" />,
                          "Community Building": (
                            <MessageSquare className="w-6 h-6" />
                          ),
                          "Marketing & Growth": (
                            <TrendingUp className="w-6 h-6" />
                          ),
                          "Trading & Investment": <Fire className="w-6 h-6" />,
                          "Security & Auditing": <Shield className="w-6 h-6" />,
                          "DAOs & Governance": <Users className="w-6 h-6" />,
                          "Gaming & Metaverse": <Zap className="w-6 h-6" />,
                          "Content Creation": <Palette className="w-6 h-6" />,
                          "Business & Entrepreneurship": (
                            <Trophy className="w-6 h-6" />
                          ),
                          "Design & UX": <Palette className="w-6 h-6" />,
                          "Legal & Compliance": <Shield className="w-6 h-6" />,
                        };

                        return (
                          <div
                            key={category.name}
                            className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-400 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-1"
                            onClick={() =>
                              handleFilterChange("category", category.name)
                            }
                          >
                            {/* Gradient Background */}
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
                            ></div>

                            {/* Content */}
                            <div className="relative p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div
                                  className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
                                >
                                  {iconMap[category.name] || (
                                    <BookOpen className="w-6 h-6" />
                                  )}
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                              </div>

                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-400 transition">
                                {category.name}
                              </h3>

                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">
                                {category.description}
                              </p>

                              {/* Subcategories Preview */}
                              {category.subcategories &&
                                category.subcategories.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-4">
                                    {category.subcategories
                                      .slice(0, 3)
                                      .map((sub, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md text-xs font-medium border border-purple-500/20"
                                        >
                                          {sub}
                                        </span>
                                      ))}
                                    {category.subcategories.length > 3 && (
                                      <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded-md text-xs font-medium">
                                        +{category.subcategories.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}

                              <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-200 dark:border-gray-800">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                  {categoryCourses.length} courses
                                </span>
                                <span className="text-primary-400 font-bold group-hover:underline flex items-center space-x-1">
                                  <span>Explore</span>
                                  <span>→</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Load More Button */}
                  {categories.length > 6 && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="inline-flex items-center space-x-2 px-8 py-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-bold hover:border-primary-400 hover:shadow-lg transition-all"
                      >
                        {showAllCategories ? (
                          <>
                            <ChevronUp className="w-5 h-5" />
                            <span>Show Less</span>
                          </>
                        ) : (
                          <>
                            <span>Load More Categories</span>
                            <span className="text-primary-400">
                              ({categories.length - 6} more)
                            </span>
                            <ChevronDown className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          /* All Courses Mode - With Filters */
          /* All Courses Mode - With Filters */
          <>
            {/* Back Button & Filter Bar */}
            <div className="mb-8">
              <button
                onClick={() => clearFilters()}
                className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-500 font-medium mb-6"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
                <span>Back to Browse</span>
              </button>
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Filter Button & Quick Category Filters */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar w-full lg:w-auto">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-medium hover:border-primary-400 transition flex-shrink-0"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    <span>Filters</span>
                  </button>

                  {/* Quick Category Filters - Using Real Data */}
                  {categories.slice(0, 5).map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() =>
                        handleFilterChange(
                          "category",
                          filters.category === cat.name ? "" : cat.name
                        )
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition whitespace-nowrap text-sm flex-shrink-0 ${
                        filters.category === cat.name
                          ? "bg-primary-400 text-black"
                          : "bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}

                  {categories.length > 5 && (
                    <button
                      onClick={() => setShowFilters(true)}
                      className="px-4 py-3 rounded-xl font-medium transition whitespace-nowrap text-sm bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 flex-shrink-0"
                    >
                      +{categories.length - 5} more
                    </button>
                  )}
                </div>

                {/* Sort & Results */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {courses.length}
                    </span>{" "}
                    courses
                  </span>
                  <select
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:border-primary-400 transition text-sm font-medium"
                    value={filters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Advanced Filters
                  </h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* All Categories */}
                  <div>
                    <label className="block text-sm font-bold mb-3">
                      All Categories
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.name}
                          onClick={() =>
                            handleFilterChange(
                              "category",
                              filters.category === cat.name ? "" : cat.name
                            )
                          }
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                            filters.category === cat.name
                              ? "bg-primary-400 text-black"
                              : "bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 hover:border-primary-400"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other Filters */}
                  <div className="grid md:grid-cols-4 gap-6">
                    {/* Level */}
                    <div>
                      <label className="block text-sm font-bold mb-3">
                        Level
                      </label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
                        value={filters.level}
                        onChange={(e) =>
                          handleFilterChange("level", e.target.value)
                        }
                      >
                        {levels.map((level) => (
                          <option
                            key={level}
                            value={level === "All Levels" ? "" : level}
                          >
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-bold mb-3">
                        Min Price
                      </label>
                      <input
                        type="number"
                        placeholder="$0"
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange("minPrice", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-3">
                        Max Price
                      </label>
                      <input
                        type="number"
                        placeholder="Any"
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange("maxPrice", e.target.value)
                        }
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-bold mb-3">
                        Min Rating
                      </label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
                        value={filters.rating}
                        onChange={(e) =>
                          handleFilterChange("rating", e.target.value)
                        }
                      >
                        <option value="">Any Rating</option>
                        <option value="4.5">4.5+ Stars</option>
                        <option value="4.0">4.0+ Stars</option>
                        <option value="3.5">3.5+ Stars</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Course Grid */}
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

const CourseCard = ({ course, getBadgeIcon, getBadgeColors, compact }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-400 transition-all hover:shadow-2xl hover:-translate-y-1 duration-300">
        {/* Thumbnail */}
        <div
          className={`relative ${
            compact ? "h-40" : "h-48"
          } overflow-hidden bg-gray-200 dark:bg-gray-800`}
        >
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
          {course.trending && (
            <div className="absolute top-3 left-3">
              <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                <TrendingUp className="w-3 h-3" />
                <span>HOT</span>
              </div>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/20">
              {course.level}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                <Clock className="w-3 h-3" />
                <span className="font-medium">{course.duration}</span>
              </div>
              <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                <Play className="w-3 h-3" />
                <span className="font-medium">{course.lessons}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className={compact ? "p-4" : "p-5"}>
          <div className="text-xs font-bold text-primary-400 mb-2 uppercase tracking-wide">
            {course.category}
          </div>
          {course.subcategories && course.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {course.subcategories.slice(0, 2).map((sub, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs font-medium border border-purple-500/20"
                >
                  {sub}
                </span>
              ))}
              {course.subcategories.length > 2 && (
                <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 rounded text-xs font-medium">
                  +{course.subcategories.length - 2}
                </span>
              )}
            </div>
          )}
          <h3
            className={`${
              compact ? "text-sm" : "text-base"
            } font-bold mb-2 text-gray-900 dark:text-white group-hover:text-primary-400 transition-colors line-clamp-2 ${
              compact ? "min-h-[2.5rem]" : "min-h-[3rem]"
            }`}
          >
            {course.title}
          </h3>
          {/* Instructor */}
          <div className="flex items-center space-x-2 mb-3">
            <img
              src={course.instructor.avatar}
              alt={course.instructor.username}
              className={`${compact ? "w-6 h-6" : "w-8 h-8"} rounded-full`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <span
                  className={`${
                    compact ? "text-xs" : "text-sm"
                  } font-medium text-gray-700 dark:text-gray-300 truncate`}
                >
                  {course.instructor.name}
                </span>
                {course.instructor.verified && (
                  <Award className="w-3 h-3 text-primary-400 flex-shrink-0" />
                )}
              </div>
              <div
                className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-bold border ${getBadgeColors(
                  course.instructor.badgeColor
                )}`}
              >
                {getBadgeIcon(course.instructor.badge)}
                <span>{course.instructor.badge}</span>
              </div>
            </div>
          </div>
          {/* Stats */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-primary-400 fill-primary-400" />
              <span
                className={`${compact ? "text-sm" : "text-base"} font-bold`}
              >
                {course.rating}
              </span>
              <span className="text-xs text-gray-500">
                ({course.students.toLocaleString()})
              </span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Users className="w-3 h-3" />
              <span>{course.students.toLocaleString()}</span>
            </div>
          </div>
          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <div
                className={`${
                  compact ? "text-xl" : "text-2xl"
                } font-bold text-gray-900 dark:text-white`}
              >
                ${course.price.usd}
              </div>
              <div className="text-xs text-gray-500">
                or {course.price.fdr} $FDR
              </div>
            </div>
            <div
              className={`${
                compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
              } rounded-lg font-bold transition-all ${
                isHovered
                  ? "bg-primary-400 text-black"
                  : "bg-primary-400/10 text-primary-400"
              }`}
            >
              View
            </div>
          </div>
        </div>
        {/* Hover Preview - What You'll Learn */}
        {isHovered && !compact && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm p-5 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div>
              <h4 className="text-lg font-bold text-white mb-3">
                {course.title}
              </h4>
              <div className="space-y-2">
                <p className="text-xs font-bold text-primary-400 uppercase tracking-wide">
                  What you'll learn:
                </p>
                <ul className="space-y-1.5">
                  {course.whatYouWillLearn.map((item, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-300 flex items-start"
                    >
                      <span className="text-primary-400 mr-2 flex-shrink-0">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button className="w-full py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-lg font-bold hover:shadow-xl transition">
              Enroll Now - ${course.price.usd}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
};
export default CoursesPage;
