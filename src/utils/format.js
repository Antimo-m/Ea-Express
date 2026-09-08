export const statuses = {
  received: "Ricevuta",
  accepted: "Accettata",
  pickup_scheduled: "Ritiro programmato",
  rider_arriving: "Rider in arrivo",
  picked_up: "Ritirata",
  in_transit: "In transito",
  out_for_delivery: "In consegna",
  delivered: "Consegnata",
  delivery_attempted: "Consegna tentata",
  rescheduled: "Riprogrammata",
  delivery_issue: "Problema di consegna",
  rejected: "Rifiutata",
  cancelled: "Annullata",
};
export function date(value, time = false) {
  if (!value) return "Da definire";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Europe/Rome",
  }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value));
}
export const money = (value) =>
  value === null || value === undefined
    ? "Da definire"
    : new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      }).format(value / 100);
export const initials = (name) =>
  name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "EA";
export function today() {
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Rome",
  }).formatToParts(new Date());
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type).value)
    .join("-");
}
