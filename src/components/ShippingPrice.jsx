import { useRef, useState } from "react";
import { request } from "../api/client";
import { Feedback } from "./UI";
import { money, date } from "../utils/format";
export default function ShippingPrice({order,reload}){
 const lock=useRef(false);const [busy,setBusy]=useState(false);const [error,setError]=useState(null);
 if(order.pricing_version!==1)return null;
 async function respond(action){if(lock.current)return;lock.current=true;setBusy(true);setError(null);try{await request(`/orders/${order.id}/price`,{method:'PATCH',data:{action,version:order.version}});reload();}catch(error){setError(error);}finally{lock.current=false;setBusy(false);}}
 return <section className="panel"><div className="section-heading"><h2>Prezzo della spedizione</h2><span className="status">{order.price_label}</span></div><div className="form-grid"><p>Tariffa iniziale<br/><strong>{money(order.quoted_price_cents)}</strong></p><p>Prezzo finale concordato<br/><strong>{money(order.price_cents)}</strong></p></div><p className="muted">{order.rate_snapshot?.delivery_time}</p>{order.price_proposals?.map(proposal=><div className="price-proposal" key={proposal.id}><strong>{money(proposal.price_cents)} · {({pending:'In attesa della tua risposta',accepted:'Accettata',rejected:'Rifiutata'})[proposal.state]}</strong><p>{proposal.reason}</p><small>{date(proposal.created_at,true)}</small></div>)}<Feedback error={error}/>{error?.status===409&&<button className="button secondary" onClick={reload}>Ricarica dati</button>}{order.price_state==='awaiting_customer' && order.status==='received' && <div className="actions"><button className="button" disabled={busy} onClick={()=>respond('accept')}>Accetta nuovo prezzo</button><button className="button secondary" disabled={busy} onClick={()=>respond('reject')}>Rifiuta proposta</button></div>}</section>;
}
