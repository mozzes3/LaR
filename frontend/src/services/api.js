import axios from "axios";

if (import.meta.env.PROD && window.location.protocol === "http:") {
  window.location.href = window.location.href.replace("http:", "https:");
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const categoryCache = {
  data: null,
  timestamp: null,
  TTL: 5 * 60 * 1000, // 5 minutes
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Auth endpoints - don't try to refresh
    const skipRefreshUrls = [
      "/auth/me",
      "/auth/refresh",
      "/auth/nonce",
      "/auth/verify",
    ];
    const isAuthEndpoint = skipRefreshUrls.some((url) =>
      originalRequest.url?.includes(url)
    );

    if (isAuthEndpoint && error.response?.status === 401) {
      return Promise.reject(error);
    }

    // Rate limiting
    if (error.response?.status === 429) {
      return Promise.reject(error);
    }

    // Token refresh for protected routes
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        processQueue(null);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
export const questionApi = {
  getCourseQuestions: (courseId) => api.get(`/questions/course/${courseId}`),
  createQuestion: (data) => api.post("/questions", data),
  replyToQuestion: (questionId, text) =>
    api.post(`/questions/${questionId}/reply`, { text }),
  deleteQuestion: (questionId) => api.delete(`/questions/${questionId}`),
  updateQuestion: (questionId, question) =>
    api.put(`/questions/${questionId}`, { question }),
  updateReply: (questionId, replyId, text) =>
    api.put(`/questions/${questionId}/reply/${replyId}`, { text }),
};

export const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get("/admin/dashboard/stats"),

  // Roles
  getAllRoles: () => api.get("/admin/roles"),
  createRole: (data) => api.post("/admin/roles", data),
  updateRole: (roleId, data) => api.put(`/admin/roles/${roleId}`, data),
  deleteRole: (roleId) => api.delete(`/admin/roles/${roleId}`),

  // Users
  getAllUsers: (params) => api.get("/admin/users", { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  assignRole: (userId, data) =>
    api.post(`/admin/users/${userId}/assign-role`, data),
  updateUserPermissions: (userId, data) =>
    api.put(`/admin/users/${userId}/permissions`, data),
  toggleUserBan: (userId) => api.post(`/admin/users/${userId}/toggle-ban`),
  makeSuperAdmin: (userId) =>
    api.post(`/admin/users/${userId}/make-super-admin`),

  // Courses
  getAllCoursesAdmin: (params) => api.get("/admin/courses", { params }),
  updateCourseStatus: (courseId, data) =>
    api.put(`/admin/courses/${courseId}/status`, data),
  deleteCourse: (courseId) => api.delete(`/admin/courses/${courseId}`),
  getCourses: (params) => api.get("/admin/courses", { params }),

  // Reviews
  getAllReviewsAdmin: (params) => api.get("/admin/reviews", { params }),
  updateReviewStatus: (reviewId, data) =>
    api.put(`/admin/reviews/${reviewId}/status`, data),
  deleteReview: (reviewId) => api.delete(`/admin/reviews/${reviewId}`),

  // Applications
  getAllApplications: (params) => api.get("/admin/applications", { params }),
  approveApplication: (id, data) =>
    api.post(`/admin/applications/${id}/approve`, data),
  pauseApplication: (id, data) =>
    api.post(`/admin/applications/${id}/pause`, data),
  rejectApplication: (id, data) =>
    api.post(`/admin/applications/${id}/reject`, data),
  deleteApplication: (id) => api.delete(`/admin/applications/${id}`),

  // Purchases
  getAllPurchases: (params) => api.get("/admin/purchases", { params }),
  updateUserDetails: (userId, data) =>
    api.put(`/admin/users/${userId}/details`, data),
  toggleInstructorStatus: (userId, data) =>
    api.post(`/admin/users/${userId}/toggle-instructor`, data),

  // Escrow Management
  getAllEscrows: (params) => api.get("/admin/payment/escrows", { params }),
  manualReleaseEscrow: (escrowId, data) =>
    api.post(`/admin/payment/escrows/${escrowId}/release`, data),
  manualRefundEscrow: (escrowId, data) =>
    api.post(`/admin/payment/escrows/${escrowId}/refund`, data),

  // Course Access Management
  grantFreeCourseAccess: (userId, courseId, data) =>
    api.post(`/admin/payment/users/${userId}/courses/${courseId}/grant`, data),
  removeCourseAccess: (userId, courseId, data) =>
    api.delete(`/admin/payment/users/${userId}/courses/${courseId}/access`, {
      data,
    }),
  getUserPurchases: (userId) =>
    api.get(`/admin/payment/users/${userId}/purchases`),

  // NEW: Audit Logs
  getAuditLogs: (params) => api.get("/admin/payment/audit-logs", { params }),
};

export const certificateApi = {
  // Get user's certificates
  getMyCertificates: () => api.get("/certificates/my"),

  // Get single certificate
  getCertificate: (id) => api.get(`/certificates/${id}`),

  // Verify certificate (public)
  verifyCertificate: (certificateNumber) =>
    api.get(`/certificates/verify/${certificateNumber}`),
  getAllMyCertificates: () => api.get("/certificates/all"),
  // Generate certificate manually (for testing)
  generateCertificate: (courseId) =>
    api.post("/certificates/generate", { courseId }),
  getCertificateImageToken: (id) => api.get(`/certificates/${id}/image-token`),
};
export const levelApi = {
  getProgress: () => api.get("/levels/progress"),
  getMilestones: () => api.get("/levels/milestones"),
};
// Auth endpoints
export const authApi = {
  getNonce: (walletAddress) => api.post("/auth/nonce", { walletAddress }),
  verify: (walletAddress, signature) =>
    api.post("/auth/verify", { walletAddress, signature }),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// Course endpoints
export const courseApi = {
  getAll: (params) => api.get("/courses", { params }),
  getBySlug: (slug) => api.get(`/courses/${slug}`),
  create: (data) => api.post("/courses", data),
  update: (slug, data) => api.put(`/courses/${slug}`, data),
  delete: (slug) => api.delete(`/courses/${slug}`),
  publish: (slug) => api.post(`/courses/${slug}/publish`),
  getInstructorCourses: () => api.get("/courses/instructor/my-courses"),
  getByInstructor: (username) => api.get(`/courses/instructor/${username}`),
  getInstructorCoursesWithStats: () =>
    api.get("/courses/instructor/my-courses-stats"),
  getLessonVideo: (courseSlug, lessonId) =>
    api.get(`/courses/${courseSlug}/lessons/${lessonId}/video`),
  createVideoSession: (slug) => api.post(`/courses/${slug}/video-session`),

  getLessonVideoWithSession: (slug, lessonId, sessionToken) =>
    api.get(`/courses/${slug}/lessons/${lessonId}/video`, {
      params: { sessionToken },
    }),
  getAllCoursesAnalytics: () => api.get("/courses/instructor/analytics/all"),
  getCourseAnalytics: (courseId) =>
    api.get(`/courses/instructor/analytics/${courseId}`),
};

// Purchase endpoints
export const purchaseApi = {
  purchaseCourse: (data) => api.post("/purchases", data), // ← ADD THIS LINE
  purchase: (data) => api.post("/purchases", data),
  getMyPurchases: () => api.get("/purchases/my-purchases"),
  getPurchase: (courseId) => api.get(`/purchases/${courseId}`),
  completeLesson: (data) => api.post("/purchases/complete-lesson", data),
};

export const noteApi = {
  getNotes: (courseId, lessonId) => api.get(`/notes/${courseId}/${lessonId}`),
  createNote: (data) => api.post("/notes", data),
  updateNote: (noteId, data) => api.put(`/notes/${noteId}`, data),
  deleteNote: (noteId) => api.delete(`/notes/${noteId}`),
};

// Review endpoints
export const reviewApi = {
  create: (data) => api.post("/reviews", data),
  getCourseReviews: (courseId, params) =>
    api.get(`/reviews/course/${courseId}`, { params }),
  update: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
  vote: (reviewId, vote) => api.post(`/reviews/${reviewId}/vote`, { vote }),
};

// Upload endpoints
// Upload endpoints
export const uploadApi = {
  // Avatar upload
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/upload/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Thumbnail upload - ACCEPTS FILE DIRECTLY
  uploadThumbnail: (file) => {
    const formData = new FormData();
    formData.append("thumbnail", file);
    return api.post("/upload/thumbnail", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadCertificationThumbnail: (formData) =>
    api.post("/upload/certification-thumbnail", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  // Video upload
  // Video upload
  uploadVideo: (file, data, onUploadProgress) => {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", data.title);

    if (data.courseSlug) {
      formData.append("courseSlug", data.courseSlug);
    }

    // IMPORTANT: Make sure oldVideoId is sent
    if (data.oldVideoId) {
      formData.append("oldVideoId", data.oldVideoId);
      console.log(`📤 Sending oldVideoId to backend: ${data.oldVideoId}`);
    }

    return api.post("/upload/video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },

  // Get signed video URL
  getVideoUrl: (videoId) => api.get(`/upload/video/${videoId}/url`),

  // Get video info
  getVideoInfo: (videoId) => api.get(`/upload/video/${videoId}/info`),

  // Delete video
  deleteVideo: (videoId) => api.delete(`/upload/video/${videoId}`),

  // Upload resource
  uploadResource: (file) => {
    const formData = new FormData();
    formData.append("resource", file);
    return api.post("/upload/resource", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteThumbnail: (thumbnailUrl) =>
    api.delete("/upload/thumbnail", { data: { url: thumbnailUrl } }),

  deleteResource: (resourceUrl) =>
    api.delete("/upload/resource", { data: { url: resourceUrl } }),
};

// User endpoints
export const userApi = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put("/users/profile", data),
  uploadAvatar: (formData) =>
    api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getStats: () => api.get("/users/stats/me"),
  getDashboardStats: () => api.get("/users/dashboard/stats"), // ← ADD THIS
  getInstructorDashboardStats: () =>
    api.get("/users/instructor/dashboard-stats"),
  getInstructorRecentActivity: (limit = 10) =>
    api.get(`/users/instructor/recent-activity?limit=${limit}`),
  getInstructorEarningsHistory: (period) =>
    api.get(`/users/instructor/earnings-history?period=${period}`),
  getAllStudents: () => api.get("/users/instructor/all-students"),
  getStudentAnalytics: () => api.get("/users/analytics"),
  getInstructorStats: (username) =>
    api.get(`/users/instructor/${username}/stats`),
  getInstructorEarningsTransactions: () =>
    api.get("/users/instructor/earnings-transactions"),
  getStudentDetails: (studentId) =>
    api.get(`/users/instructor/students/${studentId}`),
  getPaymentWallets: () => api.get("/users/payment-wallets"),
  addPaymentWallet: (data) => api.post("/users/payment-wallets", data),
  removePaymentWallet: (walletId) =>
    api.delete(`/users/payment-wallets/${walletId}`),
  setPrimaryWallet: (walletId) =>
    api.post("/users/payment-wallets/set-primary", { walletId }),
  getInstructorProfileComplete: (username) =>
    api.get(`/users/instructor/${username}/complete`),
  getStudentDashboard: () => api.get("/users/dashboard/complete"),
  getInstructorDashboardComplete: () =>
    api.get("/users/instructor/dashboard/complete"),
  getProfileComplete: (username) => api.get(`/users/${username}/complete`),
  getInstructorEarningsComplete: () =>
    api.get("/users/instructor/earnings-complete"),
};

// Instructor endpoints
export const instructorApi = {
  apply: (data) => api.post("/instructor/apply", data),
  getMyApplication: () => api.get("/instructor/my-application"),
  getAllApplications: (params) =>
    api.get("/instructor/applications", { params }),
  approve: (id, data) =>
    api.post(`/instructor/applications/${id}/approve`, data),
  reject: (id, data) => api.post(`/instructor/applications/${id}/reject`, data),
};

export const categoryApi = {
  getAll: async () => {
    // Return cached data if fresh
    if (
      categoryCache.data &&
      Date.now() - categoryCache.timestamp < categoryCache.TTL
    ) {
      console.log("✅ Using cached categories");
      return { data: { categories: categoryCache.data } };
    }

    // Fetch and cache
    console.log("🔄 Fetching fresh categories");
    const response = await api.get("/categories");
    categoryCache.data = response.data.categories;
    categoryCache.timestamp = Date.now();
    return response;
  },
};

// frontend/src/services/api.js - ADD THESE TO YOUR EXISTING API FILE

// Professional Certifications API
export const professionalCertificationApi = {
  getAllCertifications: (params) =>
    api.get("/professional-certifications", { params }),
  getCertificationDetails: (slug) =>
    api.get(`/professional-certifications/${slug}`),
  startTest: (data) =>
    api.post("/professional-certifications/start-test", data),
  submitTest: (data) =>
    api.post("/professional-certifications/submit-test", data),
  getMyAttempts: (params) =>
    api.get("/professional-certifications/attempts/my-attempts", { params }),
  getAttemptDetails: (attemptId) =>
    api.get(`/professional-certifications/attempts/${attemptId}`),
  getEligibleCertificates: () =>
    api.get("/professional-certifications/certificates/eligible"),
  getMyCertificates: () =>
    api.get("/professional-certifications/certificates/my-certificates"),
  purchaseCertificate: (data) =>
    api.post("/professional-certifications/certificates/purchase", data),
  verifyCertificate: (certificateNumber) =>
    api.get(
      `/professional-certifications/certificates/verify/${certificateNumber}`
    ),
  resetAttempts: (data) =>
    api.post("/professional-certifications/reset-attempts", data),
};

// Admin Professional Certifications API
export const adminProfessionalCertificationApi = {
  getDashboardStats: () =>
    api.get("/admin/professional-certifications/dashboard/stats"),
  getAllCertifications: (params) =>
    api.get("/admin/professional-certifications", { params }),
  getCertificationDetails: (id) =>
    api.get(`/admin/professional-certifications/${id}`),
  createCertification: (data) =>
    api.post("/admin/professional-certifications", data),
  updateCertification: (id, data) =>
    api.put(`/admin/professional-certifications/${id}`, data),
  deleteCertification: (id) =>
    api.delete(`/admin/professional-certifications/${id}`),
  updateStatus: (id, data) =>
    api.put(`/admin/professional-certifications/${id}/status`, data),
  getCertificationAttempts: (id, params) =>
    api.get(`/admin/professional-certifications/${id}/attempts`, { params }),
  getAllCertificates: (params) =>
    api.get("/admin/professional-certifications/certificates/all", { params }),
  revokeCertificate: (id, data) =>
    api.post(
      `/admin/professional-certifications/certificates/${id}/revoke`,
      data
    ),
  purchaseCertificate: (data) =>
    api.post("/professional-certifications/certificates/purchase", data),
  getEligibleCertificates: () =>
    api.get("/professional-certifications/certificates/eligible"),
};
export default api;
export { paymentApi } from "./paymentApi";
