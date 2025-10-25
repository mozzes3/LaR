import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import {
  getStudentPurchaseHistory,
  requestRefund,
} from "../services/paymentApi";
import toast from "react-hot-toast";
import RefundModal from "../components/RefundModal";

const PurchaseHistoryPage = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    fetchPurchaseHistory();
  }, []);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      const response = await getStudentPurchaseHistory();
      setPurchases(response.data.purchases);
    } catch (error) {
      console.error("Failed to fetch purchase history:", error);
      toast.error("Failed to load purchase history");
    } finally {
      setLoading(false);
    }
  };

  const handleRefundClick = (purchase) => {
    setSelectedPurchase(purchase);
    setRefundModalOpen(true);
  };

  const handleConfirmRefund = async () => {
    try {
      toast.loading("Processing refund...");

      const response = await requestRefund(selectedPurchase._id);

      toast.dismiss();
      toast.success("Refund processed successfully!");

      setRefundModalOpen(false);
      setSelectedPurchase(null);

      fetchPurchaseHistory();
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "Refund failed");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount, decimals, symbol) => {
    return `${(amount / Math.pow(10, decimals)).toFixed(2)} ${symbol}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        label: "Active",
      },
      completed: {
        bg: "bg-blue-500/20",
        text: "text-blue-400",
        label: "Completed",
      },
      refunded: {
        bg: "bg-red-500/20",
        text: "text-red-400",
        label: "Refunded",
      },
      failed: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Failed" },
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getRefundEligibilityDisplay = (eligibility) => {
    if (eligibility.eligible) {
      return (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <Clock className="w-4 h-4" />
          <span>
            {eligibility.daysLeft}d {eligibility.hoursLeft % 24}h left
          </span>
        </div>
      );
    }

    if (eligibility.progressLimit) {
      return (
        <div className="flex items-center gap-2 text-orange-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>
            Progress: {eligibility.currentProgress}% / {eligibility.maxProgress}
            %
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>Not Eligible</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Purchase History
              </h1>
              <p className="text-gray-400">
                View and manage your course purchases
              </p>
            </div>
            <span className="text-gray-400 text-lg">
              {purchases.length} purchase{purchases.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Purchases Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start learning by purchasing your first course!
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div
                key={purchase._id}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300"
              >
                {/* Collapsed View */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Side - Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        {purchase.course?.thumbnail && (
                          <img
                            src={purchase.course.thumbnail}
                            alt={purchase.course.title}
                            className="w-24 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white mb-2 truncate">
                            {purchase.course?.title || "Course Deleted"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(purchase.purchaseDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {purchase.progress}% Complete
                            </span>
                            <span>
                              {purchase.completedLessons?.length || 0} /{" "}
                              {purchase.course?.totalLessons || 0} lessons
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            {getStatusBadge(purchase.status)}
                            {getRefundEligibilityDisplay(
                              purchase.refundEligibility
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Price & Actions */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          ${purchase.amountInUSD}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatAmount(
                            purchase.amountInToken,
                            purchase.paymentToken?.decimals || 6,
                            purchase.paymentToken?.symbol || "USDC"
                          )}
                        </div>
                      </div>

                      {/* Refund Button */}
                      {purchase.refundEligibility.eligible ? (
                        <button
                          onClick={() => handleRefundClick(purchase)}
                          className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all font-medium text-sm"
                        >
                          Request Refund
                        </button>
                      ) : (
                        <div className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm text-center">
                          Not Eligible
                        </div>
                      )}

                      {/* Expand Button */}
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === purchase._id ? null : purchase._id
                          )
                        }
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {expandedId === purchase._id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {expandedId === purchase._id && (
                    <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-3">
                          Purchase Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Purchase ID:</span>
                            <span className="text-gray-300 font-mono">
                              {purchase._id.slice(-8)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Payment Method:
                            </span>
                            <span className="text-gray-300">
                              {purchase.paymentToken?.name || "USDC"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Blockchain:</span>
                            <span className="text-gray-300 capitalize">
                              {purchase.paymentToken?.blockchain || "Sepolia"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Escrow Status:
                            </span>
                            <span className="text-gray-300 capitalize">
                              {purchase.escrowStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-3">
                          Refund Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Eligibility:</span>
                            <span
                              className={
                                purchase.refundEligibility.eligible
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {purchase.refundEligibility.eligible
                                ? "Eligible"
                                : "Not Eligible"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Reason:</span>
                            <span className="text-gray-300 text-right max-w-[200px]">
                              {purchase.refundEligibility.reason}
                            </span>
                          </div>
                          {purchase.refundEligibility.eligible && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Time Remaining:
                              </span>
                              <span className="text-gray-300">
                                {purchase.refundEligibility.daysLeft}d{" "}
                                {purchase.refundEligibility.hoursLeft % 24}h
                              </span>
                            </div>
                          )}
                          {purchase.escrowReleaseDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Release Date:
                              </span>
                              <span className="text-gray-300">
                                {formatDate(purchase.escrowReleaseDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundModalOpen && selectedPurchase && (
        <RefundModal
          purchase={selectedPurchase}
          onConfirm={handleConfirmRefund}
          onCancel={() => {
            setRefundModalOpen(false);
            setSelectedPurchase(null);
          }}
        />
      )}
    </div>
  );
};

export default PurchaseHistoryPage;
