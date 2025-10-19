// frontend/src/components/CourseCompletionModal.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  CheckCircle,
  Loader2,
  Sparkles,
  Award,
  Shield,
} from "lucide-react";
import confetti from "canvas-confetti";

const CourseCompletionModal = ({
  isOpen,
  onClose,
  courseTitle,
  certificateId,
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      // Reset to step 1 when modal opens
      setStep(1);

      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ["#00ff87", "#00d4ff", "#ffed4e"];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // Progress through steps automatically
      const timer1 = setTimeout(() => setStep(2), 1500);
      const timer2 = setTimeout(() => setStep(3), 3000);
      const timer3 = setTimeout(() => setStep(4), 5000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen]);

  const handleViewCertificate = () => {
    onClose();
    navigate("/certificates");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-primary-400 rounded-3xl max-w-2xl w-full overflow-hidden">
          {/* Animated background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
              <div className="absolute top-10 left-10 w-32 h-32 bg-primary-400/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-8 md:p-12">
            {/* Trophy Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-400 blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-primary-400 to-yellow-500 rounded-full p-6">
                  <Trophy className="w-16 h-16 text-black" />
                </div>
              </div>
            </div>

            {/* Congratulations Text */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                Congratulations!
                <Sparkles className="w-8 h-8 text-primary-400 animate-pulse" />
              </h1>
              <p className="text-gray-300 text-lg">
                You've completed{" "}
                <span className="text-primary-400 font-semibold">
                  {courseTitle}
                </span>
              </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4 mb-8">
              {/* Step 1: Lessons Completed */}
              <div
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-500 ${
                  step >= 1
                    ? "border-green-500 bg-green-500/10"
                    : "border-gray-700 bg-gray-800/50"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    step >= 1 ? "bg-green-500 scale-110" : "bg-gray-700"
                  }`}
                >
                  {step >= 1 ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      step >= 1 ? "text-white" : "text-gray-400"
                    }`}
                  >
                    All lessons completed
                  </p>
                  <p className="text-sm text-gray-500">Course progress: 100%</p>
                </div>
              </div>

              {/* Step 2: Generating Certificate */}
              <div
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-500 ${
                  step >= 2
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 bg-gray-800/50"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    step >= 2
                      ? "bg-blue-500 scale-110"
                      : step === 1
                      ? "bg-gray-700 animate-pulse"
                      : "bg-gray-700"
                  }`}
                >
                  {step >= 2 ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : step === 1 ? (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  ) : (
                    <Award className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      step >= 2 ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {step >= 2
                      ? "Certificate generated"
                      : "Generating certificate..."}
                  </p>
                  <p className="text-sm text-gray-500">
                    Creating your achievement proof
                  </p>
                </div>
              </div>

              {/* Step 3: Blockchain Verification */}
              <div
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-500 ${
                  step >= 3
                    ? "border-primary-400 bg-primary-400/10"
                    : "border-gray-700 bg-gray-800/50"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    step >= 3
                      ? "bg-primary-400 scale-110"
                      : step === 2
                      ? "bg-gray-700 animate-pulse"
                      : "bg-gray-700"
                  }`}
                >
                  {step >= 3 ? (
                    <CheckCircle className="w-6 h-6 text-black" />
                  ) : step === 2 ? (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  ) : (
                    <Shield className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      step >= 3 ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {step >= 3
                      ? "Verified on Somnia blockchain"
                      : "Recording on blockchain..."}
                  </p>
                  <p className="text-sm text-gray-500">
                    {step >= 3
                      ? "Permanently secured on-chain"
                      : "Ensuring authenticity"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {step >= 4 && (
              <div className="space-y-3 animate-fade-in">
                <button
                  onClick={handleViewCertificate}
                  className="w-full py-4 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold text-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-400/30"
                >
                  <Award className="w-6 h-6" />
                  View Your Certificate
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 border-2 border-gray-700 text-gray-300 rounded-xl font-medium hover:border-primary-400 hover:text-white transition-all duration-200"
                >
                  Continue Exploring
                </button>
              </div>
            )}

            {/* Loading state message */}
            {step < 4 && (
              <div className="text-center text-gray-400 text-sm animate-pulse">
                Please wait while we process your achievement...
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .delay-700 {
          animation-delay: 700ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </>
  );
};

export default CourseCompletionModal;
