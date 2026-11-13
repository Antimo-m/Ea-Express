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
      <header className="privacy-header"><Link to={back}><Brand caption="PORTALE CLIENTI" /></Link><Link className="button back-link" to={back}><Icon name="arrow-left" /> Torna indietro</Link></header>
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
