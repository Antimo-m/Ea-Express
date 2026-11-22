import { useEffect, useMemo, useRef, useState } from "react";
import { sendFeedback } from "../api/workspace";
import { compressImage } from "../utils/compress-image";
import IconButton from "../components/IconButton";
import { Feedback, Field, Form, Header, Icon } from "../components/UI";

/** Limiti uguali a quelli del server (FeedbackReportRequest), applicati dopo la compressione delle immagini. */
const MaxFiles = 4;
const MaxFileBytes = 5 * 1024 * 1024;
const MaxTotalBytes = 12 * 1024 * 1024;
const Allowed = /\.(jpe?g|png|webp|gif|heic|pdf|txt)$/i;
const categories = [
  ["problem", "bug", "Problema o bug"],
  ["suggestion", "lightbulb", "Suggerimento"],
  ["other", "chat-square-text", "Altro"],
];
const size = bytes => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
const fileIcon = file => /\.pdf$/i.test(file.name) ? "file-earmark-pdf" : /\.txt$/i.test(file.name) ? "file-earmark-text" : "file-earmark-image";

function Thumb({ file, previews, className }) {
  const url = previews.get(file);
  return url ? <img className={className} src={url} alt="" /> : <span className={`${className} feedback-file-icon`} aria-hidden="true"><Icon name={fileIcon(file)} /></span>;
}

function Caption({ file }) {
  return <span className="feedback-file-text"><strong title={file.name}>{file.name}</strong><small>{size(file.size)}</small></span>;
}

/** Un solo allegato: anteprima al centro della casella. Due o più: miniature compatte in fila sotto la casella. */
function FileList({ files, previews, onRemove }) {
  if (files.length < 2) return null;
  return (
    <ul className="feedback-files is-strip" aria-live="polite" aria-label={`${files.length} allegati selezionati`}>
      {files.map((file, index) => (
        <li className="feedback-file" key={`${file.name}-${file.size}-${file.lastModified}`} style={{ "--file-index": index }}>
          <Thumb file={file} previews={previews} className="feedback-file-thumb" />
          <Caption file={file} />
          <IconButton action="delete" icon="x-lg" className="feedback-file-remove" label={`Rimuovi ${file.name}`} onClick={() => onRemove(file)} />
        </li>
      ))}
    </ul>
  );
}

