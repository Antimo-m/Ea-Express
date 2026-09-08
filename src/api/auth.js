import { request } from "./client";
export const me = () => request("/auth/me");
export const login = (data) => request("/auth/login", { method: "POST", data });
export const register = (data) =>
  request("/auth/register", { method: "POST", data });
export const logout = () => request("/auth/logout", { method: "POST" });
export const forgotPassword = (data) =>
  request("/auth/forgot-password", { method: "POST", data });
export const resetPassword = (data) =>
  request("/auth/reset-password", { method: "POST", data });
export const updateProfile = (data) =>
  request("/profile", { method: "PATCH", data });
export const updatePassword = (data) =>
  request("/password", { method: "PUT", data });
export const updatePreferences = (data) =>
  request("/preferences", { method: "PATCH", data });
