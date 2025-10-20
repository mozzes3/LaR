// frontend/src/pages/ProfessionalCertificationDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Award,
  Shield,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Lock,
  Sparkles,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { professionalCertificationApi } from "@services/api";
import toast from "react-hot-toast";
import { useWallet } from "@contexts/WalletContext";

const ProfessionalCertificationDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isConnected } = useWallet();

  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadCertification();
  }, [slug]);

  const loadCertification = async () => {
    try {
      setLoading(true);
      const response =
        await professionalCertificationApi.getCertificationDetails(slug);
      setCertification(response.data.certification);
    } catch (error) {
      console.error("Load certification error:", error);
      toast.error("Failed to load certification");
      navigate("/professional-certifications");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (certification.attemptsUsed >= certification.maxAttempts) {
      toast.error("You have used all attempts for this certification");
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmStartTest = () => {
    setShowConfirmModal(false);
    navigate(`/professional-certifications/${certification._id}/test`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading certification...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b-2 border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/professional-certifications")}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Certifications</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${getLevelColor(
                    certification.level
                  )}`}
                >
                  {certification.level?.toUpperCase()}
                </div>
                <div className="text-sm text-primary-500 font-bold uppercase tracking-wider">
                  {certification.category}
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {certification.title}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {certification.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Certificate Preview */}
            <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="relative h-96 bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-primary-500/20 flex items-center justify-center">
                <img
                  src={certification.thumbnail}
                  alt={certification.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center">
                  <div className="text-center text-white">
                    <Award className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-2xl font-bold mb-2">
                      Professional Certificate Preview
                    </p>
                    <p className="text-white/80">
                      Earn this blockchain-verified certificate
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Details */}
            <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Test Information
              </h2>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary-500/10 rounded-xl">
                    <Target className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Questions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {certification.totalQuestions}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Clock className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duration</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {certification.duration} min
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Passing Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {certification.passingScore}%
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-yellow-500/10 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Max Attempts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {certification.maxAttempts}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rules */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Test Rules
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Test is completely <span className="font-bold">FREE</span>{" "}
                      to take
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600 dark:text-gray-400">
                      You have{" "}
                      <span className="font-bold">
                        {certification.maxAttempts} attempts
                      </span>{" "}
                      per wallet address
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Timer starts when you begin the test
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Tab switching will{" "}
                      <span className="font-bold">cancel</span> your test after
                      2 warnings
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Copy/paste and right-click are{" "}
                      <span className="font-bold">disabled</span>
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Correct answers are{" "}
                      <span className="font-bold">NOT shown</span> after
                      completion
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Pay <span className="font-bold">$5</span> after passing to
                      get blockchain certificate
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Attempts */}
            {user && certification.userAttempts?.length > 0 && (
              <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Your Attempts
                </h2>

                <div className="space-y-3">
                  {certification.userAttempts.map((attempt, index) => (
                    <div
                      key={attempt._id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-bold text-gray-400">
                          #{attempt.attemptNumber}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900 dark:text-white">
                              Score: {attempt.score}%
                            </span>
                            {attempt.passed ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(attempt.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {attempt.status === "completed" && (
                        <button
                          onClick={() =>
                            navigate(
                              `/professional-certifications/results/${attempt._id}`
                            )
                          }
                          className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-500 transition"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            View Results
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Pricing Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-8 text-white mb-6">
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>EXCLUSIVE</span>
                  </div>
                </div>

                <div className="relative">
                  <Shield className="w-12 h-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">
                    Professional Certificate
                  </h3>
                  <p className="text-white/80 mb-6">
                    Blockchain-verified credential recognized by top Web3
                    companies
                  </p>

                  <div className="mb-6">
                    <div className="text-5xl font-bold mb-2">
                      ${certification.certificatePrice?.usd || 5}
                    </div>
                    <p className="text-white/70">per certificate</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Lifetime valid</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Blockchain verified</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Shareable on LinkedIn</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Downloadable anytime</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  {!isConnected ? (
                    <button
                      onClick={() =>
                        toast.error("Please connect your wallet first")
                      }
                      className="w-full px-6 py-4 bg-white text-primary-500 rounded-xl font-bold hover:bg-gray-100 transition flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-5 h-5" />
                      <span>Connect Wallet to Start</span>
                    </button>
                  ) : certification.attemptsUsed >=
                    certification.maxAttempts ? (
                    <button
                      disabled
                      className="w-full px-6 py-4 bg-gray-500 text-white rounded-xl font-bold cursor-not-allowed opacity-50"
                    >
                      No Attempts Remaining
                    </button>
                  ) : (
                    <button
                      onClick={handleStartTest}
                      className="group w-full px-6 py-4 bg-white text-primary-500 rounded-xl font-bold hover:bg-gray-100 transition flex items-center justify-center space-x-2"
                    >
                      <span>Start Test Now</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {user && (
                    <div className="mt-4 text-center text-sm text-white/70">
                      {certification.attemptsUsed || 0} /{" "}
                      {certification.maxAttempts} attempts used
                    </div>
                  )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              </div>

              {/* Info Box */}
              <div className="bg-primary-500/5 border-2 border-primary-500/20 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-bold text-gray-900 dark:text-white mb-2">
                      Important Note:
                    </p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Test is free to take</li>
                      <li>Pay only after passing</li>
                      <li>Certificate price may change</li>
                      <li>Limited attempts per wallet</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-md w-full animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Start Test?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Once you start, the timer begins immediately. Make sure you're
                ready.
              </p>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{certification.duration} minutes</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Target className="w-4 h-4" />
                <span>{certification.totalQuestions} questions</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <TrendingUp className="w-4 h-4" />
                <span>
                  Attempt {(certification.attemptsUsed || 0) + 1} of{" "}
                  {certification.maxAttempts}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-bold hover:border-primary-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartTest}
                className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
              >
                Start Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalCertificationDetailPage;
