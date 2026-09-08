import { request, query } from "./client";
export const dashboard = () => request("/dashboard");
export const couriers = () => request("/couriers");
export const notifications = (params) =>
  request(`/notifications${query(params)}`);
export const readNotification = (id) =>
  request(`/notifications/${id}/read`, { method: "PATCH" });
export const readAllNotifications = () =>
  request("/notifications/read-all", { method: "PATCH" });
