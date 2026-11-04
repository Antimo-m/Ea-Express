import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Brand from '../components/Brand';
import PrivacyLinks from '../components/PrivacyLinks';
import { Feedback, Icon } from '../components/UI';
import { request } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import '../styles/privacy.css';

function lifetime(cookie) {
  if (cookie.session_only) return 'Fino alla chiusura del browser';
  return cookie.minutes >= 1440 ? `${Math.round(cookie.minutes / 1440)} giorni` : `${cookie.minutes} minuti`;
}

export default function PrivacyPage({ privacy = false }) {
  const { user, updateDisplayPreferences } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    request('/privacy').then(data => {if (active) setPolicy(data);}).catch(failure => {if (active) setError(failure);});
    return () => {active = false;};
  }, []);
  async function resetPreferences() {
    setBusy(true); setError(null); setNotice('');
    try {
      if (user) await updateDisplayPreferences({theme: 'light', notification_sound: false});
      try {
        for (const key of Object.keys(localStorage)) {
          if (key === 'ea:theme' || key.startsWith('ea:notification-')) localStorage.removeItem(key);
        }
      } catch { /* Il browser può già bloccare la memorizzazione locale. */ }
      document.documentElement.dataset.eaTheme = 'light';
      setNotice('Preferenze ripristinate. Nessun consenso pubblicitario o statistico è attivo.');
    } catch (failure) {
      setError(failure);
    } finally {setBusy(false);}
  }
  return <div className="privacy-page">
    <header className="privacy-header"><Link to={user ? '/dashboard' : '/login'}><Brand caption="PORTALE CLIENTI"/></Link><Link className="button back-link" to={user ? '/dashboard' : '/login'}><Icon name="arrow-left"/> Torna indietro</Link></header>
    <main className="privacy-content">
      <span className="eyebrow">TRASPARENZA SUI TUOI DATI</span>
      <h1>{privacy ? 'Informativa privacy' : 'Cookie e preferenze'}</h1>
      <p className="privacy-lead">Il portale usa strumenti tecnici per accedere, prenotare e ricevere aggiornamenti. Nessuna pubblicità personalizzata, analytics o profilazione è attivata dal codice attuale.</p>
      <Feedback error={error}/>
      {!policy && !error && <p role="status">Caricamento della configurazione…</p>}
      {policy && <>
        {!policy.reviewed && <aside className="privacy-draft" role="note"><strong>Testo in attesa di verifica legale.</strong> I dati del titolare, i contatti e l’informativa generale devono essere completati e verificati prima della pubblicazione in produzione.</aside>}
        <section><h2>Chi gestisce i dati</h2><dl className="privacy-facts"><div><dt>Titolare</dt><dd>{policy.controller.name || 'Denominazione del titolare da fornire'}</dd></div><div><dt>Sede</dt><dd>{policy.controller.address || 'Sede del titolare da fornire'}</dd></div><div><dt>Contatti privacy</dt><dd>{policy.controller.email || 'Recapito privacy da fornire'}</dd></div></dl><p>Versione dell’informativa: {policy.version}. Il brand del servizio è EA-Express; la ragione sociale del titolare deve essere confermata.</p></section>
        {privacy ? <section><h2>Informativa generale sul servizio</h2><p>I dati dell’account e della prenotazione sono trattati per autenticare il cliente, organizzare ritiri e consegne e gestire comunicazioni e contabilità. Gli indirizzi dei destinatari restano associati agli ordini; il preferito contiene esclusivamente l’indirizzo di ritiro scelto dal cliente.</p>{policy.privacy_url && /^https:\/\//i.test(policy.privacy_url) ? <p><a href={policy.privacy_url} rel="noopener noreferrer">Leggi l’informativa completa del titolare</a></p> : <p>L’informativa completa del titolare non è ancora configurata. Devono essere specificati basi giuridiche, destinatari e responsabili, conservazione dei dati, eventuali trasferimenti, diritti e modalità di esercizio. Questo testo preparatorio non li sostituisce.</p>}<p>Il consenso ai cookie e l’accettazione delle condizioni del servizio sono operazioni distinte. La consultazione di questa informativa non costituisce una firma di un contratto.</p><Link to="/cookies">Consulta l’inventario dei cookie e degli strumenti tecnici</Link></section> : <>
          <section><h2>Cookie utilizzati</h2><p>Cookie di prima parte, impostati dal backend EA-Express. L’accesso del portale si basa su una sessione sul server: password e token di autenticazione non sono archiviati in localStorage.</p><div className="privacy-table-wrap"><table><caption>Inventario ricavato dalla configurazione attuale del server</caption><thead><tr><th>Nome</th><th>Finalità</th><th>Durata</th><th>Accesso JavaScript</th></tr></thead><tbody>{policy.cookies.map(cookie => <tr key={cookie.name}><th scope="row"><code>{cookie.name}</code></th><td>{cookie.purpose}</td><td>{lifetime(cookie)}{!cookie.session_only && cookie.name !== 'XSRF-TOKEN' && <small>Rinnovata con l’uso del servizio.</small>}</td><td>{cookie.http_only ? 'No · HttpOnly' : 'Sì · token tecnico CSRF'}</td></tr>)}</tbody></table></div><p>SameSite: <strong>{policy.same_site || 'non impostato'}</strong>. Trasmissione Secure: <strong>{policy.secure ? 'solo HTTPS' : 'non forzata in questo ambiente'}</strong>. In produzione il progetto abilita Secure per impostazione predefinita. I cookie sono inviati al dominio del backend configurato{policy.cookie_domain ? ` (${policy.cookie_domain})` : ''}.</p><p>La durata della sessione decorre dall’ultima attività. «Ricordami» è facoltativo e viene attivato solo su richiesta durante l’accesso. Il logout revoca l’accesso persistente sul browser utilizzato.</p></section>
          <section><h2>Preferenze e altri strumenti</h2><ul><li><strong>Account sul server:</strong> indirizzo di ritiro preferito, tema chiaro/scuro, suoni delle notifiche e preferenze di comunicazione. L’indirizzo rimane disponibile finché non lo modifichi o elimini. Puoi cambiare tema e suoni dai pulsanti del portale.</li><li><strong>localStorage tecnico:</strong> <code>ea:notification-seen:customer:&lt;slug&gt;</code>, fino a 1.000 identificatori opachi di notifiche, per evitare avvisi sonori ripetuti tra schede. Scade dopo 7 giorni dall’ultimo aggiornamento; i valori scaduti vengono ignorati al successivo utilizzo. Non contiene indirizzi o contenuti dei messaggi.</li><li><strong>Memoria della pagina:</strong> token CSRF e dati del form/riepilogo. Il ritorno dal checkout mantiene i dati; ricaricare o chiudere la pagina li elimina.</li><li><strong>sessionStorage e IndexedDB:</strong> nessun utilizzo rilevato nel codice applicativo. Font e icone sono serviti localmente.</li><li><strong>Aggiornamenti in tempo reale:</strong> connessione autenticata al servizio Reverb configurato da EA-Express; nessuna geolocalizzazione o mappa live. Non risultano SDK di analytics, pixel, script pubblicitari o cookie di terze parti nel codice del portale.</li></ul></section>
          <section id="preferenze"><h2>Le tue scelte</h2><p>Sono presenti solo strumenti tecnici e preferenze del servizio richieste dall’utente: non viene richiesto un consenso a categorie facoltative inesistenti. Per questo non mostriamo un banner «Accetta tutti». Il rifiuto del tracciamento pubblicitario è già rispettato, senza limitare accesso e prenotazioni.</p><p>Puoi eliminare i cookie dalle impostazioni del browser; eliminare o bloccare i cookie di sessione comporta un nuovo accesso o impedisce le funzioni autenticate. Puoi cancellare separatamente gli identificatori locali e ripristinare tema chiaro e audio disattivato.</p><button className="button secondary" disabled={busy} onClick={resetPreferences}>{busy ? 'Ripristino…' : 'Ripristina preferenze tecniche'}</button>{notice && <p role="status">{notice}</p>}<p>Se saranno introdotti strumenti facoltativi, dovranno restare bloccati fino a una scelta libera e granulare, con rifiuto e revoca accessibili e registrazione della versione dell’informativa e della scelta.</p><Link to="/privacy">Privacy Policy e diritti sui dati</Link></section>
          <section><h2>Fonti dell’informativa</h2><p><a href="https://www.garanteprivacy.it/faq/Cookie" target="_blank" rel="noopener noreferrer">FAQ cookie del Garante</a> · <a href="https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876" target="_blank" rel="noopener noreferrer">Linee guida cookie e strumenti di tracciamento</a> · <a href="https://www.edpb.europa.eu/documents/guideline/guidelines-052020-on-consent-under-regulation-2016679_en" target="_blank" rel="noopener noreferrer">Linee guida EDPB sul consenso</a>.</p></section>
        </>}
      </>}
    </main><footer><PrivacyLinks/></footer>
  </div>;
}
