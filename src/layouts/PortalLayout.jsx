import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { Icon, Feedback } from "../components/UI";
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
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const toggle = useRef(null);
  const location = useLocation();
  useEffect(() => {
    document.title = "EA-Express · Portale clienti";
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const key = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);
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
      <aside id="navigation" className={`sidebar ${open ? "is-open" : ""}`}>
        <Link className="brand" to="/dashboard" onClick={() => setOpen(false)}>
          <img src="/brand.svg" alt="" />{" "}
          <span>
            EA<span className="brand-light">-Express</span>
            <small>BUSINESS</small>
          </span>
        </Link>
        <p className="nav-caption">IL TUO NEGOZIO, IN MOVIMENTO</p>
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
            <Link to="/pickups/new" onClick={() => setOpen(false)}>
              Programma un ritiro <Icon name="arrow-right" />
            </Link>
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
      <div className="workspace">
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
                <small>Negozio · Cliente</small>
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
