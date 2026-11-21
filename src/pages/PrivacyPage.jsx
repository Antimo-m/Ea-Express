import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Brand from '../components/Brand';
import PrivacyLinks from '../components/PrivacyLinks';
import { Feedback, Icon } from '../components/UI';
import { request } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import '../styles/privacy.css';

const browserGuides = [
  ['Google Chrome', 'https://support.google.com/chrome/answer/95647?hl=it'],
  ['Mozilla Firefox', 'https://support.mozilla.org/it/kb/clear-cookies-and-site-data-firefox'],
  ['Apple Safari', 'https://support.apple.com/it-it/guide/safari/sfri11471/mac'],
  ['Microsoft Edge', 'https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09'],
];

function formatDate(value) {
  const date = value ? new Date(`${value}T00:00:00`) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : value;
}

function Section({ id, title, children }) {
  return <section id={id} aria-labelledby={`${id}-title`}><h2 id={`${id}-title`}>{title}</h2>{children}</section>;
}

function Contents({ sections }) {
  return <nav className="privacy-toc" aria-label="Indice della pagina">
    <p>Indice</p>
    <ol>{sections.map(([id, title]) => <li key={id}><a href={`#${id}`}>{title}</a></li>)}</ol>
  </nav>;
}

function ControllerFacts({ controller }) {
  const facts = [['Titolare', controller?.name], ['Sede legale', controller?.address], ['Partita IVA', controller?.vat], ['Contatto privacy', controller?.email]].filter(([, value]) => value);
  if (!facts.length) return <p>Il titolare del trattamento è il gestore del servizio EA-Express. Per qualsiasi richiesta sui tuoi dati puoi scriverci dalla sezione <strong>Messaggi</strong> del portale.</p>;
  return <dl className="privacy-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{label === 'Contatto privacy' ? <a href={`mailto:${value}`}>{value}</a> : value}</dd></div>)}</dl>;
}

