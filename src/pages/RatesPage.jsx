import { useState } from "react";
import { request, query } from "../api/client";
import { useApi } from "../hooks/useApi";
import { Header, Field, State, Empty, Pagination, Icon } from "../components/UI";
import { money } from "../utils/format";
const load = params => request(`/rates${query(params)}`);
export default function RatesPage() {
  const [filters, setFilters] = useState({q:'',area:'',page:1});
  const resource = useApi(load, filters);
  return <><Header eyebrow="RETE DI CONSEGNA" title="Dove consegniamo" description="Trova la destinazione e consulta il costo della tua prossima spedizione."/>
    <form className="panel filter-bar" onSubmit={event => {event.preventDefault();setFilters({...Object.fromEntries(new FormData(event.currentTarget)),page:1});}}>
      <Field name="q" label="Cerca località" defaultValue={filters.q} placeholder="Città, CAP o zona" maxLength={100}/>
      <Field label="Area"><select name="area" defaultValue=""><option value="">Tutte le aree</option>{(resource.data?.areas || []).map(area => <option key={area}>{area}</option>)}</select></Field>
      <button className="button secondary"><Icon name="search"/> Cerca</button>
    </form>
    <State resource={resource}>{({rates}) => <><p className="data-caption">{rates.total} tariffe disponibili</p>{rates.data.length ? <div className="rates-grid">{rates.data.map(rate => <article className="panel rate-card" key={rate.id}>
      <header><span className="eyebrow">{rate.area || 'Località'}</span><Icon name="geo-alt"/></header><h2>{rate.city}</h2><p className="rate-location">{[rate.zone,rate.postal_code ? `CAP ${rate.postal_code}` : '',rate.street].filter(Boolean).join(' · ') || 'Intera località'}</p>
      <div className="rate-price"><span>Costo spedizione</span><strong>{money(rate.price_cents)}</strong></div><p className="rate-time"><Icon name="clock"/>{rate.delivery_time || 'Tempi da confermare'}</p>
    </article>)}</div> : <Empty title="Nessuna tariffa disponibile" text="Verifica località e CAP. Per confermare una prenotazione serve una tariffa disponibile nel listino."/>}<Pagination meta={rates} onPage={page => setFilters({...filters,page})}/></>}</State>
    <p className="data-caption">Il riepilogo della prenotazione verifica la tariffa per l’indirizzo inserito. Le spedizioni precedenti conservano il prezzo concordato.</p></>;
}
