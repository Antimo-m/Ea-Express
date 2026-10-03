import { useState } from 'react';
import IconButton from '../components/IconButton';
import TrendChart from '../components/TrendChart';
import { request, query } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Header, Field, State, Icon } from '../components/UI';
import { today, money, chartDate } from '../utils/format';
const load = params => request(`/statistics${query(params)}`);
const percentage = value => value === null ? 'Nessuna base di confronto' : `${value > 0 ? '+' : ''}${value}% sul periodo precedente`;
export default function StatisticsPage() {
  const [selectedType,setSelectedType] = useState('regional');
  const [filters,setFilters] = useState({period:'custom',date_basis:'activity',from:today().slice(0,8)+'01',to:today()});
  const resource = useApi(load,filters,true,30000);
  return <>
    <Header eyebrow="LA TUA ATTIVITÀ" title="Statistiche" description="Ricavi dalle consegne, volume di lavoro e crescita del tuo negozio."/>
    <form key={`${filters.from}-${filters.to}`} className="statistics-filters" aria-label="Periodo delle statistiche" onSubmit={event => {event.preventDefault();setFilters({...Object.fromEntries(new FormData(event.currentTarget)),period:'custom',date_basis:'activity'});}}>
      <Field name="from" label="Data iniziale" type="date" defaultValue={filters.from} required/>
      <Field name="to" label="Data finale" type="date" defaultValue={filters.to} required/>
      <IconButton action="search" label="Cerca nel periodo" type="submit"/>
    </form>
    <State resource={resource}>{data => <>
      <div className="statistics-context"><p>Attività dal <strong>{chartDate(data.from)}</strong> al <strong>{chartDate(data.to)}</strong></p><span>Confronto: {chartDate(data.previous_from)} — {chartDate(data.previous_to)}</span></div>
      <section aria-label="Ricavi del negozio">
        <div className="statistics-earnings">{[
          ['Valore delle consegne',data.gross_cents,'bag-check','gross_cents'],['Costo delle spedizioni',data.delivered_spend_cents,'truck','delivered_spend_cents'],['Ricavo netto del negozio',data.net_cents,'wallet2','net_cents'],
        ].map(([label,value,icon,metric]) => <article className={`panel statistic-card${metric==='net_cents'?' statistic-highlight':''}`} key={metric}><div><span>{label}</span><Icon name={icon}/></div><strong>{money(value)}</strong><small>{percentage(data.changes[metric])}</small></article>)}</div>
        <p className="muted small">Valore merce delle consegne completate meno il relativo costo di spedizione. Ordini in corso, annullati e rifiutati sono esclusi. Il netto non comprende i costi di acquisto della merce.</p>
        {data.missing_prices > 0 && <p className="muted small" role="status">{data.missing_prices} consegne senza costo di spedizione definitivo: il netto mostrato è incompleto.</p>}
        {data.missing_values > 0 && <p className="muted small" role="status">{data.missing_values} consegne senza valore merce registrato: il ricavo mostrato è incompleto.</p>}
      </section>
      <div className="statistics-kpis">{[
        ['Ordini nel periodo',data.total,'box-seam','total'],['Consegne completate',data.delivered,'check2-circle','delivered'],['In corso',data.in_progress,'truck','in_progress'],['Annullati / rifiutati',data.cancelled,'x-circle','cancelled'],
      ].map(([label,value,icon,metric]) => <article className="panel statistic-card" key={label}><div><span>{label}</span><Icon name={icon}/></div><strong>{value}</strong><small>{percentage(data.changes[metric])}</small></article>)}</div>
      <section className="panel statistics-insight"><Icon name="graph-up-arrow"/><div><h2>Il lavoro del tuo negozio</h2><p>{data.delivered} ordini consegnati, pari al {data.completion_percent}% degli ordini nel periodo. {data.in_progress} richieste sono ancora in corso.</p><small>Le consegne sono conteggiate nel giorno di completamento. Gli ordini in corso, annullati o rifiutati seguono la data di creazione.</small></div></section>
      <TrendChart key={`orders-${data.from}-${data.to}`} summary={data.chart_summaries.orders} title="Come stanno andando le consegne?" description="Consegne per giorno di completamento; gli altri ordini seguono il giorno di creazione." points={data.trend} series={[{key:'shipments',label:'Ordini nel periodo',color:'#203f54'},{key:'delivered',label:'Consegnate',color:'#147451'}]}/>
      <TrendChart key={`revenue-${data.from}-${data.to}`} summary={data.chart_summaries.revenue} title="Quanto generano le consegne?" description="Ogni punto mostra il netto delle consegne completate in quel giorno. La somma dei giorni coincide con il totale del periodo." points={data.trend} currency series={[{key:'net_cents',label:'Ricavo netto del negozio',color:'#147451'}]}/>
      <div className="statistics-charts"><section className="panel service-distribution"><span className="chart-eyebrow">TIPOLOGIA DI SERVIZIO</span><h2>Dove spedisco di più?</h2>{[['regional','Regionali',data.regional_count],['external','Fuori regione',data.external_count]].map(([type,label,count])=><button type="button" className="volume-row" key={type} aria-pressed={selectedType===type} onClick={()=>setSelectedType(type)}><span>{label}</span><meter min="0" max={Math.max(1,data.total)} value={count} aria-label={`${label}: ${count} su ${data.total}`}/><strong>{count}</strong></button>)}<div className="service-detail" role="status"><strong>{selectedType==='regional'?'Regionali':'Fuori regione'}</strong><p>{selectedType==='regional'?data.regional_count:data.external_count} richieste su {data.total} nel periodo selezionato.</p></div><p className="muted small">Include tutte le richieste, anche annullate o rifiutate. Il servizio è sempre Rete EA-Express.</p></section>
      <TrendChart key={`months-${data.from}-${data.to}`} summary={data.chart_summaries.months} title="Come cambia il volume di lavoro?" description={data.comparison_note} points={data.months.map(point=>({...point,date:point.month}))} monthly bars series={[{key:'shipments',label:'Ordini',color:'#203f54'}]}/></div>
    </>}</State>
  </>;
}