function CookiePolicy({ policy, busy, notice, onReset }) {
  const sections = [
    ['introduzione', 'Introduzione'], ['cosa-sono', 'Cosa sono i cookie'], ['prima-terze-parti', 'Cookie di prima e di terze parti'],
    ['sessione-persistenti', 'Cookie di sessione e persistenti'],
    ['funzionali', 'Preferenze e memorizzazione locale'], ['analitici', 'Cookie analitici'], ['marketing', 'Cookie di marketing e profilazione'],
    ['servizi-esterni', 'Servizi esterni'], ['preferenze', 'Gestione delle preferenze'], ['browser', 'Eliminare o bloccare i cookie'],
    ['aggiornamenti', 'Aggiornamenti e Privacy Policy'],
  ];
  return <>
    <Contents sections={sections}/>
    <Section id="introduzione" title="Introduzione">
      <p>Questa Cookie Policy descrive come il portale clienti EA-Express utilizza i cookie e le tecnologie analoghe quando accedi, prenoti un ritiro o consulti le tue spedizioni. Integra la <Link to="/privacy">Privacy Policy</Link>, alla quale rimandiamo per tutte le informazioni sul trattamento dei dati personali.</p>
      <p>EA-Express utilizza esclusivamente strumenti tecnici, necessari al funzionamento del servizio. Non utilizziamo cookie pubblicitari, di profilazione o di analisi statistica.</p>
    </Section>
    <Section id="cosa-sono" title="Cosa sono i cookie">
      <p>Un cookie è un piccolo file di testo che un sito salva sul tuo computer o smartphone durante la navigazione e che il browser rinvia al sito nelle visite successive. Permette, ad esempio, di riconoscere una sessione di accesso già avviata.</p>
      <p>Esistono anche tecnologie analoghe, come il <em>localStorage</em> del browser, che consentono di conservare piccole informazioni sul dispositivo. In questa pagina le descriviamo insieme ai cookie.</p>
    </Section>
    <Section id="prima-terze-parti" title="Cookie di prima e di terze parti">
      <p>I <strong>cookie di prima parte</strong> sono impostati direttamente dal sito che stai visitando e solo quel sito può leggerli. I <strong>cookie di terze parti</strong> sono impostati da servizi esterni integrati nella pagina.</p>
      <p>I cookie utilizzati dal portale sono di prima parte e vengono impostati dal server EA-Express.</p>
    </Section>
    <Section id="sessione-persistenti" title="Cookie di sessione e persistenti">
      <p>I <strong>cookie di sessione</strong> servono a mantenere l’accesso mentre usi il portale e scadono dopo un periodo di inattività o alla chiusura del browser. I <strong>cookie persistenti</strong> restano sul dispositivo per un periodo determinato: nel portale ne utilizziamo uno solo, quando scegli «Ricordami» durante l’accesso.</p>
    </Section>
    <Section id="funzionali" title="Preferenze e memorizzazione locale">
      <ul>
        <li><strong>Preferenze dell’account:</strong> tema chiaro o scuro, suoni delle notifiche, preferenze di comunicazione e indirizzo di ritiro preferito vengono salvati nel tuo account sul server, non nel browser. Puoi modificarli in qualsiasi momento dal portale.</li>
        <li><strong>localStorage:</strong> il portale salva gli identificatori delle notifiche già segnalate e l’impostazione dei suoni, per evitare avvisi ripetuti tra più schede aperte. Questi dati non contengono indirizzi né testi dei messaggi.</li>
        <li><strong>Memoria della pagina:</strong> i dati di un modulo di prenotazione restano disponibili solo finché la pagina è aperta e vengono eliminati quando la ricarichi o la chiudi.</li>
      </ul>
    </Section>
    <Section id="analitici" title="Cookie analitici">
      <p>EA-Express non utilizza cookie analitici né strumenti di statistica sulla navigazione, propri o di terze parti.</p>
    </Section>
    <Section id="marketing" title="Cookie di marketing e profilazione">
      <p>EA-Express non utilizza cookie pubblicitari, pixel di tracciamento o strumenti di profilazione. Le informazioni raccolte durante la navigazione non vengono usate per mostrarti pubblicità.</p>
    </Section>
    <Section id="servizi-esterni" title="Servizi esterni">
      <ul>
        <li><strong>Notifiche in tempo reale:</strong> gli aggiornamenti delle spedizioni arrivano tramite una connessione autenticata al server EA-Express. Non utilizziamo geolocalizzazione né mappe di terze parti.</li>
        <li><strong>Caratteri e icone:</strong> sono serviti direttamente da EA-Express, senza richieste a servizi esterni.</li>
        {policy.security_check && <li><strong>Verifica di sicurezza:</strong> quando il sistema rileva tentativi di accesso sospetti può chiederti di completare una verifica anti-bot fornita da Cloudflare Turnstile. Il servizio viene caricato soltanto in quel momento e tratta dati tecnici del dispositivo al solo scopo di distinguere persone e programmi automatici.</li>}
      </ul>
    </Section>
    <Section id="preferenze" title="Gestione delle preferenze">
      <p>Poiché utilizziamo soltanto strumenti tecnici, non ti chiediamo di accettare categorie facoltative di cookie e non mostriamo un banner di consenso. Se in futuro introdurremo strumenti facoltativi, resteranno disattivati finché non avrai espresso una scelta libera, che potrai modificare in qualsiasi momento.</p>
      <p>Puoi cancellare le informazioni salvate nel browser e ripristinare il tema chiaro e i suoni disattivati senza uscire dal tuo account.</p>
      <button className="button secondary" disabled={busy} onClick={onReset}>{busy ? 'Ripristino…' : 'Ripristina preferenze tecniche'}</button>
      {notice && <p role="status">{notice}</p>}
    </Section>
    <Section id="browser" title="Eliminare o bloccare i cookie">
      <p>Puoi eliminare i cookie già presenti sul dispositivo cancellando i dati di navigazione del browser e puoi impostare il browser per bloccarli. Bloccare i cookie tecnici del portale impedisce però l’accesso al tuo account e la prenotazione dei ritiri.</p>
      <ul className="privacy-browser-list">{browserGuides.map(([name, url]) => <li key={name}><a href={url} target="_blank" rel="noopener noreferrer">{name}</a></li>)}</ul>
      <p>Per approfondire puoi consultare le <a href="https://www.garanteprivacy.it/faq/Cookie" target="_blank" rel="noopener noreferrer">domande frequenti sui cookie del Garante per la protezione dei dati personali</a>.</p>
    </Section>
    <Section id="aggiornamenti" title="Aggiornamenti e Privacy Policy">
      <p>Aggiorneremo questa pagina ogni volta che cambieranno gli strumenti utilizzati dal portale. La data dell’ultima revisione è indicata in alto.</p>
      <p>Per conoscere quali dati personali trattiamo e come esercitare i tuoi diritti consulta la <Link to="/privacy">Privacy Policy</Link>.</p>
    </Section>
  </>;
}

