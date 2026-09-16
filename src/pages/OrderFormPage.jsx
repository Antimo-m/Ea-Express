import PackageFields from "../components/PackageFields";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { createOrder, getOrder, updateOrder } from "../api/shipments";
import { useApi } from "../hooks/useApi";
import SenderFields from "../components/SenderFields";
import { useAuth } from "../hooks/useAuth";
import { Header, Field, Feedback, State, Icon, Form } from "../components/UI";
import { today } from "../utils/format";
function OrderForm({ order, pickups }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const base = pickups ? "/pickups" : "/shipments";
  async function submit(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.parcel_count = Number(data.parcel_count);
    data.packages = JSON.parse(data.packages);
    Object.keys(data).filter(key => key.startsWith("packages.")).forEach(key => delete data[key]);
    try {
      const result = order
        ? await updateOrder(order.id, { ...data, version: order.version })
        : await createOrder(data);
      navigate(`${base}/${result.data.id}`, {
        replace: true,
        state: {
          success: order
            ? "Richiesta aggiornata."
            : "Richiesta inviata. I rider possono ora prenderla in carico.",
        },
      });
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  const field = (name, label, extra = {}) => (
    <Field
      name={name}
      label={label}
      defaultValue={order?.[name] ?? ""}
      required
      maxLength={255}
      {...extra}
    />
  );
  if (order && !order.can_edit)
    return (
      <div className="panel">
        <h2>La richiesta è già in lavorazione</h2>
        <p>
          Contatta il corriere dalla spedizione per concordare eventuali
          variazioni.
        </p>
        <Link className="button" to={`${base}/${order.id}`}>
          Apri spedizione
        </Link>
      </div>
    );
  return (
    <Form errors={error?.errors} className="order-form" onSubmit={submit}>
      <div>
        <section className="panel">
          <h2>
            <span className="step">01</span> Mittente e ritiro
          </h2>
          <SenderFields identity={order || user} nameField="store_name" />
          <div className="form-grid">
            {field("pickup_address", "Indirizzo di ritiro")}
            {field("pickup_city", "Città di ritiro", { maxLength: 100 })}
          </div>
          <div className="form-grid">
            {field("pickup_date", "Data del ritiro", {
              type: "date",
              min: today(),
              defaultValue: order?.pickup_date || today(),
            })}
            <div className="form-grid">
              {field("pickup_from", "Dalle", {
                type: "time",
                defaultValue: order?.pickup_from || "09:00",
              })}
              {field("pickup_to", "Alle", {
                type: "time",
                defaultValue: order?.pickup_to || "12:00",
              })}
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>
            <span className="step">02</span> A chi consegniamo
          </h2>
          <div className="form-grid">
            {field("recipient_name", "Nome destinatario", { maxLength: 150 })}
            {field("recipient_phone", "Telefono destinatario", {
              type: "tel",
              maxLength: 30,
              minLength: 6,
            })}
          </div>
          <div className="form-grid">
            {field("delivery_address", "Indirizzo di consegna")}
            {field("delivery_city", "Città di consegna", { maxLength: 100 })}
            {field(
              "delivery_window",
              "Preferenza oraria di consegna (facoltativa)",
              {
                required: false,
                maxLength: 150,
                placeholder: "Es. nel pomeriggio",
              },
            )}
          </div>
        </section>
        <section className="panel">
          <h2>
            <span className="step">03</span> Cosa spediamo
          </h2>
          <div className="form-grid">
            {field("parcel_value", "Valore merce (€)", {
              required: false,
              inputMode: "decimal",
              placeholder: "0,00",
              maxLength: 9,
              defaultValue:
                order?.parcel_value_cents != null
                  ? (order.parcel_value_cents / 100).toFixed(2)
                  : "",
              help: "Valore dichiarato del contenuto. Non è il costo di spedizione né un importo da riscuotere.",
            })}
            <Field label="Contenuto">
              <select name="category" defaultValue={order?.category || "other"}>
                <option value="other">Altro</option>
                <option value="clothing">Abbigliamento</option>
                <option value="documents">Documenti</option>
              </select>
            </Field>
            <Field label="Priorità">
              <select
                name="urgency"
                defaultValue={order?.urgency || "standard"}
              >
                <option value="standard">Standard</option>
                <option value="urgent">Urgente</option>
              </select>
            </Field>
          </div>
          <PackageFields order={order} />
          <Field label="Istruzioni per il corriere (facoltative)">
            <textarea
              name="customer_notes"
              defaultValue={order?.customer_notes || ""}
              maxLength={2000}
              rows={4}
              placeholder="Citofono, punto di ritiro, informazioni utili…"
            />
          </Field>
        </section>
      </div>
      <aside className="panel form-summary">
        <h2>{order ? "Salva la richiesta" : "Invia ai rider"}</h2>
        <p className="muted">
          Controlla indirizzi, contatto e orario. Potrai modificare la richiesta
          fino alla presa in carico.
        </p>
        <Feedback error={error} />
        {error?.status === 409 && (
          <Link className="button secondary full" to={`${base}/${order.id}`}>
            Ricarica il dettaglio aggiornato
          </Link>
        )}
        <button className="button full" disabled={busy}>
          {busy
            ? "Invio in corso…"
            : order
              ? "Salva modifiche"
              : "Invia richiesta"}
          <Icon name="arrow-right" />
        </button>
        <Link className="cancel-link" to={order ? `${base}/${order.id}` : base}>
          Annulla
        </Link>
      </aside>
    </Form>
  );
}
function EditForm({ id, pickups }) {
  const resource = useApi(getOrder, { id });
  return (
    <State resource={resource}>
      {(data) => (
        <OrderForm
          key={data.data.version}
          order={data.data}
          pickups={pickups}
        />
      )}
    </State>
  );
}
export default function OrderFormPage({ pickups = false }) {
  const { id } = useParams();
  return (
    <>
      <Header
        eyebrow="ORGANIZZIAMO LA PROSSIMA PARTENZA"
        title={
          id
            ? "Modifica richiesta"
            : pickups
              ? "Programma un ritiro"
              : "Nuova spedizione"
        }
        description="Bastano gli indirizzi, un orario e qualche dettaglio."
      />
      {id ? (
        <EditForm id={id} pickups={pickups} />
      ) : (
        <OrderForm pickups={pickups} />
      )}
    </>
  );
}
