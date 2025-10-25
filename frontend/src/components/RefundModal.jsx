import React from "react";
import { X, AlertTriangle, DollarSign } from "lucide-react";

const RefundModal = ({ purchase, onConfirm, onCancel }) => {
  const formatAmount = (amount, decimals, symbol) => {
    return `${(amount / Math.pow(10, decimals)).toFixed(2)} ${symbol}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Request Refund</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <p className="text-gray-300">
            You are about to request a refund for:
          </p>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-2">
            <div className="font-semibold text-white">
              {purchase.course?.title}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Refund Amount:</span>
              <div className="text-right">
                <div className="text-green-400 font-bold">
                  ${purchase.amountInUSD}
                </div>
                <div className="text-xs text-gray-500">
                  {formatAmount(
                    purchase.amountInToken,
                    purchase.paymentToken?.decimals || 6,
                    purchase.paymentToken?.symbol || "USDC"
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm text-orange-300">
              <strong>Warning:</strong> After refund, you will lose access to
              this course immediately. You can re-purchase the course later if
              needed.
            </p>
          </div>

          <div className="text-sm text-gray-400 space-y-1">
            <p>• Refund will be processed on blockchain</p>
            <p>• Transaction may take a few minutes</p>
            <p>• Tokens will return to your wallet</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-all font-medium"
          >
            Confirm Refund
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
