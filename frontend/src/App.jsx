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
import AdminDashboardPage from "@pages/AdminDashboardPage";
import AdminUsersPage from "@pages/AdminUsersPage";
import AdminRolesPage from "@pages/AdminRolesPage";
import AdminUserEditPage from "@pages/AdminUserEditPage";
import AdminCoursesPage from "@pages/AdminCoursesPage";
import AdminReviewsPage from "@pages/AdminReviewsPage";
import AdminPurchasesPage from "@pages/AdminPurchasesPage";
import AdminApplicationsPage from "@pages/AdminApplicationsPage";
import AdminProfessionalCertificationsPage from "@pages/AdminProfessionalCertificationsPage";
import AdminCreateProfessionalCertificationPage from "@pages/AdminCreateProfessionalCertificationPage";
import CertificateVerificationPage from "@pages/CertificateVerificationPage";
import InstructorEarningsPage from "@pages/InstructorEarningsPage";
import ProfessionalCertificationsPage from "@pages/ProfessionalCertificationsPage";
import ProfessionalCertificationDetailPage from "@pages/ProfessionalCertificationDetailPage";
import ProfessionalCertificationTestPage from "@pages/ProfessionalCertificationTestPage";
import ProfessionalCertificationResultsPage from "@pages/ProfessionalCertificationResultPage";
import MyProfessionalAttemptsPage from "@pages/MyProfessionalAttemptsPage";

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
            <Route
              path="instructor/earnings"
              element={
                <ProtectedRoute requireInstructor>
                  <InstructorEarningsPage />
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

            <Route
              path="/professional-certifications"
              element={<ProfessionalCertificationsPage />}
            />
            <Route
              path="/professional-certifications/:slug"
              element={<ProfessionalCertificationDetailPage />}
            />
            <Route
              path="/professional-certifications/:certificationId/test"
              element={
                <ProtectedRoute>
                  <ProfessionalCertificationTestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional-certifications/results/:attemptId"
              element={
                <ProtectedRoute>
                  <ProfessionalCertificationResultsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-professional-attempts"
              element={<MyProfessionalAttemptsPage />}
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

          {/* Admin Routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users/:userId"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUserEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/roles"
            element={
              <ProtectedRoute requireAdmin>
                <AdminRolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/courses"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/professional-certifications"
            element={
              <ProtectedRoute requireAdmin>
                <AdminProfessionalCertificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/professional-certifications/create"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCreateProfessionalCertificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/professional-certifications/:id/edit"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCreateProfessionalCertificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="verify/:certificateNumber"
            element={<CertificateVerificationPage />}
          />
          <Route
            path="admin/reviews"
            element={
              <ProtectedRoute requireAdmin>
                <AdminReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/applications"
            element={
              <ProtectedRoute requireAdmin>
                <AdminApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/purchases"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPurchasesPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
