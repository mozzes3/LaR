import { Navigate, useLocation } from "react-router-dom";
import { useWallet } from "@contexts/WalletContext";
import { useEffect } from "react";

const ProtectedRoute = ({
  children,
  requireInstructor = false,
  requireAdmin = false,
}) => {
  const { isConnected, user, loading } = useWallet();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (requireAdmin && user?.role !== "admin" && !user?.isSuperAdmin) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (requireInstructor && !user?.isInstructor) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
