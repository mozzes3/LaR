import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Award,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowRight,
  Shield,
  Sparkles,
  Star,
  ChevronRight,
  Home,
  RotateCcw,
  FileCheck,
  Zap,
} from "lucide-react";
import { professionalCertificationApi } from "@services/api";
import toast from "react-hot-toast";

const ProfessionalCertificationResultPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [attempt, setAttempt] = useState(null);
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttemptDetails();
  }, [attemptId]);

  const loadAttemptDetails = async () => {
    try {
      const response = await professionalCertificationApi.getAttemptDetails(
        attemptId
      );
      setAttempt(response.data.attempt);
      setCertification(response.data.certification);
      console.log("Certification data:", response.data.certification); // Debug log
    } catch (error) {
      console.error("Load attempt error:", error);
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
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

  const getGradeColor = (grade) => {
    const colors = {
      Outstanding: "from-amber-400 via-yellow-500 to-amber-600",
      Excellent: "from-emerald-400 via-green-500 to-emerald-600",
      "Very Good": "from-blue-400 via-indigo-500 to-blue-600",
      Good: "from-cyan-400 via-blue-500 to-cyan-600",
      Pass: "from-orange-400 via-amber-500 to-orange-600",
      Fail: "from-gray-400 via-slate-500 to-gray-600",
    };
    return colors[grade] || colors.Fail;
  };

  const getGradeIcon = (grade) => {
    if (grade === "Outstanding") return Trophy;
    if (grade === "Excellent" || grade === "Very Good") return Award;
    if (grade === "Good" || grade === "Pass") return Target;
    return XCircle;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading results...
          </p>
        </div>
      </div>
    );
  }

  if (!attempt || !certification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Results Not Found
          </h2>
          <button
            onClick={() => navigate("/professional-certifications")}
            className="mt-6 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition"
          >
            Browse Certifications
          </button>
        </div>
      </div>
    );
  }

  const passed = attempt.passed;
  const GradeIcon = getGradeIcon(attempt.grade);
  const accuracyRate = (
    (attempt.correctAnswers / attempt.totalQuestions) *
    100
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-6">
          <button
            onClick={() => navigate("/")}
            className="hover:text-gray-900 dark:hover:text-white transition"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button
            onClick={() => navigate("/professional-certifications")}
            className="hover:text-gray-900 dark:hover:text-white transition"
          >
            Certifications
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 dark:text-white font-medium">
            Test Results
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          {/* Header */}
          <div className="relative border-b border-gray-200 dark:border-gray-800 px-8 py-8 bg-gradient-to-br from-white via-primary-50/30 to-white dark:from-gray-950 dark:via-primary-950/20 dark:to-gray-950 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl"></div>

            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-500/10 via-primary-600/10 to-primary-500/10 dark:from-primary-500/20 dark:via-primary-600/20 dark:to-primary-500/20 rounded-full mb-4 border border-primary-200/50 dark:border-primary-800/50">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                    {passed ? "Test Passed" : "Test Completed"}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                  {certification.title}
                  {passed && (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        CERTIFIED
                      </span>
                    </div>
                  )}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Certificate of Competency Assessment
                  {certification.subcategory
                    ? ` • ${certification.subcategory}`
                    : certification.category
                    ? ` • ${certification.category}`
                    : ""}
                </p>
              </div>

              {/* Enhanced Grade Badge */}
              <div className="relative group">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${getGradeColor(
                    attempt.grade
                  )} opacity-20 rounded-2xl blur-xl group-hover:opacity-30 transition-all`}
                ></div>
                <div
                  className={`relative px-6 py-4 rounded-2xl bg-gradient-to-br ${getGradeColor(
                    attempt.grade
                  )} shadow-xl border-2 border-white/20`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-1.5">
                      <GradeIcon className="w-5 h-5 text-white drop-shadow-lg" />
                      <p className="text-[10px] uppercase tracking-widest text-white/90 font-black">
                        Grade
                      </p>
                    </div>
                    <p className="text-3xl font-black text-white drop-shadow-2xl tracking-tight">
                      {attempt.grade}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Metadata Bar */}
          <div className="bg-gradient-to-r from-gray-50 via-primary-50/40 to-gray-50 dark:from-gray-900/50 dark:via-primary-900/10 dark:to-gray-900/50 px-8 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-4 gap-6">
              <div className="group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-primary-500/10 dark:bg-primary-500/20 rounded">
                    <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500 font-black">
                    Attempt Number
                  </p>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white">
                  #{attempt.attemptNumber}
                </p>
              </div>
              <div className="group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-blue-500/10 dark:bg-blue-500/20 rounded">
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500 font-black">
                    Reference ID
                  </p>
                </div>
                <p className="text-xs font-mono font-black text-gray-900 dark:text-white">
                  {attemptId.slice(-8).toUpperCase()}
                </p>
              </div>
              <div className="group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500 font-black">
                    Completed On
                  </p>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white">
                  {new Date(attempt.completedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-purple-500/10 dark:bg-purple-500/20 rounded">
                    <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500 font-black">
                    Time Taken
                  </p>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white">
                  {formatDuration(attempt.duration)}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Results Grid */}
          <div className="p-8">
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Score - Enhanced */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-primary-400/20 to-primary-600/20 dark:from-primary-500/30 dark:via-primary-400/30 dark:to-primary-600/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative p-6 border-2 border-primary-200 dark:border-primary-900/50 rounded-2xl bg-gradient-to-br from-white via-primary-50/30 to-white dark:from-gray-950 dark:via-primary-950/20 dark:to-gray-950 hover:border-primary-400 dark:hover:border-primary-700 transition-all shadow-lg hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary-600 dark:text-primary-400 font-black mb-1">
                        Final Score
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-semibold">
                        Performance Rating
                      </p>
                    </div>
                    <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <p className="text-5xl font-black bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 dark:from-primary-400 dark:via-primary-300 dark:to-primary-400 bg-clip-text text-transparent">
                      {attempt.score}
                    </p>
                    <span className="text-2xl font-bold text-gray-400 dark:text-gray-600">
                      %
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 h-2.5 rounded-full transition-all duration-1000 shadow-lg shadow-primary-500/50"
                        style={{ width: `${attempt.score}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-gray-500">0%</span>
                      <span className="text-primary-600 dark:text-primary-400">
                        PASSING: {certification.passingScore}%
                      </span>
                      <span className="text-gray-500">100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Correct - Enhanced */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-600/20 dark:from-emerald-500/30 dark:via-green-500/30 dark:to-emerald-600/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative p-6 border-2 border-emerald-200 dark:border-emerald-900/50 rounded-2xl bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-gray-950 dark:via-emerald-950/20 dark:to-gray-950 hover:border-emerald-400 dark:hover:border-emerald-700 transition-all shadow-lg hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-black mb-1">
                        Correct Answers
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-semibold">
                        Questions Mastered
                      </p>
                    </div>
                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <p className="text-5xl font-black bg-gradient-to-br from-emerald-600 via-green-500 to-emerald-600 dark:from-emerald-400 dark:via-green-300 dark:to-emerald-400 bg-clip-text text-transparent">
                      {attempt.correctAnswers}
                    </p>
                    <span className="text-xl font-bold text-gray-400">
                      / {attempt.totalQuestions}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-900">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {accuracyRate}% Accuracy
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500 font-semibold">
                        Success Rate
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Incorrect - Enhanced */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 via-gray-500/10 to-slate-600/10 dark:from-slate-500/20 dark:via-gray-500/20 dark:to-slate-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative p-6 border-2 border-gray-200 dark:border-gray-800 rounded-2xl bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-950 dark:via-gray-900/50 dark:to-gray-950 hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-lg hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-400 font-black mb-1">
                        Incorrect
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-semibold">
                        Review Needed
                      </p>
                    </div>
                    <div className="p-2.5 bg-gradient-to-br from-gray-400 to-slate-500 rounded-xl shadow-lg">
                      <XCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <p className="text-5xl font-black text-gray-700 dark:text-gray-300">
                      {attempt.totalQuestions - attempt.correctAnswers}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        {(100 - parseFloat(accuracyRate)).toFixed(1)}% Missed
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500 font-semibold">
                        Error Rate
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary-500" />
                Performance Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Passing Score
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {certification.passingScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Your Score
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      passed
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-500"
                    }`}
                  >
                    {attempt.score}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Questions
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {attempt.totalQuestions}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Attempts Remaining
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {Math.max(
                      0,
                      certification.maxAttempts - attempt.attemptNumber
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {passed ? (
                <button
                  onClick={() => navigate("/certificates")}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all group"
                >
                  <Award className="w-4 h-4" />
                  Claim Certificate
                  <span className="text-xs opacity-75">($5)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                certification.maxAttempts - attempt.attemptNumber > 0 && (
                  <button
                    onClick={() =>
                      navigate(
                        `/professional-certifications/${certification.slug}`
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all group"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retake Assessment
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )
              )}
              <button
                onClick={() => navigate("/professional-certifications")}
                className="px-6 py-3.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                Browse Certifications
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {passed ? (
          <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                  Congratulations on passing the assessment
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  You've demonstrated professional-level competency. Claim your
                  blockchain-verified certificate to showcase your achievement.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Keep improving your skills
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  You have {certification.maxAttempts - attempt.attemptNumber}{" "}
                  attempt
                  {certification.maxAttempts - attempt.attemptNumber !== 1
                    ? "s"
                    : ""}{" "}
                  remaining. Review the material and try again when ready.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalCertificationResultPage;
