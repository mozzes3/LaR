import { Navigate, useLocation } from "react-router-dom";
import { useWallet } from "@contexts/WalletContext";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

const ProtectedRoute = ({
  children,
  requireInstructor = false,
  requireAdmin = false,
}) => {
  const { isConnected, user, loading } = useWallet();
  const location = useLocation();
  const hasShownToast = useRef(false);

  // Use useEffect to show toasts, not during render
  useEffect(() => {
    if (!loading && !isConnected && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.error("Please connect your wallet to access this page");
    }
  }, [isConnected, loading]);

  useEffect(() => {
    if (
      !loading &&
      requireAdmin &&
      user &&
      user.role !== "admin" &&
      !user.isSuperAdmin &&
      !hasShownToast.current
    ) {
      hasShownToast.current = true;
      toast.error("This page is only accessible to admins");
    }
  }, [requireAdmin, user, loading]);

  useEffect(() => {
    if (
      !loading &&
      requireInstructor &&
      user &&
      !user.isInstructor &&
      !hasShownToast.current
    ) {
      hasShownToast.current = true;
      toast.error("This page is only accessible to instructors");
    }
  }, [requireInstructor, user, loading]);

  // Reset toast flag when location changes
  useEffect(() => {
    hasShownToast.current = false;
  }, [location.pathname]);

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
