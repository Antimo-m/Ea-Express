import { useEffect, useRef, useState } from "react";
import { createNotificationMonitor } from "../services/notification-monitor";
import { notificationFeed } from "../api/workspace";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router";
import { Icon } from "./UI";
export default function NotificationSound() {
  const { user, updateDisplayPreferences } = useAuth();
  const monitor = useRef(null);
  const [state, setState] = useState({ enabled: false, unread: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const soundEnabled = Boolean(user.portal_preferences?.notification_sound);
  useEffect(() => {
    const current = createNotificationMonitor({
      scope: `customer:${user.slug}`,
      load: notificationFeed,
      initialEnabled: false,
      saveEnabled: value => updateDisplayPreferences({notification_sound: value}),
      onChange: (next) => setState((previous) => ({ ...previous, ...next })),
    });
    monitor.current = current;
    const update = () => current.refresh();
    window.addEventListener('ea:workspace-updated', update);
    return () => { current.dispose(); window.removeEventListener('ea:workspace-updated', update); };
  }, [user.slug, updateDisplayPreferences]);
  useEffect(() => { monitor.current?.setEnabled(soundEnabled); }, [soundEnabled]);
  async function toggle() {
    if (busy) return;
    setBusy(true); setError('');
    try { await monitor.current?.toggle(); }
    catch { setError('Preferenza audio non salvata. Riprova.'); }
    finally { setBusy(false); }
  }
  return (
    <>
    <button
      className="sound-toggle"
      type="button"
      disabled={busy}
      aria-pressed={state.enabled}
      aria-label={
        state.enabled ? "Disattiva suoni notifiche" : "Attiva suoni notifiche"
      }
      title={
        state.available === false
          ? "Aggiornamenti temporaneamente non disponibili. Nuovo tentativo automatico."
          : "Avvisi per nuovi eventi. Nessun suono per gli aggiornamenti già ricevuti."
      }
      onClick={toggle}
    >
      <Icon name={state.enabled ? "volume-up" : "volume-mute"} />
      <span>{state.enabled ? "Suoni attivi" : "Attiva suoni"}</span>
    </button>
    {error && <span className="preference-error" role="alert">{error}</span>}
    <Link className="icon-button notification-bell" to="/notifications" aria-label={state.unread > 0 ? `Notifiche: ${state.unread} non lette` : 'Notifiche'}>
      <Icon name="bell" />
      {state.unread > 0 && <span className="notification-badge" aria-hidden="true">{state.unread > 99 ? '99+' : state.unread}</span>}
    </Link>
    </>
  );
}
