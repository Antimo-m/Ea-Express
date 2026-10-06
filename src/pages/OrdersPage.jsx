import FilterToolbar from "../components/FilterToolbar";
import IconButton from "../components/IconButton";
import { useSearchParams } from "react-router";
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
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries([...params].filter(([key]) => ["q","status","from","to","shipping_type","sender_type","has_messages","page"].includes(key)));
  const resource = useApi(listOrders, {
    ...values,
    ...(pickups ? { kind: "pickup" } : {}),
    ...(messages ? { has_messages: values.has_messages || "0" } : {}),
  }, true);
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
        <IconButton action="add" to={pickups ? "/pickups/new" : "/shipments/new"} label={pickups ? "Programma ritiro" : "Nuova spedizione"} />
      </Header>
      <section className="panel flush">
        <FilterToolbar key={params.toString()} count={Object.entries(values).filter(([key,value]) => key !== 'page' && key !== 'q' && value && !(key === 'has_messages' && value === '0')).length}
          onApply={setParams} onReset={() => setParams({})}
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
                onPage={(page) => setParams({ ...values, page })}
              />
            </>
          )}
        </State>
      </section>
    </>
  );
}
