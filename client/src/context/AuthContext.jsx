import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, apiError } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from a stored token on first load.
  useEffect(() => {
    const token = localStorage.getItem("pixshare_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("pixshare_token"))
      .finally(() => setLoading(false));
  }, []);

  const persist = (token, nextUser) => {
    localStorage.setItem("pixshare_token", token);
    setUser(nextUser);
  };

  const login = useCallback(async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      persist(res.data.token, res.data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: apiError(err, "Login failed.") };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const res = await api.post("/auth/register", { name, email, password });
      persist(res.data.token, res.data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: apiError(err, "Registration failed.") };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("pixshare_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
