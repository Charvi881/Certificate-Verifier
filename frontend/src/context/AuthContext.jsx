import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("st_token");
    const saved = localStorage.getItem("st_user");
    if (token && saved) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [loading, setLoading] = useState(true); // ← true until /me resolves

  // ✅ On mount, always refresh user from server so approval changes are picked up
  useEffect(() => {
    const token = localStorage.getItem("st_token");
    if (!token) { setLoading(false); return; }

    api.get("/auth/me")
      .then(({ data }) => {
        const freshUser = data.user;
        setUser(freshUser);
        // Update cache so next page load also gets fresh data
        localStorage.setItem("st_user", JSON.stringify(freshUser));
      })
      .catch(() => {
        // Token invalid/expired — clear session
        localStorage.removeItem("st_token");
        localStorage.removeItem("st_user");
        localStorage.removeItem("st_refresh");
        delete api.defaults.headers.common["Authorization"];
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("st_token",   data.token);
    localStorage.setItem("st_refresh", data.refresh);
    localStorage.setItem("st_user",    JSON.stringify(data.user));
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("st_token",   data.token);
    localStorage.setItem("st_refresh", data.refresh);
    localStorage.setItem("st_user",    JSON.stringify(data.user));
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("st_token");
    localStorage.removeItem("st_refresh");
    localStorage.removeItem("st_user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  }, []);

  // ✅ Don't render children until we know who the user is
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#060b14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Loading…</div>
    </div>
  );

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      isAdmin:      user?.role === "admin",
      isUniversity: user?.role === "university",
      isVerifier:   user?.role === "verifier",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};