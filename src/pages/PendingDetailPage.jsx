import DataPanel from "../components/DataPanel";
import { useParams } from "react-router";
import { request } from "../api/client";
import { useApi } from "../hooks/useApi";
import { Header, State, Empty } from "../components/UI";
import { date, money } from "../utils/format";

const loadPending = ({ slug }) => request(`/pending/${slug}`);
export default function PendingDetailPage() {
  const { slug } = useParams();
  const resource = useApi(loadPending, { slug }, false, 30000);
  return <>
    <Header backTo="/pending" title="Dettaglio sospeso" description="Consulta il saldo e lo storico dei pagamenti registrati da EA Express." />
    <State resource={resource}>{({ data: account }) => <>
      <DataPanel title={account.subject} description={account.description} className="pending-account-panel" actions={<span className="status">{account.status_label}</span>}>
        <dl className="facts">
          <div><dt>Importo</dt><dd>{money(account.amount_cents)}</dd></div>
          <div><dt>Già saldato</dt><dd>{money(account.settled_cents)}</dd></div>
          <div><dt>Residuo</dt><dd>{account.state === "cancelled" ? "Annullato" : money(account.remaining_cents)}</dd></div>
          <div><dt>Direzione per EA-Express</dt><dd>{account.direction_label}</dd></div>
          <div><dt>Data</dt><dd>{date(account.occurred_on)}</dd></div>
          {account.due_on && <div><dt>Scadenza</dt><dd>{date(account.due_on)}</dd></div>}
          {account.settled_at && <div><dt>Saldato il</dt><dd>{date(account.settled_at, true)}</dd></div>}
        </dl>
      </DataPanel>
      <DataPanel title="Storico pagamenti" description="Pagamenti effettivamente registrati da EA-Express, separati dalla gestione del credito.">
        {account.settlements.length ? account.settlements.map(payment => <article className="settlement-row" key={payment.slug}>
          <strong>{money(payment.amount_cents)}</strong><time dateTime={payment.created_at}>{date(payment.created_at, true)}</time>
          {payment.updated_at !== payment.created_at && <p className="muted">Aggiornato il {date(payment.updated_at, true)}</p>}
        </article>) : <Empty title="Nessun pagamento registrato" text="Qui troverai i pagamenti registrati da EA Express." />}
      </DataPanel>
    </>}</State>
  </>;
}
