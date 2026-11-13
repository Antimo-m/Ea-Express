import ThemeToggle from "../components/ThemeToggle";
import Brand from "../components/Brand";
import PrivacyLinks from "../components/PrivacyLinks";
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
import { BetaStrip } from "../components/BetaNotice";
const groups = [
  ['Operatività', [
    ['/dashboard', 'grid-1x2', 'Panoramica'], ['/pickups', 'calendar2-week', 'Ritiri'],
    ['/shipments', 'box-seam', 'Spedizioni e storico'],
    ['/messages', 'chat-left-text', 'Messaggi'],
  ]],
  ['Attività del negozio', [['/statistics', 'bar-chart', 'Statistiche'], ['/pending', 'hourglass-split', 'Sospesi']]],
  ['Configurazione commerciale', [['/rates', 'tags', 'Listini']]],
  ['Account e sistema', [['/profile', 'person-circle', 'Profilo e sicurezza'], ['/settings', 'sliders', 'Impostazioni'], ['/notifications', 'bell', 'Notifiche']]],
];
export default function PortalLayout() {
  const { user, logout } = useAuth();
  useEffect(() => connectWorkspace(request), [user.slug]);
  const [menuPath, setMenuPath] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const toggle = useRef(null);
  const navigation = useRef(null);
  const mobile = useMobile("(max-width: 991px)");
  const location = useLocation();
  const open = mobile && menuPath === location.key;
  const setOpen = value => setMenuPath(value ? location.key : null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 991px)");
    const close = () => setMenuPath(null);
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);
  useEffect(() => {
    document.title = "EA-Express · Portale clienti";
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!open || !mobile) return;
    const previousOverflow = document.body.style.overflow;
    const toggleButton = toggle.current;
    document.body.style.overflow = "hidden";
    const panel = navigation.current;
    let active = true;
    Promise.all(panel.getAnimations().map(animation => animation.finished.catch(() => {}))).then(() => {
      if (active) panel.querySelector("button")?.focus();
    });
    const key = (event) => {
      if (event.key === "Tab") {
        const elements = [...navigation.current.querySelectorAll(
          "a[href], button:not([disabled])",
        )].filter(element => element.getClientRects().length);
        const first = elements[0],
          last = elements[elements.length - 1];
        if (!navigation.current.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (event.key === "Escape") {
        setMenuPath(null);
        toggleButton?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      active = false;
      window.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
      if (toggleButton?.getClientRects().length) toggleButton.focus();
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
          tabIndex={-1}
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
        <div className="sidebar-brand">
          <button
            className="icon-button sidebar-close"
            aria-label="Chiudi navigazione"
            onClick={() => setOpen(false)}
          >
            <Icon name="x-lg" />
          </button>
          <Link className="brand" to="/dashboard" onClick={() => setOpen(false)}>
            <Brand caption="PORTALE CLIENTI" />
          </Link>
        </div>
        <div className="sidebar-content">
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
            EA-Express <span>/</span> <strong>Ritiri e spedizioni</strong>
          </span>
          <div className="topbar-actions">
            <ThemeToggle /><NotificationSound />
            <Link className="account" to="/profile" aria-label={`Apri profilo di ${user.name}`}>
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
          <BetaStrip />
          <Feedback error={error} />
          <Outlet />
        </main>
        <footer className="footer">
          <span>EA-Express</span>
          <PrivacyLinks/>
        </footer>
      </div>
      <nav className="portal-mobile-nav" aria-label="Navigazione rapida" inert={mobile && open}>
        <NavLink to="/dashboard"><Icon name="house"/><span>Home</span></NavLink>
        <NavLink to="/shipments"><Icon name="box-seam"/><span>Spedizioni</span></NavLink>
        <IconButton action="add" to="/pickups/new" className="mobile-create" label="Prenota un ritiro" />
        <NavLink to="/pickups"><Icon name="calendar2-week"/><span>Ritiri</span></NavLink>
        <NavLink to="/profile"><Icon name="person"/><span>Profilo</span></NavLink>
      </nav>
    </div>
  );
}
