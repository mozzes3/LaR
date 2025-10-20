import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  Filter,
  Eye,
  Calendar,
  ArrowRight,
  Trophy,
  Star,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";
import { professionalCertificationApi } from "@services/api";
import toast from "react-hot-toast";
import { useWallet } from "@contexts/WalletContext";

const MyProfessionalAttemptsPage = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const [attempts, setAttempts] = useState([]);
  const [filteredAttempts, setFilteredAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      navigate("/");
      return;
    }
    loadAttempts();
  }, [isConnected]);

  useEffect(() => {
    applyFilters();
  }, [filter, categoryFilter, attempts]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const response = await professionalCertificationApi.getMyAttempts();
      setAttempts(response.data.attempts);

      const uniqueCategories = [
        ...new Set(response.data.attempts.map((a) => a.certification.category)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Load attempts error:", error);
      toast.error("Failed to load attempts");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attempts];

    if (filter === "passed") {
      filtered = filtered.filter((a) => a.passed);
    } else if (filter === "failed") {
      filtered = filtered.filter((a) => !a.passed);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (a) => a.certification.category === categoryFilter
      );
    }

    setFilteredAttempts(filtered);
  };

  const getGrade = (score) => {
    if (score >= 95)
      return {
        text: "Outstanding",
        color: "from-purple-500 to-pink-500",
        textColor: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
      };
    if (score >= 85)
      return {
        text: "Excellent",
        color: "from-green-500 to-emerald-500",
        textColor: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
      };
    if (score >= 75)
      return {
        text: "Very Good",
        color: "from-blue-500 to-cyan-500",
        textColor: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
      };
    if (score >= 70)
      return {
        text: "Good",
        color: "from-cyan-500 to-teal-500",
        textColor: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/30",
      };
    if (score >= 60)
      return {
        text: "Pass",
        color: "from-yellow-500 to-orange-500",
        textColor: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
      };
    return {
      text: "Fail",
      color: "from-red-500 to-rose-500",
      textColor: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    };
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const passedAttempts = attempts.filter((a) => a.passed);
  const failedAttempts = attempts.filter((a) => !a.passed);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <Sparkles className="w-8 h-8 text-primary-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Elite Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 p-[2px]">
          <div className="bg-white dark:bg-black rounded-3xl p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-2xl">
                    <Shield className="w-8 h-8 text-primary-500" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                      Test Attempts
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Professional Certification History
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
                <span className="text-sm font-bold text-primary-500">
                  ELITE STATUS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black p-[2px] hover:scale-105 transition-transform duration-300">
            <div className="bg-gray-900 rounded-2xl p-6 h-full">
              <div className="flex items-center justify-between mb-3">
                <Target className="w-8 h-8 text-primary-500" />
                <div className="px-2 py-1 bg-primary-500/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-primary-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {attempts.length}
              </p>
              <p className="text-sm text-gray-400">Total Attempts</p>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary-500/5 rounded-tl-full"></div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-900 to-emerald-900 p-[2px] hover:scale-105 transition-transform duration-300">
            <div className="bg-gradient-to-br from-green-900/90 to-emerald-900/90 rounded-2xl p-6 h-full">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div className="px-2 py-1 bg-green-400/20 rounded-lg">
                  <Trophy className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {passedAttempts.length}
              </p>
              <p className="text-sm text-green-200">Passed</p>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-green-400/10 rounded-tl-full"></div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900 to-rose-900 p-[2px] hover:scale-105 transition-transform duration-300">
            <div className="bg-gradient-to-br from-red-900/90 to-rose-900/90 rounded-2xl p-6 h-full">
              <div className="flex items-center justify-between mb-3">
                <XCircle className="w-8 h-8 text-red-400" />
                <div className="px-2 py-1 bg-red-400/20 rounded-lg">
                  <Zap className="w-4 h-4 text-red-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {failedAttempts.length}
              </p>
              <p className="text-sm text-red-200">Failed</p>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-400/10 rounded-tl-full"></div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 to-pink-900 p-[2px] hover:scale-105 transition-transform duration-300">
            <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 rounded-2xl p-6 h-full">
              <div className="flex items-center justify-between mb-3">
                <Star className="w-8 h-8 text-purple-400" />
                <div className="px-2 py-1 bg-purple-400/20 rounded-lg">
                  <Award className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {passedAttempts.length > 0
                  ? Math.round(
                      passedAttempts.reduce((sum, a) => sum + a.score, 0) /
                        passedAttempts.length
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-purple-200">Avg Score</p>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-400/10 rounded-tl-full"></div>
            </div>
          </div>
        </div>

        {/* Filters - Elite Style */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Status Filter
              </label>
              <div className="flex gap-2">
                {[
                  { value: "all", label: "All", icon: Target },
                  { value: "passed", label: "Passed", icon: CheckCircle },
                  { value: "failed", label: "Failed", icon: XCircle },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      filter === item.value
                        ? "bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attempts List - Elite Cards */}
        {filteredAttempts.length === 0 ? (
          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-primary-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No attempts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters
            </p>
            <button
              onClick={() => navigate("/professional-certifications")}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-bold hover:shadow-lg transition"
            >
              Browse Tests
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAttempts.map((attempt) => {
              const grade = getGrade(attempt.score);
              return (
                <div
                  key={attempt._id}
                  onClick={() =>
                    navigate(
                      `/professional-certifications/attempts/${attempt._id}`
                    )
                  }
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r p-[2px] cursor-pointer hover:scale-[1.02] transition-all duration-300"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${
                      attempt.passed
                        ? "rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3)"
                        : "rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3)"
                    })`,
                  }}
                >
                  <div className="bg-white dark:bg-black rounded-2xl p-6">
                    <div className="flex items-start gap-6">
                      {/* Status Icon */}
                      <div
                        className={`p-4 rounded-2xl ${
                          attempt.passed
                            ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                            : "bg-gradient-to-br from-red-500/20 to-rose-500/20"
                        }`}
                      >
                        {attempt.passed ? (
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-500 transition">
                              {attempt.certification.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                Attempt #{attempt.attemptNumber}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(
                                  attempt.completedAt
                                ).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDuration(attempt.duration)}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition" />
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                          <div
                            className={`p-4 rounded-xl ${grade.bgColor} border-2 ${grade.borderColor}`}
                          >
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Score
                            </p>
                            <p
                              className={`text-3xl font-bold ${grade.textColor}`}
                            >
                              {attempt.score}%
                            </p>
                          </div>
                          <div
                            className={`p-4 rounded-xl ${grade.bgColor} border-2 ${grade.borderColor}`}
                          >
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Grade
                            </p>
                            <p
                              className={`text-2xl font-bold ${grade.textColor}`}
                            >
                              {grade.text}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Correct
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {attempt.correctAnswers}/{attempt.totalQuestions}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfessionalAttemptsPage;
