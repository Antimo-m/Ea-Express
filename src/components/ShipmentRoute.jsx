function address(order, prefix) {
  const street = [order[`${prefix}_address`], order[`${prefix}_street_number`]].filter(Boolean).join(" ");
  const city = [order[`${prefix}_postal_code`], order[`${prefix}_city`]].filter(Boolean).join(" ");
  return [street, city, order[`${prefix}_province`], order[`${prefix}_region`]].filter(Boolean).join(", ");
}

export default function ShipmentRoute({ order }) {
  return <div className="shipment-route">
    <div><strong>Mittente: {order.store_name || order.customer?.name || "Da definire"}</strong><address>{address(order, "pickup")}</address></div>
    <span className="shipment-route-arrow" aria-hidden="true">↓</span>
    <div><strong>Destinatario: {order.recipient_name || "Da definire"}</strong><address>{address(order, "delivery")}</address></div>
    <span className="shipment-rider">Rider: {order.rider?.name || "In attesa di assegnazione"}</span>
  </div>;
}
