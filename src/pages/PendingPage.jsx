import MetricTile from '../components/MetricTile';
import DataPanel from '../components/DataPanel';
import FilterToolbar from "../components/FilterToolbar";
import { Link, useSearchParams } from "react-router";
import { request, query } from "../api/client";
import { useApi } from "../hooks/useApi";
import { Header, State, Empty, Pagination, Field } from "../components/UI";
import { date, money } from "../utils/format";
const loadPending = params => request(`/pending${query(params)}`);
export default function PendingPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") || "open";
  const direction = params.get("direction") || "";
  const resource = useApi(loadPending, { page: params.get("page") || 1, view, direction }, false, 30000);
  return <>
    <Header title="Sospesi" description="Somme da pagare o ricevere, con residui e storico aggiornati." />
    <FilterToolbar key={params.toString()} onApply={setParams} onReset={() => setParams({})} count={Number(view !== 'open') + Number(Boolean(direction))}
      primary={<><Field label="Stato del sospeso"><select name="view" defaultValue={view}><option value="open">Aperti</option><option value="history">Storico · saldati e annullati</option><option value="all">Tutti</option></select></Field><Field label="Direzione"><select name="direction" defaultValue={direction}><option value="">Tutte</option><option value="incoming">In entrata · Devi pagare EA Express</option><option value="outgoing">In uscita · EA Express deve pagarti</option></select></Field></>}/>
    <State resource={resource}>{data => <>
      <section className="pending-metrics" aria-label="Residui aperti">
        <MetricTile label="Devi pagare EA-EXPRESS" value={money(data.totals.incoming)} icon="arrow-up-right" note="Residuo dei sospesi aperti in entrata per EA-EXPRESS" tone="attention" />
        <MetricTile label="EA-EXPRESS deve pagarti" value={money(data.totals.outgoing)} icon="arrow-down-left" note="Residuo dei sospesi aperti in uscita per EA-EXPRESS" />
      </section>
      {data.data.length ? data.data.map(account => <DataPanel key={account.slug} title={account.subject} description={account.description} className="pending-account-panel" actions={<span className="status">{account.status_label}</span>} footer={<Link className="back-link" to={`/pending/${account.slug}`}>Dettaglio e storico pagamenti →</Link>}>
        <dl className="facts">
          <div><dt>Importo</dt><dd>{money(account.amount_cents)}</dd></div>
          <div><dt>Già saldato</dt><dd>{money(account.settled_cents)}</dd></div>
          <div><dt>Residuo</dt><dd>{account.state === "cancelled" ? "Annullato" : money(account.remaining_cents)}</dd></div>
          <div><dt>Direzione per EA-EXPRESS</dt><dd>{account.direction_label}</dd></div>
          <div><dt>Data</dt><dd>{date(account.occurred_on)}</dd></div>
          {account.due_on && <div><dt>Scadenza</dt><dd>{date(account.due_on)}</dd></div>}
        </dl>
      </DataPanel>) : <Empty title="Nessun sospeso" text="Non risultano sospesi per i filtri selezionati." icon="hourglass" />}
      <Pagination meta={data.meta} onPage={page => { const next = new URLSearchParams(params); next.set("page", page); setParams(next); }} />
    </>}</State>
  </>;
}
