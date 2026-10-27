import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

const chrome = process.env.EA_BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const built = resolve('dist/index.html');
const slug = '24369069-5868-49fd-b04c-3709fa3b5a81';
const user = { slug: 'f4c0dc18-3893-4a91-b468-e88c408aa2e6', name: 'Cliente dimostrativo per collaudo interfaccia e distribuzione di prova', email: 'cliente@example.test', sender_type: 'business', business_type: 'Negozio', notify_orders: true, notify_messages: true };
const order = {
  slug, reference: 'EA-EXPRESS-2026-TEST-0123456789', version: 1, store_name: user.name,
  recipient_name: 'Destinatario dimostrativo per collaudo interfaccia', recipient_phone: '0000000000',
  pickup_address: 'Via di Prova del Collaudo Interfaccia', pickup_street_number: '123', pickup_postal_code: '80100', pickup_city: 'Napoli',
  delivery_address: 'Via Dimostrativa della Distribuzione di Prova', delivery_street_number: '123', delivery_postal_code: '81100', delivery_city: 'Caserta',
  pickup_date: '2026-10-24', pickup_from: '09:00', pickup_to: '12:00', sender_type: 'business', shipping_type: 'regional',
  status: 'out_for_delivery', status_label: 'In consegna', rider: { name: 'Rider di prova per collaudo interfaccia' }, package_type: 'standard',
  parcel_count: 1, parcel_value_cents: 12500, price_cents: 500, total_cents: 13000, category: 'custom', content_description: 'Ricambi per elettrodomestici',
  can_edit: true, can_cancel: true, delay: { reported: true, active: true, reported_at: '2026-10-23T12:00:00Z', label: 'In ritardo' },
  events: [{ slug: 'a43d49ec-2e68-47d2-8a21-5db751cfabff', label: 'Ritardo segnalato dal Rider', created_at: '2026-10-23T12:00:00Z', message: 'Segnalazione operativa registrata.' }],
};
const meta = { current_page: 1, last_page: 2, total: 25 };
const pending = { slug, subject: 'Pagamento consegne e servizi del mese di ottobre', description: 'Saldo concordato con il negozio per le consegne completate.', amount_cents: 12550, settled_cents: 5000, remaining_cents: 7550, state: 'open', status_label: 'Parzialmente saldato', direction: 'incoming', direction_label: 'Devi pagare EA-Express', occurred_on: '2026-10-01', due_on: '2026-10-31', settlements: [{ slug, amount_cents: 5000, created_at: '2026-10-22T11:00:00Z', updated_at: '2026-10-22T11:00:00Z' }] };
const statistics = {
  from: '2026-10-01', to: '2026-10-23', previous_from: '2026-09-08', previous_to: '2026-09-30',
  gross_cents: 125000, delivered_spend_cents: 5000, net_cents: 120000, missing_prices: 0, missing_values: 0,
  total: 25, delivered: 10, in_progress: 13, cancelled: 2, completion_percent: 40, regional_count: 20, external_count: 5,
  changes: { gross_cents: 10, delivered_spend_cents: 5, net_cents: 8, total: 20, delivered: 15, in_progress: null, cancelled: 0 },
  chart_summaries: {}, comparison_note: 'Confronto con i mesi precedenti.',
  trend: [{ date: '2026-10-01', shipments: 10, delivered: 5, net_cents: 50000 }, { date: '2026-10-23', shipments: 15, delivered: 5, net_cents: 70000 }],
  months: [{ month: '2026-09', shipments: 20 }, { month: '2026-10', shipments: 25 }],
};

