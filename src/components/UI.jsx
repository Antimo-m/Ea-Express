import { cloneElement, useContext, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { FormErrorsContext } from "../context/FormErrorsContext";
import { Link } from "react-router";
import { date, displayName } from "../utils/format";
import NotFoundPage from "../pages/NotFoundPage";
import ShipmentRoute from "./ShipmentRoute";
export function Icon({ name, ...props }) {
  return <i className={`bi bi-${name}`} aria-hidden="true" {...props} />;
}
export function Header({
  eyebrow = "Il tuo spazio operativo",
  title,
  description,
  backTo,
  children,
}) {
  return (
    <>
    {backTo && <nav className="page-back" aria-label="Navigazione pagina"><Link className="back-link" to={backTo}><Icon name="arrow-left"/> Torna indietro</Link></nav>}
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
export function Status({ order }) {
  return (
    <span className="order-statuses">
      <span className={`status status-${order.status}`}>{order.status_label}</span>
    </span>
  );
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
export function State({ resource, children, notFound = false }) {
  if (resource.loading)
    return (
      <div
        className="skeletons"
        role="status"
        aria-label="Caricamento in corso"
      >
        <div />
        <div />
        <div />
        <span className="sr-only">Caricamento in corso</span>
      </div>
    );
  if (notFound && resource.error?.status === 404) return <NotFoundPage />;
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
export function Field({ label, name, children, help, width, ...props }) {
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
      setClearedError(serverError);
      if (error) setLocalError(validationMessage(event.currentTarget));
    },
    onBlur: event => {
      inputProps.onBlur?.(event);
      setLocalError(validationMessage(event.currentTarget));
    },
  };
  return (
    <div className={`field field-${size}`}>
      <label htmlFor={id}>{label}{required && <span className="required-mark" aria-hidden="true"> *</span>}</label>
      {children ? (
        cloneElement(children, accessibility)
      ) : (
        <input name={name} {...props} {...accessibility} />
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
export function OrderList({ orders, base = "/shipments", messages = false }) {
  if (!orders.length)
    return (
      <Empty
        title="Nessuna spedizione trovata"
        text="Crea una richiesta oppure modifica i filtri di ricerca."
      />
    );
  return (
    <div className="order-list">
      <div className="order-table-head">
        <span>Cliente / spedizione</span>
        <span>Percorso</span>
        <span>Ritiro</span>
        <span>Stato</span>
        <span />
      </div>
      {orders.map((order) => (
        <Link className="order-row" key={order.slug} to={`${base}/${order.slug}`}>
          <div>
            <strong className="order-display-name">{displayName(order)}</strong>
            <small className="order-code" title={order.reference}>{order.reference}</small>
            {messages && (
              <span
                className={
                  order.unread_messages_count
                    ? "message-count unread-count"
                    : "message-count"
                }
              >
                <Icon name="chat-left-text" />{" "}
                {order.unread_messages_count
                  ? `${order.unread_messages_count} da leggere`
                  : `${order.messages_count || 0} messaggi`}
              </span>
            )}
          </div>
          <ShipmentRoute order={order} />
          <div>
            <strong>{date(order.pickup_date)}</strong>
            <span>
              {order.pickup_from} – {order.pickup_to}
            </span>
          </div>
          <Status order={order} />
          <Icon name="arrow-up-right" />
        </Link>
      ))}
    </div>
  );
}
