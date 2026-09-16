import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  updateProfile,
  updatePassword,
  updatePreferences,
  me,
} from "../api/auth";
import SenderFields from "../components/SenderFields";
import { Header, Field, Feedback, Icon, Form } from "../components/UI";
function AccountForm({ kind, user, onUpdate }) {
  const [error, setError] = useState(null),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (kind === "preferences") {
      data.notify_orders = data.notify_orders === "on";
      data.notify_messages = data.notify_messages === "on";
    }
    if (data.email) data.email = data.email.toLowerCase().trim();
    setError(null);
    setSuccess("");
    setBusy(true);
    try {
      const result = await {
        profile: updateProfile,
        password: updatePassword,
        preferences: updatePreferences,
      }[kind](data);
      setSuccess(result.message);
      if (kind === "password") form.reset();
      else {
        const result = await me();
        onUpdate(result.user);
      }
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Form
      errors={error?.errors}
      className="panel account-form"
      onSubmit={submit}
    >
      <h2>
        {kind === "profile"
          ? "Dati del mittente"
          : kind === "password"
            ? "Proteggi il tuo accesso"
            : "Scegli cosa ricevere"}
      </h2>
      {kind === "profile" ? (
        <>
          <SenderFields identity={user} />
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={user.email}
            required
            autoComplete="email"
          />
        </>
      ) : kind === "password" ? (
        <>
          <Field
            label="Password attuale"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Field
            label="Nuova password (almeno 12 caratteri)"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
          />
          <Field
            label="Conferma nuova password"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
          />
        </>
      ) : (
        <>
          <p className="muted">
            Queste preferenze controllano le notifiche nel portale.
          </p>
          <label className="preference">
            <span>
              <strong>Aggiornamenti sulle spedizioni</strong>
              <small>Stato, presa in carico e consegna.</small>
            </span>
            <input
              type="checkbox"
              name="notify_orders"
              defaultChecked={user.notify_orders ?? true}
            />
          </label>
          <label className="preference">
            <span>
              <strong>Messaggi del corriere</strong>
              <small>Una notifica quando arriva un nuovo messaggio.</small>
            </span>
            <input
              type="checkbox"
              name="notify_messages"
              defaultChecked={user.notify_messages ?? true}
            />
          </label>
        </>
      )}
      <Feedback error={error} success={success} />
      <button className="button" disabled={busy}>
        <Icon name="check2" />
        {busy ? "Salvataggio…" : "Salva modifiche"}
      </button>
    </Form>
  );
}
export default function ProfilePage({ settings = false }) {
  const { user, setUser } = useAuth();
  return (
    <>
      <Header
        title={settings ? "A modo tuo." : "Il tuo profilo."}
        description={
          settings
            ? "Gestisci le preferenze del tuo spazio di lavoro."
            : "Aggiorna i tuoi dati e la sicurezza dell’account."
        }
      />
      <div className="profile-grid">
        {settings ? (
          <AccountForm kind="preferences" user={user} onUpdate={setUser} />
        ) : (
          <>
            <AccountForm kind="profile" user={user} onUpdate={setUser} />
            <AccountForm kind="password" user={user} onUpdate={setUser} />
          </>
        )}
      </div>
    </>
  );
}
