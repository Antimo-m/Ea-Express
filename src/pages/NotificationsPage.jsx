import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  notifications,
  notificationHistory,
  readNotification,
  readAllNotifications,
} from "../api/workspace";
import { useApi } from "../hooks/useApi";
import {
  Header,
  State,
  Empty,
  Feedback,
  Icon,
  Pagination,
} from "../components/UI";
import { date } from "../utils/format";
function GroupHistory({ id, onRead, busy }) {
  const [page, setPage] = useState(1);
  const resource = useApi(notificationHistory, { id, page }, true);
  return (
    <div className="notification-history">
      <State resource={resource}>
        {(data) => (
          <>
            {data.data.map((item) => (
              <article
                key={item.id}
                className={`notification-event ${item.read_at ? "" : "unread"}`}
              >
                <span className="notification-event-icon">
                  <Icon name={item.is_message ? "chat-dots" : "box-seam"} />
                </span>
                <div>
                  <strong>
                    {item.title}{" "}
                    {!item.read_at && <span className="mini-badge">Nuovo</span>}
                  </strong>
                  <time dateTime={item.created_at}>
                    {date(item.created_at, true)}
                  </time>
                </div>
                <button
                  className="button secondary small-button"
                  disabled={busy}
                  onClick={() => onRead(item)}
                >
                  {item.is_message ? "Apri messaggio" : "Apri spedizione"}
                  <Icon name="arrow-up-right" />
                </button>
              </article>
            ))}
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </State>
    </div>
  );
}
function NotificationGroup({ group, onRead, busy }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="panel notification-group"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="notification-icon">
          <Icon name="box-seam" />
        </span>
        <div>
          <h2>{group.reference}</h2>
          <p>
            {group.total} aggiornamenti · {date(group.latest_at, true)}
          </p>
        </div>
        {Number(group.unread) > 0 && (
          <span className="mini-badge">{group.unread} nuovi</span>
        )}
        <Icon name="chevron-down" />
      </summary>
      {open && <GroupHistory id={group.order_id} onRead={onRead} busy={busy} />}
    </details>
  );
}
export default function NotificationsPage() {
  const [params, setParams] = useSearchParams();
  const resource = useApi(notifications, {
    page: params.get("page") || 1,
    grouped: 1,
  }, true);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function read(item) {
    setBusy(true);
    setError(null);
    try {
      if (item) {
        await readNotification(item.id);
        navigate(
          `/${item.is_message ? "messages" : "shipments"}/${item.order_id}`,
        );
      } else {
        await readAllNotifications();
        resource.reload();
      }
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header
        title="Notifiche"
        description="Ogni pacco ha la sua cronologia. Espandi un gruppo per vedere gli aggiornamenti."
      >
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => read()}
        >
          <Icon name="check2-all" />
          Segna tutte come lette
        </button>
      </Header>
      <Feedback error={error} />
      <State resource={resource}>
        {(data) => (
          <>
            {data.data.length ? (
              data.data.map((group) => (
                <NotificationGroup
                  key={group.order_id}
                  group={group}
                  onRead={read}
                  busy={busy}
                />
              ))
            ) : (
              <div className="panel">
                <Empty
                  title="Tutto sotto controllo"
                  text="Qui compariranno gli aggiornamenti delle tue spedizioni."
                  icon="bell"
                />
              </div>
            )}
            <Pagination
              meta={data.meta}
              onPage={(page) => setParams({ page })}
            />
          </>
        )}
      </State>
    </>
  );
}
