import { displayName } from "../utils/format";
import { Link } from 'react-router';
import { useState } from 'react';
import IconButton from '../components/IconButton';
import TrendChart from '../components/TrendChart';
import { request, query } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Header, Field, State, Icon } from '../components/UI';
import { money, today } from '../utils/format';
const load = params => request(`/statistics${query(params)}`);
const percentage = value => value === null ? 'Nessuna base di confronto' : `${value > 0 ? '+' : ''}${value}% sul periodo precedente`;
export default function StatisticsPage() {
  const [filters,setFilters] = useState({period:'custom',from:today().slice(0,8)+'01',to:today()});
  const resource = useApi(load,filters,true);
  return <>
    <Header eyebrow="LA TUA ATTIVITÀ" title="Statistiche e spese" description="Consegne, valore generato e costi: l’andamento della tua attività con EA Express."/>
    <form className="statistics-filters" aria-label="Periodo delle statistiche" onSubmit={event => {event.preventDefault();setFilters({...Object.fromEntries(new FormData(event.currentTarget)),period:'custom'});}}>
      <Field name="from" label="Data iniziale" type="date" defaultValue={filters.from} required/>
      <Field name="to" label="Data finale" type="date" defaultValue={filters.to} required/>
      <IconButton action="search" label="Cerca nel periodo" type="submit"/>
    </form>
    <State resource={resource}>{data => <>
      <div className="statistics-context"><p>Ordini creati dal <strong>{data.from}</strong> al <strong>{data.to}</strong></p><span>Confronto: {data.previous_from} — {data.previous_to}</span></div>
      <div className="statistics-kpis">{[
        ['Ordini affidati',data.total,'box-seam','total'],['Consegne completate',data.delivered,'check2-circle','delivered'],['In corso',data.in_progress,'truck',null],['Annullati / rifiutati',data.cancelled,'x-circle',null],
        ['Valore dei pacchi',money(data.parcel_value_cents),'bag',null],['Costi spedizioni concordati',money(data.shipping_spend_cents),'receipt','shipping_spend_cents'],['Incasso lordo stimato',money(data.gross_cents),'cash-coin','gross_cents'],['Incasso netto stimato',money(data.net_cents),'wallet2','net_cents'],
      ].map(([label,value,icon,metric]) => <article className={`panel statistic-card ${metric === 'net_cents' ? 'statistic-highlight' : ''}`} key={label}><div><span>{label}</span><Icon name={icon}/></div><strong>{value}</strong><small>{metric ? percentage(data.changes[metric]) : label === 'Valore dei pacchi' ? 'Esclusi annullati e rifiutati' : 'Stato attuale delle richieste'}</small></article>)}</div>
      <section className="panel statistics-insight"><Icon name="graph-up-arrow"/><div><h2>Il valore delle consegne</h2><p>{data.delivered} ordini consegnati, pari al {data.completion_percent}% delle richieste del periodo. Il valore dichiarato delle consegne è {money(data.gross_cents)}; sottraendo {money(data.delivered_spend_cents)} di spedizioni, il netto stimato è <strong>{money(data.net_cents)}</strong>.</p><small>Le stime usano il valore merce dichiarato degli ordini consegnati: non attestano vendite o pagamenti ricevuti. {data.missing_values} consegne senza valore dichiarato; {data.unpriced} spedizioni senza prezzo definitivo. Le spese concordate includono anche gli ordini ancora in corso.</small></div></section>
      <div className="statistics-charts">
        <TrendChart title="Richieste e consegne" description="Ordini raggruppati per giorno di creazione; consegne aggiornate allo stato attuale." points={data.trend} series={[{key:'shipments',label:'Richieste',color:'#203f54'},{key:'delivered',label:'Consegnate',color:'#147451'}]}/>
        <TrendChart title="Incassi stimati e costi" description="Solo ordini consegnati, raggruppati per data di creazione." points={data.trend} currency series={[{key:'gross_cents',label:'Lordo',color:'#203f54'},{key:'shipping_cents',label:'Spedizione',color:'#b64012'},{key:'net_cents',label:'Netto',color:'#147451'}]}/>
      </div>
      <div className="statistics-charts"><section className="panel"><h2>Tipologia delle spedizioni</h2>{[['Regionali',data.regional_count],['Fuori regione',data.external_count]].map(([label,count])=><div className="volume-row" key={label}><span>{label}</span><meter min="0" max={Math.max(1,data.total)} value={count} aria-label={`${label}: ${count} su ${data.total}`}/><strong>{count}</strong></div>)}<p className="muted small">Include tutte le richieste, anche quelle annullate o rifiutate.</p></section>
      <section className="panel"><h2>Distribuzione per tariffa</h2>{data.prices.length ? <div className="statistics-tariffs">{data.prices.map(row=><button key={row.price_cents} className="tariff-chip" onClick={()=>setFilters({...filters,tariff:row.price_cents,detail_page:1})}>{money(Number(row.price_cents))} × {row.shipments} = <strong>{money(Number(row.total_cents))}</strong><span className="small"> Vedi ordini</span></button>)}</div> : <p className="muted">Nessuna tariffa concordata nel periodo.</p>}</section></div>
      {data.detail && <section className="panel"><h2>Spedizioni a {money(Number(filters.tariff))}</h2><p>{data.detail.total} spedizioni · pagina {data.detail.current_page} di {data.detail.last_page}</p>{data.detail.data.map(order=><p className="statistics-detail-row" key={order.id}><Link to={`/shipments/${order.id}`}>{displayName(order)}</Link><small className="order-code">{order.reference}</small> · {order.delivery_city} · <strong>{money(order.price_cents)}</strong></p>)}<div className="actions"><button className="button secondary" disabled={data.detail.current_page<=1} onClick={()=>setFilters({...filters,detail_page:data.detail.current_page-1})}>Precedente</button><button className="button secondary" disabled={data.detail.current_page>=data.detail.last_page} onClick={()=>setFilters({...filters,detail_page:data.detail.current_page+1})}>Successiva</button></div></section>}
    </>}</State>
  </>;
}
