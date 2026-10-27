import { Link } from 'react-router';
import { Icon } from './UI';

export default function MetricTile({ label, value, note, icon, tone = 'neutral', to, footer }) {
  const content = <><header><span>{label}</span>{icon && <Icon name={icon} />}</header><strong className="metric-tile-value">{value}</strong>{note && <p>{note}</p>}{footer && <footer>{footer}</footer>}</>;
  return to ? <Link to={to} className={`metric-tile metric-tile--${tone}`}>{content}</Link> : <article className={`metric-tile metric-tile--${tone}`}>{content}</article>;
}
