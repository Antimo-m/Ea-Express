import { Icon, Feedback } from "./UI";
import { contentLabel } from "../utils/order-content";
import { date, money } from "../utils/format";

export default function CheckoutReview({ review, user, busy, error, onBack, onConfirm }) {
  const data = review.data;
  const quote = review.quote || {};
  return <section className="checkout-review checkout-v2" aria-labelledby="checkout-heading">
    <header className="checkout-heading">
      <span className="checkout-seal" aria-hidden="true"><Icon name="box-seam" /></span>
      <div><p className="eyebrow">ULTIMO PASSAGGIO</p><h2 id="checkout-heading">Tutto pronto per partire.</h2><p>Controlla i dettagli e conferma il tuo ordine.</p></div>
      <span className="checkout-verified"><Icon name="shield-check" /> Riepilogo verificato</span>
    </header>
    <div className="checkout-layout">
      <div className="checkout-details">
        <section className="checkout-section" aria-labelledby="checkout-route-heading">
          <div className="checkout-section-title"><span>01</span><h3 id="checkout-route-heading">Da dove, a chi</h3></div>
          <div className="checkout-addresses">
            <article className="checkout-address"><span className="checkout-caption"><Icon name="box-arrow-up" /> RITIRO · MITTENTE</span><strong>{data.store_name || user.name}</strong><address>{data.pickup_address} {data.pickup_street_number}<br />{data.pickup_postal_code} {data.pickup_city}</address><small>{{private: "Privato", business: "Attività commerciale", online_shop: "Shop online"}[user.sender_type]}</small></article>
            <span className="checkout-route-arrow" aria-hidden="true"><Icon name="arrow-right" /></span>
            <article className="checkout-address"><span className="checkout-caption"><Icon name="geo-alt" /> CONSEGNA · DESTINATARIO</span><strong>{data.recipient_name}</strong><address>{data.delivery_address} {data.delivery_street_number}<br />{data.delivery_postal_code} {data.delivery_city}{data.delivery_province && ` (${data.delivery_province})`}{data.delivery_region && <><br />{data.delivery_region}</>}{data.delivery_zone && <><br />{data.delivery_zone}</>}</address><span className="checkout-contact"><Icon name="telephone" /> {data.recipient_phone}</span></article>
          </div>
        </section>
        <section className="checkout-section" aria-labelledby="checkout-schedule-heading">
          <div className="checkout-section-title"><span>02</span><h3 id="checkout-schedule-heading">Il tuo ritiro</h3></div>
          <div className="checkout-schedule"><Icon name="calendar3" /><div><strong>{date(data.pickup_date)}</strong><span>Dalle {data.pickup_from} alle {data.pickup_to}</span></div><span className="checkout-service">{data.shipping_type === "external" ? "Fuori regione" : "Regionale"} · EA-Express</span></div>
          {(quote.delivery_time || quote.delivery_days_min) && <p className="checkout-delivery-estimate"><Icon name="truck" /> {quote.delivery_time || `Consegna prevista in ${quote.delivery_days_min}–${quote.delivery_days_max} giorni lavorativi dal ritiro.`}</p>}
        </section>
        <section className="checkout-section" aria-labelledby="checkout-package-heading">
          <div className="checkout-section-title"><span>03</span><h3 id="checkout-package-heading">Cosa spediamo</h3></div>
          <dl className="checkout-package-facts"><div><dt>Colli</dt><dd>{data.parcel_count}</dd></div><div><dt>Caratteristiche</dt><dd>{data.package_type === "fragile" ? "Fragile" : data.package_type === "other" ? data.package_description : "Standard"}</dd></div><div><dt>Contenuto</dt><dd>{contentLabel(data)}</dd></div>{data.urgency === "urgent" && <div><dt>Priorità</dt><dd>Urgente</dd></div>}</dl>
          {data.customer_notes && <div className="checkout-instructions"><Icon name="chat-left-text" /><div><strong>Indicazioni per il rider</strong><p>{data.customer_notes}</p></div></div>}
        </section>
      </div>
      <aside className="checkout-summary" aria-labelledby="checkout-summary-heading">
        <p className="eyebrow">IL TUO ORDINE</p><h3 id="checkout-summary-heading">Riepilogo economico</h3>
        <dl className="checkout-amounts"><div><dt>Valore dichiarato del pacco</dt><dd>{money(review.parcel_value_cents)}</dd></div><div><dt>Tariffa di spedizione</dt><dd>{money(review.shipping_price_cents)}</dd></div><div className="checkout-total"><dt>Totale finale</dt><dd>{money(review.total_cents)}</dd></div></dl>
        <p className="checkout-total-note">Il totale comprende valore dichiarato e spedizione. La conferma non esegue un pagamento online e non attiva un contrassegno.</p>
        <div className="checkout-assurance"><Icon name="shield-check" /><p>La tariffa viene verificata nuovamente alla conferma. Nessun importo può essere modificato da questa pagina.</p></div>
        {quote.reason && <p className="checkout-rate-note">{quote.reason}</p>}
        {!review.checkout_token && !error && <p className="alert error" role="alert">La tariffa non è disponibile. Torna ai dati e controlla la destinazione oppure contatta EA-Express.</p>}
        <Feedback error={error} />
        <footer className="checkout-actions"><button type="button" className="button button-back" disabled={busy} onClick={onBack}><Icon name="arrow-left" /> Torna indietro</button><button type="button" className="button secondary checkout-continue" aria-busy={busy || undefined} disabled={busy || !review.checkout_token || error?.status === 409} onClick={onConfirm}><Icon name={busy ? "hourglass-split" : "check2"} />{busy ? "Conferma in corso…" : "Conferma ordine"}</button></footer>
      </aside>
    </div>
  </section>;
}
