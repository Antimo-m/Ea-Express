import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import BotChallenge from "../components/BotChallenge";
import IconButton from "../components/IconButton";
import SenderFields from "../components/SenderFields";
import Brand from "../components/Brand";
import PrivacyLinks from "../components/PrivacyLinks";
import { ApiError } from "../api/client";
import { validatePortalText } from "../services/text-policy";
import { normalizeSenderText } from "../utils/text-policy";
import { Field, Feedback, Icon, Form } from "../components/UI";
export default function AuthPage({ mode = "login" }) {
  const { user, authenticate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [challenge, setChallenge] = useState(null);
  const [botToken, setBotToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const sending = useRef(false);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  const create = mode === "register";
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault();
    if (sending.current || Date.now() < retryAt) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    const data = normalizeSenderText(Object.fromEntries(new FormData(event.currentTarget)));
    if (botToken) data["cf-turnstile-response"] = botToken;
    data.email = data.email.toLowerCase().trim();
    try {
      const errors = create ? await validatePortalText(data) : {};
      if (Object.keys(errors).length) {
        setError(new ApiError(422, errors));
        return;
      }
      const result = await authenticate(data, create);
      navigate(create ? "/login" : "/dashboard", { replace: true, state: create ? { message: result.message } : null });
    } catch (error) {
      setError(error);
      setBotToken("");
      if (error.botChallenge) setChallenge(error.botChallenge);
      else if (challenge) setChallenge({ ...challenge });
      if (error.status === 429) { setNow(Date.now()); setRetryAt(Date.now() + (error.retryAfter || 60) * 1000); }
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  return (
    <div className={`auth-shell portal-auth ${create ? 'is-registration' : 'is-login'}`}>
      <section className="auth-story">
        <Link to="/login" className="brand">
          <Brand />
        </Link>
        <div>
          <p className="eyebrow">EA-Express / PORTALE CLIENTI</p>
          <h1>
            Il tuo prossimo
            <br />
            ritiro.
            <br />
            <em>Sotto controllo.</em>
          </h1>
          <p>
            Ritiri, spedizioni e rider.
            <br />
            Tutto il tuo lavoro, in un unico spazio.
          </p>
          <div className="auth-route" aria-hidden="true">
            <span>
              <Icon name="shop" />
            </span>
            <i />
            <span>
              <Icon name="bicycle" />
            </span>
            <i />
            <span>
              <Icon name="geo-alt" />
            </span>
          </div>
        </div>
        <small>EA-Express · Portale per attività e privati</small>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <Link className="auth-mobile-brand" to="/login"><Brand caption="PORTALE CLIENTI" /></Link>
          <p className="auth-access-label"><Icon name="person-badge" /> Portale clienti</p>
          <h2>
            {create ? "Crea il tuo account" : "Accedi al tuo spazio"}
          </h2>
          <p className="muted">
            {create ? "Spedisci come attività o privato, da un unico account." : "Accedi e dai il via alla tua giornata."}
          </p>
          <Feedback success={location.state?.message} error={error} />
          <Form errors={error?.errors} onSubmit={submit} aria-busy={busy}>
            {create && <SenderFields />}
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={255}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete={create ? "new-password" : "current-password"}
              minLength={create ? 12 : undefined}
              required
            />
            {create && (
              <Field
                label="Conferma password"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            )}
            {challenge && <BotChallenge challenge={challenge} onToken={setBotToken} />}
            {create ? <IconButton action="add" type="submit" label="Crea account cliente" loading={busy} disabled={remaining > 0} /> : <button className="button full" disabled={busy || remaining > 0 || Boolean(challenge && !botToken)}>{busy ? "Attendi…" : "Accedi al tuo spazio"}<Icon name="arrow-right" /></button>}
            {remaining > 0 && <p className="muted" role="status">Puoi riprovare tra {remaining < 60 ? `${remaining} secondi` : `${Math.ceil(remaining / 60)} minuti`}.</p>}
          </Form>
          <p className="auth-switch">
            {mode === "login" ? (
              <>
                Non hai un account?{" "}
                <Link to="/register">Crea il tuo account</Link>
              </>
            ) : (
              <Link className="back-link" to="/login">Torna all’accesso</Link>
            )}
          </p>
          <PrivacyLinks />
        </div>
      </section>
    </div>
  );
}
