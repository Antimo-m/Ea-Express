import { useRef, useState } from "react";
import { request } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { Field, Feedback, Form, Icon } from "./UI";
import { date } from "../utils/format";
export default function PaymentAgreement({ order, reload }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const submitting = useRef(false);
  const payment = order.payment;
  if (!payment) return null;
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(null); setSuccess("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await request(`/orders/${order.id}/payment-agreement`, { method: "PATCH", data: { ...data, version: order.version } });
      setSuccess("Accordo aggiornato. Il corriere riceverà la notifica."); reload();
    } catch (error) { setError(error); }
    finally { submitting.current = false; setBusy(false); }
  }
  const editable = payment.state !== "paid" && !["cancelled", "rejected"].includes(order.status);
  return <section className="panel payment-panel">
    <div className="section-heading"><h2><Icon name="wallet2" /> Pagamento della spedizione</h2><span className={`status payment-${payment.state}`}>{payment.label}</span></div>
    <p>Metodo: <strong>{payment.method_label}</strong></p>
    <p className="muted">Concorda il metodo con il corriere. La chat non sostituisce la conferma dell’incasso nel gestionale. Non inviare numeri di carta o credenziali.</p>
    {payment.proposed_at && <p className="small muted">Proposta di {payment.proposed_by === user.id ? "te" : "EA Express"} · {date(payment.proposed_at, true)}</p>}
    {payment.confirmed_at && <p className="small muted">Confermato da {payment.confirmed_by === user.id ? "te" : "EA Express"} · {date(payment.confirmed_at, true)}</p>}
    {payment.paid_at && <p className="small muted">Incasso registrato · {date(payment.paid_at, true)}</p>}
    <Feedback error={error} success={success} />
    {error?.status === 409 && <button className="button secondary" onClick={reload}>Ricarica accordo</button>}
    {editable && payment.state === "proposed" && payment.proposed_by !== user.id && <Form onSubmit={submit}><input type="hidden" name="action" value="confirm" /><button className="button" disabled={busy}>Conferma proposta del corriere</button></Form>}
    {editable && <Form onSubmit={submit} errors={error?.errors} className="payment-form"><input type="hidden" name="action" value="propose" /><Field label="Proponi un metodo"><select key={payment.method || 'empty'} name="method" defaultValue={payment.method || ""} required><option value="">Seleziona</option><option value="cash">Contanti</option><option value="card">Carta tramite POS</option><option value="bank_transfer">Bonifico</option><option value="other">Altro</option></select></Field><button className="button secondary" disabled={busy}>{busy ? "Invio…" : "Invia proposta"}</button></Form>}
  </section>;
}
