import { useEffect, useState } from "react";
import { request, query } from "../api/client";
import { money } from "../utils/format";
export default function ShippingQuote({ city, postal, zone, street }) {
 const [result,setResult]=useState(null);
 useEffect(()=>{let active=true;const timer=setTimeout(()=>{if(!city.trim() || !/^[0-9]{5}$/.test(postal)) return; request(`/rates/quote${query({city,postal_code:postal,zone,street})}`).then(data=>{if(active)setResult({city,postal,zone,street,data});}).catch(()=>{if(active)setResult({city,postal,zone,street,data:{available:false,reason:'Tariffa da verificare. Servizio temporaneamente non disponibile.'}});});},350);return()=>{active=false;clearTimeout(timer);};},[city,postal,zone,street]);
 const current=result?.city===city && result?.postal===postal && result?.zone===zone && result?.street===street?result.data:null;
 return <div className="quote-preview" role="status"><strong>{current?.available?`Prezzo spedizione previsto: ${money(current.price_cents)}`:current?.reason || 'Inserisci comune e CAP per calcolare la tariffa.'}</strong>{current?.available && <><p>{current.delivery_time || 'Tempi da verificare'}</p><small>{current.reason} Il rider verificherà la richiesta.</small></>}</div>;
}
