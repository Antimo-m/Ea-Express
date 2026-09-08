import { request, query } from "./client";
export const listMessages = ({ id, page }) =>
  request(`/orders/${id}/messages${query({ page })}`);
export const sendMessage = (id, body) =>
  request(`/orders/${id}/messages`, { method: "POST", data: { body } });
export const readMessages = (id) =>
  request(`/orders/${id}/messages/read`, { method: "PATCH" });
