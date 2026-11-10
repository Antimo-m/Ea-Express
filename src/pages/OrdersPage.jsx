import DataPanel from "../components/DataPanel";
import FilterToolbar from "../components/FilterToolbar";
import IconButton from "../components/IconButton";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getLabels, labelParams, listOrders } from "../api/shipments";
import { useApi } from "../hooks/useApi";
import {
  Header,
  State,
  OrderList,
  Pagination,
  Field,
} from "../components/UI";
import { statuses } from "../utils/format";
export default function OrdersPage({ pickups = false, messages = false }) {
  const [printMessage, setPrintMessage] = useState("");
  const [printing, setPrinting] = useState(false);
  const [printDay, setPrintDay] = useState("");
  const [printOrder, setPrintOrder] = useState("");
  const [selectionCount, setSelectionCount] = useState(null);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries([...params].filter(([key]) => ["q","status","from","to","shipping_type","sender_type","has_messages","page"].includes(key)));
  const resource = useApi(listOrders, {
    ...values,
    ...(pickups ? { kind: "pickup" } : {}),
    ...(messages ? { has_messages: values.has_messages || "0" } : {}),
  }, true);
  const printable = resource.data?.data?.filter(order => order.can_print !== false && order.parcel_count > 0) || [];
  const selection = printOrder ? {ids: [printOrder]} : {...values, page: undefined, ...(pickups ? {kind: 'pickup'} : {}), scope: 'filtered', day: printDay};
  const selectionKey = labelParams(selection).toString();
  const verifiedCount = printOrder ? 1 : selectionCount?.key === selectionKey ? selectionCount.count : null;
  async function checkSelection() {
    if (!printDay || checking) return;
    setChecking(true); setPrintMessage("");
    try {
      const result = await getLabels({...selection, preview: 1});
      setSelectionCount({key: selectionKey, count: result.count});
      if (!result.count) setPrintMessage("Al momento non ci sono ordini da stampare");
    } catch (error) { setPrintMessage(error.message); setSelectionCount(null); }
    finally { setChecking(false); }
  }
  function changeFilters(next) { setPrinting(false); setSelectionCount(null); setPrintOrder(""); setPrintDay(""); setParams(next); }
  const base = pickups ? "/pickups" : messages ? "/messages" : "/shipments";
  return (
    <>
      <Header
        title={
          pickups
            ? "Ritiri"
            : messages
              ? "Parliamone, direttamente."
              : "Le tue spedizioni"
        }
        description={
          pickups
            ? "Organizza i ritiri ancora da effettuare."
            : messages
              ? "Scegli una spedizione per leggere o inviare un messaggio al rider."
              : "Ogni richiesta, dal tuo negozio a destinazione."
        }
      >
        {!messages && <IconButton action="print-multiple" label="Stampa etichette" aria-disabled={!printable.length} onClick={() => { if (!printable.length) { setPrintMessage("Al momento non ci sono ordini da stampare"); return; } setPrinting(true); setPrintMessage(""); }} />}
        <IconButton action="add" to={pickups ? "/pickups/new" : "/shipments/new"} label={pickups ? "Programma ritiro" : "Nuova spedizione"} />
      </Header>
      {printMessage && <p className="muted small" role="status">{printMessage}</p>}
      {printing && <section className="panel label-selection" aria-label="Selezione etichette">
        <h2>Scegli le etichette da stampare</h2><p>I filtri attivi vengono mantenuti. Puoi stampare una giornata intera, incluse le altre pagine, oppure una sola spedizione.</p>
        <div className="label-selection-fields">
          <Field label="Giornata di ritiro" name="print_day" type="date" value={printDay} onChange={event => { setPrintDay(event.target.value); setPrintOrder(""); setSelectionCount(null); }} />
          <button className="button secondary" type="button" disabled={!printDay || checking} onClick={checkSelection}>{checking ? 'Verifica…' : 'Verifica giornata'}</button>
          <Field label="Oppure scegli una spedizione"><select value={printOrder} onChange={event => { setPrintOrder(event.target.value); setPrintDay(""); setSelectionCount(null); }}><option value="">Seleziona dalla pagina</option>{printable.map(order => <option key={order.slug} value={order.slug}>{order.reference} · {order.recipient_name}</option>)}</select></Field>
        </div>
        <p role="status">{verifiedCount === null ? 'Nessuna etichetta selezionata' : `${verifiedCount} etichette selezionate${printDay ? ` · ${printDay}` : ''}`}</p>
        <div className="actions action-pair"><button className="button secondary" type="button" onClick={() => { setPrinting(false); setSelectionCount(null); setPrintOrder(""); setPrintDay(""); }}>Annulla selezione</button><button className="button" type="button" aria-disabled={!verifiedCount} onClick={() => { if (!verifiedCount) { setPrintMessage("Al momento non ci sono ordini da stampare"); return; } navigate(`/shipments/labels?${labelParams(selection)}`); }}>Conferma stampa</button></div>
      </section>}
      <DataPanel title={messages ? "Conversazioni per spedizione" : pickups ? "Ritiri programmati" : "Registro spedizioni"} description={messages ? "Apri una spedizione per ritrovare il confronto con il rider." : "Stato, percorso e fascia di ritiro per ogni richiesta."} className="orders-register data-panel--flush" count={resource.data?.meta?.total}>
        <FilterToolbar key={params.toString()} count={Object.entries(values).filter(([key,value]) => key !== 'page' && key !== 'q' && value && !(key === 'has_messages' && value === '0')).length}
          onApply={changeFilters} onReset={() => changeFilters({})}
          search={<Field label="Cerca" name="q" placeholder="Cerca ordine, destinatario o città…" defaultValue={values.q || ""} maxLength={100} />}
          primary={<Field label="Stato"><select name="status" defaultValue={values.status || ""}><option value="">Tutti gli stati</option>{Object.entries(statuses).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></Field>}
          secondary={<>
            <Field label="Ritiro dal" name="from" type="date" defaultValue={values.from || ""}/>
            <Field label="Al" name="to" type="date" defaultValue={values.to || ""}/>
            <Field label="Servizio"><select name="shipping_type" defaultValue={values.shipping_type || ""}><option value="">Tutti</option><option value="regional">Regionali</option><option value="external">Fuori regione</option></select></Field>
            <Field label="Tipo mittente"><select name="sender_type" defaultValue={values.sender_type || ""}><option value="">Tutti</option><option value="private">Privato</option><option value="business">Attività commerciale</option><option value="online_shop">Shop online</option></select></Field>
            {messages && <Field label="Conversazioni"><select name="has_messages" defaultValue={values.has_messages || "0"}><option value="0">Tutte le spedizioni</option><option value="1">Con messaggi</option></select></Field>}
          </>}/>
        <State resource={resource}>
          {(data) => (
            <>
              <OrderList orders={data.data} base={base} messages={messages} />
              <Pagination
                meta={data.meta}
                onPage={(page) => changeFilters({ ...values, page })}
              />
            </>
          )}
        </State>
      </DataPanel>
    </>
  );
}
