import MetricTile from '../components/MetricTile';
import DataPanel from '../components/DataPanel';
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
        eyebrow="EA-Express · IL TUO NEGOZIO"
        title={`Ciao, ${user.name}.`}
        description="Richieste, ritiri e consegne: le tue priorità a colpo d’occhio."
      />
      <section className="dashboard-actions" aria-labelledby="booking-title"><div><span className="eyebrow">01 / PRENOTAZIONE</span><h2 id="booking-title">Organizza il prossimo ritiro</h2><p>Indica dove ritirare e consegnare. Controlla il totale prima di confermare.</p></div><div className="actions"><IconButton action="add" to="/pickups/new" label="Prenota un ritiro" text /><Link to="/rates" className="button secondary"><Icon name="geo-alt"/> Consulta le tariffe</Link></div></section>
      <State resource={resource}>
        {(data) => (
          <>
            <section className="portal-metric-grid" aria-label="Riepilogo operativo">
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
                <MetricTile key={label} label={label} value={value} icon={icon} to={to} tone={label === 'Richiedono attenzione' && value > 0 ? 'attention' : 'neutral'} />
              ))}
            </section>
            {data.metrics.unread > 0 && (
              <Link className="notice" to="/notifications">
                <Icon name="bell" />
                <span>Hai {data.metrics.unread} aggiornamenti da leggere.</span>
                <Icon name="arrow-right" />
              </Link>
            )}
            {data.live_order && <aside className="order-focus-summary" aria-label="Spedizione in primo piano"><div><span className="eyebrow">IN PRIMO PIANO</span><h2>{data.live_order.recipient_name}</h2><p>{data.live_order.delivery_address}, {data.live_order.delivery_city}</p></div><div><Status order={data.live_order}/><p>{data.live_order.rider?.name || 'Rider da assegnare'}</p></div><Link className="button secondary" to={`/shipments/${data.live_order.slug}`}>Segui la spedizione <Icon name="arrow-up-right"/></Link></aside>}
            <div className="dashboard-grid">
              <DataPanel title="Spedizioni recenti" description="Le ultime richieste e il loro stato." className="data-panel--flush" actions={<Link to="/shipments">Vedi tutte <Icon name="arrow-right" /></Link>}>
                <OrderList orders={data.recent} />
              </DataPanel>
              <section className="panel pickup-panel">
                <div className="section-heading">
                  <h2>I prossimi ritiri</h2>
                  <Icon name="calendar2-week" />
                </div>
                {data.next_pickups.length ? (
                  data.next_pickups.map((order) => (
                    <Link
                      className="pickup-card"
                      key={order.slug}
                      to={`/pickups/${order.slug}`}
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
