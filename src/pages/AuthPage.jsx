import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { forgotPassword, resetPassword } from "../api/auth";
import SenderFields from "../components/SenderFields";
import { Field, Feedback, Icon, Form } from "../components/UI";
export default function AuthPage({ mode = "login" }) {
  const { user, authenticate } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const create = mode === "register",
    forgot = mode === "forgot",
    reset = mode === "reset";
  if (user && !reset) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.email = data.email.toLowerCase().trim();
    try {
      if (forgot) {
        const result = await forgotPassword(data);
        setSuccess(
          result.message ||
            "Se l’account è disponibile, riceverai le istruzioni per recuperare la password.",
        );
      } else if (reset) {
        await resetPassword({ ...data, token: params.get("token") });
        setSuccess("Password aggiornata. Puoi accedere con la nuova password.");
      } else {
        await authenticate(data, create);
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-shell">
      <section className="auth-story">
        <Link to="/login" className="brand">
          <img src="/brand.svg" alt="" />
          <span>EA-Express</span>
        </Link>
        <div>
          <p className="eyebrow">DAL TUO NEGOZIO. A DESTINAZIONE.</p>
          <h1>
            Il prossimo passo
            <br />
            lo facciamo
            <br />
            <em>insieme.</em>
          </h1>
          <p>
            Ritiri, spedizioni e corrieri.
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
          <p className="eyebrow">BENVENUTO IN EA-EXPRESS</p>
          <h2>
            {create
              ? "Facciamo strada."
              : forgot
                ? "Recupera l’accesso"
                : reset
                  ? "Scegli una nuova password"
                  : "Bentornato."}
          </h2>
          <p className="muted">
            {create
              ? "Spedisci come attività o privato, da un unico account."
              : forgot
                ? "Inserisci l’email del tuo account cliente."
                : reset
                  ? "Usa almeno 12 caratteri per proteggere il tuo account."
                  : "Accedi e dai il via alla tua giornata."}
          </p>
          <Feedback error={error} success={success} />
          <Form errors={error?.errors} onSubmit={submit}>
            {create && <SenderFields />}
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={255}
              defaultValue={reset ? params.get("email") || "" : ""}
            />
            {!forgot && (
              <Field
                label="Password"
                name="password"
                type="password"
                autoComplete={
                  create || reset ? "new-password" : "current-password"
                }
                minLength={create || reset ? 12 : undefined}
                required
              />
            )}
            {(create || reset) && (
              <Field
                label="Conferma password"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            )}
            {mode === "login" && (
              <Link className="form-link" to="/forgot-password">
                Password dimenticata?
              </Link>
            )}
            <button
              className="button full"
              disabled={busy || (reset && !params.get("token"))}
            >
              {busy
                ? "Attendi…"
                : create
                  ? "Crea account cliente"
                  : forgot
                    ? "Invia istruzioni"
                    : reset
                      ? "Aggiorna password"
                      : "Accedi al tuo spazio"}
              <Icon name="arrow-right" />
            </button>
          </Form>
          <p className="auth-switch">
            {mode === "login" ? (
              <>
                Non hai un account?{" "}
                <Link to="/register">Crea il tuo account</Link>
              </>
            ) : (
              <Link to="/login">Torna all’accesso</Link>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
