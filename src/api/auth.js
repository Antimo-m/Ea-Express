import { request } from "./client";
export const me = () => request("/auth/me");
export const login = (data) => request("/auth/login", { method: "POST", data });
export const register = (data) =>
  request("/auth/register", { method: "POST", data });
export const logout = () => request("/auth/logout", { method: "POST" });
export const updateProfile = (data) =>
  request("/profile", { method: "PATCH", data });
export const updatePassword = (data) =>
  request("/password", { method: "PUT", data });
export const updatePreferences = (data) =>
  request("/preferences", { method: "PATCH", data });
export const otpStatus = () => request("/auth/otp");
export const sendOtp = () => request("/auth/otp/send", { method: "POST" });
export const verifyOtp = (data) =>
  request("/auth/otp/verify", { method: "POST", data });
export const forgotPassword = (data) =>
  request("/auth/password/forgot", { method: "POST", data });
export const resetPassword = (data) =>
  request("/auth/password/reset", { method: "POST", data });
export const platform = () => request("/platform");
