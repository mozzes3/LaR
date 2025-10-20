// frontend/src/pages/ProfessionalCertificationsPage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  Shield,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";
import { professionalCertificationApi } from "@services/api";
import toast from "react-hot-toast";
import { useWallet } from "@contexts/WalletContext";

const ProfessionalCertificationsPage = () => {
  const { user } = useWallet();
  const navigate = useNavigate();

  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    level: "",
    search: "",
  });

  const categories = [
    "All Categories",
    "Blockchain Fundamentals",
    "Web3 Development",
    "DeFi",
    "NFTs & Digital Art",
    "Smart Contracts",
    "Trading & Investment",
  ];

  const levels = ["All Levels", "beginner", "intermediate", "advanced"];

  useEffect(() => {
    loadCertifications();
  }, [filters]);

  const loadCertifications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.category && filters.category !== "All Categories")
        params.category = filters.category;
      if (filters.level && filters.level !== "All Levels")
        params.level = filters.level;
      if (filters.search) params.search = filters.search;

      const response = await professionalCertificationApi.getAllCertifications(
        params
      );
      setCertifications(response.data.certifications);
    } catch (error) {
      console.error("Load certifications error:", error);
      toast.error("Failed to load certifications");
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "beginner":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/10 text-red-500 border-red-500/30";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-bold">Blockchain-Verified</span>
              <Sparkles className="w-4 h-4" />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Professional Certifications
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Prove your Web3 expertise with blockchain-verified credentials.
              <br />
              <span className="text-primary-200 font-bold">
                Recognized by top Web3 companies worldwide.
              </span>
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center space-x-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {certifications.length}+
                </div>
                <div className="text-sm text-white/70">Certifications</div>
              </div>
              <div className="h-12 w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">3</div>
                <div className="text-sm text-white/70">Attempts</div>
              </div>
              <div className="h-12 w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">$5</div>
                <div className="text-sm text-white/70">Per Certificate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="currentColor"
              className="text-gray-50 dark:text-gray-900"
            />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search certifications..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 focus:border-primary-500 outline-none transition"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 focus:border-primary-500 outline-none transition appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat === "All Categories" ? "" : cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div className="relative">
              <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filters.level}
                onChange={(e) =>
                  setFilters({ ...filters, level: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 focus:border-primary-500 outline-none transition appearance-none cursor-pointer"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl === "All Levels" ? "" : lvl}>
                    {lvl === "All Levels"
                      ? lvl
                      : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Certifications Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 animate-pulse"
              >
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : certifications.length === 0 ? (
          <div className="text-center py-16">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">
              No certifications found
            </p>
            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <Link
                key={cert._id}
                to={`/professional-certifications/${cert.slug}`}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Premium Card */}
                <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-300 h-full group-hover:-translate-y-2">
                  {/* Exclusive Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="px-3 py-1 bg-primary-500 text-white rounded-full text-xs font-bold shadow-lg flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>EXCLUSIVE</span>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary-500/20 to-purple-500/20">
                    <img
                      src={cert.thumbnail}
                      alt={cert.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                    {/* Level Badge */}
                    <div className="absolute bottom-4 left-4">
                      <div
                        className={`px-3 py-1 rounded-lg text-xs font-bold border-2 backdrop-blur-sm ${getLevelColor(
                          cert.level
                        )}`}
                      >
                        {cert.level?.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category */}
                    <div className="text-xs text-primary-500 font-bold mb-2 uppercase tracking-wider">
                      {cert.category}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-500 transition">
                      {cert.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {cert.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {cert.duration} min
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {cert.totalQuestions} questions
                        </span>
                      </div>
                    </div>

                    {/* User Attempts (if logged in) */}
                    {user && cert.userAttempts !== undefined && (
                      <div className="mb-4 p-3 bg-primary-500/5 border border-primary-500/20 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Attempts used:
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {cert.userAttempts} / {cert.maxAttempts}
                          </span>
                        </div>
                        {!cert.canTakeTest && (
                          <div className="mt-2 text-xs text-red-500 font-medium">
                            No attempts remaining
                          </div>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${cert.certificatePrice?.usd || 5}
                        </div>
                        <div className="text-xs text-gray-500">
                          per certificate
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-primary-500 font-bold group-hover:translate-x-2 transition-transform">
                        <span>View Details</span>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-purple-500/5 to-primary-500/5"></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-500 to-purple-600 rounded-3xl p-12 text-white text-center">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative">
            <TrendingUp className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              Ready to Prove Your Expertise?
            </h2>
            <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
              Take professional tests, earn blockchain-verified certificates,
              and stand out in the Web3 job market.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-2xl font-bold">3</div>
                <div className="text-xs text-white/70">Attempts</div>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-2xl font-bold">Free</div>
                <div className="text-xs text-white/70">Tests</div>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-2xl font-bold">$5</div>
                <div className="text-xs text-white/70">Certificate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCertificationsPage;
