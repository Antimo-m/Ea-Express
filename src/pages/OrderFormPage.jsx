import IconButton from "../components/IconButton";
import { attachBookingRules } from '../services/booking-rules';
import { request } from '../api/client';
import { contentCategories, contentLabel } from "../utils/order-content";
import Modal from "../components/Modal";
import ShippingQuote from "../components/ShippingQuote";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { createOrder, getOrder, updateOrder, reviewOrder } from "../api/shipments";
import { useApi } from "../hooks/useApi";
import SenderFields from "../components/SenderFields";
import SenderAddressPreference from "../components/SenderAddressPreference";
import { useAuth } from "../hooks/useAuth";
import { Header, Field, Feedback, State, Icon, Form } from "../components/UI";
import { today, money } from "../utils/format";
function OrderForm({ order, pickups }) {
  const bookingForm = useRef(null);
  useEffect(() => {
    let disposed = false;
    let cleanup;
    const load = () => request('/booking-rules');
    load().then(payload => { if (!disposed) cleanup = attachBookingRules(bookingForm.current, payload, order, load); }).catch(() => {
      if (!disposed) cleanup = attachBookingRules(bookingForm.current, {server_now:new Date().toISOString()}, order, load);
    });
    return () => {disposed = true; cleanup?.();};
  }, [order]);
  const [category,setCategory] = useState(order?.category || 'custom');
  const [shippingType,setShippingType] = useState(order?.shipping_type || 'regional');
  const [cancelOpen,setCancelOpen] = useState(false);
  const [review,setReview] = useState(null);
  const [zone,setZone] = useState(order?.delivery_zone || "");
  const [street,setStreet] = useState(order?.delivery_address || "");
  const [city,setCity] = useState(order?.delivery_city || '');
  const [postal,setPostal] = useState(order?.delivery_postal_code || '');
  const [province,setProvince] = useState(order?.delivery_province || '');
  const [region,setRegion] = useState(order?.delivery_region || '');
  const resolvePostal = useCallback(code => {
    if (bookingForm.current) bookingForm.current.elements.delivery_postal_code.value = code;
    setPostal(code);
  }, []);
  const [packageType,setPackageType] = useState(order?.package_type || 'standard');
  const submitting = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [senderSelection, setSenderSelection] = useState(null);
  function applySenderAddress(address) {
    setSenderSelection({ identity: address || user, key: (senderSelection?.key || 0) + 1 });
    for (const field of ["pickup_address", "pickup_city", "pickup_street_number", "pickup_postal_code"]) {
      bookingForm.current.elements[field].value = address?.[field] || "";
    }
  }
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
    } catch (failure) { setError(failure); if (failure.errors?.pickup_from || failure.errors?.pickup_date) setReview(previous => ({...previous,checkout_token:null})); }
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
    <nav className="form-progress" aria-label="Avanzamento prenotazione"><span>{review ? '1. Dati del ritiro' : <strong>1. Dati del ritiro</strong>}</span><Icon name="chevron-right"/><span>{review ? <strong>2. Riepilogo e conferma</strong> : '2. Riepilogo e conferma'}</span></nav>
    {review && <section className="panel checkout-review" aria-label="Revisione richiesta">
      <p className="eyebrow">PRIMA DELLA CONFERMA</p><h2>Controlla la richiesta</h2>
      <div className="form-grid"><div><h3>Mittente e ritiro</h3><p>{review.data.store_name || user.name}<br/>{review.data.pickup_address} {review.data.pickup_street_number}<br/>{review.data.pickup_postal_code} {review.data.pickup_city}</p><p>{review.data.pickup_date} · {review.data.pickup_from}–{review.data.pickup_to}</p></div>
      <div><h3>Destinatario e consegna</h3><p>{review.data.recipient_name}<br/>{review.data.recipient_phone}<br/>{review.data.delivery_address} {review.data.delivery_street_number}<br/>{review.data.delivery_postal_code} {review.data.delivery_city} {review.data.delivery_zone}</p></div></div>
      <p><strong>{review.data.parcel_count} colli</strong> · {review.data.package_type === 'fragile' ? 'Fragile' : review.data.package_type === 'other' ? review.data.package_description : 'Standard'} · {contentLabel(review.data)}</p>
      {review.data.customer_notes && <p>Istruzioni: {review.data.customer_notes}</p>}
      <p className="review-note"><Icon name="shield-check"/> La richiesta viene inviata solo dopo la conferma. Gli importi sono verificati dal sistema.</p><dl className="checkout-amounts"><div><dt>Valore del pacco</dt><dd>{money(review.parcel_value_cents)}</dd></div><div><dt>Costo spedizione</dt><dd>{money(review.shipping_price_cents)}</dd></div><div className="checkout-total"><dt>Totale finale</dt><dd>{money(review.total_cents)}</dd></div></dl>
      <p className="muted">Il totale somma il valore dichiarato e la spedizione. Questa conferma non esegue un pagamento e non attiva un contrassegno.</p>
      <p className="muted">{review.data.shipping_type === 'external' ? 'Fuori regione' : 'Regionale'} · Rete EA-Express · {review.quote.reason} {review.quote.delivery_time} {review.quote.delivery_days_min && `Consegna prevista in ${review.quote.delivery_days_min}–${review.quote.delivery_days_max} giorni lavorativi dal ritiro, festività escluse dalla stima.`} {review.quote.source_reference && `Fonte: ${review.quote.source_reference}`}</p>
      {!review.checkout_token && <p role="alert">Non possiamo confermare un costo affidabile. Controlla la destinazione o contatta EA Express per la tariffa.</p>}
      <Feedback error={error}/><div className="actions"><IconButton action="edit" label="Modifica richiesta" disabled={busy} onClick={()=>{setReview(null);setError(null);}} /><IconButton action="send" icon="send" label="Conferma richiesta" text loading={busy} disabled={!review.checkout_token || error?.status===409} onClick={confirm} /></div>
    </section>}
    <div hidden={Boolean(review)}><Form ref={bookingForm} errors={error?.errors} className="order-form" onSubmit={submit}>
      <div>
        <section className="panel">
          <h2>
            <span className="step">01</span> Punto di ritiro
          </h2>
          <SenderAddressPreference initial={order} formRef={bookingForm} onUse={applySenderAddress} />
          <SenderFields key={senderSelection?.key || 0} identity={senderSelection?.identity || order || user} nameField="store_name" />
          <div className="form-grid">
            {field("pickup_address", "Indirizzo di ritiro")}
            {field("pickup_city", "Città di ritiro", { maxLength: 100 })}
            {field("pickup_street_number", "Numero civico", { maxLength:20 })}
            {field("pickup_postal_code", "CAP ritiro", { pattern:"[0-9]{5}",maxLength:5,inputMode:"numeric" })}
          </div>
        </section>
        <section className="panel">
          <h2>
            <span className="step">02</span> Punto di consegna
          </h2>
          <div className="form-grid">
            <Field label="Tipo di spedizione"><select name="shipping_type" value={shippingType} onChange={event=>setShippingType(event.target.value)}><option value="regional">Regionale · Rete EA-Express</option><option value="external">Fuori regione · Rete EA-Express</option></select></Field>
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
            {field("delivery_city", "Comune di consegna", { maxLength:100,onChange:event=>setCity(event.target.value) })}
            {field("delivery_street_number", "Numero civico", {maxLength:20})}
            {field("delivery_postal_code", "CAP consegna", {required:false,help:"Compilato automaticamente se il comune ha un solo CAP.",pattern:"[0-9]{5}",maxLength:5,inputMode:"numeric",onChange:event=>setPostal(event.target.value)})}
            {field("delivery_province", "Provincia", {onChange:event=>setProvince(event.target.value),required:shippingType==='external',maxLength:100})}
            {field("delivery_region", "Regione", {onChange:event=>setRegion(event.target.value),required:shippingType==='external',maxLength:100})}
          </div>
          <ShippingQuote province={province} region={region} onPostalResolved={resolvePostal} city={city} postal={postal} zone={zone} street={street} shippingType={shippingType}/>
        </section>
        <section className="panel"><h2><span className="step">03</span> Data e orario</h2>
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
            <span className="step">04</span> Pacco e indicazioni
          </h2>
          <div className="form-grid">
            {field("parcel_value", "Valore del pacco (€)", {
              required: true,
              pattern: "[0-9]{1,6}([.,][0-9]{1,2})?",
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
              <select name="category" value={category} onChange={event=>setCategory(event.target.value)}>
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
          {category === 'custom' ? field("content_description", "Scrivi il contenuto del pacco", {
            required: true, maxLength: 255, placeholder: "Es. ricambi per automobile",
          }) : <input type="hidden" name="content_description" value=""/>}
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
      <section className="panel booking-tariff">
        <h2><span className="step">05</span> Tariffa</h2>
        <p className="muted">
          Controlla indirizzi, contatto e orario. Potrai modificare la richiesta
          fino alla presa in carico.
        </p>
        <Feedback error={error} />
        {order && error?.status === 409 && (
          <Link className="button secondary full" to={`${base}/${order.id}`}>
            Ricarica il dettaglio aggiornato
          </Link>
        )}
      </section>
      <div className="booking-final-actions">
        <IconButton icon="send" action="send" label="Invia" type="submit" text loading={busy} />
        <button type="button" className="button danger" disabled={busy} onClick={()=>setCancelOpen(true)}><Icon name="trash"/> Annulla</button>
      </div>
    </Form></div>
    <Modal open={cancelOpen} title="Annullare la richiesta?" description="I dati inseriti in questa prenotazione andranno persi." danger onClose={()=>setCancelOpen(false)}>
      <footer className="modal-actions">
        <button type="button" className="button modal-back" onClick={()=>setCancelOpen(false)}><Icon name="arrow-left"/> Continua compilazione</button>
        <button type="button" className="button danger" onClick={()=>{bookingForm.current?.reset();setReview(null);setError(null);setCancelOpen(false);navigate('/dashboard',{replace:true});}}><Icon name="trash"/> Conferma annullamento</button>
      </footer>
    </Modal></>
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
