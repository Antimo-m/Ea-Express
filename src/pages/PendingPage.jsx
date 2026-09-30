import { Link, useSearchParams } from "react-router";
import { request, query } from "../api/client";
import { useApi } from "../hooks/useApi";
import { Header, State, Empty, Pagination } from "../components/UI";
import { date, money } from "../utils/format";
const loadPending = params => request(`/pending${query(params)}`);
export default function PendingPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") || "open";
  const direction = params.get("direction") || "";
  const resource = useApi(loadPending, { page: params.get("page") || 1, view, direction }, false, 30000);
  function filter(name, value) {
    const next = new URLSearchParams(params);
    next.set(name, value);
    next.delete("page");
    setParams(next);
  }
  return <>
    <Header title="Sospesi" description="Consulta le somme che devi ricevere o pagare. Entrata e uscita sono riferite a EA Express. Per chiarimenti contatta EA Express." />
    <div className="form-grid panel">
      <label>Periodo del sospeso<select value={view} onChange={event => filter("view", event.target.value)}><option value="open">Aperti</option><option value="history">Storico · saldati e annullati</option><option value="all">Tutti</option></select></label>
      <label>Direzione<select value={direction} onChange={event => filter("direction", event.target.value)}><option value="">Tutte</option><option value="incoming">In entrata · Devi pagare EA Express</option><option value="outgoing">In uscita · EA Express deve pagarti</option></select></label>
    </div>
    <State resource={resource}>{data => <>
      <div className="form-grid">
        <section className="panel"><h2>Devi pagare EA Express</h2><strong>{money(data.totals.incoming)}</strong><p className="muted">Residuo di tutti i sospesi aperti in entrata per EA Express.</p></section>
        <section className="panel"><h2>EA Express deve pagarti</h2><strong>{money(data.totals.outgoing)}</strong><p className="muted">Residuo di tutti i sospesi aperti in uscita per EA Express.</p></section>
      </div>
      {data.data.length ? data.data.map(account => <article className="panel" key={account.id}>
        <p className="eyebrow">{account.direction === "incoming" ? "In entrata" : "In uscita"} · {account.direction_label}</p>
        <h2>{account.subject}</h2><p>{account.description}</p>
        <dl className="facts">
          <div><dt>Importo</dt><dd>{money(account.amount_cents)}</dd></div>
          <div><dt>Già saldato</dt><dd>{money(account.settled_cents)}</dd></div>
          <div><dt>Residuo</dt><dd>{account.state === "cancelled" ? "Annullato" : money(account.remaining_cents)}</dd></div>
          <div><dt>Stato</dt><dd>{account.status_label}</dd></div>
          <div><dt>Data</dt><dd>{date(account.occurred_on)}</dd></div>
          {account.due_on && <div><dt>Scadenza</dt><dd>{date(account.due_on)}</dd></div>}
        </dl>
        <Link to={`/pending/${account.id}`}>Dettaglio e storico pagamenti</Link>
      </article>) : <Empty title="Nessun sospeso" text="Non risultano sospesi per i filtri selezionati." icon="hourglass" />}
      <Pagination meta={data.meta} onPage={page => { const next = new URLSearchParams(params); next.set("page", page); setParams(next); }} />
    </>}</State>
  </>;
}
