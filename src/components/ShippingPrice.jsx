import IconButton from "./IconButton";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { useRef, useState } from "react";
import { request } from "../api/client";
import { Feedback, KeyValues } from "./UI";
import { IndicativePriceNote } from "./BetaNotice";
import { money, date, displayName } from "../utils/format";
export default function ShippingPrice({order,reload}){
 const [rejectOpen,setRejectOpen]=useState(false);const lock=useRef(false);const [busy,setBusy]=useState(false);const [error,setError]=useState(null);
 if(order.pricing_version!==1)return null;
 async function respond(action){if(lock.current)return;lock.current=true;setBusy(true);setError(null);try{await request(`/orders/${order.slug}/price`,{method:'PATCH',data:{action,version:order.version}});reload();}catch(error){setError(error);if(action==='reject')throw error;}finally{lock.current=false;setBusy(false);}}
 // Stato e prezzo concordato arrivano dal backend: prima dell'accettazione del rider il prezzo finale è 0,00 €.
 const badge = <span className={`status price-state price-state--${order.price_tone || 'blue'}`}>{order.price_label}</span>;
 return <section className="panel price-panel" aria-labelledby="price-heading"><div className="section-heading"><h2 id="price-heading">Prezzo della spedizione</h2></div><KeyValues className="price-facts" items={[["Tariffa prevista", money(order.quoted_price_cents)], ["Stato prezzo", badge], ["Prezzo finale concordato", money(order.agreed_price_cents ?? 0)], ["Tempi di consegna", order.rate_snapshot?.delivery_time]]} /><IndicativePriceNote />{order.price_proposals?.map(proposal=><div className="price-proposal" key={proposal.slug}><strong>{money(proposal.price_cents)} · {({pending:'In attesa della tua risposta',accepted:'Accettata',rejected:'Rifiutata'})[proposal.state]}</strong><p>{proposal.reason}</p><small>{date(proposal.created_at,true)}</small></div>)}<Feedback error={error}/>{error?.status===409&&<button className="button secondary" onClick={reload}>Ricarica dati</button>}{order.price_state==='awaiting_customer' && order.status==='received' && <div className="actions action-pair"><button className="button" disabled={busy} onClick={()=>respond('accept')}>Accetta nuovo prezzo</button><IconButton action="delete" label="Rifiuta proposta" text disabled={busy} onClick={()=>setRejectOpen(true)} /></div>}<ConfirmDeleteModal onReload={reload} open={rejectOpen} name={displayName(order)} actionLabel="Rifiuta proposta" description="Confermi di voler rifiutare il prezzo proposto?" onClose={()=>setRejectOpen(false)} onConfirm={()=>respond('reject')} /></section>;
}
