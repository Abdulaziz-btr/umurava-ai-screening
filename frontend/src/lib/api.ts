import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { email: string; password: string; fullName: string; company?: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
};

// Jobs
export const jobsAPI = {
  create: (data: any) => api.post("/jobs", data),
  getAll: () => api.get("/jobs"),
  getById: (id: string) => api.get(`/jobs/${id}`),
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
};

// Applicants
export const applicantsAPI = {
  add: (jobId: string, applicants: any[]) =>
    api.post(`/jobs/${jobId}/applicants`, { applicants }),
  upload: (jobId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/jobs/${jobId}/applicants/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getAll: (jobId: string) => api.get(`/jobs/${jobId}/applicants`),
  getById: (jobId: string, applicantId: string) =>
    api.get(`/jobs/${jobId}/applicants/${applicantId}`),
  update: (jobId: string, applicantId: string, profileData: any) =>
    api.put(`/jobs/${jobId}/applicants/${applicantId}`, { profileData }),
  delete: (jobId: string, applicantId: string) =>
    api.delete(`/jobs/${jobId}/applicants/${applicantId}`),
};

// Screening
export const screeningAPI = {
  trigger: (jobId: string, shortlistSize: number = 10) =>
    api.post(`/jobs/${jobId}/screen`, { shortlistSize }),
  getResults: (jobId: string) => api.get(`/jobs/${jobId}/screening-results`),
};

export default api;