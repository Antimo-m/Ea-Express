import { useState } from 'react';
import IconButton from '../components/IconButton';
import TrendChart from '../components/TrendChart';
import { request, query } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Header, Field, State, Icon } from '../components/UI';
import { today } from '../utils/format';
const load = params => request(`/statistics${query(params)}`);
const percentage = value => value === null ? 'Nessuna base di confronto' : `${value > 0 ? '+' : ''}${value}% sul periodo precedente`;
export default function StatisticsPage() {
  const [filters,setFilters] = useState({period:'custom',from:today().slice(0,8)+'01',to:today()});
  const resource = useApi(load,filters,true);
  return <>
    <Header eyebrow="LA TUA ATTIVITÀ" title="Statistiche" description="Il volume di lavoro del tuo negozio: richieste, consegne e crescita nel tempo."/>
    <form className="statistics-filters" aria-label="Periodo delle statistiche" onSubmit={event => {event.preventDefault();setFilters({...Object.fromEntries(new FormData(event.currentTarget)),period:'custom'});}}>
      <Field name="from" label="Data iniziale" type="date" defaultValue={filters.from} required/>
      <Field name="to" label="Data finale" type="date" defaultValue={filters.to} required/>
      <IconButton action="search" label="Cerca nel periodo" type="submit"/>
    </form>
    <State resource={resource}>{data => <>
      <div className="statistics-context"><p>Ordini creati dal <strong>{data.from}</strong> al <strong>{data.to}</strong></p><span>Confronto: {data.previous_from} — {data.previous_to}</span></div>
      <div className="statistics-kpis">{[
        ['Ordini affidati',data.total,'box-seam','total'],['Consegne completate',data.delivered,'check2-circle','delivered'],['In corso',data.in_progress,'truck','in_progress'],['Annullati / rifiutati',data.cancelled,'x-circle','cancelled'],
      ].map(([label,value,icon,metric]) => <article className="panel statistic-card" key={label}><div><span>{label}</span><Icon name={icon}/></div><strong>{value}</strong><small>{percentage(data.changes[metric])}</small></article>)}</div>
      <section className="panel statistics-insight"><Icon name="graph-up-arrow"/><div><h2>Il lavoro del tuo negozio</h2><p>{data.delivered} ordini consegnati, pari al {data.completion_percent}% delle richieste del periodo. {data.in_progress} richieste sono ancora in corso.</p><small>Gli esiti rappresentano lo stato attuale degli ordini creati nel periodo selezionato.</small></div></section>
      <TrendChart title="Richieste e consegne" description="Ordini raggruppati per giorno di creazione; consegne aggiornate allo stato attuale." points={data.trend} series={[{key:'shipments',label:'Richieste',color:'#203f54'},{key:'delivered',label:'Consegnate',color:'#147451'}]}/>
      <div className="statistics-charts"><section className="panel"><h2>Tipologia delle spedizioni</h2>{[['Regionali',data.regional_count],['Fuori regione',data.external_count]].map(([label,count])=><div className="volume-row" key={label}><span>{label}</span><meter min="0" max={Math.max(1,data.total)} value={count} aria-label={`${label}: ${count} su ${data.total}`}/><strong>{count}</strong></div>)}<p className="muted small">Include tutte le richieste, anche quelle annullate o rifiutate.</p></section>
      <TrendChart title="Volumi mensili" description={data.comparison_note} points={data.months.map(point=>({date:point.month,shipments:point.shipments}))} series={[{key:'shipments',label:'Spedizioni',color:'#203f54'}]}/></div>
    </>}</State>
  </>;
}
