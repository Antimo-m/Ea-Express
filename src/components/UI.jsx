import { cloneElement, useContext, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { FormErrorsContext } from "../context/FormErrorsContext";
import { Link } from "react-router";
import { date, displayName } from "../utils/format";
import NotFoundPage from "../pages/NotFoundPage";
import UnavailablePage from "../pages/UnavailablePage";
import ShipmentRoute from "./ShipmentRoute";
import FirstShipment from "./FirstShipment";
export function Icon({ name, ...props }) {
  return <i className={`bi bi-${name}`} aria-hidden="true" {...props} />;
}
export function Header({
  eyebrow = "Il tuo spazio operativo",
  title,
  description,
  backTo,
  backLabel,
  toolbar,
  children,
}) {
  const back = backTo && (backLabel
    ? <Link className="icon-button action-back page-back-icon" to={backTo} aria-label={backLabel} data-tooltip={backLabel}><span className="action-icon" aria-hidden="true"><Icon name="arrow-left" /></span></Link>
    : <Link className="back-link" to={backTo}><Icon name="arrow-left"/> Torna indietro</Link>);
  return (
    <>
    {(back || toolbar) && <div className="page-toolbar">
      {back && <nav className="page-back" aria-label="Navigazione pagina">{back}</nav>}
      {toolbar && <div className="page-toolbar-actions">{toolbar}</div>}
    </div>}
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </header>
    </>
  );
}
/** Coppie etichetta–valore: mostra soltanto i dati realmente presenti, mai etichette vuote. */
export function KeyValues({ items, className = "", ...props }) {
  const rows = items.filter(([, value]) => value !== null && value !== undefined && value !== "" && value !== false);
  if (!rows.length) return null;
  return <dl className={`key-values ${className}`.trim()} {...props}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
/** Ultimo stato visto per ogni spedizione in questa sessione: l'effetto parte solo quando lo stato cambia davvero. */
const seenStatuses = new Map();
export function Status({ order }) {
  const badge = useRef(null);
  useEffect(() => {
    const previous = seenStatuses.get(order.slug);
    seenStatuses.set(order.slug, order.status);
    const node = badge.current;
    if (!node || !previous || previous === order.status) return;
    node.classList.remove("is-status-changed");
    void node.offsetWidth;
    node.classList.add("is-status-changed");
    const finish = event => { if (event.animationName === "status-glow") node.classList.remove("is-status-changed"); };
    node.addEventListener("animationend", finish);
    return () => node.removeEventListener("animationend", finish);
  }, [order.slug, order.status]);
  return (
    <span className="order-statuses">
      <span ref={badge} className={`status status-${order.status}`}>{order.status_label}</span>
    </span>
  );
}
/**
 * Priorità dell'ordine: rosso per urgente, verde per standard, sempre con l'etichetta testuale.
 * Mostrata solo quando il dato arriva dall'ordine; senza dato non si indovina.
 */
export function PriorityBadge({ urgency }) {
  if (!["urgent", "standard"].includes(urgency)) return null;
  const urgent = urgency === "urgent";
  return <span className={`priority-badge priority-badge--${urgency}`}><Icon name={urgent ? "lightning-charge-fill" : "check-circle"} />{urgent ? "Urgente" : "Standard"}</span>;
}
export function Empty({
  title = "Non c’è ancora nulla qui",
  text = "Le nuove attività compariranno in questa sezione.",
  children,
  icon = "box-seam",
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function Feedback({ error, success }) {
  const errorRef = useRef(null);
  const successRef = useRef(null);
  useEffect(() => {
    const messages = [successRef.current].filter(Boolean);
    messages.forEach(message => { message.hidden = false; });
    const timer = setTimeout(() => {
      messages.forEach(message => { message.hidden = true; });
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, success]);
  return (
    <>
      {error && (
        <div ref={errorRef} role="alert" className="alert error">
          <Icon name="exclamation-circle" />
          <div>
            {error.message}
            {Object.entries(error.errors || {}).length > 0 && (
              <ul>
                {Object.entries(error.errors).map(([key, values]) => (
                  <li key={key}>{values.join(" ")}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {success && (
        <div ref={successRef} className="alert success" role="status">
          <Icon name="check-circle" />
          {success}
        </div>
      )}
    </>
  );
}
/** Full-screen branded placeholder used while the session or the first bundle is loading. */
export function AppLoading({ label = "Caricamento del portale…" }) {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <span className="app-loading-mark" aria-hidden="true"><b>EA</b>-Express</span>
      <span className="app-loading-bar" aria-hidden="true"><span /></span>
      <span className="app-loading-label">{label}</span>
    </div>
  );
}

/** Skeleton with a delayed «slow network» hint, so long waits never look frozen. */
export function Loading({ rows = 3 }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="skeletons" role="status" aria-label="Caricamento in corso" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => <div key={index} />)}
      <span className={slow ? "skeleton-slow" : "sr-only"}>{slow ? "Il caricamento sta richiedendo più del solito. Attendi ancora qualche secondo…" : "Caricamento in corso"}</span>
    </div>
  );
}

export function State({ resource, children, notFound = false }) {
  if (resource.loading) return <Loading />;
  if (notFound && resource.error?.status === 404) return <NotFoundPage />;
  if (notFound && resource.error?.status === 403) return <UnavailablePage />;
  if (resource.error)
    return (
      <div className="panel">
        <Feedback error={resource.error} />
        <button className="button secondary" onClick={resource.reload}>
          Riprova
        </button>
      </div>
    );
  return children(resource.data);
}
function focusField(control) {
  if (!control) return;
  const target = control.classList.contains("ea-picker-source")
    ? control.nextElementSibling
    : control;
  if (!target?.getClientRects().length) return;
  target.focus();
  target.scrollIntoView({ block: "center", behavior: "smooth" });
}
function validationMessage(control) {
  if (control.validity.valid) return "";
  if (control.validity.customError) return control.validationMessage;
  if (control.validity.valueMissing) return "Questo campo è obbligatorio.";
  if (control.type === "email" && control.validity.typeMismatch) return "Inserisci un indirizzo email valido.";
  if (control.name?.includes("postal_code") && control.validity.patternMismatch) return "Il CAP deve contenere 5 cifre.";
  if (["parcel_value", "price"].includes(control.name) && control.validity.patternMismatch) return "Inserisci un importo valido con al massimo due decimali.";
  if (control.name === "code" && (control.validity.patternMismatch || control.validity.tooShort)) return "Il codice deve contenere 6 cifre.";
  if (control.validity.tooShort) return `Inserisci almeno ${control.minLength} caratteri.`;
  if (control.validity.rangeUnderflow) return `Il valore minimo consentito è ${control.min}.`;
  if (control.validity.rangeOverflow) return `Il valore massimo consentito è ${control.max}.`;
  if (control.validity.stepMismatch || control.validity.badInput) return "Inserisci un valore numerico valido.";
  return "Controlla il valore inserito.";
}
export function Form({ errors, onSubmit, onInvalidCapture, ref, ...props }) {
  const form = useRef(null);
  useImperativeHandle(ref, () => form.current);
  useEffect(() => {
    if (!Object.keys(errors || {}).length) return;
    const frame = requestAnimationFrame(() => focusField(form.current?.querySelector('[aria-invalid="true"]:not(button)')));
    return () => cancelAnimationFrame(frame);
  }, [errors]);
  return (
    <FormErrorsContext.Provider value={errors || {}}>
      <form {...props} ref={form} noValidate onInvalidCapture={event => {
        event.preventDefault();
        onInvalidCapture?.(event);
      }} onSubmit={event => {
        if (!event.currentTarget.checkValidity()) {
          event.preventDefault();
          focusField(event.currentTarget.querySelector(":invalid"));
          return;
        }
        onSubmit?.(event);
      }} />
    </FormErrorsContext.Provider>
  );
}
/**
 * Campo password con pulsante occhio: mostra o nasconde il testo senza cambiarne il valore.
 * Torna nascosto all'invio del modulo, così i gestori di password vedono sempre un campo password.
 */
function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  const input = useRef(null);
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const hide = () => setVisible(false);
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, []);
  const label = visible ? "Nascondi password" : "Mostra password";
  return (
    <span className="password-control">
      <input {...props} ref={input} type={visible ? "text" : "password"} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      <button type="button" className="password-toggle" aria-controls={props.id} aria-pressed={visible} aria-label={label} data-tooltip={label} onClick={() => setVisible(current => !current)}>
        <Icon name={visible ? "eye-slash" : "eye"} />
      </button>
    </span>
  );
}
export function Field({ label, name, children, help, width, validate, ...props }) {
  const errors = useContext(FormErrorsContext);
  const [localError, setLocalError] = useState("");
  const [clearedError, setClearedError] = useState();
  const id = useId();
  const fieldName = name || children?.props?.name;
  const serverError = errors[fieldName];
  const error = localError || (serverError !== clearedError ? serverError : null);
  const inputProps = children?.props || props;
  const required = Boolean(inputProps.required && !inputProps.readOnly);
  const size =
    width ||
    (["parcel_value", "price"].includes(fieldName)
      ? "amount"
      : props.type === "number"
        ? "quantity"
        : props.type === "tel"
          ? "phone"
          : ["time", "date"].includes(props.type)
            ? props.type
            : "auto");
  const described =
    [error ? `${id}-error` : "", help ? `${id}-help` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  const applyRule = control => {
    if (validate && control) control.setCustomValidity(control.value.trim() === "" ? "" : validate(control.value) || "");
  };
  const accessibility = {
    id,
    "aria-required": required || undefined,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described,
    onInvalid: event => {
      inputProps.onInvalid?.(event);
      setLocalError(validationMessage(event.currentTarget));
    },
    onChange: event => {
      inputProps.onChange?.(event);
      applyRule(event.currentTarget);
      setClearedError(serverError);
      if (error) setLocalError(validationMessage(event.currentTarget));
    },
    onBlur: event => {
      inputProps.onBlur?.(event);
      applyRule(event.currentTarget);
      setLocalError(validationMessage(event.currentTarget));
    },
  };
  return (
    <div className={`field field-${size}`}>
      <label htmlFor={id}>{label}{required && <span className="required-mark" aria-hidden="true"> *</span>}</label>
      {children ? (
        cloneElement(children, accessibility)
      ) : props.type === "password" ? (
        <PasswordInput name={name} {...props} {...accessibility} />
      ) : (
        <input name={name} {...props} {...accessibility} ref={validate ? applyRule : undefined} />
      )}
      {help && (
        <small id={`${id}-help`} className="field-help">
          {help}
        </small>
      )}
      {error && (
        <small className="field-error" id={`${id}-error`} role="alert">
          {Array.isArray(error) ? error.join(" ") : error}
        </small>
      )}
    </div>
  );
}
export function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  return (
    <nav className="pagination" aria-label="Paginazione">
      <button
        className="icon-button"
        aria-label="Pagina precedente"
        disabled={meta.current_page <= 1}
        onClick={() => onPage(meta.current_page - 1)}
      >
        <Icon name="arrow-left"/>
      </button>
      <span>
        {meta.current_page} / {meta.last_page}
      </span>
      <button
        className="icon-button"
        aria-label="Pagina successiva"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onPage(meta.current_page + 1)}
      >
        <Icon name="arrow-right"/>
      </button>
    </nav>
  );
}
export function OrderList({ orders, base = "/shipments", messages = false, firstRun = false }) {
  if (!orders.length && firstRun) return <FirstShipment />;
  if (!orders.length)
    return (
      <Empty
        title="Nessuna spedizione trovata"
        text="Crea una richiesta oppure modifica i filtri di ricerca."
      />
    );
  return (
    <div className="shipment-cards">
      {orders.map((order) => (
        <Link className="shipment-card" key={order.slug} to={`${base}/${order.slug}`}>
          <div className="shipment-card-top">
            <div className="shipment-card-identity">
              <strong className="order-display-name">{displayName(order)}</strong>
              <small className="order-code" title={order.reference}>{order.reference}</small>
            </div>
            <Status order={order} />
          </div>
          <div className="shipment-card-meta">
            <span className="shipment-card-date"><Icon name="calendar3" /><time dateTime={order.pickup_date}>{date(order.pickup_date)}</time>{order.pickup_from && <span>{order.pickup_from} – {order.pickup_to}</span>}</span>
            {messages && (
              <span className={order.unread_messages_count ? "message-count unread-count" : "message-count"}>
                <Icon name="chat-left-text" />{" "}
                {order.unread_messages_count ? `${order.unread_messages_count} da leggere` : `${order.messages_count || 0} messaggi`}
              </span>
            )}
            <span className="shipment-card-open" aria-hidden="true"><Icon name="arrow-up-right" /></span>
          </div>
          <ShipmentRoute order={order} />
        </Link>
      ))}
    </div>
  );
}
