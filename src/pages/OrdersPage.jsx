import { Link, useSearchParams } from "react-router";
import { listOrders } from "../api/shipments";
import { useApi } from "../hooks/useApi";
import {
  Header,
  Icon,
  State,
  OrderList,
  Pagination,
  Field,
} from "../components/UI";
import { statuses } from "../utils/format";
export default function OrdersPage({ pickups = false, messages = false }) {
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries(params);
  const resource = useApi(listOrders, {
    ...values,
    ...(pickups ? { kind: "pickup" } : {}),
    ...(messages ? { has_messages: values.has_messages || "0" } : {}),
  }, true);
  const base = pickups ? "/pickups" : messages ? "/messages" : "/shipments";
  function filter(event) {
    event.preventDefault();
    setParams(
      Object.fromEntries(
        [...new FormData(event.currentTarget)].filter(([, value]) => value),
      ),
    );
  }
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
              ? "Scegli una spedizione per leggere o inviare un messaggio al corriere."
              : "Ogni richiesta, dal tuo negozio a destinazione."
        }
      >
        <Link

          to={pickups ? "/pickups/new" : "/shipments/new"}
         className="button create-button" aria-label={pickups ? "Programma ritiro" : "Nuova spedizione"} title={pickups ? "Programma ritiro" : "Nuova spedizione"}><span aria-hidden="true">+</span></Link>
      </Header>
      <section className="panel flush">
        <form className="filters" onSubmit={filter} key={params.toString()}>
          {values.courier && (
            <input type="hidden" name="courier" value={values.courier} />
          )}
          {messages && (
            <Field label="Conversazioni">
              <select
                name="has_messages"
                defaultValue={values.has_messages || "0"}
              >
                <option value="0">Tutte le spedizioni</option>
                <option value="1">Con messaggi</option>
              </select>
            </Field>
          )}
          <Field
            label="Cerca"
            name="q"
            placeholder="Riferimento, destinatario, città"
            defaultValue={values.q || ""}
          />
          <Field label="Tipo mittente"><select name="sender_type" defaultValue={values.sender_type || ""}><option value="">Tutti</option><option value="business">Attività commerciale</option><option value="private">Privato</option><option value="online_shop">Shop online</option></select></Field><Field label="Stato">
            <select name="status" defaultValue={values.status || ""}>
              <option value="">Tutti gli stati</option>
              {Object.entries(statuses).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Ritiro dal"
            name="from"
            type="date"
            defaultValue={values.from || ""}
          />
          <Field
            label="Al"
            name="to"
            type="date"
            defaultValue={values.to || ""}
          />
          <button className="button secondary">
            <Icon name="search" />
            Filtra
          </button>
          {params.size > 0 && (
            <button
              type="button"
              className="text-button"
              onClick={() => setParams({})}
            >
              Azzera
            </button>
          )}
        </form>
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
