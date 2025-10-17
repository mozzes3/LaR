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
import CertificatesPage from "@pages/CertificatesPage";
import CertificateViewPage from "@pages/CertificateViewPage";
import AnalyticsPage from "@pages/AnalyticsPage";
import CheckoutPage from "@pages/CheckoutPage";
import CourseLearningPage from "@pages/CourseLearningPage";
import CreateCoursePage from "@pages/CreateCoursePage";
import CourseAnalyticsPage from "@pages/CourseAnalyticsPage";
import StudentsManagementPage from "@pages/StudentsManagementPage";
import UserProfilePage from "@pages/UserProfilePage";
import InstructorProfilePage from "@pages/InstructorProfilePage";
import AllStudentsPage from "@pages/AllStudentsPage";
import BecomeInstructorPage from "@pages/BecomeInstructorPage";
import NotFoundPage from "@pages/NotFoundPage";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
// Protected Route
import ProtectedRoute from "@components/common/ProtectedRoute";

function App() {
  useEffect(() => {
    const handleToastClick = (e) => {
      const toastElement =
        e.target.closest('[role="status"]') ||
        e.target.closest(".go2072408551") ||
        e.target.closest('div[style*="pointer-events"]');

      if (toastElement) {
        toast.dismiss();
      }
    };

    document.addEventListener("click", handleToastClick);
    return () => document.removeEventListener("click", handleToastClick);
  }, []);

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

            {/* Instructor Routes */}
            <Route
              path="instructor"
              element={
                <ProtectedRoute requireInstructor>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="instructor/create-course"
              element={
                <ProtectedRoute requireInstructor>
                  <CreateCoursePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="instructor/edit-course/:slug"
              element={
                <ProtectedRoute requireInstructor>
                  <CreateCoursePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="instructor/analytics"
              element={
                <ProtectedRoute requireInstructor>
                  <CourseAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="instructor/courses/:courseId/analytics"
              element={
                <ProtectedRoute requireInstructor>
                  <CourseAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="instructor/students"
              element={
                <ProtectedRoute requireInstructor>
                  <AllStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="instructor/courses/:courseId/students"
              element={
                <ProtectedRoute requireInstructor>
                  <StudentsManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Profile Routes */}
            <Route path="profile/:username" element={<UserProfilePage />} />
            <Route
              path="instructor/:username"
              element={<InstructorProfilePage />}
            />
            <Route path="settings" element={<ProfilePage />} />

            {/* Course Learning */}
            <Route
              path="courses/:courseSlug/learn"
              element={
                <ProtectedRoute>
                  <CourseLearningPage />
                </ProtectedRoute>
              }
            />

            {/* Checkout */}
            <Route path="checkout/:slug" element={<CheckoutPage />} />

            {/* Certificates */}
            <Route
              path="certificates"
              element={
                <ProtectedRoute>
                  <CertificatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="certificates/:certificateId"
              element={
                <ProtectedRoute>
                  <CertificateViewPage />
                </ProtectedRoute>
              }
            />

            {/* Progress */}
            <Route
              path="progress"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
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
