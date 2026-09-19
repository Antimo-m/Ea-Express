const base = (import.meta.env?.VITE_API_URL || "/api/v1/customer").replace(
  /\/$/,
  "",
);
let csrfToken;
let csrfPending;
const messages = {
  400: "La richiesta non è valida.",
  401: "La sessione è scaduta. Accedi nuovamente.",
  403: "Non puoi eseguire questa operazione.",
  404: "Questa risorsa non è disponibile.",
  409: "La richiesta è stata aggiornata. Ricarica i dati prima di proseguire.",
  419: "La sessione è cambiata. Riprova.",
  422: "Controlla i dati inseriti.",
  429: "Troppe richieste. Attendi un minuto e riprova.",
};
export class ApiError extends Error {
  constructor(status, errors = {}) {
    super(
      messages[status] || "Il servizio non è disponibile. Riprova tra poco.",
    );
    this.status = status;
    this.errors = errors;
  }
}
async function csrf() {
  if (!csrfPending)
    csrfPending = request("/csrf")
      .then((data) => {
        csrfToken = data.csrf_token;
      })
      .finally(() => {
        csrfPending = null;
      });
  await csrfPending;
}
export async function request(
  path,
  { method = "GET", data, retry = true } = {},
) {
  if (method !== "GET" && !csrfToken) await csrf();
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      credentials: "include",
      signal: AbortSignal.timeout(20000),
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(method !== "GET"
          ? { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken }
          : {}),
      },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
  } catch {
    throw new ApiError(0);
  }
  if (response.status === 419 && retry && method !== "GET") {
    csrfToken = null;
    await csrf();
    return request(path, { method, data, retry: false });
  }
  const body = await response.json().catch(() => {
    if (response.ok && response.status !== 204) throw new ApiError(0);
    return {};
  });
  if (!response.ok) {
    if (response.status === 401) {
      csrfToken = null;
      window.dispatchEvent(new Event("ea:session-expired"));
    }
    throw new ApiError(
      response.status,
      response.status === 422 ? body.errors : {},
    );
  }
  if (body.csrf_token) csrfToken = body.csrf_token;
  return body;
}
export function query(params = {}) {
  const value = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null,
    ),
  ).toString();
  return value ? `?${value}` : "";
}
