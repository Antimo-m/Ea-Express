import { createPortal } from "react-dom";
import { Icon } from "./UI";
import Truck from "./Truck";

// Avvisi in tempo reale: un camioncino entra in scena per gli aggiornamenti delle spedizioni, un fumetto per i messaggi.
export default function LiveToasts({ toasts, onOpen, onClose }) {
  return createPortal(
    <div className="live-toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`live-toast${toast.is_message ? " live-toast--message" : ""}`}>
          <span className="live-toast-visual" aria-hidden="true">
            {toast.is_message ? <Icon name="chat-dots-fill" /> : <span className="live-toast-truck"><Truck /></span>}
          </span>
          <button type="button" className="live-toast-body" onClick={() => onOpen(toast)}>
            <strong>{toast.title}</strong>
            <span>{toast.is_message ? "Nuovo messaggio" : "Spedizione"} · {toast.reference}</span>
          </button>
          <button type="button" className="live-toast-close" aria-label="Chiudi avviso" onClick={() => onClose(toast.id)}><Icon name="x-lg" /></button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
