import { useEffect, useState } from "react";
import { listMessages, sendMessage, readMessages } from "../api/messages";
import { useApi } from "../hooks/useApi";
import { State, Feedback, Empty, Icon, Pagination } from "./UI";
import { date } from "../utils/format";
export default function MessageThread({ id }) {
  const [page, setPage] = useState(1);
  const resource = useApi(listMessages, { id, page });
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (
      resource.data?.data.some(
        (message) => message.sender === "courier" && !message.read_at,
      )
    )
      readMessages(id).catch(setError);
  }, [id, resource.data]);
  async function submit(event) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await sendMessage(id, body.trim());
      setBody("");
      setPage(1);
      resource.reload();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel conversation" id="conversation">
      <div className="section-heading">
        <div>
          <h2>
            <Icon name="chat-left-text" /> In contatto con il corriere
          </h2>
          <p className="muted">
            Una conversazione dedicata a questa spedizione.
          </p>
        </div>
        <button
          className="icon-button"
          aria-label="Aggiorna messaggi"
          onClick={resource.reload}
        >
          <Icon name="arrow-clockwise" />
        </button>
      </div>
      <State resource={resource}>
        {(data) => (
          <>
            <Pagination meta={data.meta} onPage={setPage} />
            <div className="messages" aria-label="Messaggi">
              {data.data.length ? (
                [...data.data].reverse().map((message) => (
                  <article
                    className={`message ${message.sender === "customer" ? "outgoing" : ""}`}
                    key={message.id}
                  >
                    <strong>
                      {message.sender === "customer" ? "Tu" : "Corriere"}
                    </strong>
                    <p>{message.body}</p>
                    <small>
                      {date(message.created_at, true)}
                      {message.sender === "customer" &&
                        ` · ${message.read_at ? "Letto" : "Inviato"}`}
                    </small>
                  </article>
                ))
              ) : (
                <Empty
                  icon="chat-dots"
                  title="La conversazione inizia qui"
                  text="Invia indicazioni o chiedi un aggiornamento sulla consegna."
                />
              )}
            </div>
          </>
        )}
      </State>
      <Feedback error={error} />
      <form className="message-compose" onSubmit={submit}>
        <label className="sr-only" htmlFor="message-body">
          Messaggio al corriere
        </label>
        <textarea
          id="message-body"
          rows={2}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          required
          placeholder="Scrivi un messaggio…"
        />
        <button className="button" disabled={busy || !body.trim()}>
          <Icon name="send" />
          {busy ? "Invio…" : "Invia"}
        </button>
      </form>
    </section>
  );
}
