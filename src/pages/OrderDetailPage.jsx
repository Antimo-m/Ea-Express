import { contentLabel } from "../utils/order-content";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { getOrder, cancelOrder } from "../api/shipments";
import { useApi } from "../hooks/useApi";
import { Header, State, Status, Feedback, Icon, Empty } from "../components/UI";
import MessageThread from "../components/MessageThread";
import { date, money } from "../utils/format";
function Detail({ order, reload, pickups, messages }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(useLocation().state?.success || "");
  const base = pickups ? "/pickups" : "/shipments";
  async function cancel(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await cancelOrder(order.id, {
        version: order.version,
        reason: new FormData(event.currentTarget).get("reason"),
      });
      setSuccess("Richiesta annullata.");
      reload();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to={messages ? "/messages" : base}>
        <Icon name="arrow-left" />
        {messages
          ? "Tutte le conversazioni"
          : pickups
            ? "Tutti i ritiri"
            : "Tutte le spedizioni"}
      </Link>
      <Header
        eyebrow={order.reference}
        title={
          messages
            ? `Conversazione con ${order.courier?.name || "il corriere"}`
            : `${order.pickup_city} → ${order.delivery_city}`
        }
        description={`Destinatario: ${order.recipient_name}`}
      >
        <Link className="button secondary" to={`/shipments/${order.id}/label`}>
          <Icon name="printer" />
          Stampa etichetta
        </Link>
        <Status order={order} />
        {order.can_edit && (
          <Link className="button secondary" to={`${base}/${order.id}/edit`}>
            <Icon name="pencil" />
            Modifica
          </Link>
        )}
      </Header>
      <Feedback error={error} success={success} />
      {error?.status === 409 && (
        <button className="button secondary" onClick={reload}>
          Ricarica i dati aggiornati
        </button>
      )}
      {!messages && (
        <div className="detail-grid">
          <div>
            <section className="panel">
              <div className="section-heading">
                <h2>Il percorso della consegna</h2>
                <Icon name="signpost-split" />
              </div>
              <div className="journey">
                <div>
                  <span className="journey-point" />
                  <p className="eyebrow">RITIRO</p>
                  <h3>{order.pickup_address}</h3>
                  <p>{order.pickup_city}</p>
                  <small>
                    {date(order.pickup_date)} · {order.pickup_from}–
                    {order.pickup_to}
                  </small>
                </div>
                <div>
                  <span className="journey-point destination" />
                  <p className="eyebrow">DESTINAZIONE</p>
                  <h3>{order.delivery_address}</h3>
                  <p>{order.delivery_city}</p>
                  <small>
                    {order.recipient_name} · {order.recipient_phone}
                  </small>
                  {order.delivery_window && (
                    <p className="small">Preferenza: {order.delivery_window}</p>
                  )}
                </div>
              </div>
            </section>
            <section className="panel">
              <h2>Ogni passo, in ordine</h2>
              {order.events?.length ? (
                <ol className="timeline">
                  {order.events.map((event) => (
                    <li key={event.id}>
                      <span className="timeline-dot" />
                      <div>
                        <strong>{event.label}</strong>
                        <time>{date(event.created_at, true)}</time>
                        {event.message && <p>{event.message}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <Empty title="In attesa di aggiornamenti" />
              )}
            </section>
          </div>
          <aside>
            <section className="panel">
              <h2>Dettagli della richiesta</h2>
              <dl className="facts">
                <div>
                  <dt>Mittente</dt>
                  <dd>
                    {order.store_name}
                    <small className="muted">
                      {" "}
                      ·{" "}
                      {order.sender_type === "private"
                        ? "Privato"
                        : order.business_type || "Attività"}
                    </small>
                  </dd>
                </div>
                <div>
                  <dt>Valore merce</dt>
                  <dd>
                    {order.parcel_value_cents == null
                      ? "Non dichiarato"
                      : money(order.parcel_value_cents)}
                  </dd>
                </div>
                <div>
                  <dt>Corriere</dt>
                  <dd>{order.courier?.name || "Da assegnare"}</dd>
                </div>
                <div>
                  <dt>pacchi</dt>
                  <dd>{order.parcel_count}</dd>
                </div>
                <div>
                  <dt>Contenuto</dt>
                  <dd>
                    {contentLabel(order)}
                  </dd>
                </div>
                <div>
                  <dt>Priorità</dt>
                  <dd>{order.urgency === "urgent" ? "Urgente" : "Standard"}</dd>
                </div>
                <div>
                  <dt>Costo spedizione</dt>
                  <dd>{money(order.price_cents)}</dd>
                </div>
                {order.estimated_at && (
                  <div>
                    <dt>Arrivo stimato</dt>
                    <dd>{date(order.estimated_at, true)}</dd>
                  </div>
                )}
                {order.delivered_at && (
                  <div>
                    <dt>Consegnata il</dt>
                    <dd>{date(order.delivered_at, true)}</dd>
                  </div>
                )}
              </dl>
              <Link
                className="button secondary full"
                to={`/messages/${order.id}`}
              >
                <Icon name="chat-dots" />
                Contatta corriere
              </Link>
            </section>
            {order.customer_notes && (
              <section className="panel notes">
                <h3>Le tue istruzioni</h3>
                <p>{order.customer_notes}</p>
              </section>
            )}
            {order.can_cancel && (
              <details className="panel cancellation">
                <summary>Annulla questa richiesta</summary>
                <p>
                  Puoi annullare la richiesta finché non è stata presa in
                  carico.
                </p>
                <form onSubmit={cancel}>
                  <label className="field">
                    <span>Motivo dell’annullamento</span>
                    <textarea name="reason" required maxLength={500} rows={3} />
                  </label>
                  <button className="button danger" disabled={busy}>
                    {busy ? "Attendi…" : "Conferma annullamento"}
                  </button>
                </form>
              </details>
            )}
          </aside>
        </div>
      )}
      {order.packages?.length > 0 && <section className="panel"><h2>I tuoi pacchi</h2>{order.packages.map((item, index) => <p key={index}><strong>Pacco {index + 1}</strong> · {item.weight_kg} kg · {item.length_cm} × {item.width_cm} × {item.height_cm} cm</p>)}</section>}
      <MessageThread id={order.id} />
    </>
  );
}
export default function OrderDetailPage({ pickups = false, messages = false }) {
  const { id } = useParams();
  const resource = useApi(getOrder, { id }, true);
  return (
    <State resource={resource}>
      {(data) => (
        <Detail
          key={id}
          order={data.data}
          reload={resource.reload}
          pickups={pickups}
          messages={messages}
        />
      )}
    </State>
  );
}
