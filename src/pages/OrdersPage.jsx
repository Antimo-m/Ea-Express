import DataPanel from "../components/DataPanel";
import FilterToolbar from "../components/FilterToolbar";
import IconButton from "../components/IconButton";
import { useState } from "react";
import { useSearchParams } from "react-router";
import LabelSelectionModal from "../components/LabelSelectionModal";
import { listOrders } from "../api/shipments";
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
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries([...params].filter(([key]) => ["q","status","from","to","shipping_type","has_messages","page"].includes(key)));
  const resource = useApi(listOrders, {
    ...values,
    ...(pickups ? { kind: "pickup" } : {}),
    // «Da leggere» chiede all'API le sole conversazioni con messaggi ricevuti e non ancora letti.
    ...(messages ? (values.has_messages === "unread" ? { has_messages: "1", unread_messages: "1" } : { has_messages: values.has_messages || "0" }) : {}),
  }, true);
  const printable = resource.data?.data?.filter(order => order.can_print !== false && order.parcel_count > 0) || [];
  function changeFilters(next) { setPrinting(false); setParams(next); }
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
      {printing && <LabelSelectionModal open onClose={() => setPrinting(false)} printable={printable} filters={{...values, ...(pickups ? {kind: 'pickup'} : {})}} />}
      <DataPanel title={messages ? "Conversazioni per spedizione" : pickups ? "Ritiri programmati" : "Registro spedizioni"} description={messages ? "Apri una spedizione per ritrovare il confronto con il rider." : "Stato, percorso e fascia di ritiro per ogni richiesta."} className="orders-register data-panel--flush" count={resource.data?.meta?.total}>
        <FilterToolbar key={params.toString()} count={Object.entries(values).filter(([key,value]) => key !== 'page' && key !== 'q' && value && !(key === 'has_messages' && value === '0')).length}
          onApply={changeFilters} onReset={() => changeFilters({})}
          search={<Field label="Cerca" name="q" placeholder="Cerca ordine, destinatario o città…" defaultValue={values.q || ""} maxLength={100} />}
          primary={<Field label="Stato"><select name="status" defaultValue={values.status || ""}><option value="">Tutti gli stati</option>{Object.entries(statuses).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></Field>}
          secondary={<>
            <Field label="Ritiro dal" name="from" type="date" defaultValue={values.from || ""}/>
            <Field label="Al" name="to" type="date" defaultValue={values.to || ""}/>
            <Field label="Servizio"><select name="shipping_type" defaultValue={values.shipping_type || ""}><option value="">Tutti</option><option value="regional">Regionali</option><option value="external">Fuori regione</option></select></Field>
            {messages && <Field label="Conversazioni"><select name="has_messages" defaultValue={values.has_messages || "0"}><option value="0">Tutte le spedizioni</option><option value="1">Con messaggi</option><option value="unread">Da leggere</option></select></Field>}
          </>}/>
        <State resource={resource}>
          {(data) => (
            <>
              <OrderList orders={data.data} base={base} messages={messages} empty={messages && values.has_messages === "unread" && !values.q ? { title: "Nessuna conversazione da leggere per ora.", text: "Quando il rider o EA-Express ti scrivono, le nuove risposte compariranno qui.", icon: "check2-all" } : undefined} firstRun={!messages && !Object.entries(values).some(([key, value]) => key !== "page" && value)} />
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
