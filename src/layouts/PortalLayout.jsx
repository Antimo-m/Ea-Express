import IconButton from "../components/IconButton";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useMobile } from "../hooks/useMobile";
import { useAuth } from "../hooks/useAuth";
import { Icon, Feedback } from "../components/UI";
import NotificationSound from "../components/NotificationSound";
import { connectWorkspace } from "../services/workspace-realtime";
import { request } from "../api/client";
import { initials } from "../utils/format";
const groups = [
  ['Operatività', [
    ['/dashboard', 'grid-1x2', 'Panoramica'], ['/pickups', 'calendar2-week', 'Ritiri'],
    ['/shipments', 'box-seam', 'Spedizioni e storico'], ['/couriers', 'bicycle', 'Corrieri'],
    ['/messages', 'chat-left-text', 'Messaggi'],
  ]],
  ['Attività del negozio', [['/statistics', 'bar-chart', 'Statistiche']]],
  ['Configurazione commerciale', [['/rates', 'tags', 'Listini']]],
  ['Account e sistema', [['/profile', 'person-circle', 'Profilo e sicurezza'], ['/settings', 'sliders', 'Impostazioni'], ['/notifications', 'bell', 'Notifiche']]],
];
export default function PortalLayout() {
  const { user, logout } = useAuth();
  useEffect(() => connectWorkspace(request), [user.id]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const toggle = useRef(null);
  const navigation = useRef(null);
  const mobile = useMobile();
  const location = useLocation();
  useEffect(() => {
    document.title = "EA-Express · Portale clienti";
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!open || !mobile) return;
    const previousOverflow = document.body.style.overflow;
    const toggleButton = toggle.current;
    document.body.style.overflow = "hidden";
    navigation.current?.querySelector("button")?.focus();
    const key = (event) => {
      if (event.key === "Tab") {
        const elements = navigation.current.querySelectorAll(
          "a[href], button:not([disabled])",
        );
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (event.key === "Escape") {
        setOpen(false);
        toggleButton?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
      toggleButton?.focus();
    };
  }, [open, mobile]);
  async function signOut() {
    setBusy(true);
    try {
      await logout();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Vai al contenuto
      </a>
      {open && (
        <button
          className="nav-backdrop"
          aria-label="Chiudi menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={navigation}
        id="navigation"
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile && open ? true : undefined}
        aria-label="Menu principale"
        inert={mobile && !open}
        className={`sidebar ${open ? "is-open" : ""}`}
      >
        <button
          className="icon-button sidebar-close"
          aria-label="Chiudi navigazione"
          onClick={() => setOpen(false)}
        >
          <Icon name="x-lg" />
        </button>
        <Link className="brand" to="/dashboard" onClick={() => setOpen(false)}>
          <img className="brand-logo" src="/brand.svg" alt="EA Express" width="155" height="83"/>{" "}
          <span>
            EA<span className="brand-light">-Express</span>
            <small>BUSINESS</small>
          </span>
        </Link>
        <IconButton action="add" to="/pickups/new" label="Prenota un ritiro" text className="portal-create" onClick={() => setOpen(false)} />
        <nav aria-label="Navigazione principale">
          {groups.map(([title, items]) => <section className="nav-group" key={title} aria-label={title}>
            <h2 className="nav-caption">{title}</h2>
            {items.map(([to, icon, label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)}><Icon name={icon} />{label}</NavLink>)}
          </section>)}
        </nav>
        <div className="sidebar-bottom">
          <button className="logout" disabled={busy} onClick={signOut}>
            <Icon name="box-arrow-right" />
            {busy ? "Uscita…" : "Esci"}
          </button>
        </div>
      </aside>
      <div className="workspace" inert={mobile && open}>
        <header className="topbar">
          <button
            ref={toggle}
            className="icon-button menu-toggle"
            aria-label="Apri menu"
            aria-expanded={open}
            aria-controls="navigation"
            onClick={() => setOpen(!open)}
          >
            <Icon name="list" />
          </button>
          <span className="topbar-label">
            EA-Express <span>/</span> <strong>Portale clienti</strong>
          </span>
          <div className="topbar-actions">
            <NotificationSound />
            <Link className="account" to="/profile">
              <span className="avatar">{initials(user.name)}</span>
              <span>
                <strong>{user.name}</strong>
                <small>
                  {user.sender_type === "private"
                    ? "Privato"
                    : user.sender_type === "online_shop" ? "Shop online" : "Attività commerciale"}
                </small>
              </span>
              <Icon name="chevron-down" />
            </Link>
          </div>
        </header>
        <main id="main" tabIndex="-1">
          <Feedback error={error} />
          <Outlet />
        </main>
        <footer className="footer">
          <span>EA-Express</span>
          <span>Ogni consegna, una connessione.</span>
        </footer>
      </div>
    </div>
  );
}
