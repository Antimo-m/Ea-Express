import { useEffect, useRef, useState } from "react";
import { createNotificationMonitor } from "../services/notification-monitor";
import { notificationFeed } from "../api/workspace";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router";
import { Icon } from "./UI";
export default function NotificationSound() {
  const { user } = useAuth();
  const monitor = useRef(null);
  const [state, setState] = useState({ enabled: false, unread: 0 });
  useEffect(() => {
    const current = createNotificationMonitor({
      scope: `customer:${user.id}`,
      load: notificationFeed,
      onChange: (next) => setState((previous) => ({ ...previous, ...next })),
    });
    monitor.current = current;
    const update = () => current.refresh();
    window.addEventListener('ea:workspace-updated', update);
    return () => { current.dispose(); window.removeEventListener('ea:workspace-updated', update); };
  }, [user.id]);
  return (
    <>
    <button
      className="sound-toggle"
      type="button"
      aria-pressed={state.enabled}
      aria-label={
        state.enabled ? "Disattiva suoni notifiche" : "Attiva suoni notifiche"
      }
      title={
        state.available === false
          ? "Aggiornamenti temporaneamente non disponibili. Nuovo tentativo automatico."
          : "Avvisi per nuovi eventi. Nessun suono per gli aggiornamenti già ricevuti."
      }
      onClick={() => monitor.current?.toggle()}
    >
      <Icon name={state.enabled ? "volume-up" : "volume-mute"} />
      <span>{state.enabled ? "Suoni attivi" : "Attiva suoni"}</span>
    </button>
    <Link className="icon-button notification-bell" to="/notifications" aria-label={state.unread > 0 ? `Notifiche: ${state.unread} non lette` : 'Notifiche'}>
      <Icon name="bell" />
      {state.unread > 0 && <span className="notification-badge" aria-hidden="true">{state.unread > 99 ? '99+' : state.unread}</span>}
    </Link>
    </>
  );
}
