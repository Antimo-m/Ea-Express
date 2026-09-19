import { request, query } from "./client";
export const listMessages = ({ id, page }) =>
  request(`/orders/${id}/messages${query({ page })}`);
export const sendMessage = (id, body, submission_key) =>
  request(`/orders/${id}/messages`, { method: "POST", data: { body, submission_key } });
export const readMessages = (id, ids, state = "read") =>
  request(`/orders/${id}/messages/read`, { method: "PATCH", data: { ids, state } });
