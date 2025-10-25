import { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  RefreshCw,
  Filter,
  X,
  AlertCircle,
  DollarSign,
  Clock,
} from "lucide-react";
import { adminApi } from "@services/api";
import toast from "react-hot-toast";

const AdminEscrowManagementPage = () => {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    blockchain: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  useEffect(() => {
    loadEscrows();
  }, [filters, pagination.page]); // ← ADD pagination.page

  const loadEscrows = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.status) params.status = filters.status;
      if (filters.blockchain) params.blockchain = filters.blockchain;

      const response = await adminApi.getAllEscrows(params);
      setEscrows(response.data.escrows);
      setPagination(response.data.pagination); // ← ADD THIS
    } catch (error) {
      console.error("Load escrows error:", error);
      toast.error("Failed to load escrows");
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = (escrow) => {
    setSelectedEscrow(escrow);
    setShowReleaseModal(true);
  };

  const handleRefund = (escrow) => {
    setSelectedEscrow(escrow);
    setShowRefundModal(true);
  };

  const clearFilters = () => {
    setFilters({ status: "", blockchain: "" });
  };

  const formatAmount = (amount, decimals, symbol) => {
    if (!amount) return "0.00";
    return `${(parseFloat(amount) / Math.pow(10, decimals || 6)).toFixed(2)} ${
      symbol || "USDC"
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Escrow Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage payment escrows and process refunds/releases
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Filters
            </h2>
            {(filters.status || filters.blockchain) && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="locked">Locked</option>
                <option value="released">Released</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Blockchain
              </label>
              <select
                value={filters.blockchain}
                onChange={(e) =>
                  setFilters({ ...filters, blockchain: e.target.value })
                }
                className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900 dark:text-white"
              >
                <option value="">All Blockchains</option>
                <option value="evm">EVM</option>
                <option value="solana">Solana</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500/10 text-yellow-500 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Locked Escrows
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {escrows.filter((e) => e.escrowStatus === "locked").length}
            </p>
          </div>

          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center">
                <Unlock className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Released
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {escrows.filter((e) => e.escrowStatus === "released").length}
            </p>
          </div>

          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Refunded
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {escrows.filter((e) => e.escrowStatus === "refunded").length}
            </p>
          </div>
        </div>

        {/* Escrows List */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading escrows...
              </p>
            </div>
          ) : escrows.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No escrows found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        Time Left
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-200 dark:divide-gray-800">
                    {escrows.map((escrow) => (
                      <tr
                        key={escrow._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {escrow.user?.displayName ||
                                escrow.user?.username ||
                                "Unknown"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{escrow.user?.username || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {escrow.course?.title || "Unknown Course"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              ${escrow.amountInUSD}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {formatAmount(
                                escrow.amountInToken,
                                escrow.paymentToken?.decimals,
                                escrow.paymentToken?.symbol
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              escrow.escrowStatus === "locked"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : escrow.escrowStatus === "released"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-blue-500/10 text-blue-500"
                            }`}
                          >
                            {escrow.escrowStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {escrow.escrowStatus === "locked" && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-900 dark:text-white">
                                {escrow.daysUntilRelease}d
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {escrow.canRelease && (
                              <button
                                onClick={() => handleRelease(escrow)}
                                className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-sm font-medium transition-colors"
                              >
                                Release
                              </button>
                            )}
                            {escrow.canRefund && (
                              <button
                                onClick={() => handleRefund(escrow)}
                                className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-sm font-medium transition-colors"
                              >
                                Refund
                              </button>
                            )}
                            {!escrow.canRelease && !escrow.canRefund && (
                              <span className="text-sm text-gray-500">
                                No actions
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="border-t-2 border-gray-200 dark:border-gray-800 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing page {pagination.page} of {pagination.pages} (
                      {pagination.total} total escrows)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setPagination({
                            ...pagination,
                            page: pagination.page - 1,
                          })
                        }
                        disabled={pagination.page === 1}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setPagination({
                            ...pagination,
                            page: pagination.page + 1,
                          })
                        }
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Release Modal */}
      {showReleaseModal && selectedEscrow && (
        <EscrowActionModal
          escrow={selectedEscrow}
          action="release"
          onClose={() => {
            setShowReleaseModal(false);
            setSelectedEscrow(null);
          }}
          onSuccess={() => {
            loadEscrows();
            setShowReleaseModal(false);
            setSelectedEscrow(null);
          }}
        />
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedEscrow && (
        <EscrowActionModal
          escrow={selectedEscrow}
          action="refund"
          onClose={() => {
            setShowRefundModal(false);
            setSelectedEscrow(null);
          }}
          onSuccess={() => {
            loadEscrows();
            setShowRefundModal(false);
            setSelectedEscrow(null);
          }}
        />
      )}
    </div>
  );
};

// Escrow Action Modal Component
const EscrowActionModal = ({ escrow, action, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    try {
      setLoading(true);

      // ✅ SECURITY: Request wallet signature
      toast.loading("Please sign with your wallet to confirm...", {
        id: "sign",
      });

      const { ethereum } = window;
      if (!ethereum) {
        toast.error("MetaMask not found");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (!accounts || accounts.length === 0) {
        toast.error("Please connect your wallet first");
        return;
      }

      const signerAddress = accounts[0];
      const message = `${action === "release" ? "Release" : "Refund"} escrow ${
        escrow.escrowId
      }\nReason: ${reason}\nTimestamp: ${Date.now()}`;

      const signature = await ethereum.request({
        method: "personal_sign",
        params: [message, signerAddress],
      });

      toast.dismiss("sign");

      if (action === "release") {
        await adminApi.manualReleaseEscrow(escrow.escrowId, {
          reason,
          signature,
          signerAddress,
        });
        toast.success("Escrow released successfully");
      } else {
        await adminApi.manualRefundEscrow(escrow.escrowId, {
          reason,
          signature,
          signerAddress,
        });
        toast.success("Escrow refunded successfully");
      }

      onSuccess();
    } catch (error) {
      console.error(`${action} error:`, error);
      toast.error(error.response?.data?.error || `Failed to ${action} escrow`);
    } finally {
      setLoading(false);
    }
  };
  const isRelease = action === "release";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isRelease ? "Release Escrow" : "Refund Escrow"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Escrow Details */}
          <div className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Student:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {escrow.user?.name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Course:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {escrow.course?.title}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${escrow.amountInUSD}
              </span>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Why are you ${action}ing this escrow?`}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900 dark:text-white resize-none"
              required
            />
          </div>

          {/* Warning */}
          <div
            className={`${
              isRelease
                ? "bg-green-500/10 border-green-500/20"
                : "bg-blue-500/10 border-blue-500/20"
            } border-2 rounded-lg p-3`}
          >
            <div className="flex gap-2">
              <AlertCircle
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  isRelease ? "text-green-500" : "text-blue-500"
                }`}
              />
              <div
                className={`text-sm ${
                  isRelease
                    ? "text-green-700 dark:text-green-400"
                    : "text-blue-700 dark:text-blue-400"
                }`}
              >
                <strong>Warning:</strong> This will{" "}
                {isRelease
                  ? "send funds to the instructor"
                  : "return funds to the student"}
                . This action will be logged and audited.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 ${
                isRelease
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-blue-500 hover:bg-blue-600"
              } disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors`}
            >
              {loading
                ? "Processing..."
                : isRelease
                ? "Release Funds"
                : "Refund Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEscrowManagementPage;
