import { observeMessageReceipts } from "../services/message-receipts";
import { useEffect, useRef, useState } from "react";
import { listMessages, sendMessage, readMessages } from "../api/messages";
import { useApi } from "../hooks/useApi";
import { State, Feedback, Empty, Icon, Pagination } from "./UI";
import { date } from "../utils/format";
export default function MessageThread({ id }) {
  const [page, setPage] = useState(1);
  const resource = useApi(listMessages, { id, page }, true);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submission = useRef(null);
  const submitting = useRef(false);
  const list = useRef(null);
  const nearEnd = useRef(true);
  const [newMessages, setNewMessages] = useState(false);
  useEffect(() => {
    const container = list.current;
    if (!container || !resource.data) return;
    if (nearEnd.current) container.scrollTop = container.scrollHeight;
    return observeMessageReceipts(container, resource.data.data, (ids, state) => readMessages(id, ids, state), 'customer', setError);
  }, [id, resource.data]);
  useEffect(() => {
    const incoming = event => { if (event.detail.kind === 'messages' && event.detail.order_id === Number(id) && (!nearEnd.current || page !== 1)) setNewMessages(true); };
    window.addEventListener('ea:workspace-updated', incoming);
    return () => window.removeEventListener('ea:workspace-updated', incoming);
  }, [id, page]);
  async function submit(event) {
    event.preventDefault();
    if (!body.trim() || submitting.current) return;
    submitting.current = true;
    if (submission.current?.body !== body.trim()) submission.current = { body: body.trim(), key: crypto.randomUUID() };
    setBusy(true);
    setError(null);
    try {
      await sendMessage(id, body.trim(), submission.current.key);
      submission.current = null;
      setBody("");
      nearEnd.current = true;
      setPage(1);
      resource.reload();
    } catch (error) {
      setError(error);
    } finally {
      submitting.current = false;
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
            Una conversazione dedicata a questa spedizione. Il pagamento è confermato soltanto dalla registrazione dell’incasso nel gestionale.
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
            {newMessages && <button className="button secondary" onClick={() => { setPage(1); nearEnd.current = true; setNewMessages(false); list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }); }}>Vai ai nuovi messaggi ↓</button>}
            <div ref={list} className="messages" aria-label="Messaggi" onScroll={() => { const node = list.current; nearEnd.current = node.scrollHeight - node.scrollTop - node.clientHeight < 60; if (nearEnd.current && page === 1) setNewMessages(false); }}>
              {data.data.length ? (
                [...data.data].reverse().map((message) => (
                  <article
                    className={`message ${message.sender === "customer" ? "outgoing" : ""}`}
                    key={message.id}
                    data-message-id={message.id}
                  >
                    <strong>
                      {message.sender === "customer" ? "Tu" : "Corriere"}
                    </strong>
                    <p>{message.body}</p>
                    <small>
                      {date(message.created_at, true)}
                      {message.sender === "customer" &&
                        ` · ${message.read_at ? "Letto" : message.delivered_at ? "Consegnato" : "Inviato"}`}
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
