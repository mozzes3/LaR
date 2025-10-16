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
};

// Purchase endpoints
export const purchaseApi = {
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

// User endpoints
export const userApi = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put("/users/profile", data),
  uploadAvatar: (formData) =>
    api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getStats: () => api.get("/users/stats/me"),
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

export default api;
