import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useMobile } from "../hooks/useMobile";
import { useAuth } from "../hooks/useAuth";
import { Icon, Feedback } from "../components/UI";
import NotificationSound from "../components/NotificationSound";
import { connectWorkspace } from "../services/workspace-realtime";
import { request } from "../api/client";
import { initials } from "../utils/format";
const items = [
  ["/dashboard", "grid-1x2", "Panoramica"],
  ["/shipments", "box-seam", "Spedizioni"],
  ["/pickups", "calendar2-week", "Ritiri"],
  ["/messages", "chat-left-text", "Messaggi"],
  ["/couriers", "bicycle", "Corrieri"],
  ["/notifications", "bell", "Notifiche"],
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
          <img src="/brand.svg" alt="" />{" "}
          <span>
            EA<span className="brand-light">-Express</span>
            <small>BUSINESS</small>
          </span>
        </Link>
        <p className="nav-caption">IL TUO SPAZIO SPEDIZIONI</p>
        <nav aria-label="Navigazione principale">
          {items.map(([to, icon, label]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <Icon name={icon} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <Icon name="lightning-charge" />
            <strong>Una richiesta. Si parte.</strong>
            <p>Organizza il prossimo ritiro in pochi passaggi.</p>
            <Link to="/pickups/new" onClick={() => setOpen(false)} className="button create-button" aria-label="Programma ritiro" title="Programma ritiro"><span aria-hidden="true">+</span></Link>
          </div>
          <NavLink to="/settings" onClick={() => setOpen(false)}>
            <Icon name="sliders" />
            Impostazioni
          </NavLink>
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
            Portale clienti <span>/</span> <strong>La tua operatività</strong>
          </span>
          <div className="topbar-actions">
            <NotificationSound />
            <Link
              className="icon-button"
              to="/notifications"
              aria-label="Notifiche"
            >
              <Icon name="bell" />
            </Link>
            <Link className="account" to="/profile">
              <span className="avatar">{initials(user.name)}</span>
              <span>
                <strong>{user.name}</strong>
                <small>
                  {user.sender_type === "private"
                    ? "Privato"
                    : "Attività commerciale"}
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
