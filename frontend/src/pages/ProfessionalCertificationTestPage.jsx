// frontend/src/pages/ProfessionalCertificationTestPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  AlertTriangle,
  Lock,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { professionalCertificationApi } from "@services/api";

const ProfessionalCertificationTestPage = () => {
  const { certificationId } = useParams();
  const navigate = useNavigate();

  // Test state
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionToken, setSessionToken] = useState(null);
  const [attemptId, setAttemptId] = useState(null);

  // Security state
  const [tabSwitches, setTabSwitches] = useState(0);
  const [maxWarnings, setMaxWarnings] = useState(2);
  const [showWarning, setShowWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testCancelled, setTestCancelled] = useState(false);
  const [securityLog, setSecurityLog] = useState([]); // ADD THIS

  // Refs for security
  const timerRef = useRef(null);
  const visibilityChangeRef = useRef(null);
  const startTimeRef = useRef({});
  const securityLogRef = useRef([]); // ADD THIS

  // Log security events - DEFINE BEFORE USE
  const logSecurityEvent = useCallback((eventType) => {
    const event = {
      type: eventType,
      timestamp: Date.now(),
    };
    securityLogRef.current.push(event);
    setSecurityLog((prev) => [...prev, event]);
  }, []);

  // Anti-cheat: Disable right-click
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      logSecurityEvent("right-click");
      toast.error("Right-click is disabled");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [logSecurityEvent]);

  // Anti-cheat: Disable copy/paste
  useEffect(() => {
    const handleCopy = (e) => {
      e.preventDefault();
      logSecurityEvent("copy-attempt");
      toast.error("Copying is disabled");
    };

    const handlePaste = (e) => {
      e.preventDefault();
      logSecurityEvent("paste-attempt");
      toast.error("Pasting is disabled");
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [logSecurityEvent]);

  // Anti-cheat: Tab switch detection
  useEffect(() => {
    if (!attemptId || !sessionToken || !certificationId) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);
        logSecurityEvent("tab-switch");

        const warningsLeft = maxWarnings - newCount;

        if (newCount > maxWarnings) {
          setTestCancelled(true);
          toast.error("Test cancelled due to tab switching");
          setTimeout(
            () => navigate(`/professional-certifications/${certificationId}`),
            2000
          );
        } else {
          setShowWarning(true);
          toast.error(
            `Warning! ${warningsLeft} warning(s) remaining. Test will be cancelled if you switch tabs again.`,
            { duration: 5000 }
          );
          setTimeout(() => setShowWarning(false), 5000);
        }
      }
    };

    visibilityChangeRef.current = handleVisibilityChange;
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    attemptId,
    sessionToken,
    certificationId,
    tabSwitches,
    maxWarnings,
    navigate,
    logSecurityEvent,
  ]);

  // Load/start test
  useEffect(() => {
    let isMounted = true;
    let hasStarted = false; // ADD THIS FLAG

    const startTest = async (retryCount = 0) => {
      if (!isMounted || hasStarted) return; // CHECK FLAG
      hasStarted = true; // SET FLAG

      try {
        setLoading(true);

        const response = await professionalCertificationApi.startTest({
          certificationId,
        });

        if (!isMounted) return;

        const {
          attemptId,
          sessionToken,
          questions,
          timeRemaining,
          attemptNumber,
          settings,
        } = response.data;

        setAttemptId(attemptId);
        setSessionToken(sessionToken);
        setTestData({
          questions,
          attemptNumber,
        });
        setTimeRemaining(timeRemaining);
        setMaxWarnings(settings?.tabSwitchWarnings || 2);

        const times = {};
        questions.forEach((q) => {
          times[q._id] = Date.now();
        });
        startTimeRef.current = times;

        setLoading(false);
        toast.success(`Test started! Attempt ${attemptNumber}`);
      } catch (error) {
        if (!isMounted) return;

        // Retry on 429 - but only if not already started
        if (error.response?.status === 429 && retryCount < 2 && !hasStarted) {
          hasStarted = false; // Reset for retry
          console.log(`Retrying... attempt ${retryCount + 1}`);
          setTimeout(() => {
            if (isMounted) {
              startTest(retryCount + 1);
            }
          }, 1000 * (retryCount + 1)); // 1s, 2s backoff
          return;
        }

        console.error("Start test error:", error);
        toast.error(error.response?.data?.error || "Failed to start test");
        setLoading(false);

        // Don't navigate away on 429, let user retry manually
        if (error.response?.status !== 429) {
          navigate(`/professional-certifications/${certificationId}`);
        }
      }
    };

    startTest();

    return () => {
      isMounted = false;
    };
  }, [certificationId, navigate]);
  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || testCancelled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, testCancelled]);

  // Handle answer selection
  const handleAnswerSelect = (questionId, answer) => {
    const timeSpent = Math.floor(
      (Date.now() - startTimeRef.current[questionId]) / 1000
    );

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        answer,
        timeSpent,
      },
    }));

    // Reset timer for this question
    startTimeRef.current[questionId] = Date.now();
  };

  // Submit test
  const handleSubmitTest = async () => {
    if (isSubmitting || testCancelled) return;
    setIsSubmitting(true);

    try {
      const answersArray = Object.entries(answers).map(
        ([questionId, data]) => ({
          questionId,
          answer: data.answer,
          timeSpent: data.timeSpent,
        })
      );

      toast.loading("Submitting test...");

      const response = await professionalCertificationApi.submitTest({
        attemptId,
        sessionToken,
        answers: answersArray,
        securityLog: securityLogRef.current,
      });

      toast.dismiss();
      toast.success("Test submitted successfully!");

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      navigate(`/professional-certifications/results/${attemptId}`, {
        state: { results: response.data.results },
        replace: true,
      });
    } catch (error) {
      setIsSubmitting(false);
      toast.dismiss();
      console.error("Submit test error:", error);
      toast.error(error.response?.data?.error || "Failed to submit test");
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get time color
  const getTimeColor = () => {
    if (timeRemaining < 300) return "text-red-500";
    if (timeRemaining < 600) return "text-yellow-500";
    return "text-green-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Starting test...</p>
        </div>
      </div>
    );
  }

  if (!testData || !testData.questions || testData.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading questions...
          </p>
        </div>
      </div>
    );
  }

  if (testCancelled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-black border-2 border-red-500 rounded-xl p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Test Cancelled
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your test was cancelled due to security violations (tab
              switching).
            </p>
            <button
              onClick={() =>
                navigate(`/professional-certifications/${certificationId}`)
              }
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
            >
              Return to Certification
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = testData?.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / testData?.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Security Warning */}
        {showWarning && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <p className="font-bold">Warning!</p>
                <p className="text-sm">
                  {maxWarnings - tabSwitches} warning(s) remaining
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">
                  Attempt {testData?.attemptNumber}
                </p>
                <p className="font-bold text-gray-900 dark:text-white">
                  Professional Certification Test
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className="flex items-center space-x-2">
                <Clock className={`w-5 h-5 ${getTimeColor()}`} />
                <span
                  className={`text-xl font-mono font-bold ${getTimeColor()}`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Tab Switch Counter */}
              <div className="flex items-center space-x-2">
                <Eye
                  className={
                    tabSwitches > 0
                      ? "w-5 h-5 text-red-500"
                      : "w-5 h-5 text-gray-400"
                  }
                />
                <span className="text-sm text-gray-500">
                  {tabSwitches}/{maxWarnings}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Question {currentQuestion + 1} of {testData?.questions.length}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                {question?.question}
              </h3>
              <span className="px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg text-sm font-bold ml-4">
                {question?.points} {question?.points === 1 ? "point" : "points"}
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question?.type === "multiple-choice" ? (
              question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(question._id, option.text)}
                  className={`w-full text-left p-4 border-2 rounded-xl transition ${
                    answers[question._id]?.answer === option.text
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-gray-200 dark:border-gray-800 hover:border-primary-500"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        answers[question._id]?.answer === option.text
                          ? "border-primary-500 bg-primary-500"
                          : "border-gray-300 dark:border-gray-700"
                      }`}
                    >
                      {answers[question._id]?.answer === option.text && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white">
                      {option.text}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <>
                <button
                  onClick={() => handleAnswerSelect(question._id, "true")}
                  className={`w-full text-left p-4 border-2 rounded-xl transition ${
                    answers[question._id]?.answer === "true"
                      ? "border-green-500 bg-green-500/10"
                      : "border-gray-200 dark:border-gray-800 hover:border-green-500"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle
                      className={
                        answers[question._id]?.answer === "true"
                          ? "w-6 h-6 text-green-500"
                          : "w-6 h-6 text-gray-300 dark:text-gray-700"
                      }
                    />
                    <span className="text-gray-900 dark:text-white font-bold">
                      TRUE
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleAnswerSelect(question._id, "false")}
                  className={`w-full text-left p-4 border-2 rounded-xl transition ${
                    answers[question._id]?.answer === "false"
                      ? "border-red-500 bg-red-500/10"
                      : "border-gray-200 dark:border-gray-800 hover:border-red-500"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <XCircle
                      className={
                        answers[question._id]?.answer === "false"
                          ? "w-6 h-6 text-red-500"
                          : "w-6 h-6 text-gray-300 dark:text-gray-700"
                      }
                    />
                    <span className="text-gray-900 dark:text-white font-bold">
                      FALSE
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition"
          >
            Previous
          </button>

          <div className="flex items-center space-x-2">
            {testData?.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg font-bold transition ${
                  index === currentQuestion
                    ? "bg-primary-500 text-white"
                    : answers[testData.questions[index]._id]
                    ? "bg-green-500/20 text-green-500 border-2 border-green-500"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === testData?.questions.length - 1 ? (
            <button
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestion((prev) =>
                  Math.min(testData.questions.length - 1, prev + 1)
                )
              }
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
            >
              Next
            </button>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-bold text-gray-900 dark:text-white mb-1">
                Security Notice:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Do not switch tabs or your test will be cancelled</li>
                <li>Copy/paste is disabled</li>
                <li>Right-click is disabled</li>
                <li>All activity is monitored and logged</li>
                <li>Test will auto-submit when time expires</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCertificationTestPage;
