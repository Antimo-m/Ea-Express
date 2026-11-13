import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { forgotPassword, resetPassword } from "../api/auth";
import { Feedback, Field, Form, Icon } from "./UI";

const MIN_PASSWORD = 12;

function useSubmission() {
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  useEffect(() => {
    if (!remaining) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);
  async function run(action) {
    if (sending.current || remaining) return null;
    sending.current = true;
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (error) {
      setError(error);
      if (error.status === 429) {
        setNow(Date.now());
        setRetryAt(Date.now() + (error.retryAfter || 60) * 1000);
      }
      return null;
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  return { busy, error, remaining, run };
}

function Wait({ seconds }) {
  if (!seconds) return null;
  return <p className="muted" role="status">Puoi riprovare tra {seconds < 60 ? `${seconds} secondi` : `${Math.ceil(seconds / 60)} minuti`}.</p>;
}

export function ForgotPasswordForm() {
  const { busy, error, remaining, run } = useSubmission();
  const [message, setMessage] = useState(null);
  async function submit(event) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "").trim().toLowerCase();
    setMessage(null);
    const result = await run(() => forgotPassword({ email }));
    if (result) setMessage(result.message);
  }
  return (
    <>
      <h2>Password dimenticata?</h2>
      <p className="muted">Inserisci l’email del tuo account: ti invieremo un link valido 15 minuti per sceglierne una nuova.</p>
      <Feedback success={message} error={error} />
      <Form errors={error?.errors} onSubmit={submit} aria-busy={busy} data-password-recovery>
        <Field label="Email" name="email" type="email" autoComplete="username" required maxLength={255} autoFocus />
        <button className="button full" disabled={busy || remaining > 0}>{busy ? "Attendi…" : "Invia il link"}<Icon name="arrow-right" /></button>
        <Wait seconds={remaining} />
      </Form>
      <p className="auth-switch"><Link className="back-link" to="/login">Torna all’accesso</Link></p>
    </>
  );
}

function readLink() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return { token: params.get("token") || "", email: params.get("email") || "" };
}

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [link] = useState(readLink);
  const { busy, error, remaining, run } = useSubmission();
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);
  async function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = await run(() => resetPassword({ ...data, token: link.token, email: link.email }));
    if (result) navigate("/login", { replace: true, state: { message: result.message } });
  }
  if (!link.token || !link.email) {
    return (
      <>
        <h2>Link non valido</h2>
        <p className="muted">Il link di ripristino è incompleto o è già stato usato. Richiedine uno nuovo: vale 15 minuti.</p>
        <p className="auth-switch"><Link className="back-link" to="/forgot-password">Richiedi un nuovo link</Link></p>
      </>
    );
  }
  return (
    <>
      <h2>Scegli una nuova password</h2>
      <p className="muted">Account <strong>{link.email}</strong>. Dopo il salvataggio chiuderemo tutte le sessioni e al prossimo accesso ti chiederemo il codice di verifica.</p>
      <Feedback error={error} />
      {error?.errors?.email && <p className="muted"><Link to="/forgot-password">Richiedi un nuovo link</Link></p>}
      <Form errors={error?.errors} onSubmit={submit} aria-busy={busy} data-password-reset>
        <Field label="Nuova password" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} maxLength={72} required autoFocus help={`Almeno ${MIN_PASSWORD} caratteri.`} />
        <Field label="Conferma nuova password" name="password_confirmation" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} maxLength={72} required />
        <button className="button full" disabled={busy || remaining > 0}>{busy ? "Attendi…" : "Salva la nuova password"}<Icon name="arrow-right" /></button>
        <Wait seconds={remaining} />
      </Form>
    </>
  );
}
