import { useState } from "react";
import { useNavigate } from "react-router";
import Modal from "./Modal";
import IconButton from "./IconButton";
import { Field, Icon } from "./UI";
import { getLabels, labelParams } from "../api/shipments";
import { date } from "../utils/format";

/** Limite già applicato dall'API alla stampa per codici (`ids[]`); la giornata intera usa un'altra richiesta. */
const MAX_SELECTED = 100;
const empty = "Al momento non ci sono ordini da stampare";
const labelsCount = count => `${count} ${count === 1 ? "etichetta selezionata" : "etichette selezionate"}`;

/**
 * Scelta delle etichette da stampare: una spedizione della pagina oppure gli ordini di una giornata,
 * selezionabili uno per uno. La giornata viene caricata per intero, quindi la selezione non dipende
 * dalla paginazione dell'elenco; la chiusura non cambia pagina né modifica gli ordini.
 */
export default function LabelSelectionModal({ open, onClose, printable, filters }) {
  const navigate = useNavigate();
  const [day, setDay] = useState("");
  const [single, setSingle] = useState("");
  const [dayOrders, setDayOrders] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const daySelection = { ...filters, page: undefined, scope: "filtered", day };

  function close() {
    setDay(""); setSingle(""); setDayOrders(null); setSelected(new Set()); setMessage("");
    onClose();
  }
  async function checkDay() {
    if (!day || checking) return;
    setChecking(true); setMessage(""); setSingle("");
    try {
      const result = await getLabels({ ...daySelection, preview: 1 });
      const orders = [...new Map((result.orders || []).map(order => [order.slug, order])).values()];
      setDayOrders({ day, orders });
      setSelected(new Set(orders.map(order => order.slug)));
      if (!orders.length) setMessage(empty);
    } catch (error) {
      setDayOrders(null); setSelected(new Set()); setMessage(error.message);
    } finally {
      setChecking(false);
    }
  }
  function toggle(slug) {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }
  function print(ids) {
    if (!ids.length) { setMessage("Seleziona almeno un’etichetta da stampare."); return; }
    if (ids.length > MAX_SELECTED) { setMessage(`Puoi stampare fino a ${MAX_SELECTED} etichette selezionate per volta. Per l’intera giornata usa «Stampa tutta la giornata».`); return; }
    navigate(`/shipments/labels?${labelParams({ ids })}`);
  }

  const orders = dayOrders?.orders || [];
  const status = single ? labelsCount(1) : dayOrders && orders.length ? `${labelsCount(selected.size)} su ${orders.length} ${orders.length === 1 ? "ordine" : "ordini"}` : "Nessuna etichetta selezionata";
  return (
    <Modal open={open} title="Scegli le etichette da stampare" description="I filtri attivi vengono mantenuti. Scegli una giornata e seleziona gli ordini, oppure una sola spedizione." onClose={close}>
      <div className="modal-content-area label-picker">
        <div className="label-picker-fields">
          <Field label="Giornata di ritiro" name="print_day" type="date" value={day} onChange={event => { setDay(event.target.value); setSingle(""); setDayOrders(null); setSelected(new Set()); setMessage(""); }} />
          <Field label="Oppure scegli una spedizione">
            <select className="label-picker-select" value={single} onChange={event => { setSingle(event.target.value); setDay(""); setDayOrders(null); setSelected(new Set()); setMessage(""); }}>
              <option value="">Seleziona dalla pagina</option>
              {printable.map(order => <option key={order.slug} value={order.slug}>{order.reference} · {order.recipient_name}</option>)}
            </select>
          </Field>
        </div>
        <div className="label-picker-check">
          <IconButton action="search" label={checking ? "Verifica della giornata in corso" : "Verifica giornata"} loading={checking} disabled={!day} onClick={checkDay} />
        </div>
        <p className="label-picker-status" role="status" aria-live="polite">{status}</p>
        {orders.length > 0 && (
          <fieldset className="label-picker-day">
            <legend>Ordini del {date(dayOrders.day)}</legend>
            <div className="label-picker-bulk">
              <button type="button" className="button secondary" disabled={selected.size === orders.length} onClick={() => setSelected(new Set(orders.map(order => order.slug)))}><Icon name="check2-all" /> Seleziona tutti</button>
              <button type="button" className="button secondary" disabled={!selected.size} onClick={() => setSelected(new Set())}><Icon name="x-lg" /> Deseleziona tutti</button>
            </div>
            <ul className="label-picker-list">
              {orders.map(order => (
                <li key={order.slug}>
                  <label className={`label-pick${selected.has(order.slug) ? " is-selected" : ""}`}>
                    <input type="checkbox" checked={selected.has(order.slug)} onChange={() => toggle(order.slug)} />
                    <span className="label-pick-check" aria-hidden="true"><Icon name="check-lg" /></span>
                    <span className="label-pick-body">
                      <span className="label-pick-heading"><strong>{order.reference}</strong>{order.pickup_from && <small>{order.pickup_from}–{order.pickup_to}</small>}</span>
                      <span className="label-pick-party"><small>Mittente</small><b>{order.store_name}</b><span>{order.pickup}</span></span>
                      <span className="label-pick-party"><small>Destinatario</small><b>{order.recipient_name}</b><span>{order.delivery}</span></span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}
        {message && <p className="label-picker-message" role="alert">{message}</p>}
      </div>
      <footer className="modal-actions label-picker-actions">
        <button type="button" className="button danger label-picker-cancel" onClick={close}><Icon name="x-circle" /> Annulla selezione</button>
        {orders.length > 0 && <button type="button" className="button secondary" onClick={() => navigate(`/shipments/labels?${labelParams(daySelection)}`)}><Icon name="calendar-check" /> Stampa tutta la giornata</button>}
        <button type="button" className="button" aria-disabled={!(single || selected.size)} onClick={() => print(single ? [single] : [...selected])}><Icon name="printer" /> Stampa selezione</button>
      </footer>
    </Modal>
  );
}
