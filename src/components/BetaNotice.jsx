import { Link } from "react-router";
import { useContext } from "react";
import { usePlatform } from "../hooks/usePlatform";
import { FormErrorsContext } from "../context/FormErrorsContext";
import { Icon } from "./UI";
import "../styles/beta.css";

export function BetaBanner() {
  const { beta } = usePlatform();
  if (!beta) return null;
  return (
    <aside className="beta-banner" role="note" data-beta-banner>
      <Icon name="flask" />
      <p>
        <strong>Versione beta.</strong> EA-Express è in prova: servizio sperimentale e gratuito. Nessun pagamento o accordo passa tramite il portale.{" "}
        <Link to="/condizioni-beta">Condizioni della beta</Link>
      </p>
    </aside>
  );
}

export function BetaStrip() {
  const { beta } = usePlatform();
  if (!beta) return null;
  return (
    <p className="beta-strip" data-beta-strip>
      <strong>BETA</strong> Servizio sperimentale e gratuito · tariffe indicative · <Link to="/condizioni-beta">condizioni</Link>
    </p>
  );
}

export function IndicativePriceNote() {
  const { beta } = usePlatform();
  if (!beta) return null;
  return <p className="beta-price-note" data-indicative-price><Icon name="info-circle" /> Tariffa indicativa · nessun pagamento tramite l’app durante la beta.</p>;
}

export function Consent({ name, children }) {
  const errors = useContext(FormErrorsContext);
  const error = errors[name];
  const id = `consent-${name}`;
  return (
    <div className="consent">
      <label htmlFor={id}>
        <input id={id} type="checkbox" name={name} value="1" required aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} />
        <span>{children}</span>
      </label>
      {error && <small className="field-error" id={`${id}-error`} role="alert">{Array.isArray(error) ? error.join(" ") : error}</small>}
    </div>
  );
}
