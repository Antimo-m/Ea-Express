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
const user = { slug: 'f4c0dc18-3893-4a91-b468-e88c408aa2e6', name: 'Cliente dimostrativo per collaudo interfaccia e distribuzione di prova', email: 'cliente@example.test', sender_type: 'business', business_type: 'Negozio', portal_preferences: {theme:'light',notification_sound:false}, notify_orders: true, notify_messages: true };
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
  let savedAddress = null, confirmationStatus = 0, failAddressSave = false;
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname.replace('/api/v1/customer', '');
    if (url.pathname.startsWith('/api/')) {
      response.setHeader('Content-Type', 'application/json');
      const json = body => response.end(JSON.stringify(body));
      if (path === '/auth/me') { response.statusCode = authenticated ? 200 : 401; json(authenticated ? { user } : {}); return; }
      if (path === '/privacy') { json({version:'2026-10-28',reviewed:false,controller:{name:null,address:null,email:null},same_site:'lax',secure:false,cookies:[{name:'ea_express_customer_session',purpose:'Accesso autenticato al portale clienti',minutes:120,http_only:true,session_only:false},{name:'XSRF-TOKEN',purpose:'Protezione delle richieste da CSRF',minutes:120,http_only:false,session_only:false}]}); return; }
      if (path === '/csrf') { json({ csrf_token: 'test-token' }); return; }
      if (request.method !== 'GET') {
        let body = ''; request.on('data', chunk => body += chunk);
        request.on('end', () => {
          const data = body ? JSON.parse(body) : {};
          writes.push({ path, data });
          if (path.endsWith('/checkout')) { json({data: {...data, sender_type: user.sender_type}, quote: {available: true, price_cents: 500, reason: 'Tariffa del listino verificata.', delivery_time: 'Entro due giorni lavorativi'}, parcel_value_cents: 12500, shipping_price_cents: 500, total_cents: 13000, checkout_token: crypto.randomUUID()}); return; }
          if (path === '/orders' && confirmationStatus) { response.statusCode = confirmationStatus; json({errors: confirmationStatus === 422 ? {pickup_date: ['La data non è più disponibile.']} : {}}); return; }
          if (path === '/display-preferences') { user.portal_preferences = {...user.portal_preferences,...data}; json({data:user.portal_preferences}); return; }
          if (path === '/sender-address') {
            if (failAddressSave) {response.statusCode=409; json({});return;}
            savedAddress = request.method === 'DELETE' ? null : {...data, version: (savedAddress?.version || 0) + 1};
            json({data: savedAddress}); return;
          }
          json({ message: 'Operazione registrata.', data: order });
        }); return;
      }
      if (errorMode && path === '/orders') { response.statusCode = 500; json({}); return; }
      if (path === '/dashboard') { json({ metrics: { active: 13, pickups: 5, delivered: 10, attention: 1, unread: 2 }, live_order: order, recent: [order, { ...order, slug: user.slug }], next_pickups: [order] }); return; }
      if (path === '/orders') { const body = { data: emptyMode ? [] : [order, { ...order, slug: user.slug }], meta }; loadingMode ? setTimeout(() => json(body), 400) : json(body); return; }
      if (path.endsWith('/messages')) { json({ data: emptyMode ? [] : [{ slug, body: 'Il percorso è rallentato. Ti aggiorno appena arrivo alla destinazione concordata.', sender: 'team', created_at: '2026-10-23T12:00:00Z', delivered_at: null, read_at: null }], meta }); return; }
      if (path.startsWith('/orders/')) { json({ data: order }); return; }
      if (path === '/statistics') { json(statistics); return; }
      if (path === '/pending') { json({ data: emptyMode ? [] : [pending], totals: { incoming: 7550, outgoing: 0 }, meta }); return; }
      if (path.startsWith('/pending/')) { json({ data: pending }); return; }
      if (path === '/rates') { json({ areas: ['Campania'], rates: { ...meta, data: emptyMode ? [] : [{ slug, city: 'Caserta e provincia', area: 'Campania', zone: 'Centro storico e periferia', postal_codes: ['81100', '81020'], price_cents: 500, shipping_type: 'regional', delivery_time: 'Entro due giorni lavorativi' }] } }); return; }
      if (path === '/notifications') { json({ data: emptyMode ? [] : [{ order_slug: slug, customer_name: user.name, reference: order.reference, total: 3, unread: 1, latest_at: '2026-10-23T12:00:00Z' }], meta }); return; }
      if (path.startsWith('/notifications/orders/')) { json({ data: [
        { id: '514f7189-32ed-475f-937b-50e06c331bb7', title: 'Ritardo segnalato dal rider per la spedizione in consegna al destinatario', is_message: false, created_at: '2026-10-23T12:00:00Z', read_at: null, order_slug: slug },
        { id: '467de175-a71a-453d-989e-aab3da0a1c74', title: 'Nuovo messaggio dal team sulla tua spedizione', is_message: true, created_at: '2026-10-23T11:00:00Z', read_at: '2026-10-23T11:30:00Z', order_slug: slug },
        { id: '17d37f24-5b9a-4cc3-afcc-97df66731bb5', title: 'Spedizione affidata al rider e pronta per la consegna', is_message: false, created_at: '2026-10-23T10:00:00Z', read_at: '2026-10-23T10:30:00Z', order_slug: slug },
      ], meta: { ...meta, current_page: Number(url.searchParams.get('page') || 1) } }); return; }
      if (path === '/booking-rules') { json({ server_now: new Date().toISOString() }); return; }
      if (path === '/sender-address') { json({ data: savedAddress }); return; }
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
    for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
      await t.test(`${width}px: tutte le pagine senza overflow e con creazione accessibile`, async () => {
        await viewport(width);
        for (const path of routes) { await navigate(path); await check(path, width); }
      });
    }
    await t.test('shell senza margini residui, marchio allineato e creazione centrata', async () => {
      for (const width of [375, 760, 767, 768, 991, 992, 1024, 1250, 1440]) {
        await viewport(width); await navigate('/statistics');
        const geometry = await evaluate(`const workspace=document.querySelector('.workspace').getBoundingClientRect(); return {left:workspace.left,right:workspace.right,available:document.documentElement.clientWidth,menu:getComputedStyle(document.querySelector('.menu-toggle')).display};`);
        assert.ok(Math.abs(geometry.right - geometry.available) <= 1, JSON.stringify({width, ...geometry}));
        assert.equal(geometry.left, width < 992 ? 0 : 262);
        if (width < 992) await evaluate('document.querySelector(".menu-toggle").click();');
        const brand = await evaluate(`const logo=document.querySelector('.sidebar .brand-wordmark'); const ranges=[...logo.children].map(node=>{const range=document.createRange();range.selectNodeContents(node);return range.getBoundingClientRect().bottom;}); const sidebarNode=document.querySelector('.sidebar-content'),sidebar=sidebarNode.getBoundingClientRect(), button=document.querySelector('.portal-create').getBoundingClientRect();return {baseline:Math.abs(ranges[0]-ranges[1]),center:Math.abs((button.left+button.right-2*sidebar.left-sidebarNode.clientWidth)/2),text:logo.textContent};`);
        assert.ok(brand.baseline <= 1 && brand.center <= 1, JSON.stringify({width,...brand}));
        assert.equal(brand.text, 'EA-Express');
        if (width < 992) await evaluate('document.querySelector(".sidebar-close").click();');
      }
    });
    await t.test('menu tablet: tastiera, backdrop, navigazione e ridimensionamento', async () => {
      await viewport(768); await navigate('/dashboard');
      await evaluate('document.querySelector(".menu-toggle").click();');
      await waitFor('document.querySelector(".sidebar").classList.contains("is-open")');
      await waitFor('document.activeElement === document.querySelector(".sidebar-close")');
      await send('Input.dispatchKeyEvent', { type:'keyDown', key:'Tab', code:'Tab', windowsVirtualKeyCode:9, modifiers:8 });
      assert.equal(await evaluate('return document.activeElement === document.querySelector(".logout");'), true);
      await send('Input.dispatchKeyEvent', { type:'keyDown', key:'Tab', code:'Tab', windowsVirtualKeyCode:9 });
      await waitFor('document.activeElement === document.querySelector(".sidebar-close")');
      await send('Input.dispatchKeyEvent', { type:'keyDown', key:'Escape', code:'Escape', windowsVirtualKeyCode:27 });
      assert.equal(await evaluate('return document.activeElement === document.querySelector(".menu-toggle") && !document.querySelector(".workspace").inert && document.body.style.overflow !== "hidden";'), true);
      await evaluate('document.querySelector(".menu-toggle").click();');
      await waitFor('document.querySelector(".nav-backdrop")');
      await evaluate('document.querySelector(".nav-backdrop").click();');
      assert.equal(await evaluate('return !document.querySelector(".nav-backdrop");'), true);
      await evaluate('document.querySelector(".menu-toggle").click();');
      await waitFor('document.querySelector(".nav-backdrop")');
      await evaluate(`document.querySelector('.sidebar a[href="/pending"]').click();`);
      await waitFor('document.querySelector("h1").textContent === "Sospesi"');
      assert.equal(await evaluate('return !document.querySelector(".workspace").inert && !document.querySelector(".nav-backdrop");'), true);
      await evaluate('document.querySelector(".menu-toggle").click();');
      await viewport(1024);
      await waitFor('!document.querySelector(".nav-backdrop") && !document.querySelector(".workspace").inert && document.body.style.overflow !== "hidden"');
      await viewport(768);
      await waitFor('!document.querySelector(".sidebar").classList.contains("is-open")');
    });
    await t.test('statistiche distanziate e grafici interattivi contenuti', async () => {
      for (const width of [375,768,1024,1440]) {
        await viewport(width); await navigate('/statistics');
        const spacing = await evaluate(`const nodes=[...document.querySelector('.statistics-workspace').children];return nodes.slice(1).map((node,index)=>({gap:node.getBoundingClientRect().top-nodes[index].getBoundingClientRect().bottom,width:node.getBoundingClientRect().width,parent:node.parentElement.getBoundingClientRect().width}));`);
        assert.ok(spacing.every(item=>item.gap >= 20 && item.width <= item.parent + 1), JSON.stringify({width,spacing}));
        await evaluate('document.querySelector(".volume-row[aria-pressed=false]").click();');
        assert.match(await evaluate('return document.querySelector(".service-detail").textContent;'), /Fuori regione/);
        await evaluate('document.querySelector(".chart-legend button").click();');
        await waitFor('document.querySelector(".chart-legend button").getAttribute("aria-pressed") === "false"');
      }
    });
    await t.test('filtri: colori semantici, applicazione e reset della ricerca', async () => {
      await viewport(1024); await navigate('/rates');
      const colors = await evaluate(`const search=document.querySelector('.action-search'),reset=document.querySelector('.action-reset');const token=name=>getComputedStyle(document.documentElement).getPropertyValue(name).trim();return {search:getComputedStyle(search).getPropertyValue('--action-color').trim(),reset:getComputedStyle(reset).getPropertyValue('--action-color').trim(),filter:getComputedStyle(document.querySelector('.filter-more')).backgroundColor,searchBackground:getComputedStyle(search).backgroundColor,brand:token('--ea-brand'),info:token('--ea-info')};`);
      assert.equal(colors.search,colors.brand); assert.equal(colors.reset,colors.info); assert.equal(colors.filter,colors.searchBackground);
      await evaluate('const input=document.querySelector("input[name=q]");input.value="Caserta";input.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector(".action-search").click();');
      await waitFor('location.search.includes("q=Caserta")');
      await evaluate('document.querySelector(".action-reset").click();');
      await waitFor('location.search === "" && document.querySelector("input[name=q]").value === ""');
    });
    await t.test('ritardo manuale distinto dallo stato e cronologia visibile', async () => {
      await viewport(390); await navigate(`/shipments/${slug}`);
      assert.match(await evaluate('return document.querySelector(".order-statuses").textContent;'), /In consegna.*In ritardo/);
      assert.match(await evaluate('return document.querySelector(".timeline").textContent;'), /Ritardo segnalato/);
      assert.match(await evaluate('return document.querySelector(".delay-notice").textContent;'), /23 ott/);
    });
    await t.test('modali: contenimento, tooltip hover e focus ed Escape a tutte le larghezze', async () => {
      for (const width of [320,375,768,1024,1440]) {
      await viewport(width); await navigate('/shipments');
      await evaluate('const trigger=document.querySelector(".portal-filter-actions .button");trigger.focus();trigger.click();');
      await evaluate('return Promise.all(document.querySelector("dialog[open]").getAnimations().map(animation => animation.finished)).then(() => true);');
      const modal = await evaluate('const d=document.querySelector("dialog[open]"); const r=d.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight,focused:d.contains(document.activeElement),active:document.activeElement.outerHTML.slice(0,300)};');
      assert.ok(modal.left>=0 && modal.right<=modal.width && modal.top>=0 && modal.bottom<=modal.height && modal.focused, JSON.stringify(modal));
      assert.ok(await evaluate('return document.querySelector("dialog[open] .modal-heading > button").getBoundingClientRect().width;') >= 44);
      const closeSelector = 'dialog[open] .modal-heading > button';
      const close = await evaluate(`const r=document.querySelector('${closeSelector}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};`);
      for (const mode of ['hover','focus']) {
        if (mode === 'hover') await send('Input.dispatchMouseEvent',{type:'mouseMoved',...close});
        else { await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0}); await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9}); await evaluate(`document.querySelector('${closeSelector}').focus();`); }
        const bounds = await evaluate(`const b=document.querySelector('${closeSelector}'),s=getComputedStyle(b,'::after'),r=b.getBoundingClientRect(),d=b.closest('dialog').getBoundingClientRect();const w=parseFloat(s.width),h=parseFloat(s.height);return {content:s.content,left:r.right-w,right:r.right,top:r.top+parseFloat(s.top),bottom:r.top+parseFloat(s.top)+h,dialog:{left:d.left,right:d.right,top:d.top,bottom:d.bottom}};`);
        assert.equal(bounds.content,'"Chiudi"');
        assert.ok(bounds.left>=bounds.dialog.left && bounds.right<=bounds.dialog.right && bounds.top>=bounds.dialog.top && bounds.bottom<=bounds.dialog.bottom,JSON.stringify({mode,bounds}));
      }
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await waitFor('!document.querySelector("dialog[open]")');
      assert.equal(await evaluate('return document.activeElement === document.querySelector(".portal-filter-actions .button");'), true);
      }
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
    await t.test('aggiornamenti della stessa spedizione: card separate, bordi completi e contenuto leggibile', async () => {
      for (const width of [320, 390, 768, 1440]) {
        await viewport(width); await navigate('/notifications');
        await evaluate('document.querySelector(".notification-group > summary").click();');
        await waitFor('document.querySelectorAll(".notification-event").length === 3');
        for (const theme of ['light', 'dark']) {
          await evaluate(`document.documentElement.dataset.eaTheme = '${theme}';`);
          const cards = await evaluate(`const history=document.querySelector('.notification-history'),summary=document.querySelector('.notification-group > summary').getBoundingClientRect(),events=[...history.querySelectorAll('.notification-event')];return events.map((node,index)=>{const rect=node.getBoundingClientRect(),style=getComputedStyle(node),previous=index?events[index-1].getBoundingClientRect():summary;return {gap:rect.top-previous.bottom,borders:['Top','Right','Bottom','Left'].map(side=>parseFloat(style['border'+side+'Width'])),padding:['Top','Right','Bottom','Left'].map(side=>parseFloat(style['padding'+side])),outside:[...node.children].some(child=>{const bounds=child.getBoundingClientRect();return bounds.left<rect.left+8||bounds.right>rect.right-8||bounds.top<rect.top+8||bounds.bottom>rect.bottom-8;}),background:style.backgroundColor};});`);
          assert.ok(cards.every(card => card.gap >= 12), JSON.stringify({width,theme,cards}));
          assert.ok(cards.every(card => card.borders.every(border => border >= 1) && card.padding.every(padding => padding >= 12) && !card.outside), JSON.stringify({width,theme,cards}));
          assert.notEqual(cards[0].background, cards[1].background, `${theme}: aggiornamenti non letti distinguibili`);
          await check('/notifications expanded', width);
          if (process.env.EA_PORTAL_SCREENSHOT_DIR && [320, 1440].includes(width)) {
            const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
            writeFileSync(join(process.env.EA_PORTAL_SCREENSHOT_DIR, `notifications-${width}-${theme}.png`), Buffer.from(shot.data, 'base64'));
          }
        }
        await evaluate(`document.documentElement.dataset.eaTheme = 'light';document.querySelector('.notification-history .pagination button[aria-label="Pagina successiva"]').click();`);
        await waitFor('document.querySelector(".notification-history .pagination span")?.textContent.includes("2 / 2")');
        await evaluate('document.querySelector(".notification-group > summary").click();');
        await waitFor('!document.querySelector(".notification-history")');
      }
    });
    await t.test('cronologia pagamenti leggibile', async () => {
      await viewport(320);
      await navigate(`/pending/${slug}`);
      assert.match(await evaluate('return document.querySelector(".settlement-row").textContent;'), /50,00/);
    });
    await t.test('checkout: riepilogo, ritorno con dati preservati e conferma singola con scelta indirizzo', async () => {
      const fillBooking = async () => {
        await evaluate(`const values=${JSON.stringify({...order, parcel_value: '125.00', pickup_date: new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+86400000))})}; const form=document.querySelector('.booking-form'); for(const [name,value] of Object.entries(values)){ const input=form.elements.namedItem(name);if(!input || !['INPUT','TEXTAREA'].includes(input.tagName))continue; const prototype=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true})); }`);
        await evaluate('document.querySelector(".booking-review-button").click();');
        await waitFor('document.querySelector(".checkout-v2")');
      };
      for (const width of [320, 768, 1440]) {
        await viewport(width); await navigate('/pickups/new'); await fillBooking();
        await check('/checkout', width);
        assert.match(await evaluate('return document.querySelector(".checkout-addresses").textContent;'), /Napoli.*Caserta/);
        assert.match(await evaluate('return document.querySelector(".checkout-total").textContent;'), /130,00/);
        assert.equal(await evaluate('return !!document.querySelector(".booking-form input[name=sender_type],.booking-form select[name=sender_type]");'), false);
        const backColor = await evaluate('return getComputedStyle(document.querySelector(".button-back")).backgroundColor;');
        assert.equal(backColor, 'rgb(230, 162, 61)');
        assert.equal(await evaluate('return getComputedStyle(document.querySelector(".checkout-continue")).backgroundColor;'), 'rgb(25, 102, 79)');
        if (process.env.EA_PORTAL_SCREENSHOT_DIR) { const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true}); writeFileSync(join(process.env.EA_PORTAL_SCREENSHOT_DIR,`checkout-${width}.png`),Buffer.from(shot.data,'base64')); }
        await evaluate('document.querySelector(".checkout-actions .button-back").click();');
        await waitFor('!document.querySelector(".checkout-v2")');
        assert.equal(await evaluate('return document.querySelector("input[name=pickup_address]").value;'), order.pickup_address);
        assert.equal(await evaluate('return document.querySelector("input[name=recipient_name]").value;'), order.recipient_name);
      }
      await evaluate('document.querySelector(".booking-review-button").click();');
      await waitFor('document.querySelector(".checkout-v2")');
      const before = writes.filter(write => write.path === '/orders').length;
      await evaluate('document.querySelector(".checkout-continue").click();document.querySelector(".checkout-continue").click();');
      await waitFor('document.querySelector(".ea-modal[open] .save-pickup-prompt")');
      assert.equal(writes.filter(write => write.path === '/orders').length, before + 1);
      assert.equal(await evaluate('return document.querySelector(".ea-modal[open]").getBoundingClientRect().width > 0;'), true);
      await evaluate('[...document.querySelectorAll(".ea-modal[open] button")].find(node=>node.textContent.includes("Continua senza salvare")).click();');
      await waitFor(`location.pathname === '/pickups/${slug}'`);
      assert.equal(savedAddress, null);
      await navigate('/pickups/new'); await fillBooking();
      await evaluate('document.querySelector(".checkout-continue").click();');
      await waitFor('document.querySelector(".ea-modal[open] .save-pickup-confirm")');
      await evaluate('document.querySelector(".ea-modal[open] .save-pickup-confirm").click();');
      await waitFor(`location.pathname === '/pickups/${slug}'`);
      const savedWrite = writes.filter(write => write.path === '/sender-address').at(-1).data;
      assert.deepEqual(Object.keys(savedWrite).sort(), ['pickup_address','pickup_city','pickup_postal_code','pickup_street_number','version']);
      assert.equal(savedWrite.pickup_address, order.pickup_address);
      await navigate('/pickups/new');
      await waitFor(`document.querySelector('input[name=pickup_address]').value === ${JSON.stringify(order.pickup_address)}`);
      assert.equal(await evaluate('return document.querySelector("input[name=recipient_name]").value;'), '');
      assert.equal(await evaluate('return document.querySelector("input[name=delivery_address]").value;'), '');
      await fillBooking();
      await evaluate('document.querySelector(".checkout-continue").click();');
      await waitFor(`location.pathname === '/pickups/${slug}'`);
      assert.equal(await evaluate('return !!document.querySelector(".ea-modal[open]");'), false);
      savedAddress = null;
      await navigate('/pickups/new'); await fillBooking(); confirmationStatus = 422;
      await evaluate('document.querySelector(".checkout-continue").click();');
      await waitFor('document.querySelector(".checkout-v2 [role=alert]")');
      assert.match(await evaluate('return document.querySelector(".checkout-v2 [role=alert]").textContent;'), /data non è più disponibile/);
      assert.equal(await evaluate('return !!document.querySelector(".ea-modal[open]");'), false);
      assert.equal(savedAddress, null); confirmationStatus = 0;
      await navigate('/pickups/new'); await fillBooking(); confirmationStatus = 409;
      await evaluate('document.querySelector(".checkout-continue").click();');
      await waitFor('document.querySelector(".checkout-v2 [role=alert]")');
      assert.equal(await evaluate('return document.querySelector(".checkout-continue").disabled;'), true);
      await evaluate('document.querySelector(".checkout-actions .button-back").click();');
      await waitFor('!document.querySelector(".checkout-v2")'); confirmationStatus = 0;
      assert.equal(await evaluate('return document.querySelector("input[name=pickup_address]").value;'), order.pickup_address);
      await evaluate('document.querySelector(".booking-review-button").click();');
      await waitFor('document.querySelector(".checkout-v2")');
      failAddressSave = true;
      const confirmedBefore = writes.filter(write => write.path === '/orders').length;
      await evaluate('document.querySelector(".checkout-continue").click();');
      await waitFor('document.querySelector(".ea-modal[open] .save-pickup-confirm")');
      await evaluate('document.querySelector(".ea-modal[open] .save-pickup-confirm").click();');
      await waitFor('document.querySelector(".ea-modal[open] [role=alert]")');
      assert.match(await evaluate('return document.querySelector(".ea-modal[open]").textContent;'), /ordine è confermato/i);
      assert.equal(await evaluate('return document.querySelector(".ea-modal[open] .save-pickup-confirm").disabled;'), true);
      await evaluate('[...document.querySelectorAll(".ea-modal[open] button")].find(node=>node.textContent.includes("Continua senza salvare")).click();');
      await waitFor(`location.pathname === '/pickups/${slug}'`);
      assert.equal(writes.filter(write => write.path === '/orders').length, confirmedBefore + 1);
      assert.equal(savedAddress, null); failAddressSave = false;
    });
    await t.test('privacy pubblica, preferenze sul server e ripristino senza perdere la sessione', async () => {
      await viewport(390); await navigate('/dashboard');
      await evaluate('document.querySelector(".theme-toggle").click();');
      await waitFor('document.documentElement.dataset.eaTheme === "dark"');
      assert.equal(user.portal_preferences.theme, 'dark');
      assert.equal(writes.filter(write => write.path === '/display-preferences').at(-1).data.theme, 'dark');
      await evaluate('document.querySelector(".sound-toggle").click();');
      await waitFor('document.querySelector(".sound-toggle").getAttribute("aria-pressed") === "true"');
      assert.equal(user.portal_preferences.notification_sound, true);
      await navigate('/dashboard');
      assert.equal(await evaluate('return document.documentElement.dataset.eaTheme;'), 'dark');
      await waitFor('document.querySelector(".sound-toggle").getAttribute("aria-pressed") === "true"');
      assert.equal(await evaluate('return localStorage.getItem("ea:theme");'), null);
      await navigate('/cookies');
      await waitFor('document.querySelector(".privacy-table-wrap tbody tr")');
      await evaluate('localStorage.setItem("ea:notification-seen:customer:test", "opaque-identifiers");');
      const logoutBefore = writes.filter(write => write.path === '/auth/logout').length;
      await evaluate('document.querySelector("#preferenze button").click();');
      await waitFor('document.querySelector("#preferenze [role=status]")');
      assert.deepEqual(user.portal_preferences, {theme:'light',notification_sound:false});
      assert.equal(await evaluate('return document.documentElement.dataset.eaTheme;'), 'light');
      assert.equal(await evaluate('return localStorage.getItem("ea:notification-seen:customer:test");'), null);
      assert.equal(writes.filter(write => write.path === '/auth/logout').length, logoutBefore);
      await navigate('/dashboard');
      assert.equal(await evaluate('return location.pathname;'), '/dashboard');
      assert.equal(await evaluate('return document.querySelector(".sound-toggle").getAttribute("aria-pressed");'), 'false');
      authenticated = false;
      for (const width of [320,768,1440]) {
        await viewport(width); await navigate('/cookies');
        await waitFor('document.querySelector(".privacy-table-wrap tbody tr")');
        await check('/cookies', width);
        assert.equal(await evaluate('return location.pathname;'), '/cookies');
        assert.match(await evaluate('return document.querySelector(".privacy-table-wrap").textContent;'), /ea_express_customer_session.*HttpOnly/s);
        assert.match(await evaluate('return document.querySelector(".privacy-draft").textContent;'), /verifica legale/);
        assert.equal(await evaluate('return !!document.querySelector("dialog[open],[role=dialog],input[type=checkbox]");'), false);
        assert.ok(await evaluate(`return !!document.querySelector('a[href="/privacy"]');`));
        const scripts = await evaluate('return [...document.scripts].filter(node=>node.src).map(node=>new URL(node.src).origin);');
        assert.ok(scripts.every(scriptOrigin => scriptOrigin === origin));
        await navigate('/privacy'); await waitFor('document.querySelector(".privacy-draft")'); await check('/privacy',width);
        assert.match(await evaluate('return document.querySelector(".privacy-content").textContent;'), /non costituisce una firma/);
      }
      authenticated = true;
    });
    await t.test('accesso e registrazione non espongono recupero password', async () => {
      authenticated = false;
      for (const width of [320, 390, 768, 1440]) { await viewport(width); for (const path of ['/login', '/register']) { await navigate(path); await check(path, width); if (process.env.EA_PORTAL_SCREENSHOT_DIR) { const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});writeFileSync(join(process.env.EA_PORTAL_SCREENSHOT_DIR,`${path.slice(1)}-${width}.png`),Buffer.from(shot.data,'base64')); } assert.equal(await evaluate('return !!document.querySelector("a[href*=forgot],input[name=token]");'), false); } }
      assert.equal(writes.some(write => /forgot|reset-password/.test(write.path)), false);
    });
    if (process.env.EA_PORTAL_SCREENSHOT_DIR) {
      authenticated = true;
      for (const [width, path, label] of [375,768,1024,1440].flatMap(width=>[['/dashboard','dashboard'],['/statistics','statistics'],['/pending','pending'],['/profile','profile'],['/rates','rates']].map(([path,label])=>[width,path,`${label}-${width}`]))) { await viewport(width); await navigate(path); const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); writeFileSync(join(process.env.EA_PORTAL_SCREENSHOT_DIR, `${label}.png`), Buffer.from(shot.data, 'base64')); }
      for (const width of [375,768,1024,1440]) {
        await viewport(width); await navigate('/dashboard');
        if (width < 992) {
          await evaluate('document.querySelector(".menu-toggle").click();');
          await waitFor('document.activeElement === document.querySelector(".sidebar-close")');
        }
        const shot = await send('Page.captureScreenshot', { format:'png', captureBeyondViewport:false });
        writeFileSync(join(process.env.EA_PORTAL_SCREENSHOT_DIR, `sidebar-${width}.png`), Buffer.from(shot.data,'base64'));
      }
    }
  } finally {
    socket?.close(); browser?.kill(); await new Promise(resolve => server.close(resolve));
    rmSync(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
