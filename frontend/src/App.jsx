import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@contexts/ThemeContext";
import { WalletProvider } from "@contexts/WalletContext";

// Layout
import MainLayout from "@components/layout/MainLayout";

// Pages
import HomePage from "@pages/HomePage";
import CoursesPage from "@pages/CoursesPage";
import CourseDetailPage from "@pages/CourseDetailPage";
import DashboardPage from "@pages/DashboardPage";
import InstructorDashboard from "@pages/InstructorDashboard";
import ProfilePage from "@pages/ProfilePage";
import CheckoutPage from "@pages/CheckoutPage";
import BecomeInstructorPage from "@pages/BecomeInstructorPage";
import NotFoundPage from "@pages/NotFoundPage";

// Protected Route
import ProtectedRoute from "@components/common/ProtectedRoute";

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Public Routes */}
            <Route index element={<HomePage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:slug" element={<CourseDetailPage />} />
            <Route
              path="become-instructor"
              element={<BecomeInstructorPage />}
            />

            {/* Protected Routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="instructor"
              element={
                <ProtectedRoute requireInstructor>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="checkout/:courseId"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
