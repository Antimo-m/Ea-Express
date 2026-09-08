import { test } from "node:test";
import assert from "node:assert/strict";
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
let moduleId = 0;
const client = () => import(`../src/api/client.js?test=${++moduleId}`);
test("Le scritture inviano cookie e token CSRF, aggiornandolo dopo un rifiuto 419", async (t) => {
  const calls = [];
  const replies = [
    response({ csrf_token: "first" }),
    response({}, 419),
    response({ csrf_token: "second" }),
    response({ message: "saved" }),
  ];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return replies.shift();
  });
  const { request } = await client();
  assert.deepEqual(
    await request("/orders", { method: "POST", data: { parcel_count: 2 } }),
    { message: "saved" },
  );
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      "/api/v1/customer/csrf",
      "/api/v1/customer/orders",
      "/api/v1/customer/csrf",
      "/api/v1/customer/orders",
    ],
  );
  assert.equal(calls[1].options.credentials, "include");
  assert.equal(calls[1].options.headers["X-CSRF-TOKEN"], "first");
  assert.equal(calls[3].options.headers["X-CSRF-TOKEN"], "second");
  assert.equal(calls[3].options.body, '{"parcel_count":2}');
});
test("Un secondo rifiuto CSRF interrompe il tentativo senza cicli di reinvio", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    calls++;
    return url.endsWith("/csrf")
      ? response({ csrf_token: "expired" })
      : response({}, 419);
  });
  const { request } = await client();
  await assert.rejects(
    request("/orders", { method: "POST", data: {} }),
    (error) => error.status === 419,
  );
  assert.equal(calls, 4);
});
test("La scadenza della sessione notifica il portale senza mostrare dettagli interni", async (t) => {
  const events = [];
  const original = globalThis.window;
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  t.after(() => {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  });
  t.mock.method(globalThis, "fetch", async () =>
    response({ message: "Sensitive internal exception" }, 401),
  );
  const { request } = await client();
  await assert.rejects(
    request("/orders"),
    (error) => error.status === 401 && !error.message.includes("Sensitive"),
  );
  assert.deepEqual(events, ["ea:session-expired"]);
});
test("Gli errori server e di rete non reinviano operazioni potenzialmente già eseguite", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    calls++;
    return url.endsWith("/csrf")
      ? response({ csrf_token: "valid" })
      : response({ message: "SQL stack trace" }, 500);
  });
  const { request } = await client();
  await assert.rejects(
    request("/orders", { method: "POST", data: {} }),
    (error) => error.status === 500 && !error.message.includes("SQL"),
  );
  assert.equal(calls, 2);
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("network detail");
  });
  await assert.rejects(
    request("/orders"),
    (error) => error.status === 0 && !error.message.includes("network detail"),
  );
});
test("Gli errori di validazione conservano i messaggi dei campi, una risposta HTML viene rifiutata", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    response(
      { errors: { recipient_name: ["Inserisci il destinatario."] } },
      422,
    ),
  );
  const { request } = await client();
  await assert.rejects(
    request("/orders"),
    (error) =>
      error.status === 422 &&
      error.errors.recipient_name[0] === "Inserisci il destinatario.",
  );
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>Proxy fallback</html>"),
  );
  await assert.rejects(request("/orders"), (error) => error.status === 0);
});