function Dropzone({ files, onChange, error, processing, onProcessing }) {
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState("");
  const input = useRef(null);
  const previews = useMemo(() => new Map(files.filter(file => file.type.startsWith("image/") && !/heic/i.test(file.type)).map(file => [file, URL.createObjectURL(file)])), [files]);
  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);
  const remove = file => { setProblem(""); onChange(files.filter(candidate => candidate !== file)); input.current?.focus(); };
  const single = files.length === 1 ? files[0] : null;
  async function add(incoming) {
    const next = [...files];
    const problems = [];
    const accepted = incoming.filter(file => Allowed.test(file.name) || !problems.push(`${file.name}: formato non supportato.`));
    onProcessing(true);
    const prepared = await Promise.all(accepted.map(compressImage)).finally(() => onProcessing(false));
    for (const file of prepared) {
      if (next.length >= MaxFiles) { problems.push(`Puoi allegare al massimo ${MaxFiles} file.`); break; }
      if (file.size > MaxFileBytes) { problems.push(`${file.name}: supera ${size(MaxFileBytes)}.`); continue; }
      if (next.reduce((sum, current) => sum + current.size, 0) + file.size > MaxTotalBytes) { problems.push(`Gli allegati insieme possono pesare al massimo ${size(MaxTotalBytes)}.`); break; }
      if (!next.some(current => current.name === file.name && current.size === file.size && current.lastModified === file.lastModified)) next.push(file);
    }
    setProblem([...new Set(problems)].join(" "));
    onChange(next);
  }
  // Un file lasciato fuori dalla casella non deve aprirsi nel browser facendo perdere il modulo.
  useEffect(() => {
    const guard = event => { if (event.dataTransfer?.types?.includes("Files")) event.preventDefault(); };
    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    return () => { window.removeEventListener("dragover", guard); window.removeEventListener("drop", guard); };
  }, []);
  const message = problem || error;
  return (
    <div className="field">
      <span className="field-label" id="feedback-files-label">Allegati (facoltativo)</span>
      <label
        className={`feedback-dropzone ${dragging ? "is-dragging" : ""} ${files.length >= MaxFiles ? "is-full" : ""} ${processing ? "is-processing" : ""} ${single ? "has-single" : ""}`}
        onDragEnter={event => { event.preventDefault(); setDragging(true); }}
        onDragOver={event => { event.preventDefault(); setDragging(true); }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
        onDrop={event => { event.preventDefault(); setDragging(false); add([...(event.dataTransfer?.files || [])]); }}
      >
        <input ref={input} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.pdf,.txt,image/*,application/pdf,text/plain" aria-labelledby="feedback-files-label" aria-describedby="feedback-files-help" onChange={event => { add([...event.currentTarget.files]); event.currentTarget.value = ""; }} />
        <span className="feedback-dropzone-icon" aria-hidden="true"><Icon name="cloud-arrow-up" /></span>
        {single && (
          <span className="feedback-dropzone-preview" aria-live="polite">
            <Thumb file={single} previews={previews} className="feedback-preview-media" />
            <Caption file={single} />
            <IconButton action="delete" icon="x-lg" className="feedback-file-remove" label={`Rimuovi ${single.name}`} onClick={event => { event.preventDefault(); event.stopPropagation(); remove(single); }} />
          </span>
        )}
        <strong>{processing ? "Ottimizzazione delle immagini…" : single ? "Aggiungi altri file" : "Trascina qui foto o file"}</strong>
        {!single && <span>oppure <u>scegli dal dispositivo</u> · puoi selezionarne più di uno</span>}
      </label>
      <small id="feedback-files-help" className="field-help">Fino a {MaxFiles} file: immagini, PDF o TXT, massimo {size(MaxFileBytes)} ciascuno ({size(MaxTotalBytes)} in totale). Le foto vengono alleggerite automaticamente per un invio più rapido.</small>
      {message && <small className="field-error" role="alert">{message}</small>}
      <FileList files={files} previews={previews} onRemove={remove} />
    </div>
  );
}

export default function FeedbackPage() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [processing, setProcessing] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy || processing) return;
    const data = new FormData(event.currentTarget);
    files.forEach(file => data.append("attachments[]", file, file.name));
    data.append("client", `${navigator.userAgent} · schermo ${window.screen.width}×${window.screen.height} · finestra ${window.innerWidth}×${window.innerHeight}`.slice(0, 500));
    setError(null);
    setBusy(true);
    try {
      await sendFeedback(data);
      setFiles([]);
      setSent(true);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  const fileError = error?.errors && Object.entries(error.errors).filter(([key]) => key.startsWith("attachments")).flatMap(([, values]) => values).join(" ");
  return (
    <>
      <Header eyebrow="Aiutaci a migliorare" title="Feedback e segnalazioni" description="Hai trovato un problema o hai un’idea? Scrivici: la segnalazione arriva direttamente al team EA-Express." />
      <div className="feedback-page">
        {sent ? (
          <section className="panel feedback-sent" role="status" aria-live="polite">
            <span className="feedback-sent-icon" aria-hidden="true"><Icon name="send-check" /></span>
            <h2>Grazie, segnalazione inviata!</h2>
            <p>L’abbiamo ricevuta e la leggeremo al più presto. Se serve, ti risponderemo all’indirizzo email del tuo account.</p>
            <IconButton icon="arrow-repeat" text label="Invia un’altra segnalazione" onClick={() => setSent(false)} />
          </section>
        ) : (
          <Form errors={error?.errors} className="panel feedback-form" onSubmit={submit} aria-busy={busy || undefined}>
            <Feedback error={error?.status === 422 ? null : error} />
            <fieldset className="feedback-categories">
              <legend className="field-label">Di cosa si tratta?<span className="required-mark" aria-hidden="true"> *</span></legend>
              {categories.map(([value, icon, label]) => (
                <label className="feedback-category" key={value}>
                  <input type="radio" name="category" value={value} defaultChecked={value === "problem"} required />
                  <span><Icon name={icon} />{label}</span>
                </label>
              ))}
            </fieldset>
            <Field label="Oggetto" name="subject" required minLength={3} maxLength={120} placeholder="Es. Non riesco a stampare l’etichetta" />
            <Field label="Descrizione" name="message" help="Cosa stavi facendo, cosa ti aspettavi e cosa è successo invece.">
              <textarea name="message" rows={6} required minLength={10} maxLength={5000} placeholder="Più dettagli ci dai, prima riusciamo a risolvere." />
            </Field>
            <Field label="Pagina o sezione (facoltativo)" name="location" maxLength={200} placeholder="Es. Prenota un ritiro" />
            <Dropzone files={files} onChange={setFiles} error={fileError} processing={processing} onProcessing={setProcessing} />
            <div className="actions feedback-actions">
              <IconButton action="send" type="submit" text label={busy ? "Invio in corso…" : processing ? "Preparazione allegati…" : "Invia segnalazione"} loading={busy || processing} />
            </div>
          </Form>
        )}
      </div>
    </>
  );
}
