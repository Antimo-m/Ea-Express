import { contentLabel } from "../utils/order-content";
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { getOrder } from '../api/shipments';
import { useApi } from '../hooks/useApi';
import { Header, State, Icon, Field } from '../components/UI';
import { date, money } from '../utils/format';
function Label({ order }) {
  const [parcel, setParcel] = useState(1);
  const [format, setFormat] = useState('a6');
  const item = order.packages?.[parcel - 1];
  return <>
    <div className="print-toolbar">
      <Header title="Documento di spedizione" description="Etichetta da applicare al pacco o ricevuta completa da conservare. La stampa include soltanto il documento.">
        <Link className="button secondary" to={`/shipments/${order.id}`}><Icon name="arrow-left" /> Torna alla spedizione</Link>
        <button className="button" onClick={() => window.print()}><Icon name="printer" /> Stampa {format === 'a6' ? 'etichetta' : 'ricevuta'}</button>
      </Header>
      <div className="form-grid">
        <Field label="Documento"><select value={format} onChange={event => setFormat(event.target.value)}><option value="a6">Etichetta pacco · A6</option><option value="a4">Ricevuta completa · A4</option></select></Field>
        <Field label="Pacco da stampare"><select value={parcel} onChange={event => setParcel(Number(event.target.value))}>{Array.from({length: order.parcel_count}, (_, index) => <option key={index} value={index + 1}>Pacco {index + 1} di {order.parcel_count}</option>)}</select></Field>
      </div>
      <p className="muted small">Per un foglio pulito disattiva le intestazioni e i piè di pagina aggiunti dal browser.</p>
    </div>
    <article className={`parcel-label document-${format}`}>
      <header className="logistic-header"><div><strong>EA-EXPRESS</strong><small>{format === 'a6' ? 'ETICHETTA DI SPEDIZIONE' : 'RICEVUTA DI SPEDIZIONE'}</small></div><b>PACCO<br/>{parcel} / {order.parcel_count}</b></header>
      <div className="label-reference"><small>CODICE SPEDIZIONE</small><strong>{order.reference}</strong></div>
      <section className="label-destination"><small>DESTINATARIO / CONSEGNARE A</small><dl className="label-address"><div><dt>Nome destinatario:</dt><dd>{order.recipient_name}</dd></div><div><dt>Indirizzo di consegna:</dt><dd>{order.delivery_address}</dd></div><div><dt>Città di consegna:</dt><dd>{order.delivery_city}</dd></div><div><dt>Numero di cellulare:</dt><dd>{order.recipient_phone}</dd></div></dl></section>
      <section className="label-sender"><small>MITTENTE / RITIRARE DA</small><dl className="label-address"><div><dt>Nome mittente:</dt><dd>{order.store_name}</dd></div><div><dt>Indirizzo di ritiro:</dt><dd>{order.pickup_address}</dd></div><div><dt>Città di ritiro:</dt><dd>{order.pickup_city}</dd></div></dl></section>
      <section className="label-facts"><div><small>RITIRO PROGRAMMATO</small><strong>{date(order.pickup_date)}</strong><span>Orario: {order.pickup_from} – {order.pickup_to}</span></div><div><small>PESO E DIMENSIONI</small><strong>{item ? `Peso: ${item.weight_kg} kg` : 'Non specificati'}</strong>{item && <span>Dimensioni: {item.length_cm} × {item.width_cm} × {item.height_cm} cm</span>}</div></section>
      {format === 'a4' && <section className="receipt-details"><h3>Informazioni di consegna</h3><dl><div><dt>Stato al momento della stampa</dt><dd>{order.status_label}</dd></div><div><dt>Corriere</dt><dd>{order.courier?.name || 'Da assegnare'}</dd></div><div><dt>Contenuto</dt><dd>{contentLabel(order)}</dd></div><div><dt>Valore merce dichiarato</dt><dd>{order.parcel_value_cents == null ? 'Non dichiarato' : money(order.parcel_value_cents)}</dd></div><div><dt>Costo spedizione</dt><dd>{order.price_cents == null ? 'Da concordare' : money(order.price_cents)}</dd></div></dl>{order.customer_notes && <div className="receipt-instructions"><h3>Istruzioni per il corriere</h3><p>{order.customer_notes}</p></div>}</section>}
      <footer>Conservare il codice per identificare la spedizione.{format === 'a4' && ' Documento operativo non fiscale.'}</footer>
    </article>
  </>;
}
export default function LabelPage() {
  const { id } = useParams();
  const resource = useApi(getOrder, { id });
  return <State resource={resource}>{data => <Label order={data.data} />}</State>;
}
