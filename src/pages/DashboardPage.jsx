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
import { date } from "../utils/format";
export default function DashboardPage() {
  const resource = useApi(dashboard);
  const { user } = useAuth();
  return (
    <>
      <Header
        eyebrow="TUTTO PRONTO PER PARTIRE"
        title={`Ciao, ${user.name}.`}
        description="Ecco cosa si muove oggi nel tuo negozio."
      />
      <section className="hero">
        <div>
          <span className="hero-label">
            <span /> IL TUO NEGOZIO, SENZA DISTANZE
          </span>
          <h2>
            Tu pensa al negozio.
            <br />
            <em>Al resto, ci muoviamo noi.</em>
          </h2>
          <p>
            Organizza i ritiri, segui le consegne e resta in contatto con i tuoi
            corrieri.
          </p>
          <div className="actions">
            <Link className="button" to="/shipments/new">
              <Icon name="plus-lg" />
              Nuova spedizione
            </Link>
            <Link className="button secondary" to="/pickups/new">
              <Icon name="calendar2-plus" />
              Programma ritiro
            </Link>
          </div>
        </div>
        <div className="route-art" aria-hidden="true">
          <div className="orbit" />
          <div className="art-pin">
            <Icon name="geo-alt-fill" />
          </div>
          <div className="art-box">
            <Icon name="box-seam" />
            <span>Pronti a partire.</span>
          </div>
          <div className="art-rider">
            <Icon name="bicycle" />
          </div>
          <span className="route-dot" />
        </div>
      </section>
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
            <div className="dashboard-grid">
              <section className="panel flush">
                <div className="section-heading">
                  <div>
                    <h2>Spedizioni recenti</h2>
                    <p className="muted">Tieni il filo di ogni consegna.</p>
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
                      <h3>{order.pickup_city}</h3>
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
                    <Link to="/pickups/new">Programma un ritiro</Link>
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
