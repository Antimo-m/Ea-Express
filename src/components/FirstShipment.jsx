import { Link } from "react-router";
import Truck from "./Truck";

// Pagina vuota del primo accesso: il camion è parcheggiato e "si scalda" quando il cliente punta il bottone.
export default function FirstShipment({ title = "Il camion è pronto a partire", text = "Non hai ancora spedizioni. Prenota il primo ritiro: appena lo confermiamo, qui potrai seguirlo tappa per tappa." }) {
  return (
    <div className="first-shipment">
      <div className="first-shipment-scene" aria-hidden="true">
        <span className="first-shipment-sign">EA</span>
        <span className="first-shipment-truck"><Truck /></span>
        <span className="first-shipment-road" />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <Link className="button first-shipment-action" to="/pickups/new">Prenota il primo ritiro</Link>
    </div>
  );
}
