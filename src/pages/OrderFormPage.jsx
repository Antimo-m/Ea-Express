import { contentCategories } from "../utils/order-content";
import ShippingQuote from "../components/ShippingQuote";
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { createOrder, getOrder, updateOrder, reviewOrder } from "../api/shipments";
import { useApi } from "../hooks/useApi";
import SenderFields from "../components/SenderFields";
import { useAuth } from "../hooks/useAuth";
import { Header, Field, Feedback, State, Icon, Form } from "../components/UI";
import { today, money } from "../utils/format";
function OrderForm({ order, pickups }) {
  const [review,setReview] = useState(null);
  const [zone,setZone] = useState(order?.delivery_zone || "");
  const [street,setStreet] = useState(order?.delivery_address || "");
  const [city,setCity] = useState(order?.delivery_city || '');
  const [postal,setPostal] = useState(order?.delivery_postal_code || '');
  const [packageType,setPackageType] = useState(order?.package_type || 'standard');
  const submitting = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const base = pickups ? "/pickups" : "/shipments";
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (order?.delivery_window && !/^\d{2}:\d{2}$/.test(order.delivery_window) && !data.delivery_window) data.delivery_window = order.delivery_window;
    data.parcel_count = Number(data.parcel_count);


    try {
      const result = await reviewOrder(order ? {...data,version:order.version} : data,order?.id);
      setReview(result);
      window.scrollTo({top:0,behavior:"smooth"});
    } catch (error) {
      setError(error);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  async function confirm() {
    if (submitting.current || !review?.checkout_token) return;
    submitting.current = true; setBusy(true); setError(null);
    try {
      const data = {...review.data,checkout_token:review.checkout_token};
      const result = order ? await updateOrder(order.id,data) : await createOrder(data);
      navigate(`${base}/${result.data.id}`, {replace:true,state:{success:order ? "Richiesta aggiornata." : "Richiesta confermata e inviata ai rider."}});
    } catch (failure) { setError(failure); }
    finally { submitting.current=false; setBusy(false); }
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
    <>
    {review && <section className="panel checkout-review" aria-label="Revisione richiesta">
      <p className="eyebrow">PRIMA DELLA CONFERMA</p><h2>Controlla la richiesta</h2>
      <div className="form-grid"><div><h3>Mittente e ritiro</h3><p>{review.data.store_name || user.name}<br/>{review.data.pickup_address} {review.data.pickup_street_number}<br/>{review.data.pickup_postal_code} {review.data.pickup_city}</p><p>{review.data.pickup_date} · {review.data.pickup_from}–{review.data.pickup_to}</p></div>
      <div><h3>Destinatario e consegna</h3><p>{review.data.recipient_name}<br/>{review.data.recipient_phone}<br/>{review.data.delivery_address} {review.data.delivery_street_number}<br/>{review.data.delivery_postal_code} {review.data.delivery_city} {review.data.delivery_zone}</p><p>{review.data.delivery_window && `Preferenza: ${review.data.delivery_window}`}</p></div></div>
      <p><strong>{review.data.parcel_count} colli</strong> · {review.data.package_type === 'fragile' ? 'Fragile' : review.data.package_type === 'other' ? review.data.package_description : 'Standard'} · {contentCategories[review.data.category]} {review.data.content_description}</p>
      {review.data.customer_notes && <p>Istruzioni: {review.data.customer_notes}</p>}
      <p>Metodo di pagamento: {{cash:'Contanti',card:'Carta tramite POS',bank_transfer:'Bonifico',other:'Altro'}[review.data.payment_method]}</p>
      <dl className="checkout-amounts"><div><dt>Valore del pacco</dt><dd>{money(review.parcel_value_cents)}</dd></div><div><dt>Costo spedizione</dt><dd>{money(review.shipping_price_cents)}</dd></div><div className="checkout-total"><dt>Totale finale</dt><dd>{money(review.total_cents)}</dd></div></dl>
      <p className="muted">Il totale somma il valore dichiarato e la spedizione. Questa conferma non esegue un pagamento e non attiva un contrassegno.</p>
      <p className="muted">{review.quote.reason} {review.quote.delivery_time} {review.quote.source_reference && `Fonte: ${review.quote.source_reference}`}</p>
      {!review.checkout_token && <p role="alert">Non possiamo confermare un costo affidabile. Controlla la destinazione o contatta EA Express per la tariffa.</p>}
      <Feedback error={error}/><div className="actions"><button className="button secondary" disabled={busy} onClick={()=>{setReview(null);setError(null);}}>Indietro / Modifica</button><button className="button" disabled={busy || !review.checkout_token || error?.status===409} onClick={confirm}>{busy ? 'Conferma in corso…' : 'Conferma richiesta'}</button></div>
    </section>}
    <div hidden={Boolean(review)}><Form errors={error?.errors} className="order-form" onSubmit={submit}>
      <div>
        <section className="panel">
          <h2>
            <span className="step">01</span> Mittente e ritiro
          </h2>
          <SenderFields identity={order || user} nameField="store_name" />
          <div className="form-grid">
            {field("pickup_address", "Indirizzo di ritiro")}
            {field("pickup_city", "Città di ritiro", { maxLength: 100 })}
            {field("pickup_street_number", "Numero civico", { maxLength:20 })}
            {field("pickup_postal_code", "CAP ritiro", { pattern:"[0-9]{5}",maxLength:5,inputMode:"numeric" })}
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
            {field("delivery_address", "Indirizzo di consegna",{onChange:event=>setStreet(event.target.value)})}
            {field("delivery_zone","Zona / quartiere (facoltativo)",{required:false,maxLength:100,onChange:event=>setZone(event.target.value)})}
            {field("delivery_city", "Città di consegna", { maxLength:100,onChange:event=>setCity(event.target.value) })}
            {field("delivery_street_number", "Numero civico", {maxLength:20})}
            {field("delivery_postal_code", "CAP consegna", {pattern:"[0-9]{5}",maxLength:5,inputMode:"numeric",onChange:event=>setPostal(event.target.value)})}
            {field(
              "delivery_window",
              "Preferenza oraria di consegna (facoltativa)",
              {
                required: false,
                type: "time",
                step: 60,
                defaultValue: /^\d{2}:\d{2}$/.test(order?.delivery_window || "") ? order.delivery_window : "",
                help: order?.delivery_window && !/^\d{2}:\d{2}$/.test(order.delivery_window) ? `Preferenza precedente: ${order.delivery_window}. Seleziona un orario per sostituirla.` : "Orario indicativo, da confermare con il corriere.",
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
                {Object.entries(contentCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
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
          {field("content_description", "Descrivi il contenuto (facoltativo)", {
            required: false,
            maxLength: 255,
            placeholder: "Es. campioni di tessuto, ceramiche artigianali…",
            help: "Puoi specificare il contenuto di qualsiasi categoria oppure scegliere Altro.",
          })}
          <div className="form-grid">{field("parcel_count","Numero colli",{type:"number",min:1,max:100,defaultValue:order?.parcel_count||1})}<Field label="Caratteristiche del pacco"><select name="package_type" value={packageType} onChange={event=>setPackageType(event.target.value)}><option value="standard">Standard</option><option value="fragile">Fragile</option><option value="other">Altro</option></select></Field></div>{packageType==='other' && field("package_description","Descrizione caratteristiche",{maxLength:255})}
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
        <Field label="Metodo di pagamento"><select name="payment_method" defaultValue={order?.payment?.method || ''} required><option value="">Seleziona il metodo</option><option value="cash">Contanti</option><option value="card">Carta tramite POS</option><option value="bank_transfer">Bonifico</option><option value="other">Altro</option></select></Field>
        <ShippingQuote city={city} postal={postal} zone={zone} street={street}/><Feedback error={error} />
        {order && error?.status === 409 && (
          <Link className="button secondary full" to={`${base}/${order.id}`}>
            Ricarica il dettaglio aggiornato
          </Link>
        )}
        <button className="button full" disabled={busy}>
          {busy
            ? "Invio in corso…"
            : order
              ? "Rivedi modifiche"
              : "Rivedi richiesta"}
          <Icon name="arrow-right" />
        </button>
        <Link className="cancel-link" to={order ? `${base}/${order.id}` : base}>
          Annulla
        </Link>
      </aside>
    </Form></div></>
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
