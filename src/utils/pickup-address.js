export const pickupAddressFields = ["pickup_address", "pickup_street_number", "pickup_postal_code", "pickup_city"];

export function pickupAddress(data = {}) {
  return Object.fromEntries(pickupAddressFields.map(field => [field, String(data[field] || "").trim()]));
}

export function pickupAddressKey(data = {}) {
  return pickupAddressFields.map(field => String(data[field] || "").normalize("NFKC").toLocaleLowerCase("it").replace(field === 'pickup_street_number' ? /[^\p{L}\p{N}/-]/gu : /[^\p{L}\p{N}]/gu, "")).join("|");
}

export function samePickupAddress(left, right) {
  return Boolean(left && right) && pickupAddressKey(left) === pickupAddressKey(right);
}

export function completePickupAddress(data = {}) {
  return pickupAddressFields.every(field => String(data[field] || "").trim()) && /^[0-9]{5}$/.test(data.pickup_postal_code || "");
}
