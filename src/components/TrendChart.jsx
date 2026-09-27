import { useId, useRef, useState, useEffect } from 'react';
import { money, chartDate } from '../utils/format';

const number = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 });
export default function TrendChart({ title, description, points, series, currency = false, summary, monthly = false, bars = false }) {
  const id = useId();
  const plot = useRef(null);
  const [width, setWidth] = useState(680);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [hidden, setHidden] = useState([]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(plot.current);
    return () => observer.disconnect();
  }, []);
  const visible = series.filter(line => !hidden.includes(line.key));
  const format = value => currency ? money(value) : number.format(value);
  const formatAxis = value => currency && Math.abs(value) >= 100000 && value % 100 === 0 ? `${number.format(value / 100)} €` : format(value);
  const fallback = summary?.peak?.date || points.find(point => visible.some(line => point[line.key]))?.date || points[0]?.date;
  const activeDate = hovered || selected || fallback;
  const activeIndex = Math.max(0, points.findIndex(point => point.date === activeDate));
  const active = points[activeIndex];
  const hasData = points.some(point => visible.some(line => point[line.key]) || (currency && point.delivered));
  const values = points.flatMap(point => visible.map(line => Number(point[line.key] || 0)));
  const low = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, maximum)));
  const high = Math.ceil(maximum / (magnitude / 5)) * (magnitude / 5);
  const height = width < 480 ? 220 : 240;
  const left = currency ? 70 : 42;
  const right = width - 20;
  const top = 18;
  const bottom = height - 38;
  const step = (right - left) / Math.max(1, points.length);
  const x = index => bars ? left + (index + .5) * step : left + index / Math.max(1, points.length - 1) * (right - left);
  const y = value => bottom - (Number(value || 0) - low) / Math.max(1, high - low) * (bottom - top);
  const ticks = [...new Set([low, Math.round((low + high) / 2), high])];
  const labelCount = Math.min(points.length, Math.max(2, Math.floor((right - left) / (monthly ? 95 : 80))));
  const labels = new Set(Array.from({ length: labelCount }, (_, index) => Math.round(index * (points.length - 1) / Math.max(1, labelCount - 1))));
  const select = index => { setSelected(points[index]?.date); setHovered(null); };
  const keydown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : Math.max(0, Math.min(points.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
    select(next);
    plot.current.querySelector(`[data-point-index="${next}"]`)?.focus();
  };
  const pointAtPointer = event => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relative = (event.clientX - bounds.left - left) / (right - left);
    return Math.max(0, Math.min(points.length - 1, bars ? Math.floor(relative * points.length) : Math.round(relative * (points.length - 1))));
  };
  return <section className="panel trend-panel interactive-trend" data-chart={currency ? 'revenue' : monthly ? 'months' : 'orders'}>
    <header className="trend-heading"><div><span className="chart-eyebrow">{monthly ? 'CONFRONTO DEI MESI' : currency ? 'RICAVI DEL NEGOZIO' : 'VOLUME DI LAVORO'}</span><h2 id={id}>{title}</h2></div>{summary && <div className="trend-total"><span>Totale periodo</span><strong>{format(summary.total)}</strong></div>}</header>
    <p className="muted small" id={`${id}-description`}>{description}</p>
    {summary?.peak && <p className="chart-peak"><i className="bi bi-graph-up-arrow" aria-hidden="true"/>{monthly ? 'Mese più attivo' : currency ? 'Miglior giorno' : 'Giorno più attivo'}: <strong>{chartDate(summary.peak.date, monthly)}</strong><span>{format(summary.peak.value)}{currency ? '' : ' ordini'}</span></p>}
    <div className="chart-legend">{series.map(line => series.length > 1 ? <button type="button" key={line.key} aria-pressed={!hidden.includes(line.key)} onClick={() => setHidden(previous => previous.includes(line.key) ? previous.filter(key => key !== line.key) : visible.length > 1 ? [...previous, line.key] : previous)}><i style={{background:line.color}}/>{line.label}</button> : <span key={line.key}><i style={{background:line.color}}/>{line.label}</span>)}</div>
    <div className="interactive-plot" ref={plot}>
      {hasData ? <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-labelledby={`${id} ${id}-description`} onPointerMove={event => setHovered(points[pointAtPointer(event)]?.date)} onPointerLeave={() => setHovered(null)} onPointerDown={event => select(pointAtPointer(event))}>
        <title>{title}. Seleziona un punto o usa il cursore sotto il grafico.</title>
        <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={visible[0].color} stopOpacity=".2"/><stop offset="100%" stopColor={visible[0].color} stopOpacity=".02"/></linearGradient></defs>
        {ticks.map(value => <g key={value}><line x1={left} x2={right} y1={y(value)} y2={y(value)} className="chart-gridline"/><text x={left - 10} y={y(value) + 4} textAnchor="end" className="chart-tick">{formatAxis(value)}</text></g>)}
        {!bars && currency && <polygon points={`${x(0)},${y(0)} ${points.map((point,index)=>`${x(index)},${y(point[visible[0].key])}`).join(' ')} ${x(points.length-1)},${y(0)}`} fill={`url(#${id}-fill)`}/>}
        {!bars && visible.map(line => <polyline key={line.key} data-chart-series={line.key} fill="none" stroke={line.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points.map((point,index) => `${x(index)},${y(point[line.key])}`).join(' ')}/>)}
        <line x1={x(activeIndex)} x2={x(activeIndex)} y1={top} y2={bottom} className="chart-selection-line"/>
        {points.map((point,index) => <g key={point.date} data-point-index={index} data-date={point.date} role="button" tabIndex={index===activeIndex?0:-1} aria-label={`${chartDate(point.date,monthly)}. ${visible.map(line=>`${line.label}: ${format(point[line.key] || 0)}`).join('. ')}`} aria-pressed={index===activeIndex} onFocus={()=>select(index)} onClick={()=>select(index)} onKeyDown={event=>keydown(event,index)}>
          <rect x={Math.max(left-10,x(index)-step/2)} y={top} width={Math.max(10,step)} height={bottom-top} className="chart-hit-target"/>
          {visible.map(line => bars ? <rect key={line.key} data-chart-series={line.key} x={x(index)-Math.min(54,step*.55)/2} y={Math.min(y(0),y(point[line.key]))} width={Math.min(54,step*.55)} height={Math.max(point[line.key]?2:0,Math.abs(y(0)-y(point[line.key])))} rx="5" fill={index===activeIndex?'#bc480d':line.color} className="chart-column"/> : <circle key={line.key} cx={x(index)} cy={y(point[line.key])} r={index===activeIndex?5:2.5} fill={line.color} stroke="white" strokeWidth="2" className="chart-dot"/>)}
        </g>)}
        {points.map((point,index)=>labels.has(index) && <text key={point.date} data-chart-label x={x(index)} y={height-10} textAnchor={index===0?'start':index===points.length-1?'end':'middle'} className="chart-tick">{chartDate(point.date,monthly,true)}</text>)}
      </svg> : <div className="chart-empty"><i className="bi bi-bar-chart" aria-hidden="true"/><strong>{currency?'Nessuna consegna completata':'Nessun ordine'} nel periodo</strong><p>Prova a scegliere un altro intervallo.</p></div>}
    </div>
    {hasData && active && <>
      <div className="chart-detail" role="status" aria-live="polite" aria-atomic="true"><div><span>{monthly?'Mese selezionato':'Giorno selezionato'}</span><strong>{chartDate(active.date,monthly)}</strong></div><dl>{visible.map(line=><div key={line.key}><dt>{line.label}</dt><dd>{format(active[line.key] || 0)}</dd></div>)}{currency && <div><dt>Consegne completate</dt><dd>{number.format(active.delivered || 0)}</dd></div>}</dl></div>
      <div className="chart-selector"><label htmlFor={`${id}-selection`}>{monthly?'Mese':'Giorno'}</label><input id={`${id}-selection`} type="range" min="0" max={Math.max(0,points.length-1)} value={activeIndex} aria-valuetext={chartDate(active.date,monthly)} onChange={event=>select(Number(event.target.value))}/><span className="muted small">{monthly?'Tocca una barra':'Tocca un punto'} o sposta il cursore.</span></div>
    </>}
    <details className="chart-data"><summary>Consulta tutti i valori</summary><div className="table-scroll"><table><thead><tr><th>{monthly?'Mese':'Data ordine'}</th>{series.map(line => <th key={line.key}>{line.label}</th>)}</tr></thead><tbody>{points.map(point => <tr key={point.date}><th>{chartDate(point.date,monthly)}</th>{series.map(line => <td key={line.key}>{format(point[line.key] || 0)}</td>)}</tr>)}</tbody></table></div></details>
  </section>;
}
