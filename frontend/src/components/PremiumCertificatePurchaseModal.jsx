import { useState } from "react";
import {
  X,
  Shield,
  Award,
  Check,
  Loader,
  Sparkles,
  Lock,
  Zap,
  Download,
  Eye,
  ExternalLink,
} from "lucide-react";
import { professionalCertificationApi } from "@services/api";
import toast from "react-hot-toast";

const PremiumCertificatePurchaseModal = ({
  attempt,
  certification,
  onClose,
  onSuccess,
}) => {
  console.log("🎯 Modal opened with attempt:", attempt);
  console.log("🆔 Attempt ID:", attempt?._id);

  const [step, setStep] = useState("confirm");
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [certificate, setCertificate] = useState(null);

  const stages = [
    { key: "payment", label: "Processing Payment", duration: 1500 },
    { key: "generating", label: "Generating Certificate", duration: 2000 },
    { key: "blockchain", label: "Verifying on Blockchain", duration: 2500 },
    { key: "finalizing", label: "Finalizing Certificate", duration: 1000 },
  ];

  const handlePurchase = async () => {
    if (!attempt?._id) {
      toast.error("Invalid attempt data");
      console.error("Missing attempt ID:", attempt);
      return;
    }

    setProcessing(true);
    setStep("processing");

    try {
      for (const stage of stages) {
        setProcessingStage(stage.key);
        await new Promise((resolve) => setTimeout(resolve, stage.duration));
      }

      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      console.log("📤 Sending purchase request:", {
        attemptId: attempt._id,
        paymentMethod: "usdt",
        transactionHash: mockTxHash,
      });

      const response = await professionalCertificationApi.purchaseCertificate({
        attemptId: attempt._id,
        paymentMethod: "usdt",
        transactionHash: mockTxHash,
      });

      setCertificate(response.data.certificate);

      // Check if certificate already existed
      if (response.data.alreadyExists) {
        toast.success("Certificate already purchased!");
        // Redirect to certificates page
        setTimeout(() => {
          window.location.href = "/certificates?tab=competency";
        }, 1000);
        return;
      }

      setStep("success");

      if (onSuccess) onSuccess(response.data.certificate);

      setCertificate(response.data.certificate);
      setStep("success");

      if (onSuccess) onSuccess(response.data.certificate);
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error(error.response?.data?.error || "Purchase failed");
      setStep("confirm");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl border-2 border-primary-500/30 max-w-2xl w-full shadow-2xl shadow-primary-500/20 animate-slideUp">
        {step === "confirm" && (
          <>
            {/* Header */}
            <div className="relative p-8 border-b border-gray-800">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-purple-500 to-primary-400"></div>
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/50">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-white">
                      Validate Certificate
                    </h2>
                    <Sparkles className="w-5 h-5 text-primary-400 animate-pulse" />
                  </div>
                  <p className="text-gray-400">Certificate of Competency</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Certificate Preview */}
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 bg-primary-500/20 border border-primary-500/50 rounded-full text-xs font-bold text-primary-400">
                    OFFICIAL
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {certification.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <span>{certification.category}</span>
                  {certification.subcategories?.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{certification.subcategories.join(" | ")}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Your Score</p>
                    <p className="text-2xl font-bold text-primary-400">
                      {attempt.score}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Passed On</p>
                    <p className="text-sm font-medium text-white">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shield, label: "NFT Blockchain Verified" },
                  { icon: Lock, label: "Tamper-Proof" },
                  { icon: Award, label: "Globally Recognized" },
                  { icon: Zap, label: "Instant Delivery" },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700"
                  >
                    <feature.icon className="w-5 h-5 text-primary-400" />
                    <span className="text-sm font-medium text-gray-300">
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 border border-primary-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Validation Fee</p>
                    <p className="text-4xl font-bold text-white">
                      ${certification.certificatePrice?.usd || 5}
                      <span className="text-lg text-gray-400 ml-2">USD</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-xl">
                      <p className="text-xs text-green-400 font-bold">
                        ONE-TIME FEE
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={handlePurchase}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white font-bold rounded-xl transition shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Award className="w-5 h-5" />
                <span>Validate Certificate Now</span>
              </button>

              <p className="text-xs text-center text-gray-500">
                🔒 Secure payment • Instant delivery • Lifetime validity
              </p>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="p-12 text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/50">
                <Loader className="w-16 h-16 text-white animate-spin" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              {stages.find((s) => s.key === processingStage)?.label ||
                "Processing..."}
            </h3>

            <div className="max-w-md mx-auto space-y-3">
              {stages.map((stage, index) => (
                <div key={stage.key} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                      stages.findIndex((s) => s.key === processingStage) > index
                        ? "bg-green-500"
                        : stages.findIndex((s) => s.key === processingStage) ===
                          index
                        ? "bg-primary-500 animate-pulse"
                        : "bg-gray-700"
                    }`}
                  >
                    {stages.findIndex((s) => s.key === processingStage) >
                    index ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Loader className="w-5 h-5 text-white animate-spin" />
                    )}
                  </div>
                  <span className="text-gray-300 font-medium">
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-gray-500 mt-8 text-sm">
              Please wait while we process your certificate...
            </p>
          </div>
        )}

        {step === "success" && certificate && (
          <div className="p-12 text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                <Check className="w-16 h-16 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              Congratulations!
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Your certificate is ready
            </p>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-8">
              <p className="text-sm text-gray-400 mb-2">Certificate Number</p>
              <p className="text-2xl font-mono font-bold text-primary-400">
                {certificate.certificateNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() =>
                  window.open(`/certificates/view/${certificate._id}`, "_blank")
                }
                className="py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                <span>View</span>
              </button>
              <button
                onClick={() => {
                  /* Download logic */
                }}
                className="py-3 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>Download</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-6 text-gray-400 hover:text-white transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumCertificatePurchaseModal;
