import { Link, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '../components/UI';

/**
 * Pagina neutra per le risorse non consentite: nessun riferimento a ruoli, permessi o struttura interna.
 * «Torna indietro» usa la cronologia solo se esiste una pagina precedente del portale, altrimenti porta alla home.
 */
export default function UnavailablePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const home = user ? '/dashboard' : '/login';
  const goBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(home, { replace: true });
  };
  return <section className="not-found-page unavailable-page" aria-labelledby="unavailable-title">
    <span className="unavailable-mark" aria-hidden="true"><Icon name="exclamation-circle" /></span>
    <h1 id="unavailable-title">Pagina non disponibile</h1>
    <p>Non è possibile raggiungere la pagina richiesta. Torna alla pagina precedente oppure alla pagina iniziale.</p>
    <div className="actions">
      <button type="button" className="button secondary" onClick={goBack}><Icon name="arrow-left" /> Torna indietro</button>
      <Link className="button" to={home} replace>Pagina iniziale</Link>
    </div>
  </section>;
}
