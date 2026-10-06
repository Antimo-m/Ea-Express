import { request, query } from "./client";
export const listMessages = ({ slug, page }) =>
  request(`/orders/${slug}/messages${query({ page })}`);
export const sendMessage = (slug, body, submission_key) =>
  request(`/orders/${slug}/messages`, { method: "POST", data: { body, submission_key } });
export const readMessages = (slug, ids, state = "read") =>
  request(`/orders/${slug}/messages/read`, { method: "PATCH", data: { ids, state } });
