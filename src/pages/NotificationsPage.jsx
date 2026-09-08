import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  notifications,
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
export default function NotificationsPage() {
  const [params, setParams] = useSearchParams();
  const resource = useApi(notifications, { page: params.get("page") || 1 });
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
        title="Tutti gli aggiornamenti."
        description="Le novità sulle tue consegne e i messaggi dei corrieri."
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
      <section className="panel flush">
        <State resource={resource}>
          {(data) => (
            <>
              {data.data.length ? (
                <div className="notification-list">
                  {data.data.map((item) => (
                    <button
                      disabled={busy}
                      className={`notification ${item.read_at ? "" : "unread"}`}
                      key={item.id}
                      onClick={() => read(item)}
                    >
                      <span className="notification-icon">
                        <Icon
                          name={item.is_message ? "chat-dots" : "box-seam"}
                        />
                      </span>
                      <span>
                        <strong>
                          {item.title}
                          {!item.read_at && (
                            <span
                              className="unread-dot"
                              aria-label="Non letta"
                            />
                          )}
                        </strong>
                        <small>
                          {item.reference} · {date(item.created_at, true)}
                        </small>
                      </span>
                      <Icon name="arrow-up-right" />
                    </button>
                  ))}
                </div>
              ) : (
                <Empty
                  title="Sei al passo con tutto"
                  text="Gli aggiornamenti delle tue spedizioni appariranno qui."
                  icon="bell"
                />
              )}
              <Pagination
                meta={data.meta}
                onPage={(page) => setParams({ page })}
              />
            </>
          )}
        </State>
      </section>
    </>
  );
}
