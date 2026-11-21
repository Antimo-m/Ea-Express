import { Link } from "react-router";
import Brand from "../components/Brand";
import PrivacyLinks from "../components/PrivacyLinks";
import { Icon } from "../components/UI";
import { useAuth } from "../hooks/useAuth";
import { usePlatform } from "../hooks/usePlatform";
import "../styles/privacy.css";
import "../styles/beta.css";

export default function BetaTermsPage() {
  const { user } = useAuth();
  const { beta, terms, terms_version: version } = usePlatform();
  const back = user ? "/dashboard" : "/register";
  return (
    <div className="privacy-page">
      <header className="privacy-header privacy-header--stacked"><Link to={back}><Brand caption="PORTALE CLIENTI" /></Link></header>
      <nav className="page-back beta-back" aria-label="Navigazione pagina"><Link className="icon-button action-back page-back-icon" to={back} aria-label={user ? "Torna alla panoramica" : "Torna alla registrazione"} data-tooltip="Torna indietro"><span className="action-icon" aria-hidden="true"><Icon name="arrow-left" /></span></Link></nav>
      <main className="privacy-content beta-terms">
        <span className="eyebrow">VERSIONE BETA</span>
        <h1>Condizioni d’uso della beta</h1>
        {beta ? (
          <>
            <p className="privacy-lead">Versione {version}. Leggi queste condizioni prima di registrarti: la registrazione richiede di accettarle.</p>
            <ol>{terms.map((section) => <li key={section.title}><h2>{section.title}</h2><p>{section.body}</p></li>)}</ol>
          </>
        ) : <p className="privacy-lead">La fase beta è conclusa: si applicano le condizioni del servizio ufficiale.</p>}
        <PrivacyLinks />
      </main>
    </div>
  );
}