test('Portale clienti: pagine, touch, modali e accessibilità alle larghezze richieste', { skip: !existsSync(chrome) || !existsSync(built), timeout: 180000 }, async t => {
  const temporary = mkdtempSync(join(tmpdir(), 'ea-portal-ui-'));
  let browser, socket, authenticated = true, errorMode = false, emptyMode = false, loadingMode = false;
  const writes = [];
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname.replace('/api/v1/customer', '');
    if (url.pathname.startsWith('/api/')) {
      response.setHeader('Content-Type', 'application/json');
      const json = body => response.end(JSON.stringify(body));
      if (path === '/auth/me') { response.statusCode = authenticated ? 200 : 401; json(authenticated ? { user } : {}); return; }
      if (path === '/csrf') { json({ csrf_token: 'test-token' }); return; }
      if (request.method !== 'GET') { let body = ''; request.on('data', chunk => body += chunk); request.on('end', () => { writes.push({ path, data: body ? JSON.parse(body) : {} }); json({ message: 'Operazione registrata.', data: order }); }); return; }
      if (errorMode && path === '/orders') { response.statusCode = 500; json({}); return; }
      if (path === '/dashboard') { json({ metrics: { active: 13, pickups: 5, delivered: 10, attention: 1, unread: 2 }, live_order: order, recent: [order, { ...order, slug: user.slug }], next_pickups: [order] }); return; }
      if (path === '/orders') { const body = { data: emptyMode ? [] : [order, { ...order, slug: user.slug }], meta }; loadingMode ? setTimeout(() => json(body), 400) : json(body); return; }
      if (path.endsWith('/messages')) { json({ data: emptyMode ? [] : [{ slug, body: 'Il percorso è rallentato. Ti aggiorno appena arrivo alla destinazione concordata.', sender: 'team', created_at: '2026-10-23T12:00:00Z', delivered_at: null, read_at: null }], meta }); return; }
      if (path.startsWith('/orders/')) { json({ data: order }); return; }
      if (path === '/statistics') { json(statistics); return; }
      if (path === '/pending') { json({ data: emptyMode ? [] : [pending], totals: { incoming: 7550, outgoing: 0 }, meta }); return; }
      if (path.startsWith('/pending/')) { json({ data: pending }); return; }
      if (path === '/rates') { json({ areas: ['Campania'], rates: { ...meta, data: emptyMode ? [] : [{ slug, city: 'Caserta e provincia', area: 'Campania', zone: 'Centro storico e periferia', postal_codes: ['81100', '81020'], price_cents: 500, shipping_type: 'regional', delivery_time: 'Entro due giorni lavorativi' }] } }); return; }
      if (path === '/notifications') { json({ data: emptyMode ? [] : [{ order_slug: slug, customer_name: user.name, reference: order.reference, total: 2, unread: 1, latest_at: '2026-10-23T12:00:00Z' }], meta }); return; }
      if (path.startsWith('/notifications/orders/')) { json({ data: [{ id: crypto.randomUUID(), title: 'Ritardo segnalato dal rider', is_message: false, created_at: '2026-10-23T12:00:00Z', order_slug: slug }], meta }); return; }
      if (path === '/booking-rules') { json({ server_now: new Date().toISOString() }); return; }
      if (path === '/sender-address') { json({ data: null }); return; }
      json({ enabled: false, data: [] }); return;
    }
    const file = resolve('dist', `.${url.pathname}`);
    if (file.startsWith(resolve('dist') + '/') && existsSync(file) && extname(file)) {
      response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream');
      response.end(readFileSync(file)); return;
    }
    response.setHeader('Content-Type', 'text/html'); response.end(readFileSync(built));
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${join(temporary, 'chrome')}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    const endpoint = await new Promise((resolve, reject) => {
      let output = ''; const timer = setTimeout(() => reject(new Error(output.slice(-1000))), 15000);
      browser.stderr.on('data', chunk => { output += chunk; const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
      browser.once('exit', code => { clearTimeout(timer); reject(new Error(`Chrome ${code}: ${output.slice(-1000)}`)); });
    });
    const pages = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();
    socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    let sequence = 0; const pending = new Map();
    socket.addEventListener('message', ({ data }) => { const result = JSON.parse(data); if (!pending.has(result.id)) return; const waiter = pending.get(result.id); pending.delete(result.id); result.error ? waiter.reject(new Error(result.error.message)) : waiter.resolve(result.result); });
    const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; const timer = setTimeout(() => reject(new Error(`Timeout ${method}`)), 15000); pending.set(id, { resolve: result => { clearTimeout(timer); resolve(result); }, reject: error => { clearTimeout(timer); reject(error); } }); socket.send(JSON.stringify({ id, method, params })); });
    const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression: `(() => { ${expression} })()`, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
    const waitFor = async expression => { for (let index = 0; index < 100; index++) { if (await evaluate(`return Boolean(${expression});`)) return; await new Promise(resolve => setTimeout(resolve, 30)); } throw new Error(`Not ready: ${expression}`); };
    const navigate = async path => { await evaluate('window.__previous = true;'); await send('Page.navigate', { url: origin + path }); await waitFor('!window.__previous && document.readyState === "complete" && !document.querySelector(".skeletons") && document.querySelector("h1, .auth-form h2")'); await evaluate('return document.fonts.ready.then(() => true);'); };
    const viewport = width => send('Emulation.setDeviceMetricsOverride', { width, height: ({320:568,360:800,375:812,390:844,430:932,768:1024})[width] || 900, deviceScaleFactor: 1, mobile: width < 768 });
    const check = async (path, width) => {
      const result = await evaluate(`return { width: innerWidth, scroll: document.documentElement.scrollWidth, errors: [...document.querySelectorAll('.error-boundary')].map(n => n.textContent), heading: document.querySelector('.page-heading') ? getComputedStyle(document.querySelector('.page-heading')).position : 'static', add: [...document.querySelectorAll('.action-add')].filter(n => n.getClientRects().length).map(n => ({ label: n.getAttribute('aria-label'), text: n.textContent.trim(), width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height, plus: !!n.querySelector('.bi-plus-lg') })), overflow: [...document.querySelectorAll('main *')].filter(n => {const r=n.getBoundingClientRect();return r.width && r.right>innerWidth+1 && getComputedStyle(n).position !== 'fixed';}).slice(0,5).map(n => n.className) };`);
      assert.ok(result.scroll <= result.width + 1, `${path} @ ${width}: horizontal overflow ${JSON.stringify(result)}`);
      assert.equal(result.heading, 'static', `${path}: heading scrolls`);
      for (const add of result.add) { assert.ok(add.label?.length > 5, `${path}: specific accessible creation label`); assert.equal(add.text, '', `${path}: plus only`); assert.equal(add.plus, true); assert.ok(add.width >= 44 && add.height >= 44, `${path}: touch target ${JSON.stringify(add)}`); }
    };
    const routes = ['/dashboard', '/shipments', '/pickups', '/messages', `/shipments/${slug}`, `/messages/${slug}`, '/pickups/new', `/shipments/${slug}/edit`, '/rates', '/statistics', '/pending', `/pending/${slug}`, '/notifications', '/profile', '/settings', `/shipments/${slug}/label`];
    for (const width of [320, 360, 375, 390, 430, 768, 1440]) {
      await t.test(`${width}px: tutte le pagine senza overflow e con creazione accessibile`, async () => {
        await viewport(width);
        for (const path of routes) { await navigate(path); await check(path, width); }
      });
    }
    await t.test('ritardo manuale distinto dallo stato e cronologia visibile', async () => {
      await viewport(390); await navigate(`/shipments/${slug}`);
      assert.match(await evaluate('return document.querySelector(".order-statuses").textContent;'), /In consegna.*In ritardo/);
      assert.match(await evaluate('return document.querySelector(".timeline").textContent;'), /Ritardo segnalato/);
      assert.match(await evaluate('return document.querySelector(".delay-notice").textContent;'), /23 ott/);
    });
    await t.test('filtri su smartphone: modale contenuta, focus ed Escape', async () => {
      await viewport(320); await navigate('/shipments');
      await evaluate('const trigger=document.querySelector(".portal-filter-actions .button");trigger.focus();trigger.click();');
      await evaluate('return Promise.all(document.querySelector("dialog[open]").getAnimations().map(animation => animation.finished)).then(() => true);');
      const modal = await evaluate('const d=document.querySelector("dialog[open]"); const r=d.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight,focused:d.contains(document.activeElement),active:document.activeElement.outerHTML.slice(0,300)};');
      assert.ok(modal.left>=0 && modal.right<=modal.width && modal.top>=0 && modal.bottom<=modal.height && modal.focused, JSON.stringify(modal));
      assert.ok(await evaluate('return document.querySelector("dialog[open] .modal-heading > button").getBoundingClientRect().width;') >= 44);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await waitFor('!document.querySelector("dialog[open]")');
      assert.equal(await evaluate('return document.activeElement === document.querySelector(".portal-filter-actions .button");'), true);
    });
    await t.test('menu raggiungibile e focus contenuto anche a 767px', async () => {
      await viewport(767); await navigate('/profile');
      await evaluate('document.querySelector(".menu-toggle").click();');
      assert.equal(await evaluate('return document.querySelector(".sidebar").getAttribute("aria-modal");'), 'true');
      assert.equal(await evaluate('return document.querySelector(".workspace").inert;'), true);
      await evaluate('document.querySelector(".sidebar-close").click();');
      assert.equal(await evaluate('return document.querySelector(".workspace").inert;'), false);
    });
    await t.test('titolo scorre, navigazione resta raggiungibile e caricamento è annunciato', async () => {
      await viewport(320); await navigate('/pickups/new');
      await evaluate('window.scrollTo(0,600);');
      assert.ok(await evaluate('return document.querySelector(".page-heading").getBoundingClientRect().bottom;') < 0);
      assert.equal(await evaluate('return getComputedStyle(document.querySelector(".portal-mobile-nav")).position;'), 'fixed');
      loadingMode = true;
      await send('Page.navigate', { url: origin + '/shipments' });
      await waitFor('document.querySelector(".orders-register .skeletons[role=status]")');
      assert.equal(await evaluate('return document.querySelector(".orders-register .skeletons").getAttribute("aria-label");'), 'Caricamento in corso');
      await waitFor('document.querySelectorAll(".order-row").length === 2');
      loadingMode = false;
    });
    await t.test('stati vuoti ed errore conservano navigazione e possibilità di riprovare', async () => {
      emptyMode = true;
      for (const path of ['/shipments', '/rates', '/pending', '/notifications']) { await navigate(path); assert.ok(await evaluate('return !!document.querySelector(".empty");')); await check(path, 767); }
      emptyMode = false; errorMode = true; await navigate('/shipments');
      assert.ok(await evaluate('return !!document.querySelector("[role=alert]");'));
      errorMode = false; await evaluate('[...document.querySelectorAll("button")].find(n=>n.textContent==="Riprova").click();');
      await waitFor('document.querySelectorAll(".order-row").length === 2');
    });
    await t.test('notifiche espandibili e cronologia pagamenti leggibili', async () => {
      await viewport(320); await navigate('/notifications');
      await evaluate('document.querySelector(".notification-group").open=true;');
      await waitFor('document.querySelector(".notification-event")');
      await check('/notifications expanded', 320);
      await navigate(`/pending/${slug}`);
      assert.match(await evaluate('return document.querySelector(".settlement-row").textContent;'), /50,00/);
    });
    await t.test('accesso e registrazione non espongono recupero password', async () => {
      authenticated = false;
      for (const width of [320, 390, 768, 1440]) { await viewport(width); for (const path of ['/login', '/register']) { await navigate(path); await check(path, width); assert.equal(await evaluate('return !!document.querySelector("a[href*=forgot],input[name=token]");'), false); } }
      assert.equal(writes.some(write => /forgot|reset-password/.test(write.path)), false);
    });
    if (process.env.EA_PORTAL_SCREENSHOT_DIR) {
      authenticated = true;
      for (const [width, path, label] of [[390, '/dashboard', 'dashboard-mobile'], [320, '/pickups/new', 'booking-320'], [1440, '/shipments', 'shipments-desktop']]) { await viewport(width); await navigate(path); const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); writeFileSync(join(process.env.EA_PORTAL_SCREENSHOT_DIR, `${label}.png`), Buffer.from(shot.data, 'base64')); }
    }
  } finally {
    socket?.close(); browser?.kill(); await new Promise(resolve => server.close(resolve));
    rmSync(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
