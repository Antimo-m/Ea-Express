import { useEffect, useState } from 'react';
import { request } from '../api/client';
import { trackingMessage, observeTracking } from '../services/tracking-state';
import { Icon } from './UI';

export default function LiveTracking({ orderId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => observeTracking({ request, path: `/orders/${orderId}/location`, orderId, onData: setData, onError: setError }), [orderId]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  const message = trackingMessage(data, now);
  const fresh = data?.location && now - Date.parse(data.location.recorded_at) < 90000;
  return <section className="tracking-panel" data-tracking-state={fresh ? 'live' : data?.state}>
    <header className="tracking-heading"><div><span className="eyebrow">LA TUA SPEDIZIONE</span><h2>Segui la consegna</h2></div><span className="tracking-state"><span className="live-dot"/>{fresh ? 'GPS live' : 'Tracking ordine'}</span></header>
    <div className="tracking-placeholder"><Icon name="geo-alt"/><strong>{message}</strong>{data?.location ? <p>Posizione GPS: {data.location.latitude.toFixed(5)}, {data.location.longitude.toFixed(5)}<br/>Precisione: {Math.round(data.location.accuracy)} m</p> : <p>La posizione sarà disponibile quando il Rider attiverà il GPS per questa consegna.</p>}</div>
    {error && <p className="tracking-error" role="status">{error.message}</p>}
    <footer className="tracking-footer"><strong>{data?.rider?.name || 'Rider da assegnare'}</strong><span>{data?.location ? `Ultimo aggiornamento ${new Date(data.location.recorded_at).toLocaleTimeString('it-IT')}` : message}</span></footer>
    {data && <div className="tracking-journey"><div><strong>01 · Ritiro</strong><p>{data.pickup.address}</p></div><div><strong>02 · Consegna</strong><p>{data.delivery.address}</p></div></div>}
  </section>;
}
