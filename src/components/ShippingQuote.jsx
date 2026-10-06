import { useEffect, useState } from 'react';
import { request, query } from '../api/client';
import { money } from '../utils/format';
export default function ShippingQuote({ city, postal, zone, street, shippingType = 'regional', weight, dimension, province, region, onPostalResolved }) {
  const [result, setResult] = useState(null);
  const key = JSON.stringify([city, postal, zone, street, shippingType, weight, dimension, province, region]);
  const valid = Boolean(city.trim()) && (!postal || /^\d{5}$/.test(postal));
  useEffect(() => {
    if (!valid) return;
    let active = true;
    let timeout;
    const timer = setTimeout(() => {
      timeout = setTimeout(() => { if (active) { active = false; setResult({key, error:true}); } }, 15000);
      request(`/rates/quote${query({city,postal_code:postal,zone,street,shipping_type:shippingType,weight_kg:weight,max_dimension_cm:dimension,province,region})}`)
        .then(data => { if (active) { setResult({key,data}); if (!postal && data.territory_valid && data.postal_code) onPostalResolved?.(data.postal_code); } })
        .catch(() => { if (active) setResult({key,error:true}); })
        .finally(() => clearTimeout(timeout));
    }, 350);
    return () => { active = false; clearTimeout(timer); clearTimeout(timeout); };
  }, [key, valid, city, postal, zone, street, shippingType, weight, dimension, province, region, onPostalResolved]);
  const current = result?.key === key ? result : null;
  const quote = current?.data;
  const available = quote?.available && Number.isInteger(quote.price_cents);
  const loading = valid && !current;
  return <div className="shipping-quote-summary" data-state={loading ? 'loading' : current?.error ? 'error' : available ? 'ready' : quote ? 'unavailable' : 'empty'} role="status" aria-live="polite" aria-busy={loading}>
    <strong>{!valid ? 'Completa la destinazione' : loading ? 'Ricalcolo tariffa…' : current.error ? 'Non è stato possibile calcolare la tariffa' : available ? money(quote.price_cents) : 'Tariffa non disponibile'}</strong>
    {!valid && <p>{!city.trim() ? 'Inserisci il comune di consegna. Il CAP viene risolto se univoco; altrimenti indica un CAP di 5 cifre.' : 'Inserisci un CAP valido di 5 cifre.'}</p>}
    {current?.error && <p>Verifica CAP e destinazione e riprova.</p>}
    {quote && !available && <p>{quote.reason || 'Nessuna tariffa compatibile nel listino.'}</p>}
    {available && <><p>{[city,province,`CAP ${quote.postal_code || postal}`].filter(Boolean).join(' · ')}</p>{(quote.area || quote.zone) && <p>{[quote.area,quote.zone].filter(Boolean).join(' · ')}</p>}<p>{shippingType === 'external' ? 'Fuori regione' : 'Regionale'} · Rete EA-Express</p><p>{quote.delivery_time || (quote.delivery_days_min ? `${quote.delivery_days_min}–${quote.delivery_days_max} giorni lavorativi dal ritiro` : 'Tempi da confermare')}</p>{quote.reason && <small>{quote.reason}</small>}</>}
  </div>;
}
