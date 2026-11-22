const base = (import.meta.env?.VITE_API_URL || "/api/v1/customer").replace(
  /\/$/,
  "",
);
let csrfToken;
let csrfPending;
let pendingRequests = 0;
/** Broadcasts the number of API requests in flight, used by the global activity bar. */
function activity(delta) {
  pendingRequests = Math.max(0, pendingRequests + delta);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ea:activity", { detail: pendingRequests }));
}
const messages = {
  400: "La richiesta non è valida.",
  401: "La sessione è scaduta. Accedi nuovamente.",
  403: "Non puoi eseguire questa operazione.",
  404: "Questa risorsa non è disponibile.",
  409: "La richiesta è stata aggiornata. Ricarica i dati prima di proseguire.",
  419: "La sessione è cambiata. Riprova.",
  422: "Controlla i dati inseriti.",
  429: "Troppe richieste. Attendi prima di riprovare.",
};
export class ApiError extends Error {
  constructor(status, errors = {}, retryAfter = null, botChallenge = null) {
    super(
      messages[status] || "Il servizio non è disponibile. Riprova tra poco.",
    );
    this.status = status;
    this.errors = errors;
    this.retryAfter = retryAfter;
    this.botChallenge = botChallenge;
    if (botChallenge) this.message = "Completa la verifica di sicurezza e riprova.";
    if (status === 429 && retryAfter) this.message = `Troppe richieste. Potrai riprovare tra ${retryAfter < 60 ? `${retryAfter} secondi` : `${Math.ceil(retryAfter / 60)} minuti`}.`;
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
  // I moduli con allegati viaggiano come multipart: il browser imposta il Content-Type con il boundary.
  const multipart = typeof FormData !== "undefined" && data instanceof FormData;
  let response;
  activity(1);
  try {
    response = await fetch(`${base}${path}`, {
      method,
      credentials: "include",
      signal: AbortSignal.timeout(multipart ? 90000 : 20000),
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(method !== "GET"
          ? { ...(multipart ? {} : { "Content-Type": "application/json" }), "X-CSRF-TOKEN": csrfToken }
          : {}),
      },
      ...(data !== undefined ? { body: multipart ? data : JSON.stringify(data) } : {}),
    });
  } catch (failure) {
    const error = new ApiError(0);
    if (typeof navigator !== "undefined" && navigator.onLine === false) error.message = "Sei offline: controlla la connessione e riprova.";
    else if (failure?.name === "TimeoutError") error.message = "Il servizio sta rispondendo lentamente. Riprova tra qualche istante.";
    throw error;
  } finally {
    activity(-1);
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
      response.status === 429 ? retrySeconds(response.headers.get('Retry-After'), body.retry_after) : null,
      body.bot_challenge || null,
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

function retrySeconds(header, fallback) {
  const seconds = header && /^\d+$/.test(header) ? Number(header) : header ? Math.ceil((Date.parse(header) - Date.now()) / 1000) : Number(fallback);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}
