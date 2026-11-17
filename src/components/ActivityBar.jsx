import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

/**
 * Thin top bar shown while a page is being opened or API requests are in flight, so slow
 * responses never look like an unresponsive interface. CSS delays its appearance to avoid flicker.
 */
export default function ActivityBar() {
  const location = useLocation();
  const current = location.pathname + location.search;
  const [requests, setRequests] = useState(0);
  const [pendingFrom, setPendingFrom] = useState(null);
  const fallback = useRef();
  useEffect(() => {
    const onActivity = event => setRequests(event.detail);
    const onClick = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      const from = window.location.pathname + window.location.search;
      if (url.origin !== window.location.origin || url.pathname + url.search === from) return;
      setPendingFrom(from);
      clearTimeout(fallback.current);
      fallback.current = setTimeout(() => setPendingFrom(null), 20000);
    };
    window.addEventListener("ea:activity", onActivity);
    document.addEventListener("click", onClick);
    return () => { window.removeEventListener("ea:activity", onActivity); document.removeEventListener("click", onClick); clearTimeout(fallback.current); };
  }, []);
  const busy = pendingFrom === current || requests > 0;
  return <div className="activity-bar" role="progressbar" aria-label="Caricamento in corso" aria-hidden={!busy} hidden={!busy} />;
}
