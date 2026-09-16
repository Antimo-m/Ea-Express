import { useEffect, useRef } from 'react';
import { attachFormPopovers } from '../services/form-popovers';
import { cloneElement, useContext, useId } from "react";
import { FormErrorsContext } from "../context/FormErrorsContext";
import { Link } from "react-router";
import { date } from "../utils/format";
export function Icon({ name, ...props }) {
  return <i className={`bi bi-${name}`} aria-hidden="true" {...props} />;
}
export function Header({
  eyebrow = "Il tuo spazio operativo",
  title,
  description,
  children,
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </header>
  );
}
export function Status({ order }) {
  return (
    <span className={`status status-${order.status}`}>
      {order.status_label}
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
  return (
    <>
      {error && (
        <div role="alert" className="alert error">
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
        <div className="alert success" role="status">
          <Icon name="check-circle" />
          {success}
        </div>
      )}
    </>
  );
}
export function State({ resource, children }) {
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
export function Form({ errors, ...props }) {
  return (
    <FormErrorsContext.Provider value={errors || {}}>
      <form {...props} />
    </FormErrorsContext.Provider>
  );
}
export function Field({ label, name, children, help, width, ...props }) {
  const controlRoot = useRef(null);
  useEffect(() => attachFormPopovers(controlRoot.current), []);
  const errors = useContext(FormErrorsContext);
  const id = useId();
  const fieldName = name || children?.props?.name;
  const error = errors[fieldName];
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
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described,
  };
  return (
    <div ref={controlRoot} className={`field field-${size}`}>
      <label htmlFor={id}>{label}</label>
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
          {error.join(" ")}
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
        className="button secondary"
        disabled={meta.current_page <= 1}
        onClick={() => onPage(meta.current_page - 1)}
      >
        Precedente
      </button>
      <span>
        {meta.current_page} di {meta.last_page}
      </span>
      <button
        className="button secondary"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onPage(meta.current_page + 1)}
      >
        Successiva
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
        <span>Spedizione / destinatario</span>
        <span>Percorso</span>
        <span>Ritiro</span>
        <span>Stato</span>
        <span />
      </div>
      {orders.map((order) => (
        <Link className="order-row" key={order.id} to={`${base}/${order.id}`}>
          <div>
            <strong className="reference">{order.reference}</strong>
            <span>{order.recipient_name}</span>
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
          <div>
            <strong>
              {order.pickup_city} <Icon name="arrow-right" />{" "}
              {order.delivery_city}
            </strong>
            <span>{order.courier?.name || "In attesa di assegnazione"}</span>
          </div>
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
