import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import * as api from "../api/auth";
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    api
      .me()
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch((error) => {
        if (active && error.status !== 401) setError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const expired = () => setUser(null);
    window.addEventListener("ea:session-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("ea:session-expired", expired);
    };
  }, []);
  async function reload() {
    setError(null);
    setLoading(true);
    try {
      const data = await api.me();
      setUser(data.user);
    } catch (error) {
      if (error.status !== 401) setError(error);
    } finally {
      setLoading(false);
    }
  }
  async function authenticate(data, create = false) {
    const result = await (create ? api.register(data) : api.login(data));
    setUser(result.user);
    setError(null);
  }
  async function logout() {
    await api.logout();
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, error, reload, authenticate, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
