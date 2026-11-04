import IconButton from "./IconButton";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { request } from "../api/client";
import { Feedback, Icon } from "./UI";
import Modal from "./Modal";
import { pickupAddress, samePickupAddress, completePickupAddress } from "../utils/pickup-address";

export default function SenderAddressPreference({ ref, formRef, onUse, initial }) {
  const [saved, setSaved] = useState(null);
  const [current, setCurrent] = useState(initial || {});
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const decision = useRef(null);
  const offered = useRef(new Set());
  useEffect(() => {
    let active = true;
    request("/sender-address").then(result => {
      if (!active) return;
      setSaved(result.data); setReady(true);
      const entered = formRef.current && Object.values(pickupAddress(Object.fromEntries(new FormData(formRef.current)))).some(Boolean);
      if (result.data && !initial && !entered) {
        onUse(result.data); setCurrent(result.data);
        setMessage("Il tuo indirizzo di ritiro è già pronto. Puoi modificarlo per questo ordine.");
      }
    }).catch(error => { if (active) setError(error); });
    return () => { active = false; };
  }, [initial, onUse, formRef]);
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const read = () => setCurrent(pickupAddress(Object.fromEntries(new FormData(form))));
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    return () => { form.removeEventListener("input", read); form.removeEventListener("change", read); };
  }, [formRef]);
  useEffect(() => () => { decision.current?.(false); }, []);
  useImperativeHandle(ref, () => ({
    async offerSave(data, orderKey) {
      if (offered.current.has(orderKey) || !completePickupAddress(data)) return;
      offered.current.add(orderKey);
      let latest;
      try {
        const result = await request("/sender-address");
        latest = result.data; setSaved(latest); setReady(true);
      } catch {
        return;
      }
      if (samePickupAddress(latest, data)) return;
      setError(null); setPrompt({ data: pickupAddress(data), version: latest?.version || 0 });
      return new Promise(resolve => { decision.current = resolve; });
    },
  }));
  function closePrompt() {
    if (busy) return;
    setPrompt(null); setError(null);
    decision.current?.(false); decision.current = null;
  }
  async function reload() {
    setError(null); setBusy(true);
    try { const result = await request("/sender-address"); setSaved(result.data); setReady(true); }
    catch (failure) { setError(failure); }
    finally { setBusy(false); }
  }
  async function save(data, version, afterOrder = false) {
    if (busy) return;
    setBusy(true); setError(null); setMessage("");
    try {
      const result = await request("/sender-address", { method: "PUT", data: { ...pickupAddress(data), version } });
      setSaved(result.data); setMessage("Indirizzo di ritiro salvato nel tuo account.");
      if (afterOrder) {
        setPrompt(null); decision.current?.(true); decision.current = null;
      }
    } catch (failure) { setError(failure); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      await request("/sender-address", { method: "DELETE", data: { version: saved.version } });
      setSaved(null); setConfirmDelete(false); setMessage("Preferito eliminato. Gli indirizzi degli ordini restano invariati.");
    } catch (failure) { setError(failure); }
    finally { setBusy(false); }
  }
  const complete = completePickupAddress(current);
  const matches = samePickupAddress(saved, current);
  function applySaved(edit = false) {
    onUse(saved); setCurrent(saved); setMessage(edit ? "Modifica l’indirizzo qui sotto e salva le modifiche al preferito." : "Indirizzo preferito inserito nel ritiro.");
  }
  return <>
    <div className="sender-address-preference">
      <div className="saved-pickup-heading"><Icon name="bookmark-check" /><div><strong>Il tuo indirizzo di ritiro</strong><p>Salvato nel tuo account, disponibile anche da altri dispositivi.</p></div></div>
      {saved && <><address>{saved.pickup_address} {saved.pickup_street_number}<br />{saved.pickup_postal_code} {saved.pickup_city}</address><div className="saved-pickup-actions">
        <button type="button" className="button secondary" disabled={busy} onClick={() => applySaved()}>Usa questo indirizzo</button>
        <button type="button" className="button secondary" disabled={busy} onClick={() => { onUse(null); setCurrent({}); setMessage("Inserisci un altro indirizzo. Il preferito rimane salvato."); }}>Altro indirizzo</button>
        <button type="button" className="button secondary" disabled={busy} onClick={() => applySaved(true)}>Modifica preferito</button>
        <IconButton action="delete" label="Elimina indirizzo di ritiro preferito" disabled={busy} onClick={() => setConfirmDelete(true)} />
      </div></>}
      {!saved && ready && <p>Inserisci il punto di ritiro. Dopo la conferma potrai salvarlo per la prossima volta.</p>}
      {ready && complete && !matches && <div className="save-pickup-current"><button type="button" className="button secondary" disabled={busy || error?.status === 409} onClick={() => save(pickupAddress(Object.fromEntries(new FormData(formRef.current))), saved?.version || 0)}><Icon name="bookmark-plus" />{saved ? "Salva modifiche al preferito" : "Salva questo indirizzo"}</button></div>}
      {confirmDelete && <div role="group" aria-label="Conferma eliminazione preferito"><p>Eliminare il preferito? Gli ordini precedenti rimangono invariati.</p><div className="actions"><IconButton action="confirm" label="Conferma eliminazione" loading={busy} onClick={remove} /><button type="button" className="button button-back" disabled={busy} onClick={() => setConfirmDelete(false)}>Torna indietro</button></div></div>}
      {!prompt && <Feedback error={error} />}
      {!prompt && error && <button type="button" className="button secondary" disabled={busy} onClick={reload}>Ricarica preferito</button>}
      {message && <p className="saved-pickup-message" role="status">{message}</p>}
    </div>
    {createPortal(<Modal open={Boolean(prompt)} busy={busy} title="Salviamo il punto di ritiro?" description="Il tuo ordine è confermato. Puoi ritrovare questo indirizzo già compilato nei prossimi ritiri." onClose={closePrompt}>
      <div className="modal-content-area save-pickup-prompt"><span className="save-pickup-icon" aria-hidden="true"><Icon name="bookmark-star" /></span><address>{prompt?.data.pickup_address} {prompt?.data.pickup_street_number}<br />{prompt?.data.pickup_postal_code} {prompt?.data.pickup_city}</address><p>Salviamo solo l’indirizzo di ritiro del mittente nel tuo account. I dati del destinatario rimangono legati a questo ordine.</p>{saved && <p>Questo indirizzo sostituirà il tuo attuale preferito.</p>}<Feedback error={error} />{error?.status === 409 && <p>Il preferito è cambiato da un altro dispositivo. L’ordine è confermato: potrai aggiornare l’indirizzo alla prossima prenotazione.</p>}</div>
      <footer className="modal-actions"><button type="button" className="button secondary" disabled={busy} onClick={closePrompt}>Continua senza salvare</button><button type="button" className="button secondary save-pickup-confirm" disabled={busy || error?.status === 409} aria-busy={busy || undefined} onClick={() => save(prompt.data, prompt.version, true)}><Icon name="bookmark-check" />{busy ? "Salvataggio…" : "Salva per i prossimi ritiri"}</button></footer>
    </Modal>, document.body)}
  </>;
}
