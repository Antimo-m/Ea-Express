import { request, query } from "./client";
export const listOrders = (params) => request(`/orders${query(params)}`);
export const getOrder = ({ slug }) =>
  request(`/orders/${encodeURIComponent(slug)}`);
export const createOrder = (data) =>
  request("/orders", { method: "POST", data });
export const updateOrder = (slug, data) =>
  request(`/orders/${slug}`, { method: "PATCH", data });
export const cancelOrder = (slug, data) =>
  request(`/orders/${slug}/cancel`, { method: "POST", data });

export const reviewOrder = (data, slug) => request(slug ? `/orders/${slug}/checkout` : "/orders/checkout", {method:"POST",data});

export const labelParams = ({ ids = [], ...filters }) => {
  const params = new URLSearchParams();
  ids.forEach(slug => params.append('ids[]', slug));
  for (const [name, value] of Object.entries(filters)) if (value !== undefined && value !== null && value !== '') params.set(name, String(value));
  return params;
};
export const getLabels = (selection) => request(`/orders/labels?${labelParams(selection)}`);
