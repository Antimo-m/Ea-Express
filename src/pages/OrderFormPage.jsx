import IconButton from "../components/IconButton";
import { attachBookingRules } from '../services/booking-rules';
import { request } from '../api/client';
import { contentCategories } from "../utils/order-content";
import Modal from "../components/Modal";
import CheckoutReview from "../components/CheckoutReview";
import ShippingQuote from "../components/ShippingQuote";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { createOrder, getOrder, updateOrder, reviewOrder } from "../api/shipments";
import { useApi } from "../hooks/useApi";
import SenderFields from "../components/SenderFields";
import SenderAddressPreference from "../components/SenderAddressPreference";
import { useAuth } from "../hooks/useAuth";
import { Header, Field, Feedback, State, Icon, Form } from "../components/UI";
import { today } from "../utils/format";
function OrderForm({ order, pickups }) {
  const bookingForm = useRef(null);
  const senderPreference = useRef(null);
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
  const applySenderAddress = useCallback(address => {
    for (const field of ["pickup_address", "pickup_city", "pickup_street_number", "pickup_postal_code"]) {
      bookingForm.current.elements[field].value = address?.[field] || "";
    }
  }, []);
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
      const result = await reviewOrder(order ? {...data,version:order.version} : data,order?.slug);
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
      const result = order ? await updateOrder(order.slug,data) : await createOrder(data);
      await senderPreference.current?.offerSave(review.data, review.checkout_token);
      navigate(`${base}/${result.data.slug}`, {replace:true,state:{success:order ? "Richiesta aggiornata." : "Richiesta confermata e inviata ai rider."}});
    } catch (failure) { setError(failure); if (failure.errors?.pickup_from || failure.errors?.pickup_date) setReview(previous => ({...previous,checkout_token:null})); }
    finally { submitting.current=false; setBusy(false); }
  }
  const fieldWidths = {
    pickup_address: 'address', pickup_street_number: 'civic', pickup_postal_code: 'postal', pickup_city: 'city',
    delivery_address: 'address', delivery_street_number: 'civic', delivery_postal_code: 'postal', delivery_city: 'city',
    delivery_zone: 'zone', delivery_province: 'province', delivery_region: 'region',
    recipient_name: 'name', content_description: 'description', package_description: 'description',
  };
  const field = (name, label, extra = {}) => (
    <Field
      name={name}
      width={fieldWidths[name]}
      label={label}
      defaultValue={order?.[name] ?? ""}
      required
      maxLength={255}
      {...extra}
    />
  );
  if (!["private", "business", "online_shop"].includes(user.sender_type)) {
    return <section className="panel"><h2>Completa i dati del mittente</h2><p>Seleziona la tua tipologia nel profilo prima di programmare un ritiro.</p><Link className="button" to="/profile">Completa il profilo</Link></section>;
  }
  if (order && !order.can_edit)
    return (
      <div className="panel">
        <h2>La richiesta è già in lavorazione</h2>
        <p>
          Contatta il rider dalla spedizione per concordare eventuali
          variazioni.
        </p>
        <Link className="button" to={`${base}/${order.slug}`}>
          Apri spedizione
        </Link>
      </div>
    );
  return (
    <>
    <nav className="form-progress" aria-label="Avanzamento prenotazione"><span>{review ? '1. Dati del ritiro' : <strong>1. Dati del ritiro</strong>}</span><Icon name="chevron-right"/><span>{review ? <strong>2. Riepilogo e conferma</strong> : '2. Riepilogo e conferma'}</span></nav>
    {review && <CheckoutReview review={review} user={user} busy={busy} error={error} onBack={() => { setReview(null); setError(null); }} onConfirm={confirm} />}
    <div hidden={Boolean(review)}><Form ref={bookingForm} errors={error?.errors} className="order-form booking-form" onSubmit={submit}>
      <div>
        <section className="panel">
          <h2>
            <span className="step">01</span> Punto di ritiro
          </h2>
          <SenderAddressPreference ref={senderPreference} initial={order} formRef={bookingForm} onUse={applySenderAddress} />
          <SenderFields identity={{...user, ...order, business_type: user.business_type, business_description: user.business_description}} nameField="store_name" selectableType={false} profileType={user.sender_type} />
          <div className="booking-grid booking-address">
            {field("pickup_address", "Indirizzo di ritiro")}
            {field("pickup_street_number", "Civico", { maxLength: 20 })}
            {field("pickup_city", "Comune di ritiro", { maxLength: 100 })}
            {field("pickup_postal_code", "CAP ritiro", { pattern: "[0-9]{5}", maxLength: 5, inputMode: "numeric" })}
          </div>
        </section>
        <section className="panel">
          <h2>
            <span className="step">02</span> Punto di consegna
          </h2>
          <div className="booking-service">
            <Field label="Tipo di spedizione" width="service"><select name="shipping_type" value={shippingType} onChange={event => setShippingType(event.target.value)}><option value="regional">Regionale · Rete EA-Express</option><option value="external">Fuori regione · Rete EA-Express</option></select></Field>
          </div>
          <div className="booking-grid booking-contact">
            {field("recipient_name", "Nome destinatario", { maxLength: 150 })}
            {field("recipient_phone", "Telefono destinatario", { type: "tel", maxLength: 30, minLength: 6 })}
          </div>
          <div className="booking-grid booking-address">
            {field("delivery_address", "Indirizzo di consegna", { onChange: event => setStreet(event.target.value) })}
            {field("delivery_street_number", "Civico", { maxLength: 20 })}
            {field("delivery_city", "Comune di consegna", { maxLength: 100, onChange: event => setCity(event.target.value) })}
            {field("delivery_postal_code", "CAP consegna", { required: false, help: "Automatico se il comune ha un solo CAP.", pattern: "[0-9]{5}", maxLength: 5, inputMode: "numeric", onChange: event => setPostal(event.target.value) })}
          </div>
          <div className="booking-grid booking-location-details">
            {field("delivery_zone", "Zona / quartiere (facoltativo)", { required: false, maxLength: 100, onChange: event => setZone(event.target.value) })}
            {field("delivery_province", "Provincia", { onChange: event => setProvince(event.target.value), required: shippingType === 'external', maxLength: 100 })}
            {field("delivery_region", "Regione", { onChange: event => setRegion(event.target.value), required: shippingType === 'external', maxLength: 100 })}
          </div>
        </section>
        <section className="panel"><h2><span className="step">03</span> Data e orario</h2>
          <div className="booking-grid booking-schedule">
            {field("pickup_date", "Data del ritiro", { type: "date", min: today(), defaultValue: order?.pickup_date || today() })}
            {field("pickup_from", "Dalle", { type: "time", defaultValue: order?.pickup_from || "09:00" })}
            {field("pickup_to", "Alle", { type: "time", defaultValue: order?.pickup_to || "12:00" })}
          </div>
        </section>
        <section className="panel">
          <h2>
            <span className="step">04</span> Pacco e indicazioni
          </h2>
          <div className="booking-grid booking-parcel">
            {field("parcel_count", "Numero colli", { type: "number", min: 1, max: 100, defaultValue: order?.parcel_count || 1 })}
            {field("parcel_value", "Valore del pacco (€)", {
              pattern: "[0-9]{1,6}([.,][0-9]{1,2})?", inputMode: "decimal", placeholder: "0,00", maxLength: 9,
              defaultValue: order?.parcel_value_cents != null ? (order.parcel_value_cents / 100).toFixed(2) : "",
              help: "Valore dichiarato, non costo di spedizione o importo da riscuotere.",
            })}
            <Field label="Caratteristiche del pacco" width="package"><select name="package_type" value={packageType} onChange={event => setPackageType(event.target.value)}><option value="standard">Standard</option><option value="fragile">Fragile</option><option value="other">Altro</option></select></Field>
          </div>
          {packageType === 'other' && field("package_description", "Descrizione caratteristiche", { maxLength: 255 })}
          <div className="booking-grid booking-content">
              <Field label="Contenuto" width="category"><select name="category" value={category} onChange={event => setCategory(event.target.value)}>{Object.entries(contentCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Priorità" width="priority"><select name="urgency" defaultValue={order?.urgency || "standard"}><option value="standard">Standard</option><option value="urgent">Urgente</option></select></Field>
            {category === 'custom' ? field("content_description", "Contenuto del pacco", { maxLength: 255, placeholder: "Es. ricambi per automobile" }) : <input type="hidden" name="content_description" value=""/>}
          </div>
          <Field label="Istruzioni per il rider (facoltative)" width="notes">
            <textarea
              name="customer_notes"
              defaultValue={order?.customer_notes || ""}
              maxLength={2000}
              rows={2}
              placeholder="Citofono, punto di ritiro, informazioni utili…"
            />
          </Field>
        </section>
      </div>
      <section className="panel booking-tariff">
        <h2><span className="step">05</span> Tariffa</h2>
          <ShippingQuote province={province} region={region} onPostalResolved={resolvePostal} city={city} postal={postal} zone={zone} street={street} shippingType={shippingType}/>
        <p className="muted">
          Controlla indirizzi, contatto e orario. Potrai modificare la richiesta
          fino alla presa in carico.
        </p>
        <Feedback error={error} />
        {order && error?.status === 409 && (
          <Link className="button secondary full" to={`${base}/${order.slug}`}>
            Ricarica il dettaglio aggiornato
          </Link>
        )}
      </section>
      <div className="booking-final-actions">
        <button className="button booking-review-button" type="submit" disabled={busy} aria-busy={busy || undefined}>{busy ? "Verifica in corso…" : "Prosegui al riepilogo"}<Icon name="arrow-right" /></button>
        <button type="button" className="button danger" disabled={busy} onClick={()=>setCancelOpen(true)}><Icon name="trash"/> Annulla</button>
      </div>
    </Form></div>
    <Modal open={cancelOpen} title="Annullare la richiesta?" description="I dati inseriti in questa prenotazione andranno persi." danger onClose={()=>setCancelOpen(false)}>
      <footer className="modal-actions">
        <button type="button" className="button modal-back" onClick={()=>setCancelOpen(false)}><Icon name="arrow-left"/> Continua compilazione</button>
        <IconButton action="confirm" label="Conferma annullamento" onClick={()=>{bookingForm.current?.reset();setReview(null);setError(null);setCancelOpen(false);navigate('/dashboard',{replace:true});}} />
      </footer>
    </Modal></>
  );
}
function EditForm({ slug, pickups }) {
  const resource = useApi(getOrder, { slug });
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
  const { slug } = useParams();
  return (
    <>
      <Header
        eyebrow="ORGANIZZIAMO LA PROSSIMA PARTENZA"
        title={
          slug
            ? "Modifica richiesta"
            : pickups
              ? "Programma un ritiro"
              : "Nuova spedizione"
        }
        description="Bastano gli indirizzi, un orario e qualche dettaglio."
      />
      {slug ? (
        <EditForm slug={slug} pickups={pickups} />
      ) : (
        <OrderForm pickups={pickups} />
      )}
    </>
  );
}
