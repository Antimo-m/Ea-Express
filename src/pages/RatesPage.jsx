import FilterToolbar from "../components/FilterToolbar";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { request, query } from "../api/client";
import { useApi } from "../hooks/useApi";
import { Header, Field, State, Empty, Pagination, Icon } from "../components/UI";
import { money } from "../utils/format";
import { IndicativePriceNote } from "../components/BetaNotice";
const load = params => request(`/rates${query(params)}`);
export default function RatesPage() {
  const [params, setFilters] = useSearchParams();
  const filters = Object.fromEntries(params);
  const resource = useApi(load, filters, true, 30000);
  const page = Number(filters.page) || 1;
  const previousPage = useRef(page);
  const results = useRef(null);
  useEffect(() => {
    if (page === previousPage.current || resource.loading || resource.error || resource.data?.rates.current_page !== page) return;
    previousPage.current = page;
    results.current?.focus({ preventScroll: true });
    results.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [page, resource.loading, resource.error, resource.data]);
  return <><Header eyebrow="RETE DI CONSEGNA" title="Dove consegniamo" description="Trova la destinazione e consulta il costo della tua prossima spedizione."/>
    <FilterToolbar key={params.toString()} onApply={setFilters} onReset={() => setFilters({})} count={[filters.shipping_type,filters.area].filter(Boolean).length}
      search={<Field name="q" label="Cerca località" defaultValue={filters.q || ''} placeholder="Città, CAP o zona" maxLength={100}/>}
      primary={<Field label="Servizio"><select name="shipping_type" defaultValue={filters.shipping_type || ''}><option value="">Tutti</option><option value="regional">Regionali</option><option value="external">Fuori regione</option></select></Field>}
      secondary={<Field label="Area"><select name="area" defaultValue={filters.area || ''}><option value="">Tutte le aree</option>{(resource.data?.areas || []).map(area => <option key={area}>{area}</option>)}</select></Field>}
    />
    <section ref={results} className="rates-results" aria-label="Tariffe disponibili" tabIndex="-1"><State resource={resource}>{({rates}) => <><p className="data-caption">{rates.total} tariffe disponibili</p>{rates.data.length ? <div className="rates-grid">{rates.data.map(rate => <article className="panel rate-card" key={rate.slug}>
      <header><span className="eyebrow">{rate.area || 'Località'}</span><Icon name="geo-alt"/></header><h2>{rate.city}</h2><span className="service-badge">{rate.shipping_type === "external" ? 'Fuori regione · Rete EA-Express' : "Regionale"}</span>{(rate.max_weight_kg || rate.max_dimension_cm) && <p className="small">{rate.max_weight_kg && `Fino a ${rate.max_weight_kg} kg totali. `}{rate.max_dimension_cm && `Lato massimo: ${rate.max_dimension_cm} cm.`}</p>}<p className="rate-location">{[rate.zone,rate.postal_codes?.length ? `CAP ${rate.postal_codes.join(', ')}` : rate.postal_code ? `CAP ${rate.postal_code}` : '',rate.street].filter(Boolean).join(' · ') || (rate.is_default ? 'Tutte le destinazioni fuori regione senza tariffa specifica' : 'Intera località')}</p>
      <div className="rate-price"><span>Costo spedizione</span><strong>{money(rate.price_cents)}</strong></div><p className="rate-time"><Icon name="clock"/>{rate.delivery_time || (rate.delivery_days_min ? `${rate.delivery_days_min}–${rate.delivery_days_max} giorni lavorativi` : 'Tempi da confermare')}</p>
    </article>)}</div> : <Empty title="Nessuna tariffa disponibile" text="Verifica località e CAP. Per confermare una prenotazione serve una tariffa disponibile nel listino."/>}<Pagination meta={rates} onPage={page => setFilters({...filters,page})}/></>}</State></section>
    <IndicativePriceNote /><p className="data-caption">Il riepilogo della prenotazione verifica la tariffa per l’indirizzo inserito. Le spedizioni precedenti conservano il prezzo concordato.</p></>;
}
