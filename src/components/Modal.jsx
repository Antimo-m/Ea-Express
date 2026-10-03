import { useEffect, useId, useRef } from "react";
import { Icon } from "./UI";
export default function Modal({ open, title, description, busy = false, danger = false, onClose, children }) {
  const dialog = useRef(null);
  const id = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!open) return;
    const origin = document.activeElement;
    node.showModal();
    node.querySelector('input:not([type="hidden"]):not(.ea-picker-source):not(:disabled), .ea-picker-trigger:not(:disabled), textarea:not(:disabled), button:not(:disabled)')?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const controls = [...node.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')].filter(control => control.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (!first) {event.preventDefault(); node.focus(); return;}
      if (!node.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); node.close(); if (origin?.isConnected) origin.focus(); };
  }, [open]);
  return <dialog ref={dialog} className={`ea-modal ${danger ? 'ea-modal-danger' : ''}`} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined} aria-busy={busy} onCancel={event => {event.preventDefault(); if (!busy) onClose();}}>
    <header className="modal-heading"><div><h2 id={`${id}-title`}>{title}</h2>{description && <p id={`${id}-description`}>{description}</p>}</div><button type="button" className="icon-button" aria-label="Chiudi finestra" data-tooltip="Chiudi" disabled={busy} onClick={onClose}><Icon name="x-lg"/></button></header>
    {children}
  </dialog>;
}
