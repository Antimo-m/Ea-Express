import { Link, useParams } from "react-router";
import { request } from "../api/client";
import { useApi } from "../hooks/useApi";
import { Header, State, Empty } from "../components/UI";
import { date, money } from "../utils/format";

const loadPending = ({ id }) => request(`/pending/${id}`);
export default function PendingDetailPage() {
  const { id } = useParams();
  const resource = useApi(loadPending, { id }, false, 30000);
  return <>
    <Header title="Dettaglio sospeso" description="Consulta il saldo e lo storico dei pagamenti registrati da EA Express." />
    <Link to="/pending">Torna ai sospesi</Link>
    <State resource={resource}>{({ data: account }) => <>
      <article className="panel">
        <p className="eyebrow">{account.direction === "incoming" ? "In entrata" : "In uscita"} · {account.direction_label}</p>
        <h2>{account.subject}</h2><p>{account.description}</p>
        <dl className="facts">
          <div><dt>Importo</dt><dd>{money(account.amount_cents)}</dd></div>
          <div><dt>Già saldato</dt><dd>{money(account.settled_cents)}</dd></div>
          <div><dt>Residuo</dt><dd>{account.state === "cancelled" ? "Annullato" : money(account.remaining_cents)}</dd></div>
          <div><dt>Stato</dt><dd>{account.status_label}</dd></div>
          <div><dt>Data</dt><dd>{date(account.occurred_on)}</dd></div>
          {account.due_on && <div><dt>Scadenza</dt><dd>{date(account.due_on)}</dd></div>}
          {account.settled_at && <div><dt>Saldato il</dt><dd>{date(account.settled_at, true)}</dd></div>}
        </dl>
      </article>
      <section className="panel"><h2>Storico pagamenti</h2>
        {account.settlements.length ? account.settlements.map(payment => <div key={payment.id}>
          <p><strong>{money(payment.amount_cents)}</strong> · {date(payment.created_at, true)}</p>
          {payment.updated_at !== payment.created_at && <p className="muted">Aggiornato il {date(payment.updated_at, true)}</p>}
        </div>) : <Empty title="Nessun pagamento registrato" text="Qui troverai i pagamenti registrati da EA Express." />}
      </section>
    </>}</State>
  </>;
}
