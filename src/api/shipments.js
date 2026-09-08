import { request, query } from "./client";
export const listOrders = (params) => request(`/orders${query(params)}`);
export const getOrder = ({ id }) =>
  request(`/orders/${encodeURIComponent(id)}`);
export const createOrder = (data) =>
  request("/orders", { method: "POST", data });
export const updateOrder = (id, data) =>
  request(`/orders/${id}`, { method: "PATCH", data });
export const cancelOrder = (id, data) =>
  request(`/orders/${id}/cancel`, { method: "POST", data });
