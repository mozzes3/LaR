import { Navigate } from "react-router-dom";
import { useWallet } from "@contexts/WalletContext";
import toast from "react-hot-toast";

const ProtectedRoute = ({ children, requireInstructor = false }) => {
  const { isConnected, user } = useWallet();

  if (!isConnected || !user) {
    toast.error("Please connect your wallet to access this page");
    return <Navigate to="/" replace />;
  }

  if (requireInstructor && !user.isInstructor) {
    toast.error("This page is only accessible to instructors");
    return <Navigate to="/become-instructor" replace />;
  }

  return children;
};

export default ProtectedRoute;
