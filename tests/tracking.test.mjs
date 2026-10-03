import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackingMessage, shouldSendPosition, observeTracking } from '../src/services/tracking-state.js';

test('GPS: massimo un invio ogni 10 secondi, movimento di 15 metri e heartbeat ogni 30 secondi', () => {
  const previous = { latitude: 40.85, longitude: 14.26, sentAt: 100000 };
  const point = { latitude: 40.85, longitude: 14.26, accuracy: 12, timestamp: 110000 };
  assert.equal(shouldSendPosition(null, point, 110000), true);
  assert.equal(shouldSendPosition(previous, { ...point, latitude: 40.86 }, 109000), false);
  assert.equal(shouldSendPosition(previous, { ...point, latitude: 40.86 }, 110000), true);
  assert.equal(shouldSendPosition(previous, point, 110000), false);
  assert.equal(shouldSendPosition(previous, { ...point, timestamp: 130000 }, 130000), true);
  assert.equal(shouldSendPosition(null, { ...point, accuracy: 501 }, 130000), false);
  assert.equal(shouldSendPosition(null, point, 300000), false);
});

test('Una posizione vecchia non è presentata come live', () => {
  const data = { state: 'live', location: { recorded_at: '2026-10-01T10:00:00Z' } };
  assert.match(trackingMessage(data, Date.parse('2026-10-01T10:02:00Z')), /2 minuti fa/);
  assert.equal(trackingMessage({ state: 'unassigned' }), 'Rider non ancora assegnato');
  assert.match(trackingMessage({ state: 'completed', status_label: 'Consegnato' }), /Tracking terminato/);
});

test('Il canale GPS aggiorna solo il proprio ordine e rimuove dati dopo una revoca', async () => {
  const previousWindow = globalThis.window, previousDocument = globalThis.document;
  globalThis.window = new EventTarget();
  globalThis.document = new EventTarget();
  let calls = 0, value;
  const stop = observeTracking({ orderId: 7, path: '/orders/7/location', request: async () => {
    calls++;
    if (calls === 2) throw Object.assign(new Error('Revocato'), { status: 404 });
    return { state: 'live' };
  }, onData: data => { value = data; }, onError: () => {} });
  const tick = () => new Promise(resolve => setImmediate(resolve));
  try {
    await tick();
    window.dispatchEvent(new CustomEvent('ea:rider-location', { detail: { order_id: 8 } }));
    await tick();
    assert.equal(calls, 1);
    window.dispatchEvent(new CustomEvent('ea:rider-location', { detail: { order_id: 7 } }));
    await tick();
    assert.equal(calls, 2);
    assert.equal(value, null);
    window.dispatchEvent(new CustomEvent('ea:rider-location', { detail: { order_id: 7 } }));
    await tick();
    assert.equal(calls, 2);
  } finally { stop(); globalThis.window = previousWindow; globalThis.document = previousDocument; }
});

