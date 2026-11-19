import { Icon, Feedback, KeyValues } from "./UI";
import { contentLabel } from "../utils/order-content";
import { date, money } from "../utils/format";
import { IndicativePriceNote } from "./BetaNotice";

export default function CheckoutReview({ review, user, busy, error, onBack, onConfirm }) {
  const data = review.data;
  const quote = review.quote || {};
  const street = (address, number) => [address, number].filter(Boolean).join(" ");
  const senderType = {private: "Privato", business: "Attività commerciale", online_shop: "Shop online"}[user.sender_type];
  const packageLabel = data.package_type === "fragile" ? "Fragile" : data.package_type === "other" ? data.package_description : "Standard";
  const deliveryEstimate = quote.delivery_time || (quote.delivery_days_min ? `${quote.delivery_days_min}–${quote.delivery_days_max} giorni lavorativi dal ritiro` : null);
  return <section className="checkout-review checkout-v2" aria-labelledby="checkout-heading">
    <header className="checkout-heading">
      <span className="checkout-seal" aria-hidden="true"><Icon name="box-seam" /></span>
      <div><p className="eyebrow">ULTIMO PASSAGGIO</p><h2 id="checkout-heading">Tutto pronto per partire.</h2><p>Controlla i dettagli e conferma il tuo ordine.</p></div>
      <span className="checkout-verified"><Icon name="shield-check" /> Riepilogo verificato</span>
    </header>
    <div className="checkout-layout">
      <div className="checkout-details">
        <section className="checkout-section" aria-labelledby="checkout-route-heading">
          <div className="checkout-section-title"><span>01</span><h3 id="checkout-route-heading">Mittente e destinatario</h3></div>
          <div className="checkout-addresses">
            <article className="checkout-address" aria-labelledby="checkout-sender-heading"><h4 className="checkout-caption" id="checkout-sender-heading"><Icon name="box-arrow-up" /> Mittente</h4><KeyValues items={[["Nome mittente", data.store_name || user.name], ["Tipologia", senderType], ["Indirizzo mittente", street(data.pickup_address, data.pickup_street_number)], ["CAP", data.pickup_postal_code], ["Città", data.pickup_city]]} /></article>
            <span className="checkout-route-arrow" aria-hidden="true"><Icon name="arrow-right" /></span>
            <article className="checkout-address" aria-labelledby="checkout-recipient-heading"><h4 className="checkout-caption" id="checkout-recipient-heading"><Icon name="geo-alt" /> Destinatario</h4><KeyValues items={[["Nome destinatario", data.recipient_name], ["Indirizzo destinatario", street(data.delivery_address, data.delivery_street_number)], ["CAP", data.delivery_postal_code], ["Città", data.delivery_city], ["Zona", data.delivery_zone], ["Provincia", data.delivery_province], ["Regione", data.delivery_region], ["Telefono destinatario", data.recipient_phone]]} /></article>
          </div>
        </section>
        <section className="checkout-section" aria-labelledby="checkout-schedule-heading">
          <div className="checkout-section-title"><span>02</span><h3 id="checkout-schedule-heading">Il tuo ritiro</h3></div>
          <KeyValues className="checkout-facts" items={[["Data del ritiro", date(data.pickup_date)], ["Fascia oraria", data.pickup_from && data.pickup_to ? `Dalle ${data.pickup_from} alle ${data.pickup_to}` : null], ["Servizio", `${data.shipping_type === "external" ? "Fuori regione" : "Regionale"} · EA-Express`], ["Consegna prevista", deliveryEstimate]]} />
        </section>
        <section className="checkout-section" aria-labelledby="checkout-package-heading">
          <div className="checkout-section-title"><span>03</span><h3 id="checkout-package-heading">Cosa spediamo</h3></div>
          <KeyValues className="checkout-facts" items={[["Numero colli", data.parcel_count], ["Caratteristiche", packageLabel], ["Contenuto", contentLabel(data)], ["Priorità", data.urgency === "urgent" ? "Urgente" : "Standard"]]} />
          {data.customer_notes && <div className="checkout-instructions"><Icon name="chat-left-text" /><div><strong>Indicazioni per il rider</strong><p>{data.customer_notes}</p></div></div>}
        </section>
      </div>
      <aside className="checkout-summary" aria-labelledby="checkout-summary-heading">
        <p className="eyebrow">IL TUO ORDINE</p><h3 id="checkout-summary-heading">Riepilogo economico</h3>
        <dl className="checkout-amounts"><div><dt>Valore dichiarato del pacco</dt><dd>{money(review.parcel_value_cents)}</dd></div><div><dt>Tariffa di spedizione</dt><dd>{money(review.shipping_price_cents)}</dd></div><div className="checkout-total"><dt>Totale finale</dt><dd>{money(review.total_cents)}</dd></div></dl>
        <IndicativePriceNote />
        <p className="checkout-total-note">Il totale comprende valore dichiarato e spedizione. La conferma non esegue alcun pagamento online.</p>
        <div className="checkout-assurance"><Icon name="shield-check" /><p>La tariffa viene verificata nuovamente alla conferma. Nessun importo può essere modificato da questa pagina.</p></div>
        {quote.reason && <p className="checkout-rate-note">{quote.reason}</p>}
        {!review.checkout_token && !error && <p className="alert error" role="alert">La tariffa non è disponibile. Torna ai dati e controlla la destinazione oppure contatta EA-Express.</p>}
        <Feedback error={error} />
        <footer className="checkout-actions"><button type="button" className="button button-back" disabled={busy} onClick={onBack}><Icon name="arrow-left" /> Torna indietro</button><button type="button" className="button secondary checkout-continue" aria-busy={busy || undefined} disabled={busy || !review.checkout_token || quote.available === false || error?.status === 409} onClick={onConfirm}><Icon name={busy ? "hourglass-split" : "check2"} />{busy ? "Conferma in corso…" : "Conferma ordine"}</button></footer>
      </aside>
    </div>
  </section>;
}
