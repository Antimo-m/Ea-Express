import { useRef, useState } from 'react';
import Modal from './Modal';
import { Feedback, Icon } from './UI';
export default function ConfirmDeleteModal({ open, name, description, actionLabel = 'Elimina', loading = false, onClose, onConfirm, onReload, children }) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function confirm(event) {
    event.preventDefault();
    if (pending.current || loading || error?.status === 409) return;
    pending.current = true; setBusy(true); setError(null);
    const data = new FormData(event.currentTarget);
    try { await onConfirm(data); onClose(); }
    catch (failure) { setError(failure); }
    finally { pending.current = false; setBusy(false); }
  }
  function close() { if (!pending.current && !loading) { setError(null); onClose(); } }
  return <Modal open={open} title={`${actionLabel}: ${name}`} description={description || `Sei sicuro di voler eliminare «${name}»?`} danger busy={busy || loading} onClose={close}>
    <form onSubmit={confirm}>
      <div className="modal-content-area"><Feedback error={error} />{error?.status === 409 && onReload && <button type="button" className="button secondary" onClick={() => { close(); onReload(); }}>Ricarica dati aggiornati</button>}{children}</div>
      <footer className="modal-actions"><button type="button" className="button modal-back" disabled={busy || loading} onClick={close}><Icon name="arrow-left"/> Torna indietro</button><button className="button danger" disabled={busy || loading || error?.status === 409} aria-busy={busy || loading}><Icon name="trash" />{busy || loading ? 'Attendi…' : actionLabel}</button></footer>
    </form>
  </Modal>;
}
