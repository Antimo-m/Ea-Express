import MetricTile from '../components/MetricTile';
import { useState } from 'react';
import FilterToolbar from '../components/FilterToolbar';
import { useSearchParams } from 'react-router';
import TrendChart from '../components/TrendChart';
import { request, query } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Header, Field, State, Icon } from '../components/UI';
import { today, money, chartDate } from '../utils/format';
const load = params => request(`/statistics${query(params)}`);
const percentage = value => value === null ? 'Nessuna base di confronto' : `${value > 0 ? '+' : ''}${value}% sul periodo precedente`;
const validatePeriod = ({from, to}) => from && to && from > to ? {to: ['La data finale deve essere uguale o successiva alla data iniziale.']} : {};
export default function StatisticsPage() {
  const [selectedType,setSelectedType] = useState('regional');
  const [params,setFilters] = useSearchParams();
  const defaults = {from:today().slice(0,8)+'01',to:today()};
  const filters = {...defaults,...Object.fromEntries(params),period:'custom',date_basis:'activity'};
  const resource = useApi(load,filters,true,30000);
  return <>
    <Header eyebrow="LA TUA ATTIVITÀ" title="Statistiche" description="Ricavi dalle consegne, volume di lavoro e crescita del tuo negozio."/>
    <FilterToolbar key={params.toString()} errors={resource.error?.errors} validate={validatePeriod} label="Periodo delle statistiche" onApply={setFilters} onReset={() => setFilters({})} count={Number(filters.from !== defaults.from || filters.to !== defaults.to)}
      primary={<><Field name="from" label="Data iniziale" type="date" defaultValue={filters.from} required/><Field name="to" label="Data finale" type="date" defaultValue={filters.to} required/></>}/>
    <State resource={resource}>{data => <div className="statistics-workspace">
      <div className="statistics-context"><p>Attività dal <strong>{chartDate(data.from)}</strong> al <strong>{chartDate(data.to)}</strong></p><span>Confronto: {chartDate(data.previous_from)} — {chartDate(data.previous_to)}</span></div>
      <section aria-label="Ricavi del negozio">
        <div className="statistics-earnings">{[
          ['Valore delle consegne',data.gross_cents,'bag-check','gross_cents'],['Costo delle spedizioni',data.delivered_spend_cents,'truck','delivered_spend_cents'],['Ricavo netto del negozio',data.net_cents,'wallet2','net_cents'],
        ].map(([label,value,icon,metric]) => <MetricTile key={metric} label={label} value={money(value)} icon={icon} tone={metric==='net_cents'?'positive':'neutral'} note={percentage(data.changes[metric])} />)}</div>
        <p className="muted small">Valore merce delle consegne completate meno il relativo costo di spedizione. Ordini in corso, annullati e rifiutati sono esclusi. Il netto non comprende i costi di acquisto della merce.</p>
        {data.missing_prices > 0 && <p className="muted small" role="status">{data.missing_prices} consegne senza costo di spedizione definitivo: il netto mostrato è incompleto.</p>}
        {data.missing_values > 0 && <p className="muted small" role="status">{data.missing_values} consegne senza valore merce registrato: il ricavo mostrato è incompleto.</p>}
      </section>
      <div className="statistics-kpis">{[
        ['Ordini nel periodo',data.total,'box-seam','total'],['Consegne completate',data.delivered,'check2-circle','delivered'],['In corso',data.in_progress,'truck','in_progress'],['Annullati / rifiutati',data.cancelled,'x-circle','cancelled'],
      ].map(([label,value,icon,metric]) => <MetricTile key={label} label={label} value={value} icon={icon} note={percentage(data.changes[metric])} />)}</div>
      <section className="panel statistics-insight"><Icon name="graph-up-arrow"/><div><h2>Il lavoro del tuo negozio</h2><p>{data.delivered} ordini consegnati, pari al {data.completion_percent}% degli ordini nel periodo. {data.in_progress} richieste sono ancora in corso.</p><small>Le consegne sono conteggiate nel giorno di completamento. Gli ordini in corso, annullati o rifiutati seguono la data di creazione.</small></div></section>
      <TrendChart key={`orders-${data.from}-${data.to}`} summary={data.chart_summaries.orders} title="Come stanno andando le consegne?" description="Consegne per giorno di completamento; gli altri ordini seguono il giorno di creazione." points={data.trend} series={[{key:'shipments',label:'Ordini nel periodo',color:'var(--ea-info)'},{key:'delivered',label:'Consegnate',color:'var(--ea-success)'}]}/>
      <TrendChart key={`revenue-${data.from}-${data.to}`} summary={data.chart_summaries.revenue} title="Quanto generano le consegne?" description="Ogni punto mostra il netto delle consegne completate in quel giorno. La somma dei giorni coincide con il totale del periodo." points={data.trend} currency series={[{key:'net_cents',label:'Ricavo netto del negozio',color:'var(--ea-success)'}]}/>
      <div className="statistics-charts"><section className="panel service-distribution"><span className="chart-eyebrow">TIPOLOGIA DI SERVIZIO</span><h2>Dove spedisco di più?</h2>{[['regional','Regionali',data.regional_count],['external','Fuori regione',data.external_count]].map(([type,label,count])=><button type="button" className="volume-row" key={type} aria-pressed={selectedType===type} onClick={()=>setSelectedType(type)}><span>{label}</span><meter min="0" max={Math.max(1,data.total)} value={count} aria-label={`${label}: ${count} su ${data.total}`}/><strong>{count}</strong></button>)}<div className="service-detail" role="status"><strong>{selectedType==='regional'?'Regionali':'Fuori regione'}</strong><p>{selectedType==='regional'?data.regional_count:data.external_count} richieste su {data.total} nel periodo selezionato.</p></div><p className="muted small">Include tutte le richieste, anche annullate o rifiutate. Il servizio è sempre Rete EA-Express.</p></section>
      <TrendChart key={`months-${data.from}-${data.to}`} summary={data.chart_summaries.months} title="Come cambia il volume di lavoro?" description={data.comparison_note} points={data.months.map(point=>({...point,date:point.month}))} monthly bars series={[{key:'shipments',label:'Ordini',color:'var(--ea-info)'}]}/></div>
    </div>}</State>
  </>;
}
