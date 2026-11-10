import { useSearchParams } from 'react-router';
import IconButton from '../components/IconButton';
import { Header, State } from '../components/UI';
import { useApi } from '../hooks/useApi';
import { getLabels } from '../api/shipments';
import { Label } from './LabelPage';

function Documents({ selection }) {
  const resource = useApi(getLabels, selection);
  return <State resource={resource} notFound>{data => data.data?.length
    ? <div className="label-batch"><div className="print-toolbar"><Header title="Etichette di spedizione" description={`${data.data.length} spedizioni selezionate`}><IconButton action="back" to="/shipments" label="Torna alle spedizioni" /><IconButton action="print-multiple" label="Stampa tutte le etichette" onClick={() => window.print()} /></Header></div>{data.data.map(order => <Label key={order.slug} order={order} showTools={false} />)}</div>
    : <p role="status">Al momento non ci sono ordini da stampare</p>}</State>;
}

export default function LabelsPage() {
  const [params] = useSearchParams();
  const ids = params.getAll('ids[]');
  const selection = ids.length ? {ids} : Object.fromEntries(params);
  return ids.length || (params.get('scope') === 'filtered' && params.get('day')) ? <Documents selection={selection} /> : <><Header title="Etichette di spedizione" backTo="/shipments" /><p role="status">Al momento non ci sono ordini da stampare</p></>;
}
