import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export const certificateApi = {
  // Get user's certificates
  getMyCertificates: () => api.get("/certificates/my"),

  // Get single certificate
  getCertificate: (id) => api.get(`/certificates/${id}`),

  // Verify certificate (public)
  verifyCertificate: (certificateNumber) =>
    api.get(`/certificates/verify/${certificateNumber}`),

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
};

// Purchase endpoints
export const purchaseApi = {
  purchaseCourse: (data) => api.post("/purchases", data), // ← ADD THIS LINE
  purchase: (data) => api.post("/purchases", data),
  getMyPurchases: () => api.get("/purchases/my-purchases"),
  getPurchase: (courseId) => api.get(`/purchases/${courseId}`),
  completeLesson: (data) => api.post("/purchases/complete-lesson", data),
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
  getAllStudents: () => api.get("/users/instructor/all-students"),
  getStudentAnalytics: () => api.get("/users/analytics"),
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
  getAll: () => api.get("/categories"),
  getSubcategories: (category) =>
    api.get(`/categories/${encodeURIComponent(category)}/subcategories`),
};

export default api;
