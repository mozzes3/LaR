import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Download,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import { professionalCertificationApi } from "@services/api";

const ProfessionalCertificationResultsPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadResults();
  }, [attemptId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await professionalCertificationApi.getAttemptDetails(
        attemptId
      );
      setResults(response.data);
    } catch (error) {
      console.error("Load results error:", error);
      toast.error("Failed to load results");
      navigate("/professional-certifications");
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade === "Outstanding" || grade === "Excellent")
      return "text-green-500";
    if (grade === "Very Good" || grade === "Good") return "text-blue-500";
    return "text-yellow-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  const { attempt, certification } = results || {};

  if (!attempt || !certification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  const passed = attempt.passed;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Results Card */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
          {/* Header */}
          <div
            className={`p-8 text-center ${
              passed
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : "bg-gradient-to-r from-red-500 to-rose-600"
            } text-white`}
          >
            {passed ? (
              <CheckCircle className="w-20 h-20 mx-auto mb-4" />
            ) : (
              <XCircle className="w-20 h-20 mx-auto mb-4" />
            )}
            <h1 className="text-4xl font-bold mb-2">
              {passed ? "Congratulations!" : "Test Not Passed"}
            </h1>
            <p className="text-xl text-white/90">
              {passed
                ? "You have successfully passed the certification test"
                : "You did not meet the passing score this time"}
            </p>
          </div>

          {/* Score Summary */}
          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <Target className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {attempt.score}%
                </p>
                <p className="text-sm text-gray-500">Score</p>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {attempt.correctAnswers}
                </p>
                <p className="text-sm text-gray-500">Correct</p>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {attempt.totalQuestions - attempt.correctAnswers}
                </p>
                <p className="text-sm text-gray-500">Incorrect</p>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.floor(attempt.duration / 60)}m
                </p>
                <p className="text-sm text-gray-500">Duration</p>
              </div>
            </div>

            {/* Grade */}
            <div className="text-center py-6 border-y-2 border-gray-200 dark:border-gray-800">
              <p className="text-gray-500 mb-2">Your Grade</p>
              <p
                className={`text-5xl font-bold ${getGradeColor(attempt.grade)}`}
              >
                {attempt.grade}
              </p>
            </div>

            {/* Performance Breakdown */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Performance Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <span className="text-gray-600 dark:text-gray-400">
                    Passing Score Required
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {certification.passingScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <span className="text-gray-600 dark:text-gray-400">
                    Your Score
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {attempt.score}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <span className="text-gray-600 dark:text-gray-400">
                    Questions Answered Correctly
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {attempt.correctAnswers} / {attempt.totalQuestions}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-4">
              {passed ? (
                <>
                  <Link
                    to="/professional-certifications/certificates/eligible"
                    className="flex items-center justify-center space-x-2 w-full py-4 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
                  >
                    <Award className="w-5 h-5" />
                    <span>Purchase Certificate ($5)</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <p className="text-center text-sm text-gray-500">
                    Get your blockchain-verified professional certificate
                  </p>
                </>
              ) : (
                <>
                  <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold text-gray-900 dark:text-white mb-1">
                          You can retake this test
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          You have{" "}
                          {certification.maxAttempts - attempt.attemptNumber}{" "}
                          attempt(s) remaining. Review the material and try
                          again!
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/professional-certifications/${certification.slug}`}
                    className="flex items-center justify-center space-x-2 w-full py-4 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>Try Again</span>
                  </Link>
                </>
              )}

              <Link
                to="/professional-certifications"
                className="block text-center py-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-bold hover:border-primary-500 transition"
              >
                Back to Certifications
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCertificationResultsPage;
