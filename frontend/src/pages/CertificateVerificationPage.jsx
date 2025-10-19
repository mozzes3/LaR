// frontend/src/pages/CertificateVerificationPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Award,
  Calendar,
  User,
  BookOpen,
  Trophy,
} from "lucide-react";
import { certificateApi } from "@services/api";

const CertificateVerificationPage = () => {
  const { certificateNumber } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setLoading(true);
        const response = await certificateApi.verifyCertificate(
          certificateNumber
        );

        if (response.data.valid) {
          setCertificate(response.data.certificate);
        } else {
          setError("Certificate not found or invalid");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("Failed to verify certificate. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Verifying certificate...
          </p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Certificate Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "This certificate could not be verified."}
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleViewOnBlockchain = () => {
    if (certificate.blockchainExplorerUrl) {
      window.open(certificate.blockchainExplorerUrl, "_blank");
    } else if (certificate.blockchainHash) {
      window.open(
        `https://shannon-explorer.somnia.network/tx/${certificate.blockchainHash}`,
        "_blank"
      );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Certificate Verified
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This certificate is authentic and verified on Somnia blockchain
          </p>
        </div>

        {/* Certificate Details Card */}
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-8 mb-6">
          {/* Certificate Number */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div>
              <p className="text-sm text-gray-500 mb-1">Certificate Number</p>
              <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                {certificate.certificateNumber}
              </p>
            </div>
            <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-500 font-bold text-sm">VERIFIED ✓</p>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary-400/10 rounded-lg">
                <User className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Student Name</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {certificate.studentName}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary-400/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Completed Date</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {new Date(certificate.completedDate).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-start space-x-3 mb-3">
              <div className="p-2 bg-primary-400/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Course Title</p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">
                  {certificate.courseTitle}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Instructor</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {certificate.instructor}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Hours</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {certificate.totalHours}h
                </p>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl text-center">
              <Trophy className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 mb-1">Grade</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {certificate.grade}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl text-center">
              <Award className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 mb-1">Score</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {certificate.finalScore}%
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl text-center">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 mb-1">Lessons</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {certificate.totalLessons}
              </p>
            </div>
          </div>

          {/* Blockchain Verification */}
          <div className="p-4 bg-gradient-to-br from-primary-400/10 to-purple-500/10 border-2 border-primary-400/30 rounded-xl">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Blockchain Verification
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              This certificate is permanently recorded on Somnia blockchain
            </p>

            {certificate.blockchainHash && (
              <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                <p className="text-xs font-mono text-gray-900 dark:text-white break-all">
                  {certificate.blockchainHash}
                </p>
              </div>
            )}

            <button
              onClick={handleViewOnBlockchain}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-primary-400 text-primary-400 rounded-lg font-medium hover:bg-primary-400 hover:text-black transition"
            >
              <ExternalLink className="w-5 h-5" />
              <span>View on Somnia Explorer</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Issued by Lizard Academy • Verified on Somnia Blockchain
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-primary-400 hover:text-primary-500 font-semibold"
          >
            Visit Lizard Academy →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
