import { useId } from 'react';

export default function DataPanel({ title, description, count, actions, footer, children, className = '' }) {
  const id = useId();
  return <section className={`data-panel ${className}`} aria-labelledby={id}>
    <header className="data-panel-heading"><div><h2 id={id}>{title} {count !== undefined && <span className="count-badge">{count}</span>}</h2>{description && <p>{description}</p>}</div>{actions && <div className="data-panel-actions">{actions}</div>}</header>
    <div className="data-panel-content">{children}</div>
    {footer && <footer className="data-panel-footer">{footer}</footer>}
  </section>;
}
