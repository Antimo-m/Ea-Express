import { useEffect, useRef, useState } from "react";
import { createNotificationMonitor } from "../services/notification-monitor";
import { notificationFeed } from "../api/workspace";
import { useAuth } from "../hooks/useAuth";
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
      {state.unread > 0 && (
        <span
          className="sound-unread"
          aria-label={`${state.unread} aggiornamenti non letti`}
        >
          {state.unread}
        </span>
      )}
    </button>
  );
}