function PrivacyPolicy({ policy }) {
  const sections = [
    ['introduzione', 'Introduzione'], ['titolare', 'Titolare del trattamento'], ['dati', 'Dati che trattiamo'], ['finalita', 'Perché utilizziamo i dati'],
    ['destinatari', 'Chi può accedere ai dati'], ['conservazione', 'Conservazione e sicurezza'], ['diritti', 'I tuoi diritti'], ['cookie', 'Cookie'], ['modifiche', 'Modifiche'],
  ];
  return <>
    <Contents sections={sections}/>
    <Section id="introduzione" title="Introduzione">
      <p>Questa Privacy Policy spiega quali dati personali vengono trattati quando utilizzi il portale clienti EA-Express per prenotare ritiri, seguire le spedizioni e comunicare con il servizio.</p>
      {policy.privacy_url && /^https:\/\//i.test(policy.privacy_url) && <p><a href={policy.privacy_url} rel="noopener noreferrer">Leggi l’informativa completa del titolare</a></p>}
    </Section>
    <Section id="titolare" title="Titolare del trattamento"><ControllerFacts controller={policy.controller}/></Section>
    <Section id="dati" title="Dati che trattiamo">
      <ul>
        <li><strong>Dati dell’account:</strong> nome e cognome o denominazione dell’attività, indirizzo email, tipologia di mittente e descrizione dell’attività. La password è conservata esclusivamente in forma cifrata non reversibile.</li>
        <li><strong>Informazioni di contatto:</strong> email e recapiti telefonici indicati per organizzare ritiri e consegne.</li>
        <li><strong>Indirizzi di mittenti e destinatari:</strong> indirizzi di ritiro e di consegna, nominativi e recapiti dei destinatari che inserisci nelle prenotazioni.</li>
        <li><strong>Informazioni sugli ordini:</strong> numero e tipologia dei colli, contenuto dichiarato, valore indicato, fasce orarie, note e tariffa applicata.</li>
        <li><strong>Informazioni operative:</strong> stati della spedizione, rider assegnato, storico degli eventi, etichette ed eventuali segnalazioni relative alla consegna.</li>
        <li><strong>Comunicazioni:</strong> messaggi scambiati con EA-Express dal portale e notifiche relative alle tue spedizioni.</li>
        <li><strong>Dati tecnici e di sicurezza:</strong> cookie di sessione, codici di verifica temporanei e registri degli eventi di accesso, nei quali l’indirizzo IP è conservato in forma pseudonimizzata.</li>
      </ul>
    </Section>
    <Section id="finalita" title="Perché utilizziamo i dati">
      <ul>
        <li>Creare e gestire il tuo account e verificare la tua identità all’accesso.</li>
        <li>Organizzare ritiri e consegne, assegnare le spedizioni ai rider e generare le etichette.</li>
        <li>Inviarti email e notifiche sullo stato delle spedizioni, in base alle preferenze che hai scelto.</li>
        <li>Rispondere ai messaggi e gestire le segnalazioni relative alle consegne.</li>
        <li>Gestire la contabilità del servizio, incluse le tariffe e le posizioni economiche delle spedizioni.</li>
        <li>Proteggere il portale da accessi non autorizzati e utilizzi abusivi.</li>
      </ul>
      <p>I dati non vengono utilizzati per finalità pubblicitarie né per profilazione.</p>
    </Section>
    <Section id="destinatari" title="Chi può accedere ai dati">
      <p>I dati sono accessibili al personale amministrativo di EA-Express e, per le sole spedizioni loro assegnate, ai rider incaricati del ritiro e della consegna. Possono inoltre essere trattati dai fornitori tecnici che ospitano il servizio e recapitano le email, esclusivamente per queste attività. I dati non vengono venduti né ceduti a terzi per finalità commerciali.</p>
    </Section>
    <Section id="conservazione" title="Conservazione e sicurezza">
      <p>I dati dell’account e delle spedizioni restano associati al tuo account per il tempo necessario a fornire il servizio. I registri degli eventi di sicurezza vengono eliminati automaticamente dopo {policy.security_log_days || 14} giorni.</p>
      <p>Le comunicazioni con il portale avvengono tramite connessione cifrata. L’accesso è protetto da password e da un codice di verifica inviato via email; le sessioni vengono revocate al cambio della password.</p>
    </Section>
    <Section id="diritti" title="I tuoi diritti">
      <p>In base al Regolamento (UE) 2016/679 (GDPR) puoi chiedere l’accesso ai tuoi dati, la loro rettifica o cancellazione, la limitazione del trattamento, la portabilità e puoi opporti al trattamento nei casi previsti. Hai inoltre il diritto di proporre reclamo al <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">Garante per la protezione dei dati personali</a>.</p>
      <p>{policy.controller?.email ? <>Per esercitare i tuoi diritti scrivi a <a href={`mailto:${policy.controller.email}`}>{policy.controller.email}</a>.</> : <>Per esercitare i tuoi diritti scrivici dalla sezione <strong>Messaggi</strong> del portale.</>}</p>
    </Section>
    <Section id="cookie" title="Cookie">
      <p>Il portale utilizza solo cookie tecnici necessari all’accesso e alla sicurezza. I dettagli sono descritti nella <Link to="/cookies">Cookie Policy</Link>.</p>
      <p>L’accettazione delle condizioni del servizio e la consultazione di questa informativa sono operazioni distinte: leggere questa pagina non equivale alla firma di un contratto.</p>
    </Section>
    <Section id="modifiche" title="Modifiche">
      <p>Potremo aggiornare questa Privacy Policy per riflettere modifiche del servizio. La data dell’ultima revisione è indicata in alto.</p>
    </Section>
  </>;
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
    <header className="privacy-header"><Link to={user ? '/dashboard' : '/login'}><Brand caption="PORTALE CLIENTI"/></Link><Link className="icon-button action-back page-back-icon" to={user ? '/dashboard' : '/login'} aria-label="Torna indietro" data-tooltip="Torna indietro"><span className="action-icon" aria-hidden="true"><Icon name="arrow-left"/></span></Link></header>
    <main className="privacy-content">
      <span className="eyebrow">{privacy ? 'PROTEZIONE DEI DATI' : 'COOKIE E TECNOLOGIE ANALOGHE'}</span>
      <h1>{privacy ? 'Privacy Policy' : 'Cookie Policy'}</h1>
      {policy && <p className="privacy-updated">Ultimo aggiornamento: <time dateTime={policy.updated_at || policy.version}>{formatDate(policy.updated_at || policy.version)}</time>{!policy.reviewed && ' · Versione per la fase di test del servizio'}</p>}
      <Feedback error={error}/>
      {!policy && !error && <p role="status">Caricamento…</p>}
      {policy && (privacy ? <PrivacyPolicy policy={policy}/> : <CookiePolicy policy={policy} busy={busy} notice={notice} onReset={resetPreferences}/>)}
    </main><footer><PrivacyLinks/></footer>
  </div>;
}
