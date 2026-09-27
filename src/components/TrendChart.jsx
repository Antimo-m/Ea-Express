import { useId } from 'react';
import { money } from '../utils/format';

export default function TrendChart({ title, description, points, series, currency = false }) {
  const id = useId();
  const values = points.flatMap(point => series.map(line => Number(point[line.key] || 0)));
  const low = Math.min(0, ...values);
  const high = Math.max(1, ...values);
  const y = value => 150 - (value - low) / (high - low) * 130;
  const x = index => 36 + index / Math.max(1, points.length - 1) * 620;
  const format = value => currency ? money(value) : value;
  return <section className="panel trend-panel">
    <h2 id={id}>{title}</h2><p className="muted small">{description}</p>
    <div className="chart-legend">{series.map(line => <span key={line.key}><i style={{background:line.color}}/>{line.label}</span>)}</div>
    <svg viewBox="0 0 680 185" role="img" aria-labelledby={id}>
      <title>{title}. Dati disponibili nella tabella sotto il grafico.</title>
      {[low, (low + high) / 2, high].map((value,index) => <g key={index}><line x1="36" x2="656" y1={y(value)} y2={y(value)} stroke="#dfe5eb"/><text x="36" y={y(value) - 4} fontSize="10" fill="#526273">{format(Math.round(value))}</text></g>)}
      {series.map(line => <g key={line.key}><polyline fill="none" stroke={line.color} strokeWidth="3" strokeLinejoin="round" points={points.map((point,index) => `${x(index)},${y(point[line.key] || 0)}`).join(' ')}/>{points.length === 1 && <circle cx={x(0)} cy={y(points[0][line.key] || 0)} r="4" fill={line.color}/>}</g>)}
      <text x="36" y="176" fontSize="11" fill="#526273">{points[0]?.date}</text><text x="656" y="176" textAnchor="end" fontSize="11" fill="#526273">{points.at(-1)?.date}</text>
    </svg>
    {!points.some(point => series.some(line => point[line.key])) && <p className="muted small">Nessun movimento nel periodo.</p>}
    <details className="chart-data"><summary>Consulta i dati giornalieri</summary><div className="table-scroll"><table><thead><tr><th>Data ordine</th>{series.map(line => <th key={line.key}>{line.label}</th>)}</tr></thead><tbody>{points.map(point => <tr key={point.date}><th>{point.date}</th>{series.map(line => <td key={line.key}>{format(point[line.key] || 0)}</td>)}</tr>)}</tbody></table></div></details>
  </section>;
}
