import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
  Users,
  BookOpen,
  DollarSign,
  Zap,
  Star,
  Clock,
  Play,
  ChevronRight,
  TrendingUp as Fire,
  Gamepad2,
  Trophy,
  Coins,
} from "lucide-react";
import { useState, useEffect } from "react";
import { courseApi } from "@services/api";

const HomePage = () => {
  const [trendingCourses, setTrendingCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const stats = [
    { label: "Course Creators", value: "500+", icon: Users },
    { label: "Active Courses", value: "2,000+", icon: BookOpen },
    { label: "Students Learning", value: "50K+", icon: TrendingUp },
    { label: "Total Paid Out", value: "$2.5M", icon: DollarSign },
  ];

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Learn from Web3 KOLs",
      description:
        "Access exclusive courses from NFT founders, crypto influencers, and blockchain experts",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Earn $FDR Rewards",
      description:
        "Get 1 $FDR token for every $1 spent. Use rewards for future courses",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "NFT Certificates",
      description:
        "Receive verifiable on-chain certificates upon completing courses",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Teach & Earn",
      description: "Share your expertise and keep 80% of your course revenue",
    },
  ];

  // Helper function to format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Helper function to format date
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

  // Load real trending courses from API
  useEffect(() => {
    const loadTrendingCourses = async () => {
      try {
        setLoading(true);

        // Fetch courses sorted by popularity/enrollment
        const response = await courseApi.getAll({
          sort: "popular",
          limit: 6,
        });

        // Transform courses to match component needs
        const transformedCourses = (response.data.courses || []).map(
          (course) => ({
            id: course._id,
            slug: course.slug,
            title: course.title,
            instructor: {
              username: course.instructor?.username || "Unknown",
              avatar:
                course.instructor?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${course._id}`,
              verified: course.instructor?.instructorVerified || false,
              followers: "0",
              // ✅ ADD THESE 3 LINES:
              badges:
                course.instructor?.badges && course.instructor.badges.length > 0
                  ? course.instructor.badges
                  : ["Instructor"],
            },
            thumbnail: course.thumbnail,
            price: course.price,
            rating: course.averageRating || 0,
            students: course.enrollmentCount || 0,
            duration: formatDuration(course.totalDuration || 0),
            category: course.category,
            level: course.level,
            trending: course.enrollmentCount > 500,
            lessons: course.totalLessons || 0,
            lastUpdated: formatDate(course.updatedAt),
          })
        );
        setTrendingCourses(transformedCourses);
        setLoading(false);
      } catch (error) {
        console.error("Error loading trending courses:", error);
        setTrendingCourses([]);
        setLoading(false);
      }
    };

    loadTrendingCourses();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section - KEEP AS IS */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-20 lg:py-28">
        {/* ... keep all hero section code ... */}
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, rgb(250, 204, 21) 1px, transparent 0)",
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-40 h-40 bg-primary-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        <div className="container-custom relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-400/10 border border-primary-400/30 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-primary-400 animate-pulse" />
              <span className="text-sm font-semibold text-primary-400">
                Learn from 500+ Web3 Experts
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              Learn From{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600">
                Web3 Legends
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Access exclusive courses from NFT founders, DeFi builders, and
              crypto KOLs.
              <span className="text-primary-400 font-semibold">
                {" "}
                Earn $FDR tokens
              </span>{" "}
              while you level up.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/courses"
                className="btn-glossy-hybrid inline-flex items-center space-x-2 px-10 py-5 rounded-xl font-bold text-lg group"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link
                to="/become-instructor"
                className="btn-glossy-outline inline-flex items-center space-x-2 px-10 py-5 rounded-xl font-bold text-lg"
              >
                <Zap className="w-5 h-5" />
                <span>Teach & Earn</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">500+ Instructors</span>
              </div>
              <div className="w-px h-4 bg-gray-700"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">50K+ Students</span>
              </div>
              <div className="w-px h-4 bg-gray-700"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">$2.5M+ Earned</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - KEEP AS IS */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary-400/10 rounded-2xl group-hover:bg-primary-400/20 transition-all group-hover:scale-110 duration-300">
                    <stat.icon className="w-8 h-8 text-primary-400" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2 text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Founder Academy - KEEP AS IS */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Why{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                Learn Here?
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              The only Web3 education marketplace that rewards you for learning
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-400 transition-all hover:shadow-xl hover:shadow-primary-400/10 hover:-translate-y-2 duration-300"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-400/30 transition-all">
                  <div className="text-primary-400">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Courses - NOW WITH REAL DATA */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/30">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Fire className="w-6 h-6 text-orange-500" />
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Trending Courses
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Most popular courses from top creators this week
              </p>
            </div>
            <Link
              to="/courses"
              className="hidden md:flex items-center space-x-2 text-primary-400 hover:text-primary-500 font-semibold group"
            >
              <span>View All</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl h-96"></div>
                </div>
              ))}
            </div>
          ) : trendingCourses.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {trendingCourses.slice(0, 3).map((course) => (
                  <EnhancedCourseCard key={course.id} course={course} />
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  to="/courses"
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl hover:shadow-primary-400/50 transition-all transform hover:scale-105"
                >
                  <span>Browse All Courses</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No courses available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Founder Simulator Game Section - NEW! */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="container-custom">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-1">
            <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-3xl p-8 lg:p-12">
              {/* Animated Background */}
              <div className="absolute inset-0 opacity-20">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 2px 2px, rgb(250, 204, 21) 1px, transparent 0)",
                    backgroundSize: "40px 40px",
                  }}
                ></div>
              </div>

              {/* Floating Game Elements */}
              <div className="absolute top-10 right-10 w-20 h-20 bg-primary-400/30 rounded-full blur-2xl animate-pulse"></div>
              <div
                className="absolute bottom-10 left-10 w-32 h-32 bg-primary-400/20 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>

              <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <div className="text-white">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-400/20 border border-primary-400/30 rounded-full mb-6">
                    <Gamepad2 className="w-4 h-4 text-primary-400" />
                    <span className="text-sm font-semibold text-primary-400">
                      New: Interactive Learning
                    </span>
                  </div>

                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    Founder Simulator
                  </h2>

                  <p className="text-xl text-purple-200 mb-8 leading-relaxed">
                    Learn by doing! Build your NFT empire, make strategic
                    decisions, and compete with other founders in our
                    interactive Web3 simulation game.
                  </p>

                  {/* Game Features */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary-400/20 rounded-lg mt-1">
                        <Trophy className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Real Scenarios</h4>
                        <p className="text-sm text-purple-300">
                          Face actual Web3 challenges
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary-400/20 rounded-lg mt-1">
                        <Coins className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Earn $FDR</h4>
                        <p className="text-sm text-purple-300">
                          Win tokens by playing
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary-400/20 rounded-lg mt-1">
                        <Users className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Compete</h4>
                        <p className="text-sm text-purple-300">
                          Global leaderboard
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary-400/20 rounded-lg mt-1">
                        <BookOpen className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Learn</h4>
                        <p className="text-sm text-purple-300">
                          Practical Web3 knowledge
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a // Added missing opening <a> tag
                      href="https://foundersimulator.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-2xl hover:shadow-primary-400/50 transition-all transform hover:scale-105"
                    >
                      <Gamepad2 className="w-5 h-5" />
                      <span>Play Now</span>
                    </a>
                    <button className="inline-flex items-center justify-center space-x-2 px-8 py-4 border-2 border-primary-400 text-primary-400 rounded-xl font-bold hover:bg-primary-400 hover:text-black transition-all">
                      <span>Learn More</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Right Visual - Game Preview */}
                <div className="relative">
                  <div className="relative rounded-2xl overflow-hidden border-4 border-primary-400/30 shadow-2xl shadow-primary-400/20 transform hover:scale-105 transition-transform duration-500">
                    <img
                      src="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop"
                      alt="Founder Simulator Game"
                      className="w-full h-auto"
                    />
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center group">
                      <div className="w-20 h-20 bg-primary-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer shadow-2xl shadow-primary-400/50">
                        <Play className="w-10 h-10 text-black ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Floating Stats */}
                  <div className="absolute -bottom-4 -left-4 bg-black/90 backdrop-blur-lg border-2 border-primary-400/50 rounded-xl p-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-primary-400" />
                      <div>
                        <div className="text-sm text-gray-400">
                          Active Players
                        </div>
                        <div className="text-xl font-bold text-white">
                          12,450
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -top-4 -right-4 bg-black/90 backdrop-blur-lg border-2 border-primary-400/50 rounded-xl p-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-5 h-5 text-primary-400" />
                      <div>
                        <div className="text-sm text-gray-400">
                          $FDR Rewards
                        </div>
                        <div className="text-xl font-bold text-white">
                          $50K+
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructor CTA */}
      <section className="py-24 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 relative overflow-hidden">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              backgroundSize: "30px 30px",
            }}
          ></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">
              Share Your Web3 Expertise
            </h2>
            <p className="text-xl md:text-2xl text-black/80 mb-10 max-w-2xl mx-auto">
              Join 500+ instructors earning from their knowledge. Keep 80% of
              revenue and build your brand.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/become-instructor"
                className="inline-flex items-center space-x-2 px-10 py-5 bg-black text-primary-400 rounded-xl font-bold text-lg hover:bg-gray-900 transition-all transform hover:scale-105"
              >
                <Zap className="w-5 h-5" />
                <span>Start Teaching Today</span>
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center space-x-2 px-10 py-5 border-2 border-black text-black rounded-xl font-bold text-lg hover:bg-black hover:text-primary-400 transition-all"
              >
                <span>See Example Courses</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="container-custom text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Ready to Master Web3?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Start learning from the best creators in crypto today
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center space-x-2 px-10 py-5 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-primary-400/50 transition-all transform hover:scale-105"
          >
            <BookOpen className="w-5 h-5" />
            <span>Explore All Courses</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

// Enhanced Course Card Component (same as before)
const EnhancedCourseCard = ({ course }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-400 transition-all hover:shadow-2xl hover:-translate-y-2 duration-300">
        {/* Thumbnail */}
        <div className="relative h-52 overflow-hidden bg-gray-200 dark:bg-gray-800">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

          {/* Trending Badge */}
          {course.trending && (
            <div className="absolute top-4 left-4">
              <div className="flex items-center space-x-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                <Fire className="w-3 h-3" />
                <span>TRENDING</span>
              </div>
            </div>
          )}

          {/* Category & Level Pills */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <span className="px-3 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/20">
              {course.category}
            </span>
            <span className="px-3 py-1 bg-primary-400/90 backdrop-blur-sm text-black text-xs font-bold rounded-full">
              {course.level}
            </span>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-sm">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{course.duration}</span>
              </div>
              <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Play className="w-4 h-4" />
                <span className="font-medium">{course.lessons}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Rating & Students */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-1.5">
              <Star className="w-5 h-5 text-primary-400 fill-primary-400" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {course.rating}
              </span>
              <span className="text-sm text-gray-500">
                ({course.students.toLocaleString()})
              </span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-500 font-medium">
              <Users className="w-4 h-4" />
              <span>{course.students.toLocaleString()}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white group-hover:text-primary-400 transition-colors line-clamp-2 min-h-[3.5rem]">
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="flex items-center space-x-3 mb-5 pb-5 border-b border-gray-200 dark:border-gray-800">
            <img
              src={course.instructor.avatar}
              alt={course.instructor.username}
              className="w-10 h-10 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {course.instructor.username}
                </span>
                {course.instructor.verified && (
                  <Award className="w-4 h-4 text-primary-400 flex-shrink-0" />
                )}
              </div>
              <span className="text-xs text-gray-500">
                {course.instructor.followers} followers
              </span>
            </div>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ${course.price.usd}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">
                or {course.price.fdr} $FDR
              </div>
            </div>
            <div
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isHovered
                  ? "bg-primary-400 text-black shadow-lg shadow-primary-400/30"
                  : "bg-primary-400/10 text-primary-400"
              }`}
            >
              {isHovered ? "View Details" : "Learn More"}
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <span className="text-xs text-gray-500">
              Updated {course.lastUpdated}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HomePage;
