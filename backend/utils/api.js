import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("st_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (!window.location.pathname.includes("/login")) {
        localStorage.removeItem("st_token");
        localStorage.removeItem("st_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;