import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
});

// Response interceptor — auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("st_token");
      localStorage.removeItem("st_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
