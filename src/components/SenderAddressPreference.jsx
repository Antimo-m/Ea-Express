import { useEffect, useState } from "react";
import { request } from "../api/client";
import { Feedback } from "./UI";

const fields = ["store_name", "sender_type", "business_type", "business_description", "pickup_address", "pickup_street_number", "pickup_postal_code", "pickup_city"];
const required = ["store_name", "pickup_address", "pickup_street_number", "pickup_postal_code", "pickup_city"];
const normalize = value => String(value || "").trim().toLocaleLowerCase("it").replace(/\s+/g, " ");

export default function SenderAddressPreference({ formRef, onUse, initial }) {
  const [saved, setSaved] = useState(null);
  const [current, setCurrent] = useState(initial || {});
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    let active = true;
    request("/sender-address").then(result => { if (active) { setSaved(result.data); setReady(true); } }).catch(error => { if (active) setError(error); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const read = () => {
      const values = new FormData(form);
      setCurrent(Object.fromEntries(fields.map(field => [field, values.get(field) || ""])));
    };
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    return () => { form.removeEventListener("input", read); form.removeEventListener("change", read); };
  }, [formRef]);
  async function reload() {
    setError(null); setBusy(true);
    try { const result = await request("/sender-address"); setSaved(result.data); setReady(true); }
    catch (failure) { setError(failure); }
    finally { setBusy(false); }
  }
  async function save() {
    if (busy) return;
    setBusy(true); setError(null); setMessage("");
    const values = new FormData(formRef.current);
    const data = Object.fromEntries(fields.map(field => [field, values.get(field) || ""]));
    try {
      const result = await request("/sender-address", { method: "PUT", data: { ...data, version: saved?.version || 0 } });
      setSaved(result.data); setCurrent(data); setMessage("Indirizzo mittente preferito salvato.");
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
  const complete = required.every(field => String(current[field] || "").trim()) && /^[0-9]{5}$/.test(current.pickup_postal_code || "");
  const matches = saved && fields.every(field => normalize(saved[field]) === normalize(current[field]));
  function applySaved(edit = false) {
    onUse(saved); setCurrent(saved); setMessage(edit ? "Modifica i campi del mittente qui sotto, poi premi Salva modifiche al preferito." : "Indirizzo preferito inserito nei campi del mittente.");
  }
  return <div className="panel">
    <h3>Indirizzo mittente preferito</h3>
    {saved && <><p><strong>{saved.store_name}</strong><br />{saved.pickup_address} {saved.pickup_street_number}<br />{saved.pickup_postal_code} {saved.pickup_city}</p>
      <div className="actions">
        <button type="button" className="button secondary" disabled={busy} onClick={() => applySaved()}>Usa indirizzo preferito</button>
        <button type="button" className="button secondary" disabled={busy} onClick={() => { onUse(null); setCurrent({}); setMessage("Compila un altro indirizzo. Il preferito resta invariato finché non lo salvi."); }}>Inserisci un altro indirizzo</button>
        <button type="button" className="button secondary" disabled={busy} onClick={() => applySaved(true)}>Modifica indirizzo preferito</button>
        <button type="button" className="button danger" disabled={busy} onClick={() => setConfirmDelete(true)}>Elimina preferito</button>
      </div></>}
    {!saved && ready && <p>Compila il mittente qui sotto. Potrai salvarlo per i prossimi ritiri.</p>}
    {ready && complete && !matches && <div><p>{saved ? "Vuoi aggiornare il preferito con il mittente inserito?" : "Vuoi salvare questo indirizzo come indirizzo preferito?"}</p><button type="button" className="button secondary" disabled={busy || error?.status === 409} onClick={save}>{saved ? "Salva modifiche al preferito" : "Salva come indirizzo preferito"}</button><p className="muted">Facoltativo. Vengono salvati solo i dati del mittente.</p></div>}
    {confirmDelete && <div role="group" aria-label="Conferma eliminazione preferito"><p>Eliminare il preferito? Gli ordini precedenti non cambieranno.</p><div className="actions"><button type="button" className="button danger" disabled={busy} onClick={remove}>Conferma eliminazione</button><button type="button" className="button secondary" disabled={busy} onClick={() => setConfirmDelete(false)}>Mantieni preferito</button></div></div>}
    <Feedback error={error} />
    {error && <button type="button" className="button secondary" disabled={busy} onClick={reload}>Ricarica preferito</button>}
    {message && <p role="status">{message}</p>}
  </div>;
}
