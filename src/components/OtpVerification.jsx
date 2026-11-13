import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { otpStatus, sendOtp } from "../api/auth";
import { Feedback, Field, Form, Icon } from "./UI";

const RESEND_SECONDS = 60;

function waitLabel(seconds) {
  return seconds < 60 ? `${seconds} secondi` : `${Math.ceil(seconds / 60)} minuti`;
}

export default function OtpVerification() {
  const { confirmDevice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(location.state?.message || null);
  const sending = useRef(false);
  const [resendAt, setResendAt] = useState(() => Date.now() + (location.state?.retryAfter || RESEND_SECONDS) * 1000);
  const [now, setNow] = useState(Date.now);
  const remaining = Math.max(0, Math.ceil((resendAt - now) / 1000));
  useEffect(() => {
    let active = true;
    otpStatus()
      .then((result) => {
        if (!active) return;
        if (!result.pending) {
          navigate("/login", { replace: true, state: { message: "La verifica non è più attiva. Accedi di nuovo per ricevere un nuovo codice." } });
          return;
        }
        setEmail(result.email);
        setChecking(false);
      })
      .catch((error) => {
        if (!active) return;
        setError(error);
        setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);
  useEffect(() => {
    if (!remaining) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);
  async function submit(event) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await confirmDevice({ code: new FormData(event.currentTarget).get("code").trim() });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(error);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  async function resend() {
    if (sending.current || remaining) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await sendOtp();
      setSuccess(result.message);
      setNow(Date.now());
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
    } catch (error) {
      setError(error);
      if (error.status === 429) {
        setNow(Date.now());
        setResendAt(Date.now() + (error.retryAfter || RESEND_SECONDS) * 1000);
      }
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <h2>Conferma il tuo accesso</h2>
      <p className="muted">
        {email ? <>Abbiamo inviato un codice di 6 cifre a <strong>{email}</strong>.</> : "Abbiamo inviato un codice di 6 cifre alla tua email."}{" "}
        Lo chiediamo solo al primo accesso da questo dispositivo.
      </p>
      <Feedback success={success} error={error} />
      <Form errors={error?.errors} onSubmit={submit} aria-busy={busy || checking} data-otp-verification>
        <Field
          label="Codice di verifica"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          minLength={6}
          maxLength={6}
          required
          autoFocus
          help="Il codice scade dopo pochi minuti. Controlla anche la posta indesiderata."
        />
        <button className="button full" disabled={busy || checking}>
          {busy ? "Attendi…" : "Conferma e accedi"}
          <Icon name="arrow-right" />
        </button>
        <button type="button" className="button secondary full" onClick={resend} disabled={busy || checking || remaining > 0}>
          <Icon name="arrow-clockwise" /> {remaining > 0 ? `Invia un nuovo codice tra ${waitLabel(remaining)}` : "Invia un nuovo codice"}
        </button>
      </Form>
      <p className="auth-switch">
        <Link className="back-link" to="/login">Torna all’accesso</Link>
      </p>
    </>
  );
}
