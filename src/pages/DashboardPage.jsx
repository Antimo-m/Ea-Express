import LiveTracking from "../components/LiveTracking";
import IconButton from "../components/IconButton";
import { Link } from "react-router";
import { dashboard } from "../api/workspace";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../hooks/useAuth";
import {
  Header,
  Icon,
  State,
  OrderList,
  Empty,
  Status,
} from "../components/UI";
import { date, displayName } from "../utils/format";
export default function DashboardPage() {
  const resource = useApi(dashboard, {}, true);
  const { user } = useAuth();
  return (
    <>
      <Header
        eyebrow="TUTTO PRONTO PER PARTIRE"
        title={`Ciao, ${user.name}.`}
        description="Richieste, ritiri e consegne: le tue priorità a colpo d’occhio."
      />
      <section className="dashboard-actions"><div><h2>Il prossimo ritiro parte da qui</h2><p>Prepara la richiesta e verifica il totale prima di confermare.</p></div><div className="actions"><IconButton action="add" to="/pickups/new" label="Prenota un ritiro" text /><Link to="/rates" className="button secondary"><Icon name="geo-alt"/> Consulta le tariffe</Link></div></section>
      <State resource={resource}>
        {(data) => (
          <>
            <section className="metrics" aria-label="Riepilogo operativo">
              {[
                [
                  "Spedizioni attive",
                  data.metrics.active,
                  "box-seam",
                  "/shipments",
                ],
                [
                  "Ritiri da effettuare",
                  data.metrics.pickups,
                  "calendar2-week",
                  "/pickups",
                ],
                [
                  "Consegne completate",
                  data.metrics.delivered,
                  "check2-circle",
                  "/shipments?status=delivered",
                ],
                [
                  "Richiedono attenzione",
                  data.metrics.attention,
                  "exclamation-circle",
                  "/shipments",
                ],
              ].map(([label, value, icon, to]) => (
                <Link className="metric" to={to} key={label}>
                  <span className="metric-icon">
                    <Icon name={icon} />
                  </span>
                  <span>{label}</span>
                  <strong>
                    {value}
                    <Icon name="arrow-up-right" />
                  </strong>
                </Link>
              ))}
            </section>
            {data.metrics.unread > 0 && (
              <Link className="notice" to="/notifications">
                <Icon name="bell" />
                <span>Hai {data.metrics.unread} aggiornamenti da leggere.</span>
                <Icon name="arrow-right" />
              </Link>
            )}
            {data.live_order && <div className="order-focus"><LiveTracking key={data.live_order.id} orderId={data.live_order.id}/><aside className="order-focus-summary"><span className="eyebrow">IN PRIMO PIANO</span><Status order={data.live_order}/><h2>{data.live_order.recipient_name}</h2><p>{data.live_order.delivery_address}, {data.live_order.delivery_city}</p><strong>{data.live_order.courier?.name || 'Rider da assegnare'}</strong><Link className="button" to={`/shipments/${data.live_order.id}`}>Segui la spedizione <Icon name="arrow-up-right"/></Link></aside></div>}
            <div className="dashboard-grid">
              <section className="panel flush">
                <div className="section-heading">
                  <div>
                    <h2>Spedizioni recenti</h2>
                    <p className="muted">
                      Le ultime richieste e il loro stato.
                    </p>
                  </div>
                  <Link to="/shipments">
                    Vedi tutte <Icon name="arrow-right" />
                  </Link>
                </div>
                <OrderList orders={data.recent} />
              </section>
              <section className="panel pickup-panel">
                <div className="section-heading">
                  <h2>I prossimi ritiri</h2>
                  <Icon name="calendar2-week" />
                </div>
                {data.next_pickups.length ? (
                  data.next_pickups.map((order) => (
                    <Link
                      className="pickup-card"
                      key={order.id}
                      to={`/pickups/${order.id}`}
                    >
                      <div className="pickup-date">
                        <strong>{date(order.pickup_date)}</strong>
                        <span>
                          {order.pickup_from}–{order.pickup_to}
                        </span>
                      </div>
                      <h3>{displayName(order)}</h3>
                      <p>{order.pickup_address}</p>
                      <Status order={order} />
                    </Link>
                  ))
                ) : (
                  <Empty
                    title="Agenda libera"
                    text="Il prossimo ritiro parte da qui."
                    icon="calendar2-check"
                  >
                    <IconButton action="add" to="/pickups/new" label="Programma ritiro" />
                  </Empty>
                )}
              </section>
            </div>
          </>
        )}
      </State>
    </>
  );
}
