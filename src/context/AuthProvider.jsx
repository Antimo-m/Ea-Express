import { useCallback, useEffect, useState } from "react";
import { request } from "../api/client";
import { AuthContext } from "./AuthContext";
import * as api from "../api/auth";
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const customerSlug = user?.slug;
  const updateDisplayPreferences = useCallback(async (data) => {
    const result = await request('/display-preferences', {method: 'PATCH', data});
    setUser(previous => previous?.slug === customerSlug ? ({...previous, portal_preferences: {...previous.portal_preferences, ...Object.fromEntries(Object.keys(data).map(key => [key, result.data[key]]))}}) : previous);
    return result.data;
  }, [customerSlug]);
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
    setUser(result.user || null);
    setError(null);
    return result;
  }
  async function logout() {
    await api.logout();
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, error, reload, authenticate, logout, setUser, updateDisplayPreferences }}
    >
      {children}
    </AuthContext.Provider>
  );
}
