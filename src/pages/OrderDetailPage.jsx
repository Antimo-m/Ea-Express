import IconButton from "../components/IconButton";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { contentLabel } from "../utils/order-content";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { getOrder, cancelOrder } from "../api/shipments";
import { useApi } from "../hooks/useApi";
import { Header, State, Status, Feedback, Icon, Empty } from "../components/UI";
import ShippingPrice from "../components/ShippingPrice";
import MessageThread from "../components/MessageThread";
import { date, money, displayName } from "../utils/format";
function Detail({ order, reload, pickups, messages }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [success, setSuccess] = useState(useLocation().state?.success || "");
  const base = pickups ? "/pickups" : "/shipments";
  async function cancel(data) {
    await cancelOrder(order.id, { version: order.version, reason: data.get('reason') });
    setSuccess('Richiesta annullata.');
    reload();
  }
  return (
    <>
      <Header
        backTo={messages ? "/messages" : base}
        eyebrow={messages ? "CONVERSAZIONE" : "SPEDIZIONE"}
        title={messages ? `Conversazione · ${displayName(order)}` : displayName(order)}
        description={`${order.reference} · ${order.pickup_city} → ${order.delivery_city} · Destinatario: ${order.recipient_name}`}
      >
        <IconButton action="print" label="Stampa etichetta" to={`/shipments/${order.id}/label`} />
        <Status order={order} /><span className="service-badge">{order.shipping_type === "external" ? "Fuori regione" : "Regionale"}</span>
        {order.can_edit && (
          <IconButton action="edit" label="Modifica spedizione" to={`${base}/${order.id}/edit`} />
        )}
      </Header>
      <Feedback success={success} />

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
                  <h3>{order.pickup_address} {order.pickup_street_number}</h3>
                  <p>{order.pickup_postal_code} {order.pickup_city}</p>
                  <small>
                    {date(order.pickup_date)} · {order.pickup_from}–
                    {order.pickup_to}
                  </small>
                </div>
                <div>
                  <span className="journey-point destination" />
                  <p className="eyebrow">DESTINAZIONE</p>
                  <h3>{order.delivery_address} {order.delivery_street_number}</h3>
                  <p>{order.delivery_postal_code} {order.delivery_city}</p>
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
              {order.shipping_type === 'external' && <div className="carrier-summary"><h2>Consegna con Rete EA-Express</h2><dl className="facts"><div><dt>Servizio</dt><dd>Rete EA-Express</dd></div><div><dt>Tracking spedizione</dt><dd>{order.carrier_tracking || 'Non ancora disponibile'}</dd></div><div><dt>Stato spedizione</dt><dd>{{booked:'Prenotata',handed_over:'Affidata alla rete',in_transit:'In transito',delivery_issue:'Problema di consegna',delivered:'Consegnata'}[order.carrier_status] || 'In attesa di affidamento'}</dd></div>{order.estimated_delivery_from && <div><dt>Consegna stimata</dt><dd>{date(order.estimated_delivery_from)} – {date(order.estimated_delivery_to)}</dd></div>}</dl><p className="muted small">Stima dal ritiro, da confermare con EA-Express. Gli aggiornamenti sono registrati da EA Express.</p></div>}
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
              <h2>Dettagli della richiesta</h2><p className={order.package_type==='fragile'?'fragile-badge':'muted'}>{order.package_type==='fragile'?'FRAGILE':order.package_type==='other'?order.package_description:'Pacco standard'}</p>
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
                        : order.sender_type === "online_shop" ? "Shop online" : order.business_type || "Attività"}
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
              <section className="panel cancellation"><h3>Gestisci la richiesta</h3><IconButton action="delete" label="Annulla richiesta" onClick={() => setCancelOpen(true)} />
                <ConfirmDeleteModal onReload={reload} open={cancelOpen} name={displayName(order)} actionLabel="Annulla richiesta" description="La richiesta sarà annullata e resterà consultabile nello storico." onClose={() => setCancelOpen(false)} onConfirm={cancel}>
                  <label className="field"><span>Motivo dell’annullamento</span><textarea name="reason" required maxLength={500} rows={3}/></label>
                </ConfirmDeleteModal>
              </section>
            )}
          </aside>
        </div>
      )}
      {order.packages?.length > 0 && <section className="panel"><h2>I tuoi pacchi</h2>{order.packages.map((item, index) => <p key={index}><strong>Pacco {index + 1}</strong> · {item.weight_kg} kg · {item.length_cm} × {item.width_cm} × {item.height_cm} cm</p>)}</section>}
      <ShippingPrice order={order} reload={reload}/>
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
